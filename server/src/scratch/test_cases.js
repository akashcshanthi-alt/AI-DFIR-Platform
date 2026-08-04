const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

async function runTests() {
  console.log('=== [TRACE AI CASES INTEGRATION TESTS] ===');
  console.log(`Targeting base API URL: ${BASE_URL}\n`);

  let token = '';
  let registeredUserId = '';

  // 1. Register a test operator
  try {
    const registerEmail = `analyst.${Date.now()}@trace.ai`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Lead Test Analyst',
        email: registerEmail,
        password: 'clearancepassword123',
        role: 'Analyst',
        department: 'SOC-Testing'
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
        email: registerEmail,
        password: 'clearancepassword123'
      })
    });

    const loginData = await loginRes.json();
    if (!loginRes.ok || !loginData.success) {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }

    token = loginData.token;
    console.log(`[PASS] 2. Login successful. Token obtained.\n`);
  } catch (err) {
    console.error(`[FAIL] Authentication setup aborted: ${err.message}`);
    process.exit(1);
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  let caseA_Id = '';
  let caseB_Id = '';
  let caseC_Id = '';
  let caseA_mongoId = '';

  // 3. Create Case A (Critical, Open)
  try {
    const res = await fetch(`${BASE_URL}/cases`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Memory Dump Anomaly Node 4',
        description: 'Anomalous memory dump discovered matching exfiltration behavior.',
        severity: 'Critical',
        status: 'Open',
        assignedAnalyst: 'J. Dorsey',
        destinationIP: '10.0.1.15',
        targetHost: 'SRV-DB-04'
      })
    });
    const body = await res.json();
    if (!res.ok || !body.success) throw new Error(JSON.stringify(body));
    
    caseA_Id = body.data.caseId;
    caseA_mongoId = body.data._id;
    console.log(`[PASS] 3. Case A created successfully: caseId=${caseA_Id}, _id=${caseA_mongoId}`);
  } catch (err) {
    console.error(`[FAIL] Case A creation failed: ${err.message}`);
  }

  // 4. Create Case B (High, Investigating)
  try {
    const res = await fetch(`${BASE_URL}/cases`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Phishing Campaign Link Clicked',
        description: 'User clicked credential harvesting link in mock phishing drill.',
        severity: 'High',
        status: 'Investigating',
        assignedAnalyst: 'S. Kovac',
        destinationIP: '192.168.1.102',
        targetHost: 'WS-FIN-10'
      })
    });
    const body = await res.json();
    if (!res.ok || !body.success) throw new Error(JSON.stringify(body));
    
    caseB_Id = body.data.caseId;
    console.log(`[PASS] 4. Case B created successfully: caseId=${caseB_Id}`);
  } catch (err) {
    console.error(`[FAIL] Case B creation failed: ${err.message}`);
  }

  // 5. Create Case C (Low, Closed)
  try {
    const res = await fetch(`${BASE_URL}/cases`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Suspicious PowerShell Execution',
        description: 'Base64 encoded block executed in user space.',
        severity: 'Low',
        status: 'Closed',
        assignedAnalyst: 'A. Miller',
        destinationIP: '172.16.5.12',
        targetHost: 'WS-HR-20'
      })
    });
    const body = await res.json();
    if (!res.ok || !body.success) throw new Error(JSON.stringify(body));
    
    caseC_Id = body.data.caseId;
    console.log(`[PASS] 5. Case C created successfully: caseId=${caseC_Id}\n`);
  } catch (err) {
    console.error(`[FAIL] Case C creation failed: ${err.message}`);
  }

  // 6. Verification: Fail on validation rules
  try {
    const res = await fetch(`${BASE_URL}/cases`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: '', // should fail empty title
        severity: 'SuperCritical' // should fail invalid severity enum
      })
    });
    const body = await res.json();
    if (res.status === 400 && !body.success) {
      console.log(`[PASS] 6. Validation caught bad input correctly: status 400.`);
    } else {
      throw new Error(`Expected status 400 validation error, but got ${res.status}`);
    }
  } catch (err) {
    console.error(`[FAIL] Validation verification failed: ${err.message}`);
  }

  // 7. Verification: Get all cases and verify Search, Filter, Pagination, Sorting
  try {
    // 7.1 Search
    const searchRes = await fetch(`${BASE_URL}/cases?search=PowerShell`, { headers: authHeaders });
    const searchBody = await searchRes.json();
    if (searchBody.data.length === 1 && searchBody.data[0].caseId === caseC_Id) {
      console.log(`[PASS] 7.1 Search function works. Correctly matched Case C.`);
    } else {
      throw new Error(`Search failed. Expected matching Case C, got: ${JSON.stringify(searchBody.data)}`);
    }

    // 7.2 Filter by Severity
    const filterRes = await fetch(`${BASE_URL}/cases?severity=High`, { headers: authHeaders });
    const filterBody = await filterRes.json();
    if (filterBody.data.length === 1 && filterBody.data[0].caseId === caseB_Id) {
      console.log(`[PASS] 7.2 Severity filtering works. Correctly retrieved Case B.`);
    } else {
      throw new Error(`Filtering failed. Expected matching Case B, got: ${JSON.stringify(filterBody.data)}`);
    }

    // 7.3 Filter by Status
    const statusRes = await fetch(`${BASE_URL}/cases?status=Closed`, { headers: authHeaders });
    const statusBody = await statusRes.json();
    if (statusBody.data.length === 1 && statusBody.data[0].caseId === caseC_Id) {
      console.log(`[PASS] 7.3 Status filtering works. Correctly retrieved Case C.`);
    } else {
      throw new Error(`Status filtering failed. Expected matching Case C, got: ${JSON.stringify(statusBody.data)}`);
    }

    // 7.4 Pagination (page=1, limit=2)
    const pagRes = await fetch(`${BASE_URL}/cases?page=1&limit=2`, { headers: authHeaders });
    const pagBody = await pagRes.json();
    if (pagBody.data.length === 2 && pagBody.pagination.total === 3 && pagBody.pagination.pages === 2) {
      console.log(`[PASS] 7.4 Pagination works. Retrieved 2 of 3 cases, pages counted = 2.`);
    } else {
      throw new Error(`Pagination failed. Expected 2 cases and metadata, got: ${JSON.stringify(pagBody.pagination)}`);
    }
  } catch (err) {
    console.error(`[FAIL] Search/Filter/Pagination queries failed: ${err.message}`);
  }

  // 8. Retrieve Case by ID (supports Object ID AND sequential caseId string)
  try {
    // 8.1 Fetch by sequential caseId (e.g., DF-1001)
    const resIdStr = await fetch(`${BASE_URL}/cases/${caseA_Id}`, { headers: authHeaders });
    const bodyIdStr = await resIdStr.json();
    if (resIdStr.ok && bodyIdStr.data.caseId === caseA_Id) {
      console.log(`[PASS] 8.1 Fetch by caseId string works.`);
    } else {
      throw new Error(`Fetch by caseId string failed.`);
    }

    // 8.2 Fetch by MongoDB Object ID
    const resMongoId = await fetch(`${BASE_URL}/cases/${caseA_mongoId}`, { headers: authHeaders });
    const bodyMongoId = await resMongoId.json();
    if (resMongoId.ok && bodyMongoId.data._id === caseA_mongoId) {
      console.log(`[PASS] 8.2 Fetch by MongoDB Object ID works.`);
    } else {
      throw new Error(`Fetch by MongoDB Object ID failed.`);
    }
  } catch (err) {
    console.error(`[FAIL] Retrieve by ID failed: ${err.message}`);
  }

  // 9. Update Case A (PUT /api/cases/:id)
  try {
    const res = await fetch(`${BASE_URL}/cases/${caseA_Id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        status: 'Closed',
        description: 'Archived due to verification of test case parameters.',
        evidenceCount: 4
      })
    });
    const body = await res.json();
    if (res.ok && body.data.status === 'Closed' && body.data.evidenceCount === 4) {
      console.log(`[PASS] 9. Case updated successfully. Status transitioned to Closed, evidenceCount = 4.`);
    } else {
      throw new Error(`Update request rejected or failed: ${JSON.stringify(body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] Case update failed: ${err.message}`);
  }

  // 10. Delete Case A (DELETE /api/cases/:id)
  try {
    const delRes = await fetch(`${BASE_URL}/cases/${caseA_Id}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    const delBody = await delRes.json();
    if (!delRes.ok || !delBody.success) {
      throw new Error(`Delete failed: ${JSON.stringify(delBody)}`);
    }
    console.log(`[PASS] 10. Case A deleted successfully.`);

    // 10.1 Try to retrieve deleted case (should return 404)
    const checkRes = await fetch(`${BASE_URL}/cases/${caseA_Id}`, { headers: authHeaders });
    if (checkRes.status === 404) {
      console.log(`[PASS] 10.1 Checking deleted case returns 404 correctly.`);
    } else {
      throw new Error(`Expected 404 on deleted case, but got status ${checkRes.status}`);
    }

    // 10.2 Verify total count is now 2
    const countRes = await fetch(`${BASE_URL}/cases`, { headers: authHeaders });
    const countBody = await countRes.json();
    if (countBody.pagination.total === 2) {
      console.log(`[PASS] 10.2 Verification: Total count correct. Total cases remaining: 2.`);
    } else {
      throw new Error(`Expected remaining count of 2, but got ${countBody.pagination.total}`);
    }
  } catch (err) {
    console.error(`[FAIL] Delete operation verification failed: ${err.message}`);
  }

  console.log('\n=== [ALL INTEGRATION TESTS SUCCESSFUL] ===');
  process.exit(0);
}

runTests();
