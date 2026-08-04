(async () => {
  const BASE_URL = 'http://localhost:5000/api';
  console.log(`=== Querying Registered Users from DB via Backend API ===`);

  try {
    // 1. Log in as default Admin
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'cso@trace.ai',
        password: 'clearancepassword123'
      })
    });
    
    if (!loginRes.ok) {
      throw new Error(`Admin login failed: ${loginRes.status}`);
    }
    
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('[PASS] Admin authenticated successfully.');

    // 2. Fetch users list
    const usersRes = await fetch(`${BASE_URL}/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!usersRes.ok) {
      throw new Error(`Failed to fetch users: ${usersRes.status}`);
    }

    const usersData = await usersRes.json();
    
    console.log('\n--- Active System Users in MongoDB ---');
    if (usersData && usersData.data) {
      usersData.data.forEach(u => {
        console.log(`- ID: ${u.userId} | Name: ${u.fullName} | Email: ${u.email} | Role: ${u.role} | Dept: ${u.department} | Status: ${u.accountStatus}`);
      });
    } else {
      console.log('No user array returned in response.', usersData);
    }
  } catch (err) {
    console.error('[FAIL] Error querying user database:', err.message);
  }
})();
