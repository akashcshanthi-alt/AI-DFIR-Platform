const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

async function testAuditAPIs() {
  console.log('=== [TRACE AI AUDIT LOGS APIS VERIFICATION] ===');
  console.log(`Targeting base API URL: ${BASE_URL}\n`);

  let token = '';

  // 1. Login
  try {
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'cso@trace.ai',
        password: 'clearancepassword123'
      })
    });

    const loginData = await loginRes.json();
    if (!loginRes.ok || !loginData.success) {
      throw new Error(`Login failed for seeded CSO user: ${JSON.stringify(loginData)}`);
    }

    token = loginData.token;
    console.log(`[PASS] 1. Authenticated successfully. Token obtained.`);
  } catch (err) {
    console.error(`[FAIL] Login failed: ${err.message}`);
    process.exit(1);
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  let testLogId = '';

  // 2. Test GET /audit-logs list
  try {
    const res = await fetch(`${BASE_URL}/audit-logs?page=1&limit=5`, { headers: authHeaders });
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(`GET /audit-logs failed: ${JSON.stringify(data)}`);
    }

    if (!Array.isArray(data.data.logs)) {
      throw new Error('logs field is not an array');
    }

    if (data.data.logs.length === 0) {
      throw new Error('No audit logs returned in seeding validation');
    }

    testLogId = data.data.logs[0].logId;
    console.log(`[PASS] 2. Verified paginated list logs retrieval. Found ${data.data.logs.length} logs on Page 1.`);
  } catch (err) {
    console.error(`[FAIL] List logs test failed: ${err.message}`);
    process.exit(1);
  }

  // 3. Test GET /audit-logs search
  try {
    const res = await fetch(`${BASE_URL}/audit-logs?search=escalation`, { headers: authHeaders });
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(`Search GET /audit-logs failed: ${JSON.stringify(data)}`);
    }

    const hasEscalation = data.data.logs.some(l => l.action.toLowerCase().includes('escalation') || l.description.toLowerCase().includes('escalation'));
    if (!hasEscalation) {
      throw new Error('Search failed to filter records containing "escalation"');
    }

    console.log(`[PASS] 3. Verified search query filtering (found escalation).`);
  } catch (err) {
    console.error(`[FAIL] Search test failed: ${err.message}`);
    process.exit(1);
  }

  // 4. Test GET /audit-logs exact filters
  try {
    const res = await fetch(`${BASE_URL}/audit-logs?severity=Critical`, { headers: authHeaders });
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(`Filter GET /audit-logs failed: ${JSON.stringify(data)}`);
    }

    const nonCritical = data.data.logs.filter(l => l.severity !== 'Critical');
    if (nonCritical.length > 0) {
      throw new Error(`Found non-critical logs in filtered results: ${JSON.stringify(nonCritical)}`);
    }

    console.log(`[PASS] 4. Verified exact severity filter (Critical).`);
  } catch (err) {
    console.error(`[FAIL] Severity filter test failed: ${err.message}`);
    process.exit(1);
  }

  // 5. Test GET /audit-logs/:id detail view
  try {
    const res = await fetch(`${BASE_URL}/audit-logs/${testLogId}`, { headers: authHeaders });
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(`GET /audit-logs/:id failed: ${JSON.stringify(data)}`);
    }

    if (data.data.logId !== testLogId) {
      throw new Error(`logId does not match. Expected ${testLogId}, got ${data.data.logId}`);
    }

    console.log(`[PASS] 5. Verified single log retrieval by logId ID (${testLogId}).`);
  } catch (err) {
    console.error(`[FAIL] Single log detail view failed: ${err.message}`);
    process.exit(1);
  }

  // 6. Test CSV Export
  try {
    const res = await fetch(`${BASE_URL}/audit-logs/export`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ format: 'csv' })
    });

    const csvText = await res.text();
    if (!res.ok || !csvText.startsWith('Timestamp,Log ID,User')) {
      throw new Error(`CSV export invalid payload structure: ${csvText.slice(0, 100)}`);
    }

    console.log(`[PASS] 6. Verified CSV export byte stream (Starts with correct headers).`);
  } catch (err) {
    console.error(`[FAIL] CSV export failed: ${err.message}`);
    process.exit(1);
  }

  // 7. Test PDF Export
  try {
    const res = await fetch(`${BASE_URL}/audit-logs/export`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ format: 'pdf' })
    });

    const contentType = res.headers.get('Content-Type');
    if (!res.ok || (!contentType.includes('pdf') && !contentType.includes('octet-stream'))) {
      throw new Error(`PDF export returned incorrect Content-Type header: ${contentType}`);
    }

    console.log(`[PASS] 7. Verified PDF export byte stream. Content-Type: ${contentType}`);
  } catch (err) {
    console.error(`[FAIL] PDF export failed: ${err.message}`);
    process.exit(1);
  }

  // 8. Test DELETE /audit-logs/:id
  try {
    const res = await fetch(`${BASE_URL}/audit-logs/${testLogId}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(`DELETE /audit-logs/:id failed: ${JSON.stringify(data)}`);
    }

    // Verify deletion check
    const checkRes = await fetch(`${BASE_URL}/audit-logs/${testLogId}`, { headers: authHeaders });
    const checkData = await checkRes.json();
    if (checkRes.ok && checkData.success) {
      throw new Error(`Log entry still exists after deletion command returned success`);
    }

    console.log(`[PASS] 8. Verified audit log delete command (logId: ${testLogId}).`);
  } catch (err) {
    console.error(`[FAIL] Delete log test failed: ${err.message}`);
    process.exit(1);
  }

  console.log('\n=== [ALL AUDIT LOGS APIS AND EXPORTS VERIFIED SUCCESSFULLY] ===');
  process.exit(0);
}

testAuditAPIs();
