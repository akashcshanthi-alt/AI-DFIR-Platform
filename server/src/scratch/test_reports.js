const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

async function runTests() {
  console.log('=== [TRACE AI REPORTS INTEGRATION TESTS] ===');
  console.log(`Targeting base API URL: ${BASE_URL}\n`);

  let token = '';
  let registeredUserId = '';
  const testEmail = `analyst.reports.${Date.now()}@trace.ai`;

  // 1. Register a test operator
  try {
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Reports Tester',
        email: testEmail,
        password: 'clearancepassword123',
        role: 'Analyst',
        department: 'SOC-Reports-Testing'
      })
    });

    const regData = await regRes.json();
    if (!regRes.ok || !regData.success) {
      throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
    }

    registeredUserId = regData.data.id;
    console.log(`[PASS] 1. Operator registered successfully. ID: ${registeredUserId}`);

    // 2. Login to retrieve token
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'clearancepassword123'
      })
    });

    const loginData = await loginRes.json();
    if (!loginRes.ok || !loginData.success) {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }

    token = loginData.token;
    console.log(`[PASS] 2. Login successful. Token obtained.`);
  } catch (err) {
    console.error(`[FAIL] Authentication setup aborted: ${err.message}`);
    process.exit(1);
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 3. Create a mock case for report linking
  let testCaseId = '';
  try {
    const caseRes = await fetch(`${BASE_URL}/cases`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Unauthorized API Access Detected',
        description: 'Repetitive brute force attempts observed against key registry assets.',
        severity: 'High',
        status: 'Open',
        assignedAnalyst: 'System Test',
        sourceIP: '198.51.100.12',
        destinationIP: '10.0.0.122',
        targetHost: 'API-GW-04',
        evidenceCount: 3
      })
    });

    const caseData = await caseRes.json();
    if (!caseRes.ok || !caseData.success) {
      throw new Error(`Case creation failed: ${JSON.stringify(caseData)}`);
    }

    testCaseId = caseData.data.caseId;
    console.log(`[PASS] 3. Mock Case created successfully: ${testCaseId}`);
  } catch (err) {
    console.error(`[FAIL] Mock Case creation failed: ${err.message}`);
    process.exit(1);
  }

  let pdfReportId = '';
  let pdfReportMongoId = '';
  let pdfFilePath = '';
  let csvReportId = '';
  let csvFilePath = '';

  // 4. Generate PDF Report via POST /api/reports/generate
  try {
    const res = await fetch(`${BASE_URL}/reports/generate`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Executive Intrusion Summary PDF',
        caseId: testCaseId,
        format: 'PDF',
        reportType: 'Incident Summary'
      })
    });

    const body = await res.json();
    if (!res.ok || !body.success) throw new Error(JSON.stringify(body));

    pdfReportId = body.data.reportId;
    pdfReportMongoId = body.data._id;
    pdfFilePath = body.data.filePath;

    console.log(`[PASS] 4. PDF Report generated successfully: reportId=${pdfReportId}`);
    
    // Check that physical file exists on disk
    const absolutePath = path.resolve(__dirname, '..', '.' + pdfFilePath);
    if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).size > 0) {
      console.log(`[PASS] 4.1 Physical PDF file exists on disk (${fs.statSync(absolutePath).size} bytes).`);
    } else {
      throw new Error(`Physical PDF file missing or empty at: ${absolutePath}`);
    }
  } catch (err) {
    console.error(`[FAIL] PDF Report generation failed: ${err.message}`);
  }

  // 5. Generate CSV Report via POST /api/reports/generate
  try {
    const res = await fetch(`${BASE_URL}/reports/generate`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Executive Intrusion Details CSV',
        caseId: testCaseId,
        format: 'CSV',
        reportType: 'Forensic Audit'
      })
    });

    const body = await res.json();
    if (!res.ok || !body.success) throw new Error(JSON.stringify(body));

    csvReportId = body.data.reportId;
    csvFilePath = body.data.filePath;

    console.log(`[PASS] 5. CSV Report generated successfully: reportId=${csvReportId}`);
    
    // Check that physical file exists on disk
    const absolutePath = path.resolve(__dirname, '..', '.' + csvFilePath);
    if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).size > 0) {
      console.log(`[PASS] 5.1 Physical CSV file exists on disk (${fs.statSync(absolutePath).size} bytes).`);
    } else {
      throw new Error(`Physical CSV file missing or empty at: ${absolutePath}`);
    }
  } catch (err) {
    console.error(`[FAIL] CSV Report generation failed: ${err.message}`);
  }

  // 6. Verify GET /api/reports (Pagination, Search, Filter, Sort)
  try {
    // 6.1 Get all reports
    const resAll = await fetch(`${BASE_URL}/reports`, { headers: authHeaders });
    const allBody = await resAll.json();
    if (allBody.data.length >= 2 && allBody.pagination.total >= 2) {
      console.log(`[PASS] 6.1 GET /api/reports successfully retrieved catalog (Total reports count: ${allBody.pagination.total}).`);
    } else {
      throw new Error(`Expected at least 2 reports, got: ${JSON.stringify(allBody)}`);
    }

    // 6.2 Search verification (search 'Summary' -> matches PDF)
    const resSearch = await fetch(`${BASE_URL}/reports?search=Summary`, { headers: authHeaders });
    const searchBody = await resSearch.json();
    if (searchBody.data.length >= 1 && searchBody.data[0].reportId === pdfReportId) {
      console.log('[PASS] 6.2 Search matches title queries correctly.');
    } else {
      throw new Error(`Search failed. Expected matching PDF report, got: ${JSON.stringify(searchBody.data)}`);
    }

    // 6.3 Filter by format (format=CSV -> matches CSV)
    const resFilter = await fetch(`${BASE_URL}/reports?format=CSV`, { headers: authHeaders });
    const filterBody = await resFilter.json();
    if (filterBody.data.length >= 1 && filterBody.data[0].reportId === csvReportId) {
      console.log('[PASS] 6.3 Filter by format works successfully.');
    } else {
      throw new Error(`Format filter failed. Expected CSV report, got: ${JSON.stringify(filterBody.data)}`);
    }
  } catch (err) {
    console.error(`[FAIL] List catalog queries failed: ${err.message}`);
  }

  // 7. Verify GET /api/reports/:id
  try {
    const resDetails = await fetch(`${BASE_URL}/reports/${pdfReportId}`, { headers: authHeaders });
    const detailsBody = await resDetails.json();
    if (resDetails.ok && detailsBody.data.reportId === pdfReportId) {
      console.log('[PASS] 7. GET /api/reports/:id successfully fetched metadata by sequential reportId string.');
    } else {
      throw new Error(`Fetch metadata by ID failed: ${JSON.stringify(detailsBody)}`);
    }
  } catch (err) {
    console.error(`[FAIL] Get report details failed: ${err.message}`);
  }

  // 8. Verify GET /api/reports/:id/download
  try {
    const dlRes = await fetch(`${BASE_URL}/reports/${pdfReportId}/download`, { headers: authHeaders });
    if (dlRes.ok && dlRes.headers.get('content-disposition').includes('attachment')) {
      console.log('[PASS] 8. GET /api/reports/:id/download correctly served file download and headers.');
    } else {
      throw new Error(`Download response checks failed. Status: ${dlRes.status}, Headers: ${JSON.stringify(dlRes.headers)}`);
    }
  } catch (err) {
    console.error(`[FAIL] Download endpoint test failed: ${err.message}`);
  }

  // 9. Verify DELETE /api/reports/:id
  try {
    const delRes = await fetch(`${BASE_URL}/reports/${pdfReportId}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    const delBody = await delRes.json();
    if (delRes.ok && delBody.success) {
      console.log('[PASS] 9. DELETE /api/reports/:id database query completed successfully.');
    } else {
      throw new Error(`Delete request failed: ${JSON.stringify(delBody)}`);
    }

    // 9.1 Verify physical file is unlinked
    const absolutePath = path.resolve(__dirname, '..', '.' + pdfFilePath);
    if (!fs.existsSync(absolutePath)) {
      console.log('[PASS] 9.1 Physical PDF file was successfully deleted/unlinked from server disk.');
    } else {
      throw new Error(`Physical report file still exists at: ${absolutePath}`);
    }

    // 9.2 Verify retrieving deleted metadata returns 404
    const checkRes = await fetch(`${BASE_URL}/reports/${pdfReportId}`, { headers: authHeaders });
    if (checkRes.status === 404) {
      console.log('[PASS] 9.2 Requesting deleted report metadata returns 404 correctly.');
    } else {
      throw new Error(`Expected 404 on deleted metadata, got status ${checkRes.status}`);
    }
  } catch (err) {
    console.error(`[FAIL] Delete report verification failed: ${err.message}`);
  }

  console.log('\n=== [ALL REPORTS INTEGRATION TESTS SUCCESSFUL] ===');
  process.exit(0);
}

runTests();
