/**
 * Automated Security Hardening Verification Suite
 * Verifies Phase 1A Critical Security Hardening fixes:
 * 1. Google SSO arbitrary email bypass removal & fail-closed behavior
 * 2. Hardcoded JWT fallback secrets removal & fail-closed behavior
 * 3. Plaintext password reset token log leakage prevention
 * 4. Normal auth flow preservation
 */

const http = require('http');
const mongoose = require('mongoose');
const app = require('../app');
const connectDB = require('../config/database');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

async function runSecuritySuite() {
  console.log('====================================================');
  console.log('Starting Phase 1A Critical Security Verification');
  console.log('====================================================\n');

  // Step 1: Initialize database
  await connectDB();

  // Step 2: Spin up ephemeral server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;
  console.log(`[Test Server] Ephemeral test server listening on ${baseUrl}\n`);

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (!condition) {
      console.error(`[FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
    passedTests++;
    console.log(`[PASS] ${message}`);
  }

  try {
    // -------------------------------------------------------------
    // TEST SUITE 1: Google SSO Hardening
    // -------------------------------------------------------------
    console.log('--- Test Suite 1: Google SSO Hardening ---');

    // 1.1: Arbitrary email payload must return 400 Bad Request
    const res1 = await fetch(`${baseUrl}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'attacker@evil.corp', fullName: 'Attacker' })
    });
    const body1 = await res1.json();
    assert(
      res1.status === 400 && body1.success === false && body1.error?.message?.includes('idToken'),
      'Arbitrary email-only Google login rejected with 400 Bad Request'
    );

    // 1.2: Empty payload must return 400 Bad Request
    const res2 = await fetch(`${baseUrl}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const body2 = await res2.json();
    assert(
      res2.status === 400 && body2.success === false,
      'Empty Google login payload rejected with 400 Bad Request'
    );

    // 1.3: Unverified / unconfigured ID token must fail closed with 401 Unauthorized
    const res3 = await fetch(`${baseUrl}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: 'mock.unverified.token' })
    });
    const body3 = await res3.json();
    assert(
      res3.status === 401 && body3.success === false && body3.error?.message?.includes('not configured'),
      'Unconfigured Firebase / Google SSO provider fails closed with 401 Unauthorized'
    );

    // -------------------------------------------------------------
    // TEST SUITE 2: Normal Email/Password Flow & RBAC Preservation
    // -------------------------------------------------------------
    console.log('\n--- Test Suite 2: Normal Auth Flow Preservation ---');

    const testEmail = `operator_${Date.now()}@trace.ai`;
    const testPassword = 'SecurePassword!123';

    // 2.1: Register normal user
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Security Operator One',
        email: testEmail,
        password: testPassword,
        role: 'Investigator',
        department: 'DFIR SOC'
      })
    });
    const regBody = await regRes.json();
    assert(regRes.status === 201 && regBody.success === true, 'Standard operator registration succeeds with 201');

    // 2.2: Login with credentials
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    const loginBody = await loginRes.json();
    assert(
      loginRes.status === 200 && loginBody.success === true && loginBody.token && loginBody.refreshToken,
      'Standard operator login succeeds with valid JWT access and refresh tokens'
    );

    const validToken = loginBody.token;

    // -------------------------------------------------------------
    // TEST SUITE 3: Password Reset Token Leakage Check
    // -------------------------------------------------------------
    console.log('\n--- Test Suite 3: Password Reset Token Leakage Check ---');

    // Intercept console.log during forgot-password
    const capturedLogs = [];
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      capturedLogs.push(args.join(' '));
      originalConsoleLog(...args);
    };

    const forgotRes = await fetch(`${baseUrl}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });
    const forgotBody = await forgotRes.json();

    // Restore console.log
    console.log = originalConsoleLog;

    assert(forgotRes.status === 200 && forgotBody.success === true, 'Forgot-password endpoint responds successfully');

    // Check DB for the generated token
    const dbUser = await User.findOne({ email: testEmail });
    const resetToken = dbUser?.resetPasswordToken;
    assert(Boolean(resetToken), 'Password reset token was securely persisted in MongoDB');

    // Verify logs do NOT contain the plaintext token or reset link
    const logDump = capturedLogs.join('\n');
    assert(
      !logDump.includes(resetToken),
      'Plaintext password reset token is NEVER printed to console/logs'
    );
    assert(
      !logDump.includes('reset-password?token='),
      'Password reset link containing token is NEVER printed to console/logs'
    );
    assert(
      logDump.includes('Password reset token generated successfully'),
      'Safe confirmation message logged without secret leakage'
    );

    // -------------------------------------------------------------
    // TEST SUITE 4: JWT Secret Fail-Closed Behavior
    // -------------------------------------------------------------
    console.log('\n--- Test Suite 4: JWT Secret Hardening & Fail-Closed Behavior ---');

    // 4.1: Missing JWT_SECRET during auth verification fails closed
    const originalSecret = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;

    // Call protected endpoint with missing JWT_SECRET
    const protectedRes = await fetch(`${baseUrl}/cases`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${validToken}`,
        'Content-Type': 'application/json'
      }
    });
    const protectedBody = await protectedRes.json();

    assert(
      protectedRes.status === 500 && protectedBody.success === false && protectedBody.error?.message?.includes('Authentication service configuration error'),
      'Middleware fails closed with 500 when JWT_SECRET is missing from environment'
    );

    // 4.2: Missing JWT_SECRET during token generation throws error
    const authController = require('../controllers/auth.controller');
    let threwSecretError = false;
    try {
      await authController.login(
        { body: { email: testEmail, password: testPassword } },
        { status: () => ({ json: () => {} }) },
        (err) => { if (err) threwSecretError = true; }
      );
    } catch (e) {
      threwSecretError = true;
    }
    assert(threwSecretError, 'Token generation fails closed when JWT_SECRET is missing from environment');

    // Restore JWT_SECRET
    process.env.JWT_SECRET = originalSecret;

    // 4.3: Missing JWT_REFRESH_SECRET throws error
    const originalRefreshSecret = process.env.JWT_REFRESH_SECRET;
    delete process.env.JWT_REFRESH_SECRET;

    let threwRefreshError = false;
    try {
      await authController.login(
        { body: { email: testEmail, password: testPassword } },
        { status: () => ({ json: () => {} }) },
        (err) => { if (err) threwRefreshError = true; }
      );
    } catch (e) {
      threwRefreshError = true;
    }
    assert(threwRefreshError, 'Token generation fails closed when JWT_REFRESH_SECRET is missing from environment');

    // Restore JWT_REFRESH_SECRET
    process.env.JWT_REFRESH_SECRET = originalRefreshSecret;

    // 4.4: Verify protected endpoint works when JWT_SECRET is properly configured
    const normalProtectedRes = await fetch(`${baseUrl}/cases`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${validToken}`,
        'Content-Type': 'application/json'
      }
    });
    assert(normalProtectedRes.status === 200, 'Protected endpoint succeeds when JWT_SECRET is correctly configured');

    console.log(`\n====================================================`);
    console.log(`ALL TESTS PASSED: ${passedTests}/${totalTests} verifications passed!`);
    console.log(`====================================================\n`);

  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

runSecuritySuite()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test Suite Failed:', err);
    process.exit(1);
  });
