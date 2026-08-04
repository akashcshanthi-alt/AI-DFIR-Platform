const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

async function runUserManagementTests() {
  console.log('=== [TRACE USER MANAGEMENT & RBAC INTEGRATION TESTS] ===');
  console.log(`Targeting base API URL: ${BASE_URL}\n`);

  let superAdminToken = '';
  let analystToken = '';
  const superEmail = `super.admin.${Date.now()}@trace.ai`;
  const analystEmail = `analyst.test.${Date.now()}@trace.ai`;

  // 1. Register a Super Admin operator
  try {
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Super Administrator',
        email: superEmail,
        password: 'superclearancekey123',
        role: 'Super Admin',
        department: 'Security Command Center'
      })
    });

    const regData = await regRes.json();
    if (!regRes.ok || !regData.success) {
      throw new Error(`Super Admin Registration failed: ${JSON.stringify(regData)}`);
    }

    console.log(`[PASS] 1. Super Admin registered. Email: ${superEmail}`);

    // 2. Login Super Admin
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: superEmail,
        password: 'superclearancekey123'
      })
    });

    const loginData = await loginRes.json();
    if (!loginRes.ok || !loginData.success) {
      throw new Error(`Super Admin Login failed: ${JSON.stringify(loginData)}`);
    }

    superAdminToken = loginData.token;
    console.log(`[PASS] 2. Super Admin login successful.`);
  } catch (err) {
    console.error(`[FAIL] Super Admin authentication failed: ${err.message}`);
    process.exit(1);
  }

  const superHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${superAdminToken}`
  };

  // 3. Register a regular Analyst
  let analystUserId = '';
  try {
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Regular Analyst John',
        email: analystEmail,
        password: 'analystpassword123',
        role: 'Analyst',
        department: 'Subnet Security Team'
      })
    });

    const regData = await regRes.json();
    if (!regRes.ok || !regData.success) {
      throw new Error(`Analyst Registration failed: ${JSON.stringify(regData)}`);
    }

    analystUserId = regData.data.userId;
    console.log(`[PASS] 3. Regular Analyst registered: ${analystUserId}`);

    // Login Analyst
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: analystEmail,
        password: 'analystpassword123'
      })
    });

    const loginData = await loginRes.json();
    analystToken = loginData.token;
  } catch (err) {
    console.error(`[FAIL] Regular Analyst registration failed: ${err.message}`);
    process.exit(1);
  }

  const analystHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${analystToken}`
  };

  // 4. GET /api/users as Super Admin
  try {
    const res = await fetch(`${BASE_URL}/users`, {
      method: 'GET',
      headers: superHeaders
    });

    const body = await res.json();
    if (res.ok && body.success && body.data.length > 0) {
      console.log(`[PASS] 4. GET /api/users returned ${body.data.length} registered operators paginated.`);
    } else {
      throw new Error(JSON.stringify(body));
    }
  } catch (err) {
    console.error(`[FAIL] GET /api/users test failed: ${err.message}`);
    process.exit(1);
  }

  // 5. GET /api/users/:id (look up details)
  try {
    const res = await fetch(`${BASE_URL}/users/${analystUserId}`, {
      method: 'GET',
      headers: superHeaders
    });

    const body = await res.json();
    if (res.ok && body.success && body.data.fullName === 'Regular Analyst John') {
      console.log(`[PASS] 5. GET /api/users/:id successfully retrieved operator info: ${body.data.fullName}`);
    } else {
      throw new Error(JSON.stringify(body));
    }
  } catch (err) {
    console.error(`[FAIL] Look up operator failed: ${err.message}`);
    process.exit(1);
  }

  // 6. PUT /api/users/:id/role (promote Analyst to Investigator)
  try {
    const res = await fetch(`${BASE_URL}/users/${analystUserId}/role`, {
      method: 'PUT',
      headers: superHeaders,
      body: JSON.stringify({ role: 'Investigator' })
    });

    const body = await res.json();
    if (res.ok && body.success && body.data.role === 'Investigator') {
      console.log(`[PASS] 6. Role updated from Analyst to Investigator.`);
    } else {
      throw new Error(JSON.stringify(body));
    }
  } catch (err) {
    console.error(`[FAIL] Role update failed: ${err.message}`);
    process.exit(1);
  }

  // 7. PUT /api/users/:id/status (Suspend Analyst)
  try {
    const res = await fetch(`${BASE_URL}/users/${analystUserId}/status`, {
      method: 'PUT',
      headers: superHeaders,
      body: JSON.stringify({ status: 'Suspended' })
    });

    const body = await res.json();
    if (res.ok && body.success && body.data.accountStatus === 'Suspended') {
      console.log(`[PASS] 7. Status successfully updated to Suspended.`);
    } else {
      throw new Error(JSON.stringify(body));
    }
  } catch (err) {
    console.error(`[FAIL] Status update failed: ${err.message}`);
    process.exit(1);
  }

  // 8. PUT /api/users/:id (edit profile details)
  try {
    const res = await fetch(`${BASE_URL}/users/${analystUserId}`, {
      method: 'PUT',
      headers: superHeaders,
      body: JSON.stringify({ fullName: 'John Updated Doe', department: 'C2-Threat-Triage' })
    });

    const body = await res.json();
    if (res.ok && body.success && body.data.fullName === 'John Updated Doe') {
      console.log(`[PASS] 8. Profile detail successfully updated to: ${body.data.fullName}`);
    } else {
      throw new Error(JSON.stringify(body));
    }
  } catch (err) {
    console.error(`[FAIL] Profile update failed: ${err.message}`);
    process.exit(1);
  }

  // 9. DELETE /api/users/:id (remove account)
  try {
    const res = await fetch(`${BASE_URL}/users/${analystUserId}`, {
      method: 'DELETE',
      headers: superHeaders
    });

    const body = await res.json();
    if (res.ok && body.success) {
      console.log(`[PASS] 9. Operator account successfully removed from system registry.`);
    } else {
      throw new Error(JSON.stringify(body));
    }
  } catch (err) {
    console.error(`[FAIL] Account deletion failed: ${err.message}`);
    process.exit(1);
  }

  // 10. Verify permissions (RBAC restriction) - Analyst should receive 403 on admin routes
  try {
    const res = await fetch(`${BASE_URL}/users`, {
      method: 'GET',
      headers: analystHeaders
    });

    const body = await res.json();
    if (res.status === 403 && !body.success) {
      console.log(`[PASS] 10. Role clearance check validated. Regular analyst requests rejected with 403.`);
    } else {
      throw new Error(`Analyst accessed administrative routes: ${res.status}`);
    }
  } catch (err) {
    console.error(`[FAIL] Clearance check validation failed: ${err.message}`);
    process.exit(1);
  }

  console.log('\n=== [ALL USER MANAGEMENT & RBAC INTEGRATION TESTS SUCCESSFUL] ===');
  process.exit(0);
}

runUserManagementTests();
