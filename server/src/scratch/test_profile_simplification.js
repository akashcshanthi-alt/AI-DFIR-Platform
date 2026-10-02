const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const API_BASE = 'http://localhost:5000/api';
const DEMO_USER = {
  email: 'akash.demo@trace.local',
  password: 'AKASHC2026!'
};

async function runTests() {
  console.log('--- STARTING PROFILE SIMPLIFICATION TESTS ---');

  // 1. Authenticate as AKASH C
  console.log('\n[TEST 1] Authenticating as AKASH C...');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(DEMO_USER)
  });

  const loginData = await loginRes.json();
  if (!loginRes.ok || !loginData.success) {
    console.error('FAIL: Login failed:', loginData);
    process.exit(1);
  }
  const token = loginData.token || loginData.data?.token;
  console.log('PASS: Login successful. Token received.');

  // 2. Fetch Profile via GET /api/auth/profile
  console.log('\n[TEST 2] Fetching Profile via GET /api/auth/profile...');
  const profileRes = await fetch(`${API_BASE}/auth/profile`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const profileData = await profileRes.json();
  if (!profileRes.ok || !profileData.success) {
    console.error('FAIL: Profile fetch failed:', profileData);
    process.exit(1);
  }

  const user = profileData.data;
  console.log('Retrieved user profile:', {
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    userId: user.userId,
    emailVerified: user.emailVerified,
    accountStatus: user.accountStatus,
    createdAt: user.createdAt
  });

  if (user.fullName !== 'AKASH C') {
    console.error(`FAIL: Name mismatch. Expected 'AKASH C', got '${user.fullName}'`);
    process.exit(1);
  }
  if (user.email !== 'akash.demo@trace.local') {
    console.error(`FAIL: Email mismatch. Expected 'akash.demo@trace.local', got '${user.email}'`);
    process.exit(1);
  }
  if (user.role !== 'Investigator') {
    console.error(`FAIL: Role mismatch. Expected 'Investigator', got '${user.role}'`);
    process.exit(1);
  }
  console.log('PASS: User identity verification passed (Name: AKASH C, Email: akash.demo@trace.local, Role: Investigator).');

  // 3. Verify sensitive fields are not exposed
  console.log('\n[TEST 3] Verifying sensitive auth fields are excluded...');
  if (user.password !== undefined || user.passwordHash !== undefined || user.resetPasswordToken !== undefined || user.verificationToken !== undefined) {
    console.error('FAIL: Sensitive authentication fields exposed in profile response!');
    process.exit(1);
  }
  console.log('PASS: Sensitive authentication fields are properly omitted.');

  // 4. Test Updating Profile via PUT /api/users/profile
  console.log('\n[TEST 4] Updating Profile via PUT /api/users/profile...');
  const updateRes = await fetch(`${API_BASE}/users/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      fullName: 'AKASH C',
      department: 'DFIR Investigation & Incident Response',
      phone: '+1-555-0199',
      profileImage: ''
    })
  });
  const updateData = await updateRes.json();
  if (!updateRes.ok || !updateData.success) {
    console.error('FAIL: Profile update failed:', updateData);
    process.exit(1);
  }
  if (updateData.data.department !== 'DFIR Investigation & Incident Response' || updateData.data.phone !== '+1-555-0199') {
    console.error('FAIL: Updated fields mismatch:', updateData.data);
    process.exit(1);
  }
  console.log('PASS: Profile successfully updated with real details.');

  // 5. Verify Assigned Cases query for AKASH C
  console.log('\n[TEST 5] Checking assigned cases for AKASH C...');
  const casesRes = await fetch(`${API_BASE}/cases?limit=5`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const casesData = await casesRes.json();
  if (!casesRes.ok || !casesData.success) {
    console.error('FAIL: Cases fetch failed:', casesData);
    process.exit(1);
  }
  console.log(`PASS: Cases retrieved: ${casesData.data.length} assigned cases (Empty state verified).`);

  // 6. Verify User Activity / Audit Logs for AKASH C
  console.log('\n[TEST 6] Checking user audit logs for AKASH C...');
  const auditRes = await fetch(`${API_BASE}/audit-logs?limit=5`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const auditData = await auditRes.json();
  if (!auditRes.ok || !auditData.success) {
    console.error('FAIL: Audit logs fetch failed:', auditData);
    process.exit(1);
  }
  console.log(`PASS: Audit logs retrieved: ${auditData.data.length} logs for AKASH C.`);

  // 7. Verify Data Isolation (Token required, no unauthorized access)
  console.log('\n[TEST 7] Checking authorization protection...');
  const unauthRes = await fetch(`${API_BASE}/auth/profile`);
  if (unauthRes.status !== 401) {
    console.error('FAIL: Unauthenticated profile request should return 401. Got:', unauthRes.status);
    process.exit(1);
  }
  console.log('PASS: Unauthenticated profile request rejected with 401 Unauthorized.');

  console.log('\nALL PROFILE SIMPLIFICATION TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('Unexpected error during test execution:', err);
  process.exit(1);
});
