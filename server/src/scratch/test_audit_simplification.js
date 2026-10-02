const assert = require('assert');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';

async function testAuditSimplification() {
  console.log('================================================================');
  console.log('TRACE AI DFIR - AUDIT LOGS SIMPLIFICATION & ISOLATION TEST');
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
  assert.strictEqual(loginRes.status, 200, 'AKASH C login must succeed');
  const loginData = await loginRes.json();
  const akashToken = loginData.token;
  const akashEmail = loginData.user.email;
  console.log(`[PASS] Logged in as ${loginData.user.fullName} (${akashEmail})`);

  const akashHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${akashToken}`
  };

  // Step 2: Fetch audit logs for AKASH C
  console.log('\n2. Fetching Audit Logs for AKASH C...');
  const logsRes = await fetch(`${BASE_URL}/audit-logs`, { headers: akashHeaders });
  assert.strictEqual(logsRes.status, 200);
  const logsData = await logsRes.json();
  const logs = logsData.data.logs;
  console.log(`[PASS] Retrieved ${logs.length} audit log(s) for AKASH C.`);

  // Verify all retrieved logs strictly belong to AKASH C
  const foreignLogs = logs.filter(l => l.user !== akashEmail && l.user !== 'AKASH C' && l.user !== loginData.user.userId);
  assert.strictEqual(foreignLogs.length, 0, 'No unrelated user audit logs must be visible to AKASH C');
  console.log('[PASS] Verified 0 foreign/demo audit logs in AKASH C audit trail.');

  // Verify LOGIN_SUCCESS audit log exists from step 1
  const loginLog = logs.find(l => l.action === 'LOGIN_SUCCESS');
  assert.ok(loginLog, 'LOGIN_SUCCESS audit event must be present for AKASH C');
  assert.strictEqual(loginLog.module, 'AUTH');
  assert.strictEqual(loginLog.status, 'Success');
  console.log(`[PASS] Verified real LOGIN_SUCCESS event recorded (ID: ${loginLog.logId})`);

  // Step 3: Perform real action: Case Creation
  console.log('\n3. Performing action: Create Case...');
  const createCaseRes = await fetch(`${BASE_URL}/cases`, {
    method: 'POST',
    headers: akashHeaders,
    body: JSON.stringify({
      title: 'Audit Verification Host Compromise',
      description: 'Suspicious beaconing payload identified on workstation host WS-AUDIT-01.',
      severity: 'Medium',
      targetHost: 'WS-AUDIT-01'
    })
  });
  assert.strictEqual(createCaseRes.status, 201);
  const createdCase = (await createCaseRes.json()).data;
  const caseId = createdCase.caseId;
  console.log(`[PASS] Created case: ${caseId}`);

  // Step 4: Verify CREATE_CASE audit event in Audit Logs
  console.log('\n4. Verifying CREATE_CASE event in Audit Logs...');
  const logsAfterCaseRes = await fetch(`${BASE_URL}/audit-logs`, { headers: akashHeaders });
  const logsAfterCase = (await logsAfterCaseRes.json()).data.logs;
  const createCaseLog = logsAfterCase.find(l => l.action === 'CREATE_CASE' && l.description.includes(caseId));
  assert.ok(createCaseLog, 'CREATE_CASE audit entry must be recorded');
  assert.strictEqual(createCaseLog.module, 'CASE_MANAGEMENT');
  assert.strictEqual(createCaseLog.status, 'Success');
  console.log(`[PASS] CREATE_CASE audit entry verified: ${createCaseLog.logId} - ${createCaseLog.description}`);

  // Step 5: Perform real action: Update Case
  console.log('\n5. Performing action: Update Case...');
  const updateCaseRes = await fetch(`${BASE_URL}/cases/${caseId}`, {
    method: 'PUT',
    headers: akashHeaders,
    body: JSON.stringify({
      status: 'Investigating',
      assignedAnalyst: 'AKASH C'
    })
  });
  assert.strictEqual(updateCaseRes.status, 200);

  const logsAfterUpdateRes = await fetch(`${BASE_URL}/audit-logs`, { headers: akashHeaders });
  const logsAfterUpdate = (await logsAfterUpdateRes.json()).data.logs;
  const updateCaseLog = logsAfterUpdate.find(l => l.action === 'UPDATE_CASE' && l.description.includes(caseId));
  assert.ok(updateCaseLog, 'UPDATE_CASE audit entry must be recorded');
  console.log(`[PASS] UPDATE_CASE audit entry verified: ${updateCaseLog.logId}`);

  // Step 6: Perform real action: Generate Report
  console.log('\n6. Performing action: Generate Report...');
  const genReportRes = await fetch(`${BASE_URL}/reports/generate`, {
    method: 'POST',
    headers: akashHeaders,
    body: JSON.stringify({
      title: 'Audit Test Incident Summary',
      caseId: caseId,
      format: 'PDF',
      reportType: 'Incident Summary'
    })
  });
  assert.strictEqual(genReportRes.status, 201);
  const genReport = (await genReportRes.json()).data;
  const reportId = genReport.reportId;
  console.log(`[PASS] Generated report: ${reportId}`);

  const logsAfterReportRes = await fetch(`${BASE_URL}/audit-logs`, { headers: akashHeaders });
  const logsAfterReport = (await logsAfterReportRes.json()).data.logs;
  const genReportLog = logsAfterReport.find(l => l.action === 'GENERATE_REPORT' && l.description.includes(reportId));
  assert.ok(genReportLog, 'GENERATE_REPORT audit entry must be recorded');
  assert.strictEqual(genReportLog.module, 'REPORTS');
  console.log(`[PASS] GENERATE_REPORT audit entry verified: ${genReportLog.logId}`);

  // Step 7: Search Audit Logs
  console.log('\n7. Testing search functionality...');
  const searchRes = await fetch(`${BASE_URL}/audit-logs?search=CREATE_CASE`, { headers: akashHeaders });
  assert.strictEqual(searchRes.status, 200);
  const searchData = await searchRes.json();
  assert.ok(searchData.data.logs.length >= 1);
  assert.strictEqual(searchData.data.logs[0].action, 'CREATE_CASE');
  console.log('[PASS] Search by action matched expected records.');

  // Step 8: Export Audit Logs (CSV & PDF)
  console.log('\n8. Testing Export functionality...');
  const csvExportRes = await fetch(`${BASE_URL}/audit-logs/export`, {
    method: 'POST',
    headers: akashHeaders,
    body: JSON.stringify({ format: 'csv' })
  });
  assert.strictEqual(csvExportRes.status, 200);
  const csvText = await csvExportRes.text();
  assert.ok(csvText.includes('Timestamp,Log ID,User,Role,Action'), 'CSV must contain headers');
  assert.ok(csvText.includes(akashEmail), 'CSV must contain AKASH C email');
  assert.ok(!csvText.includes('attacker@scam.org'), 'CSV must NOT leak other users');
  console.log('[PASS] CSV export generated and verified clean.');

  const pdfExportRes = await fetch(`${BASE_URL}/audit-logs/export`, {
    method: 'POST',
    headers: akashHeaders,
    body: JSON.stringify({ format: 'pdf' })
  });
  assert.strictEqual(pdfExportRes.status, 200);
  const pdfBuffer = await pdfExportRes.arrayBuffer();
  assert.ok(pdfBuffer.byteLength > 0, 'PDF export must return real document buffer');
  console.log(`[PASS] PDF export generated (${pdfBuffer.byteLength} bytes).`);

  // Step 9: User Isolation Verification
  console.log('\n9. Testing Security & Authorization Boundaries...');
  // Attempt to query audit log by ID with a foreign user's log (e.g. LOG-1001 from CSO)
  const unauthorizedLogRes = await fetch(`${BASE_URL}/audit-logs/LOG-1001`, { headers: akashHeaders });
  assert.strictEqual(unauthorizedLogRes.status, 404, 'AKASH C cannot view other users audit logs by ID');
  console.log('[PASS] Unauthorized audit log fetch rejected with 404 Not Found.');

  // Attempt to pass query parameter ?user=cso@trace.ai as an Investigator
  const tamperedQueryRes = await fetch(`${BASE_URL}/audit-logs?user=cso@trace.ai`, { headers: akashHeaders });
  assert.strictEqual(tamperedQueryRes.status, 200);
  const tamperedData = await tamperedQueryRes.json();
  const hasCso = tamperedData.data.logs.some(l => l.user === 'cso@trace.ai');
  assert.strictEqual(hasCso, false, 'Investigator cannot override user filter to see admin logs');
  console.log('[PASS] Query parameter user spoofing correctly ignored for Investigator clearance.');

  // Step 10: Clean up test report and test case
  console.log('\n10. Cleaning up test artifacts...');
  await fetch(`${BASE_URL}/reports/${reportId}`, { method: 'DELETE', headers: akashHeaders });
  await fetch(`${BASE_URL}/cases/${caseId}`, { method: 'DELETE', headers: akashHeaders });
  console.log('[PASS] Cleaned up test case and report.');

  console.log('\n================================================================');
  console.log('>>> ALL AUDIT LOGS SIMPLIFICATION & ISOLATION TESTS PASSED <<<');
  console.log('================================================================\n');
}

testAuditSimplification().catch(err => {
  console.error('[FAIL]', err);
  process.exit(1);
});
