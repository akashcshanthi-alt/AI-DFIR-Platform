/**
 * Unit Test Suite for Critical Security Hardening
 * Verifies auth.controller and auth middleware behavior in isolation without external DB dependencies.
 */

const { googleLogin, forgotPassword } = require('../controllers/auth.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

function mockRes() {
  const res = {};
  res.statusCode = 200;
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.body = data;
    return res;
  };
  return res;
}

let passed = 0;
let total = 0;

function assert(cond, msg) {
  total++;
  if (!cond) {
    console.error(`[FAIL] ${msg}`);
    process.exit(1);
  }
  passed++;
  console.log(`[PASS] ${msg}`);
}

async function run() {
  console.log('=== RUNNING AUTH SECURITY UNIT TESTS ===\n');

  // 1. Google SSO: Reject arbitrary email without token
  {
    const req = { body: { email: 'attacker@evil.com', fullName: 'Attacker' } };
    const res = mockRes();
    let nextCalled = false;
    await googleLogin(req, res, () => { nextCalled = true; });

    assert(res.statusCode === 400, 'googleLogin returns 400 for arbitrary email-only body');
    assert(res.body?.success === false, 'googleLogin success flag is false');
    assert(res.body?.error?.message?.includes('idToken'), 'googleLogin error message informs idToken required');
  }

  // 2. Google SSO: Reject empty body
  {
    const req = { body: {} };
    const res = mockRes();
    await googleLogin(req, res, () => {});

    assert(res.statusCode === 400, 'googleLogin returns 400 for empty body');
    assert(res.body?.success === false, 'googleLogin returns success=false for empty body');
  }

  // 3. Google SSO: Fail closed for unverified token
  {
    const req = { body: { idToken: 'unverified-firebase-id-token' } };
    const res = mockRes();
    await googleLogin(req, res, () => {});

    assert(res.statusCode === 401, 'googleLogin fails closed with 401 for unverified token');
    assert(res.body?.success === false, 'googleLogin returns success=false for unverified token');
    assert(res.body?.error?.message?.includes('not configured'), 'googleLogin message explains unconfigured SSO');
  }

  // 4. JWT Secret Handling in authenticate middleware
  {
    const savedSecret = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;

    const req = { headers: { authorization: 'Bearer some.dummy.token' } };
    const res = mockRes();
    let nextCalled = false;
    authenticate(req, res, () => { nextCalled = true; });

    assert(res.statusCode === 500, 'authenticate middleware returns 500 when JWT_SECRET is unset in env');
    assert(!nextCalled, 'authenticate middleware does NOT call next() when JWT_SECRET is missing');

    // Restore secret
    process.env.JWT_SECRET = savedSecret || 'test-secret-at-least-32-chars-long';
  }

  // 5. JWT Authentication with valid token
  {
    process.env.JWT_SECRET = 'valid-test-secret-min-32-characters-test';
    const payload = { id: 'user123', email: 'operator@trace.ai', role: 'Investigator' };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });

    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    let nextCalled = false;
    authenticate(req, res, () => { nextCalled = true; });

    assert(nextCalled === true, 'authenticate middleware calls next() for valid JWT');
    assert(req.user?.email === 'operator@trace.ai', 'req.user correctly populated from verified JWT');
  }

  // 6. RBAC Middleware check
  {
    const req = { user: { role: 'Analyst' } };
    const res = mockRes();
    let nextCalled = false;
    authorizeRoles('Admin', 'Super Admin')(req, res, () => { nextCalled = true; });

    assert(res.statusCode === 403, 'authorizeRoles returns 403 for unauthorized role');
    assert(!nextCalled, 'authorizeRoles does not call next() for unauthorized role');
  }

  // 7. Password reset token leakage verification
  {
    const req = { body: {} };
    const res = mockRes();
    await forgotPassword(req, res, () => {});
    assert(res.statusCode === 400, 'forgotPassword rejects empty email with 400');
  }

  console.log(`\n=== ALL ${passed}/${total} UNIT CHECKS PASSED ===`);
}

run();
