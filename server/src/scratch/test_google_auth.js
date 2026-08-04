const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

async function runGoogleAuthTests() {
  console.log('=== [TRACE GOOGLE OAUTH INTEGRATION TESTS] ===');
  console.log(`Targeting base API URL: ${BASE_URL}\n`);

  const testEmail = `google.analyst.${Date.now()}@trace.ai`;
  const testName = 'Google SSO Analyst';

  let testUserId = '';

  // 1. POST /api/auth/google (User does not exist - should auto-create)
  try {
    const res = await fetch(`${BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        fullName: testName,
        profileImage: 'https://images.unsplash.com/photo-google'
      })
    });

    const body = await res.json();
    if (res.ok && body.success && body.token) {
      testUserId = body.user.userId;
      console.log('[PASS] 1. New Google user auto-created on-the-fly:');
      console.log(`     - User ID: ${body.user.userId}`);
      console.log(`     - Email: ${body.user.email}`);
      console.log(`     - Role: ${body.user.role}`);
      console.log(`     - Department: ${body.user.department}`);
      console.log(`     - Verified Status: ${body.user.emailVerified}`);
      
      const checkDetails = body.user.role === 'Analyst' && body.user.department === 'Google SSO' && body.user.emailVerified === true;
      if (checkDetails) {
        console.log('[PASS] 1.1 Mongoose model properties mapped successfully.');
      } else {
        throw new Error('Default properties mismatch.');
      }
    } else {
      throw new Error(JSON.stringify(body));
    }
  } catch (err) {
    console.error(`[FAIL] User auto-creation test failed: ${err.message}`);
    process.exit(1);
  }

  // 2. POST /api/auth/google (User already exists - should login automatically)
  try {
    const res = await fetch(`${BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        fullName: testName
      })
    });

    const body = await res.json();
    if (res.ok && body.success && body.token) {
      console.log(`[PASS] 2. Existing Google user logged in automatically: ${body.user.userId}`);
    } else {
      throw new Error(JSON.stringify(body));
    }
  } catch (err) {
    console.error(`[FAIL] Auto-login test failed: ${err.message}`);
    process.exit(1);
  }

  // 3. Validation test (missing email)
  try {
    const res = await fetch(`${BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: testName
      })
    });

    const body = await res.json();
    if (res.status === 400 && !body.success) {
      console.log('[PASS] 3. Missing email validated and rejected with 400.');
    } else {
      throw new Error(`Unexpected response code: ${res.status}`);
    }
  } catch (err) {
    console.error(`[FAIL] Email validation test failed: ${err.message}`);
    process.exit(1);
  }

  // 4. Suspend User validation test (GET token block check)
  // Retrieve Super Admin token to suspend user
  let adminToken = '';
  const adminEmail = `admin.${Date.now()}@trace.ai`;
  try {
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Admin User',
        email: adminEmail,
        password: 'adminpassword123',
        role: 'Admin',
        department: 'TRACE Security Command'
      })
    });
    const regData = await regRes.json();
    
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: 'adminpassword123' })
    });
    const loginData = await loginRes.json();
    adminToken = loginData.token;

    // Suspend the Google user
    const suspRes = await fetch(`${BASE_URL}/users/${testUserId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'Suspended' })
    });
    const suspData = await suspRes.json();
    if (!suspRes.ok || !suspData.success) {
      throw new Error(`Suspension failed: ${JSON.stringify(suspData)}`);
    }

    console.log('[PASS] 4. Google user status changed to Suspended.');

    // Attempt Google Login for Suspended user - should block with 403
    const blockedRes = await fetch(`${BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, fullName: testName })
    });

    const blockedBody = await blockedRes.json();
    if (blockedRes.status === 403 && !blockedBody.success) {
      console.log('[PASS] 4.1 Suspended Google user blocked from logging in with 403.');
    } else {
      throw new Error(`Unexpected login bypass. Code: ${blockedRes.status}`);
    }
  } catch (err) {
    console.error(`[FAIL] Suspension guard verification failed: ${err.message}`);
    process.exit(1);
  }

  console.log('\n=== [ALL GOOGLE OAUTH INTEGRATION TESTS SUCCESSFUL] ===');
  process.exit(0);
}

runGoogleAuthTests();
