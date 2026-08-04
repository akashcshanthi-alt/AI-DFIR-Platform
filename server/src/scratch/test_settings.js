const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

async function runSettingsTests() {
  console.log('=== [TRACE SECURITY SETTINGS INTEGRATION TESTS] ===');
  console.log(`Targeting base API URL: ${BASE_URL}\n`);

  let token = '';
  const testEmail = `analyst.settings.${Date.now()}@trace.ai`;

  // 1. Register a test operator
  try {
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Settings Auditor',
        email: testEmail,
        password: 'clearancepassword123',
        role: 'Admin',
        department: 'TRACE Settings Command'
      })
    });

    const regData = await regRes.json();
    if (!regRes.ok || !regData.success) {
      throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
    }

    console.log(`[PASS] 1. Settings operator registered. Email: ${testEmail}`);

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

  // 3. GET /api/settings (baseline retrieval)
  try {
    const res = await fetch(`${BASE_URL}/settings`, {
      method: 'GET',
      headers: authHeaders
    });

    const body = await res.json();
    if (res.ok && body.success) {
      console.log('[PASS] 3. GET /api/settings returned baseline configurations:');
      console.log(`     - Company Name: ${body.data.organization.companyName}`);
      console.log(`     - MFA Status: ${body.data.security.mfaEnabled}`);
      console.log(`     - Sensitivity: ${body.data.aiConfiguration.aiSensitivity}`);
      console.log(`     - Min Pass Length: ${body.data.passwordPolicy.minLength}`);
      
      if (body.data.organization.companyName === 'TRACE DFIR Labs') {
        console.log('[PASS] 3.1 Settings schema loaded baseline default parameters correctly.');
      } else {
        throw new Error('Default parameter mismatch.');
      }
    } else {
      throw new Error(JSON.stringify(body));
    }
  } catch (err) {
    console.error(`[FAIL] GET /api/settings failed: ${err.message}`);
    process.exit(1);
  }

  // 4. PUT /api/settings (update parameters)
  const updatePayload = {
    organization: { companyName: 'TRACE AUDITED CO' },
    security: { inactivityTimeout: 99 },
    passwordPolicy: { minLength: 12 }
  };

  try {
    const res = await fetch(`${BASE_URL}/settings`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify(updatePayload)
    });

    const body = await res.json();
    if (res.ok && body.success) {
      console.log('[PASS] 4. PUT /api/settings completed updates.');
    } else {
      throw new Error(JSON.stringify(body));
    }
  } catch (err) {
    console.error(`[FAIL] PUT /api/settings failed: ${err.message}`);
    process.exit(1);
  }

  // 5. Re-run GET /api/settings and verify persistence after updates
  try {
    const res = await fetch(`${BASE_URL}/settings`, {
      method: 'GET',
      headers: authHeaders
    });

    const body = await res.json();
    if (res.ok && body.success) {
      console.log('[PASS] 5. GET /api/settings returned persistent values from MongoDB:');
      console.log(`     - Updated Company Name: "${body.data.organization.companyName}"`);
      console.log(`     - Updated Timeout: ${body.data.security.inactivityTimeout} min`);
      console.log(`     - Updated Password Length constraint: ${body.data.passwordPolicy.minLength} char`);
      
      const checkOrg = body.data.organization.companyName === 'TRACE AUDITED CO';
      const checkTimeout = body.data.security.inactivityTimeout === 99;
      const checkMinLength = body.data.passwordPolicy.minLength === 12;

      if (checkOrg && checkTimeout && checkMinLength) {
        console.log('[PASS] 5.1 Updates successfully verified in MongoDB storage.');
      } else {
        throw new Error('Persistence mismatch.');
      }
    } else {
      throw new Error(JSON.stringify(body));
    }
  } catch (err) {
    console.error(`[FAIL] Verification GET failed: ${err.message}`);
    process.exit(1);
  }

  console.log('\n=== [ALL SETTINGS MODULE INTEGRATION TESTS SUCCESSFUL] ===');
  process.exit(0);
}

runSettingsTests();
