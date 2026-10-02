const assert = require('assert');

async function testDemoUser() {
  const baseUrl = 'http://localhost:5000/api';
  console.log('Testing demo user login, data isolation, and authentication flow...');

  // 1. Test Login with wrong password -> expect 401
  const wrongLoginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'akash.demo@trace.local',
      password: 'WrongPassword123!'
    })
  });
  assert.strictEqual(wrongLoginRes.status, 401, 'Wrong password should return 401');
  console.log('[PASS] Wrong password rejected with 401');

  // 2. Test Login with correct credentials
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'akash.demo@trace.local',
      password: 'AKASHC2026!'
    })
  });
  assert.strictEqual(loginRes.status, 200, 'Login should succeed with 200');
  const loginData = await loginRes.json();
  assert.strictEqual(loginData.success, true);
  assert.ok(loginData.token, 'Token should be returned');
  assert.strictEqual(loginData.user.email, 'akash.demo@trace.local');
  assert.strictEqual(loginData.user.fullName, 'AKASH C');
  assert.strictEqual(loginData.user.role, 'Investigator');
  console.log(`[PASS] Login successful. User: ${loginData.user.fullName} (${loginData.user.userId}), Role: ${loginData.user.role}`);

  const token = loginData.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 3. Test Profile
  const profileRes = await fetch(`${baseUrl}/auth/profile`, { headers: authHeaders });
  assert.strictEqual(profileRes.status, 200);
  const profileData = await profileRes.json();
  assert.strictEqual(profileData.data.email, 'akash.demo@trace.local');
  console.log('[PASS] /auth/profile returns correct user details');

  // 4. Test Dashboard Overview & Data Isolation
  const overviewRes = await fetch(`${baseUrl}/dashboard/overview`, { headers: authHeaders });
  assert.strictEqual(overviewRes.status, 200);
  const overviewData = await overviewRes.json();
  const data = overviewData.data;

  console.log('Dashboard stats for new user:', JSON.stringify(data.stats, null, 2));

  assert.strictEqual(data.stats.totalCases, 0, 'Cases count must be 0');
  assert.strictEqual(data.stats.openCases, 0, 'Open cases count must be 0');
  assert.strictEqual(data.stats.criticalCases, 0, 'Critical cases count must be 0');
  assert.strictEqual(data.stats.closedCases, 0, 'Closed cases count must be 0');
  assert.strictEqual(data.stats.reportsGenerated, 0, 'Reports count must be 0');
  assert.strictEqual(data.stats.totalIOCs, 0, 'IOCs count must be 0');
  assert.strictEqual(data.stats.activeIOCs, 0, 'Active IOCs count must be 0');
  assert.strictEqual(data.recentCases.length, 0, 'Recent cases list must be empty');
  assert.strictEqual(data.recentAlerts.length, 0, 'Recent alerts must be empty for new user');
  console.log('[PASS] Dashboard overview is completely clean (0 cases, 0 reports, 0 IOCs, 0 alerts)');

  // 5. Test Cases endpoint
  const casesRes = await fetch(`${baseUrl}/cases`, { headers: authHeaders });
  assert.strictEqual(casesRes.status, 200);
  const casesData = await casesRes.json();
  assert.strictEqual(casesData.data.length, 0, 'Cases endpoint must return 0 items for new user');
  console.log('[PASS] /cases returns 0 cases');

  // 6. Test Evidence endpoint
  const evidenceRes = await fetch(`${baseUrl}/evidence`, { headers: authHeaders });
  assert.strictEqual(evidenceRes.status, 200);
  const evidenceData = await evidenceRes.json();
  assert.strictEqual(evidenceData.data.length, 0, 'Evidence endpoint must return 0 items for new user');
  console.log('[PASS] /evidence returns 0 items');

  // 7. Test IOC endpoint (/api/ioc)
  const iocRes = await fetch(`${baseUrl}/ioc`, { headers: authHeaders });
  assert.strictEqual(iocRes.status, 200);
  const iocData = await iocRes.json();
  assert.strictEqual(iocData.data.items.length, 0, 'IOC endpoint must return 0 items for new user');
  console.log('[PASS] /ioc returns 0 items');

  // 8. Test Reports endpoint
  const reportsRes = await fetch(`${baseUrl}/reports`, { headers: authHeaders });
  assert.strictEqual(reportsRes.status, 200);
  const reportsData = await reportsRes.json();
  assert.strictEqual(reportsData.data.length, 0, 'Reports endpoint must return 0 items');
  console.log('[PASS] /reports returns 0 items');

  // 9. Verify Cross-User Case Access Denial (e.g. attempting to access other user's case DF-1001)
  const crossCaseRes = await fetch(`${baseUrl}/cases/DF-1001`, { headers: authHeaders });
  assert.strictEqual(crossCaseRes.status, 404, 'Cross-user case access must be rejected with 404 not found');
  console.log('[PASS] Access to unauthorized/other user cases is blocked (404)');

  // 10. Verify Cross-User Timeline Access Denial
  const crossTimelineRes = await fetch(`${baseUrl}/timeline?caseId=DF-1001`, { headers: authHeaders });
  assert.strictEqual(crossTimelineRes.status, 404, 'Cross-user timeline query must be rejected');
  console.log('[PASS] Unauthorized case timeline access is blocked');

  // 11. Test Logout
  const logoutRes = await fetch(`${baseUrl}/auth/logout`, {
    method: 'POST',
    headers: authHeaders
  });
  assert.strictEqual(logoutRes.status, 200);
  console.log('[PASS] /auth/logout succeeds');

  // 12. Test Login again
  const reLoginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'akash.demo@trace.local',
      password: 'AKASHC2026!'
    })
  });
  assert.strictEqual(reLoginRes.status, 200, 'Re-login must succeed');
  const reLoginData = await reLoginRes.json();
  assert.ok(reLoginData.token);
  console.log('[PASS] Re-login with demo user credentials succeeded cleanly');

  console.log('\n=======================================================');
  console.log('>>> ALL DEMO USER TESTS PASSED 100% CLEANLY <<<');
  console.log('=======================================================\n');
}

testDemoUser().catch(err => {
  console.error('[FAIL]', err);
  process.exit(1);
});
