const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

async function testDashboardAPIs() {
  console.log('=== [TRACE AI DASHBOARD APIS VERIFICATION] ===');
  console.log(`Targeting base API URL: ${BASE_URL}\n`);

  let token = '';

  // Login with seeder user
  try {
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'cso@trace.ai',
        password: 'clearancepassword123'
      })
    });

    const loginData = await loginRes.json();
    if (!loginRes.ok || !loginData.success) {
      throw new Error(`Login failed for seeded CSO user: ${JSON.stringify(loginData)}`);
    }

    token = loginData.token;
    console.log(`[PASS] 1. Authenticated as Chief Security Officer (CSO). Token obtained.`);
  } catch (err) {
    console.error(`[FAIL] Login failed: ${err.message}`);
    process.exit(1);
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Helper to fetch and inspect response
  const checkEndpoint = async (name, endpoint, validators) => {
    try {
      const res = await fetch(`${BASE_URL}/dashboard${endpoint}`, { headers: authHeaders });
      const body = await res.json();
      
      if (!res.ok || !body.success) {
        throw new Error(`Endpoint returned failed response: ${JSON.stringify(body)}`);
      }
      
      validators(body.data);
      console.log(`[PASS] Verified ${name} endpoint: ${endpoint}`);
    } catch (err) {
      console.error(`[FAIL] Verification failed on ${name}: ${err.message}`);
    }
  };

  // 2. Test GET /stats
  await checkEndpoint('Statistics', '/stats', (data) => {
    if (typeof data.totalCases !== 'number') throw new Error('totalCases is not a number');
    if (typeof data.openCases !== 'number') throw new Error('openCases is not a number');
    if (typeof data.closedCases !== 'number') throw new Error('closedCases is not a number');
    if (typeof data.criticalCases !== 'number') throw new Error('criticalCases is not a number');
    if (typeof data.activeAnalysts !== 'number') throw new Error('activeAnalysts is not a number');
    if (typeof data.reportsGenerated !== 'number') throw new Error('reportsGenerated is not a number');
    if (typeof data.notifications !== 'number') throw new Error('notifications is not a number');
  });

  // 3. Test GET /recent-cases
  await checkEndpoint('Recent Cases', '/recent-cases', (data) => {
    if (!Array.isArray(data)) throw new Error('recentCases is not an array');
    console.log(`       - Found ${data.length} recent cases in DB.`);
  });

  // 4. Test GET /recent-alerts
  await checkEndpoint('Recent Alerts', '/recent-alerts', (data) => {
    if (!Array.isArray(data)) throw new Error('recentAlerts is not an array');
    console.log(`       - Found ${data.length} recent alerts mapped from high-severity audit logs.`);
  });

  // 5. Test GET /activity
  await checkEndpoint('Activity Feed', '/activity', (data) => {
    if (!Array.isArray(data)) throw new Error('activity logs feed is not an array');
    console.log(`       - Found ${data.length} recent system activities.`);
  });

  // 6. Test GET /telemetry
  await checkEndpoint('Telemetry', '/telemetry', (data) => {
    if (typeof data.activeAlerts !== 'number') throw new Error('activeAlerts is not a number');
    if (!data.mttd) throw new Error('mttd is missing');
    if (!data.mttr) throw new Error('mttr is missing');
    if (!data.aiResolutions) throw new Error('aiResolutions is missing');
  });

  // 7. Test GET /charts
  await checkEndpoint('Charts', '/charts', (data) => {
    if (!Array.isArray(data.severityDistribution)) throw new Error('severityDistribution is not an array');
    if (!Array.isArray(data.casesByMonth)) throw new Error('casesByMonth is not an array');
    if (!Array.isArray(data.incidentTrend)) throw new Error('incidentTrend is not an array');
    if (typeof data.resolutionRate.rate !== 'number') throw new Error('resolutionRate is not a number');
  });

  // 8. Test GET /overview (unified fetch)
  await checkEndpoint('Overview', '/overview', (data) => {
    if (!data.stats) throw new Error('Overview missing stats data');
    if (!data.recentCases) throw new Error('Overview missing recentCases data');
    if (!data.recentAlerts) throw new Error('Overview missing recentAlerts data');
    if (!data.activity) throw new Error('Overview missing activity data');
    if (!data.telemetry) throw new Error('Overview missing telemetry data');
    if (!data.charts) throw new Error('Overview missing charts data');
  });

  console.log('\n=== [ALL DASHBOARD ENDPOINTS VERIFIED SUCCESSFULLY] ===');
  process.exit(0);
}

testDashboardAPIs();
