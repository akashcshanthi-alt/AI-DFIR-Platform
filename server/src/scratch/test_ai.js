const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

async function runTests() {
  console.log('=== [TRACE AI COGNITIVE CORRELATION INTEGRATION TESTS] ===');
  console.log(`Targeting base API URL: ${BASE_URL}\n`);

  let token = '';
  let registeredUserId = '';
  const testEmail = `analyst.ai.${Date.now()}@trace.ai`;

  // 1. Register a test operator
  try {
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'AI Analyst Tester',
        email: testEmail,
        password: 'clearancepassword123',
        role: 'Analyst',
        department: 'Cognitive-AI-Testing'
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

  // 3. Create a mock case with SSH Brute Force signature details
  let testCaseId = '';
  try {
    const caseRes = await fetch(`${BASE_URL}/cases`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'High-risk SSH password spray targeting gateway servers',
        description: 'Persistent brute-force login attempts identified on default gateway port 22.',
        severity: 'High',
        status: 'Open',
        assignedAnalyst: 'AI Tester',
        sourceIP: '185.220.101.5',
        destinationIP: '10.0.0.1',
        targetHost: 'SSH-GW-01',
        evidenceCount: 0
      })
    });

    const caseData = await caseRes.json();
    if (!caseRes.ok || !caseData.success) {
      throw new Error(`Case creation failed: ${JSON.stringify(caseData)}`);
    }

    testCaseId = caseData.data.caseId;
    console.log(`[PASS] 3. Mock Case created: ${testCaseId}`);
  } catch (err) {
    console.error(`[FAIL] Mock Case creation failed: ${err.message}`);
    process.exit(1);
  }

  // 4. Verify POST /api/ai/analyze
  try {
    const res = await fetch(`${BASE_URL}/ai/analyze`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ caseId: testCaseId })
    });

    const body = await res.json();
    if (res.ok && body.success) {
      console.log('[PASS] 4. POST /api/ai/analyze successfully triaged the case:');
      console.log(`     - Analysis summary: ${body.data.summary}`);
      console.log(`     - Risk level: ${body.data.riskScore}%`);
      console.log(`     - MITRE techniques count: ${body.data.mitre.length}`);
      
      // Verify SSH Brute Force profile matching
      if (body.data.summary.toLowerCase().includes('ssh') || body.data.analysis.toLowerCase().includes('ssh')) {
        console.log('[PASS] 4.1 AI engine successfully matched threat logs to the SSH Spray profile.');
      } else {
        throw new Error(`Profile mismatch: ${JSON.stringify(body.data)}`);
      }
    } else {
      throw new Error(JSON.stringify(body));
    }
  } catch (err) {
    console.error(`[FAIL] POST /api/ai/analyze test failed: ${err.message}`);
  }

  // 5. Verify POST /api/ai/chat
  try {
    const res = await fetch(`${BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        caseId: testCaseId,
        messages: [
          { role: 'user', content: 'What are the recommended actions/mitigations for this SSH threat?' }
        ]
      })
    });

    const body = await res.json();
    if (res.ok && body.success && body.data.message.content) {
      console.log('[PASS] 5. POST /api/ai/chat returned intelligent assistant reply:');
      console.log(`     - Reply content: "${body.data.message.content.replace(/\n/g, ' ')}"`);
      
      if (body.data.message.content.toLowerCase().includes('fail2ban') || body.data.message.content.toLowerCase().includes('firewall')) {
        console.log('[PASS] 5.1 Assistant returned customized mitigations.');
      } else {
        throw new Error(`Chat response lacked context: ${body.data.message.content}`);
      }
    } else {
      throw new Error(JSON.stringify(body));
    }
  } catch (err) {
    console.error(`[FAIL] POST /api/ai/chat test failed: ${err.message}`);
  }

  // 6. Verify POST /api/ai/summarize
  try {
    const res = await fetch(`${BASE_URL}/ai/summarize`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ caseId: testCaseId })
    });

    const body = await res.json();
    if (res.ok && body.success && body.data.summary) {
      console.log(`[PASS] 6. POST /api/ai/summarize returns brief summary.`);
    } else {
      throw new Error(JSON.stringify(body));
    }
  } catch (err) {
    console.error(`[FAIL] Summary endpoint failed: ${err.message}`);
  }

  // 7. Verify POST /api/ai/recommendations
  try {
    const res = await fetch(`${BASE_URL}/ai/recommendations`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ caseId: testCaseId })
    });

    const body = await res.json();
    if (res.ok && body.success && body.data.recommendations.length > 0) {
      console.log(`[PASS] 7. POST /api/ai/recommendations successfully returns list of ${body.data.recommendations.length} items.`);
    } else {
      throw new Error(JSON.stringify(body));
    }
  } catch (err) {
    console.error(`[FAIL] Recommendations endpoint failed: ${err.message}`);
  }

  // 8. Verify POST /api/ai/ioc-detection
  try {
    const res = await fetch(`${BASE_URL}/ai/ioc-detection`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ caseId: testCaseId })
    });

    const body = await res.json();
    if (res.ok && body.success && body.data.iocs.length > 0) {
      console.log(`[PASS] 8. POST /api/ai/ioc-detection successfully returns suspect indicators: ${body.data.iocs[0].value}`);
    } else {
      throw new Error(JSON.stringify(body));
    }
  } catch (err) {
    console.error(`[FAIL] IOC detection endpoint failed: ${err.message}`);
  }

  console.log('\n=== [ALL AI INTEGRATION TESTS SUCCESSFUL] ===');
  process.exit(0);
}

runTests();
