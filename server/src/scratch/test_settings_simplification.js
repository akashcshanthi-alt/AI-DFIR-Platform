const API_BASE = 'http://localhost:5000/api';
const DEMO_USER = {
  email: 'akash.demo@trace.local',
  password: 'AKASHC2026!'
};

async function runTests() {
  console.log('--- STARTING SETTINGS SIMPLIFICATION TESTS ---');

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

  // 2. Verify Profile details
  console.log('\n[TEST 2] Verifying Authenticated Operator Profile...');
  const profileRes = await fetch(`${API_BASE}/auth/profile`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const profileData = await profileRes.json();
  if (!profileRes.ok || !profileData.success) {
    console.error('FAIL: Profile fetch failed:', profileData);
    process.exit(1);
  }
  const user = profileData.data;
  if (user.fullName !== 'AKASH C' || user.email !== 'akash.demo@trace.local' || user.role !== 'Investigator') {
    console.error('FAIL: Unexpected user details:', user);
    process.exit(1);
  }
  console.log('PASS: Profile returns verified identity (AKASH C, akash.demo@trace.local, Investigator).');

  // 3. Test Change Password Security Controls
  console.log('\n[TEST 3] Testing Change Password security controls...');
  
  // 3a. Incorrect current password rejected
  const wrongPwdRes = await fetch(`${API_BASE}/users/profile/password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      currentPassword: 'WrongPassword123!',
      newPassword: 'NewPassword2026!'
    })
  });
  if (wrongPwdRes.status !== 401 && wrongPwdRes.status !== 400) {
    console.error('FAIL: Expected wrong password to be rejected with 401/400. Got:', wrongPwdRes.status);
    process.exit(1);
  }
  console.log('PASS: Incorrect current password rejected.');

  // 3b. Correct password update
  const updatePwdRes = await fetch(`${API_BASE}/users/profile/password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      currentPassword: DEMO_USER.password,
      newPassword: 'TemporarySecret2026!'
    })
  });
  const updatePwdData = await updatePwdRes.json();
  if (!updatePwdRes.ok || !updatePwdData.success) {
    console.error('FAIL: Failed to update password with valid credentials:', updatePwdData);
    process.exit(1);
  }
  console.log('PASS: Password updated successfully with valid current password.');

  // 3c. Revert password back to original demo password
  const revertPwdRes = await fetch(`${API_BASE}/users/profile/password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      currentPassword: 'TemporarySecret2026!',
      newPassword: DEMO_USER.password
    })
  });
  const revertPwdData = await revertPwdRes.json();
  if (!revertPwdRes.ok || !revertPwdData.success) {
    console.error('FAIL: Failed to revert password:', revertPwdData);
    process.exit(1);
  }
  console.log('PASS: Password reverted cleanly back to original.');

  // 4. Test AI Readiness Check (Safe local Ollama probe)
  console.log('\n[TEST 4] Testing Ollama readiness probe...');
  const readinessRes = await fetch(`${API_BASE}/ai/readiness`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const readinessData = await readinessRes.json();
  if (!readinessRes.ok || !readinessData.success) {
    console.error('FAIL: Readiness probe endpoint failed:', readinessData);
    process.exit(1);
  }
  console.log('PASS: AI readiness probe executed cleanly:', readinessData.data);

  // 5. Test Core DFIR Endpoints (Ensuring no regressions)
  console.log('\n[TEST 5] Testing Core DFIR Modules...');
  
  const endpoints = [
    { name: 'Dashboard Overview', url: `${API_BASE}/dashboard/overview` },
    { name: 'Cases List', url: `${API_BASE}/cases` },
    { name: 'Evidence List', url: `${API_BASE}/evidence` },
    { name: 'Reports List', url: `${API_BASE}/reports` },
    { name: 'Audit Logs', url: `${API_BASE}/audit-logs` }
  ];

  for (const ep of endpoints) {
    const res = await fetch(ep.url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      console.error(`FAIL: ${ep.name} failed:`, data);
      process.exit(1);
    }
    console.log(`PASS: ${ep.name} operational.`);
  }

  // 6. Test Logout
  console.log('\n[TEST 6] Testing Session Logout...');
  const logoutRes = await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  const logoutData = await logoutRes.json();
  if (!logoutRes.ok || !logoutData.success) {
    console.error('FAIL: Logout failed:', logoutData);
    process.exit(1);
  }
  console.log('PASS: Session logout completed cleanly.');

  console.log('\nALL SETTINGS SIMPLIFICATION TESTS PASSED (100% SUCCESS)!');
}

runTests().catch(err => {
  console.error('Unexpected test error:', err);
  process.exit(1);
});
