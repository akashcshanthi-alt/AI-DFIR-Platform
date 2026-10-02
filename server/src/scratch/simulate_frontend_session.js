const assert = require('assert');

// Mock localStorage for node environment
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

global.localStorage = localStorageMock;

const API_URL = 'http://localhost:5000/api';

async function simulateFrontendSession() {
  console.log('=== Simulating Frontend Client Session ===');

  // Step 1: Login
  console.log('1. Attempting login via POST /api/auth/login...');
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'akash.demo@trace.local',
      password: 'AKASHC2026!'
    })
  });

  const loginData = await loginRes.json();
  assert.strictEqual(loginRes.status, 200);
  assert.strictEqual(loginData.success, true);
  
  // Set localStorage like frontend authService
  localStorage.setItem('token', loginData.token);
  localStorage.setItem('refreshToken', loginData.refreshToken);
  localStorage.setItem('isAuthenticated', 'true');
  localStorage.setItem('operatorName', loginData.user.fullName);
  localStorage.setItem('operatorEmail', loginData.user.email);
  localStorage.setItem('operatorRole', loginData.user.role);

  console.log('[PASS] Frontend session initialized in localStorage:');
  console.log(`       Name: ${localStorage.getItem('operatorName')}`);
  console.log(`       Email: ${localStorage.getItem('operatorEmail')}`);
  console.log(`       Role: ${localStorage.getItem('operatorRole')}`);
  console.log(`       isAuthenticated: ${localStorage.getItem('isAuthenticated')}`);

  // Step 2: Dashboard Overview Fetch
  console.log('\n2. Fetching Dashboard Overview via GET /api/dashboard/overview...');
  const token = localStorage.getItem('token');
  const dashRes = await fetch(`${API_URL}/dashboard/overview`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const dashData = await dashRes.json();
  assert.strictEqual(dashRes.status, 200);
  assert.strictEqual(dashData.success, true);

  const stats = dashData.data.stats;
  console.log('[PASS] Dashboard stats loaded:');
  console.log(`       Total Cases: ${stats.totalCases}`);
  console.log(`       Open Cases: ${stats.openCases}`);
  console.log(`       Critical Cases: ${stats.criticalCases}`);
  console.log(`       Closed Cases: ${stats.closedCases}`);
  console.log(`       Reports Generated: ${stats.reportsGenerated}`);
  console.log(`       Total IOCs: ${stats.totalIOCs}`);
  console.log(`       Active IOCs: ${stats.activeIOCs}`);
  console.log(`       Recent Cases Count: ${dashData.data.recentCases.length}`);
  console.log(`       Recent Alerts Count: ${dashData.data.recentAlerts.length}`);

  assert.strictEqual(stats.totalCases, 0);
  assert.strictEqual(stats.reportsGenerated, 0);
  assert.strictEqual(stats.totalIOCs, 0);
  assert.strictEqual(dashData.data.recentCases.length, 0);
  assert.strictEqual(dashData.data.recentAlerts.length, 0);

  // Step 3: Logout
  console.log('\n3. Executing logout...');
  const logoutRes = await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  assert.strictEqual(logoutRes.status, 200);
  localStorage.clear();
  assert.strictEqual(localStorage.getItem('token'), null);
  assert.strictEqual(localStorage.getItem('isAuthenticated'), null);
  console.log('[PASS] Session cleared and user logged out.');

  // Step 4: Re-login
  console.log('\n4. Executing re-login with same credentials...');
  const reloginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'akash.demo@trace.local',
      password: 'AKASHC2026!'
    })
  });
  const reloginData = await reloginRes.json();
  assert.strictEqual(reloginRes.status, 200);
  assert.strictEqual(reloginData.success, true);
  console.log(`[PASS] Re-login successful for ${reloginData.user.email} (${reloginData.user.role})`);

  console.log('\n=============================================');
  console.log('>>> FRONTEND CLIENT SIMULATION 100% PASSED <<<');
  console.log('=============================================\n');
}

simulateFrontendSession().catch(err => {
  console.error('[FAIL]', err);
  process.exit(1);
});
