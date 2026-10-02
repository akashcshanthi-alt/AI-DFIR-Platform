const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

async function runGoogleAuthTests() {
  console.log('=== [TRACE GOOGLE OAUTH SECURITY REGRESSION TESTS] ===');
  console.log(`Targeting base API URL: ${BASE_URL}\n`);

  const testEmail = `attacker.${Date.now()}@trace.ai`;
  const testName = 'Arbitrary Email Attacker';

  // 1. Insecure arbitrary email login attempt must be REJECTED (400)
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
    if (res.status === 400 && !body.success && body.error?.message?.includes('idToken')) {
      console.log('[PASS] 1. Arbitrary email-only authentication rejected with 400 Bad Request:');
      console.log(`     - Response message: "${body.error.message}"`);
    } else {
      throw new Error(`Insecure arbitrary email bypass succeeded or did not return 400. Status: ${res.status}, Body: ${JSON.stringify(body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] Arbitrary email rejection test failed: ${err.message}`);
    process.exit(1);
  }

  // 2. Missing token payload must be REJECTED (400)
  try {
    const res = await fetch(`${BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    const body = await res.json();
    if (res.status === 400 && !body.success) {
      console.log('[PASS] 2. Empty payload rejected with 400 Bad Request.');
    } else {
      throw new Error(`Unexpected response code for empty payload: ${res.status}`);
    }
  } catch (err) {
    console.error(`[FAIL] Empty payload rejection test failed: ${err.message}`);
    process.exit(1);
  }

  // 3. Unconfigured Firebase provider fails closed with 401 Unauthorized
  try {
    const res = await fetch(`${BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken: 'mock-google-id-token-unverified'
      })
    });

    const body = await res.json();
    if (res.status === 401 && !body.success) {
      console.log('[PASS] 3. Unconfigured identity provider fails closed with 401 Unauthorized:');
      console.log(`     - Response message: "${body.error?.message}"`);
    } else {
      throw new Error(`Did not fail closed with 401. Status: ${res.status}, Body: ${JSON.stringify(body)}`);
    }
  } catch (err) {
    console.error(`[FAIL] Fail-closed test failed: ${err.message}`);
    process.exit(1);
  }

  console.log('\n=== [ALL GOOGLE AUTH SECURITY TESTS PASSED CLEANLY] ===');
}

runGoogleAuthTests();
