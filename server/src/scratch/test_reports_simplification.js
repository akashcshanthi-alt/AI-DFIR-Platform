const assert = require('assert');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';

async function testReportsSimplification() {
  console.log('================================================================');
  console.log('TRACE AI DFIR - REPORTS PAGE SIMPLIFICATION & ISOLATION TEST');
  console.log('================================================================\n');

  // Step 1: Login as AKASH C
  console.log('1. Logging in as AKASH C (akash.demo@trace.local)...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'akash.demo@trace.local',
      password: 'AKASHC2026!'
    })
  });
  assert.strictEqual(loginRes.status, 200, 'Login for AKASH C must succeed');
  const loginData = await loginRes.json();
  const akashToken = loginData.token;
  const akashUserId = loginData.user.id || loginData.user._id;
  console.log(`[PASS] Logged in as ${loginData.user.fullName} (ID: ${akashUserId})`);

  const akashHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${akashToken}`
  };

  // Step 2: Verify AKASH C initially has 0 reports
  console.log('\n2. Verifying initial reports state for AKASH C...');
  const initialReportsRes = await fetch(`${BASE_URL}/reports`, { headers: akashHeaders });
  assert.strictEqual(initialReportsRes.status, 200);
  const initialReportsData = await initialReportsRes.json();
  assert.strictEqual(initialReportsData.data.length, 0, 'Initial reports must be 0');
  assert.strictEqual(initialReportsData.pagination.total, 0, 'Pagination total must be 0');
  console.log('[PASS] AKASH C has 0 reports in MongoDB catalog.');

  // Step 3: Create an authorized case for AKASH C to test report generation
  console.log('\n3. Creating an authorized incident case for AKASH C...');
  const createCaseRes = await fetch(`${BASE_URL}/cases`, {
    method: 'POST',
    headers: akashHeaders,
    body: JSON.stringify({
      title: 'Demo Malware Infiltration Triage',
      description: 'Suspicious beaconing payload identified on workstation host WS-ALPHA-01.',
      severity: 'High',
      targetHost: 'WS-ALPHA-01',
      sourceIP: '10.0.1.45',
      destinationIP: '198.51.100.88'
    })
  });
  assert.strictEqual(createCaseRes.status, 201, 'Case creation must succeed');
  const caseData = await createCaseRes.json();
  const createdCaseId = caseData.data.caseId;
  console.log(`[PASS] Case created with ID: ${createdCaseId} for AKASH C`);

  // Step 4: Generate a real PDF report for AKASH C's case
  console.log(`\n4. Generating a real PDF report for case ${createdCaseId}...`);
  const genPdfRes = await fetch(`${BASE_URL}/reports/generate`, {
    method: 'POST',
    headers: akashHeaders,
    body: JSON.stringify({
      title: 'Executive Incident Brief - WS-ALPHA-01',
      caseId: createdCaseId,
      format: 'PDF',
      reportType: 'Incident Summary'
    })
  });
  assert.strictEqual(genPdfRes.status, 201, 'PDF report generation must succeed');
  const pdfData = await genPdfRes.json();
  const generatedReport = pdfData.data;
  const reportId = generatedReport.reportId;
  assert.ok(reportId, 'Report must have a sequential reportId');
  assert.strictEqual(generatedReport.caseId, createdCaseId);
  assert.strictEqual(generatedReport.format, 'PDF');
  assert.ok(generatedReport.fileSize > 0, 'File size must be > 0');
  console.log(`[PASS] PDF Report generated: ${reportId} (${generatedReport.fileSize} bytes)`);

  // Step 5: Verify report appears in AKASH C's reports list
  console.log('\n5. Verifying report appears in AKASH C reports catalog...');
  const updatedReportsRes = await fetch(`${BASE_URL}/reports`, { headers: akashHeaders });
  assert.strictEqual(updatedReportsRes.status, 200);
  const updatedReportsData = await updatedReportsRes.json();
  assert.strictEqual(updatedReportsData.data.length, 1, 'AKASH C must now see 1 report');
  assert.strictEqual(updatedReportsData.data[0].reportId, reportId);
  console.log(`[PASS] Report ${reportId} visible in AKASH C reports catalog.`);

  // Step 6: Test Format Filter on /reports (PDF vs CSV)
  console.log('\n6. Testing Format filter...');
  const pdfFilterRes = await fetch(`${BASE_URL}/reports?format=PDF`, { headers: akashHeaders });
  const pdfFilterData = await pdfFilterRes.json();
  assert.strictEqual(pdfFilterData.data.length, 1);

  const csvFilterRes = await fetch(`${BASE_URL}/reports?format=CSV`, { headers: akashHeaders });
  const csvFilterData = await csvFilterRes.json();
  assert.strictEqual(csvFilterData.data.length, 0, 'No CSV reports generated yet');
  console.log('[PASS] Format filter (PDF / CSV) correctly filters backend records.');

  // Step 7: Verify View Report Metadata by ID
  console.log('\n7. Verifying report metadata fetch by ID...');
  const viewRes = await fetch(`${BASE_URL}/reports/${reportId}`, { headers: akashHeaders });
  assert.strictEqual(viewRes.status, 200);
  const viewData = await viewRes.json();
  assert.strictEqual(viewData.data.reportId, reportId);
  assert.strictEqual(viewData.data.title, 'Executive Incident Brief - WS-ALPHA-01');
  console.log('[PASS] Report metadata details retrieved successfully.');

  // Step 8: Verify Real File Download
  console.log('\n8. Verifying physical report file download...');
  const downloadRes = await fetch(`${BASE_URL}/reports/${reportId}/download`, { headers: akashHeaders });
  assert.strictEqual(downloadRes.status, 200);
  const fileBuffer = await downloadRes.arrayBuffer();
  assert.ok(fileBuffer.byteLength > 0, 'Downloaded file must contain real byte data');
  console.log(`[PASS] Downloaded physical PDF file successfully (${fileBuffer.byteLength} bytes).`);

  // Step 9: User Data Isolation Check (Another user should NOT see or access this report)
  console.log('\n9. Testing User Data Isolation with a second user (cso@trace.ai)...');
  const user2LoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'cso@trace.ai',
      password: 'clearancepassword123'
    })
  });
  assert.strictEqual(user2LoginRes.status, 200);
  const user2Data = await user2LoginRes.json();
  const user2Headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${user2Data.token}`
  };

  // User 2 query catalog -> must NOT contain AKASH C's report
  const user2ReportsRes = await fetch(`${BASE_URL}/reports`, { headers: user2Headers });
  const user2ReportsData = await user2ReportsRes.json();
  const hasAkashReport = user2ReportsData.data.some(r => r.reportId === reportId);
  assert.strictEqual(hasAkashReport, false, 'User 2 MUST NOT see AKASH C report in catalog');
  console.log('[PASS] User 2 catalog strictly isolates reports (AKASH C report is not visible).');

  // User 2 direct fetch AKASH C report by ID -> must return 404
  const user2ViewRes = await fetch(`${BASE_URL}/reports/${reportId}`, { headers: user2Headers });
  assert.strictEqual(user2ViewRes.status, 404, 'Unauthorized report access must return 404');
  console.log('[PASS] User 2 direct view of AKASH C report rejected with 404.');

  // User 2 direct download AKASH C report -> must return 404
  const user2DownloadRes = await fetch(`${BASE_URL}/reports/${reportId}/download`, { headers: user2Headers });
  assert.strictEqual(user2DownloadRes.status, 404, 'Unauthorized report download must return 404');
  console.log('[PASS] User 2 direct download of AKASH C report rejected with 404.');

  // Step 10: Clean up test case and report
  console.log('\n10. Cleaning up test report and test case...');
  const deleteReportRes = await fetch(`${BASE_URL}/reports/${reportId}`, {
    method: 'DELETE',
    headers: akashHeaders
  });
  assert.strictEqual(deleteReportRes.status, 200, 'Report deletion must succeed');

  const deleteCaseRes = await fetch(`${BASE_URL}/cases/${createdCaseId}`, {
    method: 'DELETE',
    headers: akashHeaders
  });
  assert.strictEqual(deleteCaseRes.status, 200, 'Case deletion must succeed');
  console.log('[PASS] Test report and test case cleaned up.');

  // Verify AKASH C is clean again (0 reports)
  const finalReportsRes = await fetch(`${BASE_URL}/reports`, { headers: akashHeaders });
  const finalReportsData = await finalReportsRes.json();
  assert.strictEqual(finalReportsData.data.length, 0);
  console.log('[PASS] AKASH C catalog verified clean (0 reports).');

  console.log('\n================================================================');
  console.log('>>> ALL REPORTS SIMPLIFICATION & ISOLATION TESTS PASSED 100% <<<');
  console.log('================================================================\n');
}

testReportsSimplification().catch(err => {
  console.error('[FAIL]', err);
  process.exit(1);
});
