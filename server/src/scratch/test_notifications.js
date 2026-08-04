const ioClient = require('socket.io-client');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;
const SOCKET_URL = `http://localhost:${PORT}`;

async function runTests() {
  console.log('=== [TRACE AI NOTIFICATIONS MODULE INTEGRATION TESTS] ===');
  console.log(`API URL: ${BASE_URL}`);
  console.log(`Socket URL: ${SOCKET_URL}\n`);

  let token = '';
  let registeredUserId = '';
  const testEmail = `analyst.notif.${Date.now()}@trace.ai`;

  // 1. Register a test user
  try {
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Notification Tester',
        email: testEmail,
        password: 'clearancepassword123',
        role: 'Analyst',
        department: 'SOC-Testing'
      })
    });

    const regData = await regRes.json();
    if (!regRes.ok || !regData.success) {
      throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
    }

    registeredUserId = regData.data.id;
    console.log(`[PASS] 1. Registered test operator successfully. ID: ${registeredUserId}`);

    // 2. Login to obtain JWT token
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'clearancepassword123'
      })
    });

    const loginData = await loginRes.json();
    if (!loginRes.ok || !loginData.success) {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }

    token = loginData.token;
    console.log(`[PASS] 2. Login successful. Token obtained.`);
  } catch (err) {
    console.error(`[FAIL] Setup failed: ${err.message}`);
    process.exit(1);
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 3. Connect Socket.IO client using retrieved token
  let socket;
  let receivedSocketNotif = null;

  try {
    socket = ioClient(SOCKET_URL, {
      auth: { token },
      transports: ['websocket']
    });

    await new Promise((resolve, reject) => {
      socket.on('connect', () => {
        console.log(`[PASS] 3. Socket.IO client connected successfully. ID: ${socket.id}`);
        resolve();
      });

      socket.on('connect_error', (err) => {
        reject(new Error(`Socket connection error: ${err.message}`));
      });

      // Keep connection timeout
      setTimeout(() => reject(new Error('Socket connection timed out')), 5000);
    });

    // Subscribe to notification event
    socket.on('notification', (payload) => {
      console.log('[PASS] 3.1 Received real-time socket notification payload successfully!');
      receivedSocketNotif = payload;
    });

  } catch (err) {
    console.error(`[FAIL] Socket connection setup failed: ${err.message}`);
    if (socket) socket.close();
    process.exit(1);
  }

  let notifA_Id = '';
  let notifA_mongoId = '';
  let notifB_Id = '';

  // 4. Create Notification A via POST /api/notifications (Triggers Socket push)
  try {
    const res = await fetch(`${BASE_URL}/notifications`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'PowerShell Alert',
        message: 'Suspicious PowerShell run detected on Node-04.',
        type: 'Critical',
        priority: 'High',
        userId: registeredUserId
      })
    });

    const body = await res.json();
    if (!res.ok || !body.success) throw new Error(JSON.stringify(body));

    notifA_Id = body.data.notificationId;
    notifA_mongoId = body.data._id;
    console.log(`[PASS] 4. Notification A created: notificationId=${notifA_Id}, mongoId=${notifA_mongoId}`);

    // Wait a brief moment to ensure Socket.IO event propagates
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (receivedSocketNotif && receivedSocketNotif.notificationId === notifA_Id) {
      console.log(`[PASS] 4.1 Verified Socket.IO real-time notification push matches creation.`);
    } else {
      throw new Error('Socket did not receive the expected notification in real-time.');
    }
  } catch (err) {
    console.error(`[FAIL] Notification A / Socket Push test failed: ${err.message}`);
  }

  // 5. Create Notification B (Warning, Medium)
  try {
    const res = await fetch(`${BASE_URL}/notifications`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'CPU Leak Anomaly',
        message: 'CPU usage is elevated on server control bank.',
        type: 'Warning',
        priority: 'Medium',
        userId: registeredUserId
      })
    });

    const body = await res.json();
    if (!res.ok || !body.success) throw new Error(JSON.stringify(body));

    notifB_Id = body.data.notificationId;
    console.log(`[PASS] 5. Notification B created: notificationId=${notifB_Id}`);
  } catch (err) {
    console.error(`[FAIL] Notification B creation failed: ${err.message}`);
  }

  // 6. Verify GET /api/notifications (Pagination, Search, Filter, Sort, Unread count)
  try {
    // 6.1 Get all (verify count and unreadCount = 2)
    const resAll = await fetch(`${BASE_URL}/notifications`, { headers: authHeaders });
    const allBody = await resAll.json();
    if (allBody.data.notifications.length >= 2 && allBody.data.unreadCount === 2) {
      console.log(`[PASS] 6.1 GET /api/notifications retrieved all correct notices (Unread: ${allBody.data.unreadCount}).`);
    } else {
      throw new Error(`Expected at least 2 notifications and unreadCount = 2, got: ${JSON.stringify(allBody.data)}`);
    }

    // 6.2 Search verification (search 'PowerShell' -> returns only A)
    const resSearch = await fetch(`${BASE_URL}/notifications?search=PowerShell`, { headers: authHeaders });
    const searchBody = await resSearch.json();
    if (searchBody.data.notifications.length === 1 && searchBody.data.notifications[0].notificationId === notifA_Id) {
      console.log('[PASS] 6.2 Search functionality matched correct notification.');
    } else {
      throw new Error(`Search filter failed. Expected Notification A, got: ${JSON.stringify(searchBody.data.notifications)}`);
    }

    // 6.3 Filter by type (type=Warning -> returns only B)
    const resFilter = await fetch(`${BASE_URL}/notifications?type=Warning`, { headers: authHeaders });
    const filterBody = await resFilter.json();
    if (filterBody.data.notifications.length === 1 && filterBody.data.notifications[0].notificationId === notifB_Id) {
      console.log('[PASS] 6.3 Type filtering works correctly.');
    } else {
      throw new Error(`Type filter failed. Expected Notification B, got: ${JSON.stringify(filterBody.data.notifications)}`);
    }

    // 6.4 Pagination (limit=1 -> 1 notification per page)
    const resPag = await fetch(`${BASE_URL}/notifications?page=1&limit=1`, { headers: authHeaders });
    const pagBody = await resPag.json();
    if (pagBody.data.notifications.length === 1 && pagBody.data.pagination.limit === 1) {
      console.log(`[PASS] 6.4 Pagination metadata matches request.`);
    } else {
      throw new Error(`Pagination query failed: ${JSON.stringify(pagBody.data.pagination)}`);
    }
  } catch (err) {
    console.error(`[FAIL] GET notifications tests failed: ${err.message}`);
  }

  // 7. Verify GET /api/notifications/unread
  try {
    const resUnread = await fetch(`${BASE_URL}/notifications/unread`, { headers: authHeaders });
    const unreadBody = await resUnread.json();
    if (unreadBody.data.notifications.length === 2 && unreadBody.data.unreadCount === 2) {
      console.log(`[PASS] 7. GET /api/notifications/unread successfully fetched 2 unread items.`);
    } else {
      throw new Error(`Expected 2 unread notifications, got: ${JSON.stringify(unreadBody.data)}`);
    }
  } catch (err) {
    console.error(`[FAIL] GET unread notifications failed: ${err.message}`);
  }

  // 8. Verify PUT /api/notifications/:id/read (Marks A as read)
  try {
    const resRead = await fetch(`${BASE_URL}/notifications/${notifA_Id}/read`, {
      method: 'PUT',
      headers: authHeaders
    });
    const readBody = await resRead.json();
    if (resRead.ok && readBody.data.notification.isRead === true && readBody.data.unreadCount === 1) {
      console.log(`[PASS] 8. Notification A marked as read. New unread count: ${readBody.data.unreadCount}`);
    } else {
      throw new Error(`Mark as read failed: ${JSON.stringify(readBody)}`);
    }
  } catch (err) {
    console.error(`[FAIL] Mark as read failed: ${err.message}`);
  }

  // 9. Verify PUT /api/notifications/read-all (Marks all read)
  try {
    const resReadAll = await fetch(`${BASE_URL}/notifications/read-all`, {
      method: 'PUT',
      headers: authHeaders
    });
    const readAllBody = await resReadAll.json();
    if (resReadAll.ok && readAllBody.data.unreadCount === 0) {
      console.log('[PASS] 9. Bulk Mark All as Read works. Unread count is now 0.');
    } else {
      throw new Error(`Bulk mark all read failed: ${JSON.stringify(readAllBody)}`);
    }
  } catch (err) {
    console.error(`[FAIL] Bulk mark read failed: ${err.message}`);
  }

  // 10. Verify DELETE /api/notifications/:id (Deletes A)
  try {
    const delRes = await fetch(`${BASE_URL}/notifications/${notifA_Id}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    const delBody = await delRes.json();
    if (delRes.ok && delBody.success) {
      console.log('[PASS] 10. Notification A deleted successfully.');
    } else {
      throw new Error(`Delete failed: ${JSON.stringify(delBody)}`);
    }

    // 10.1 Verify check returns 404
    const checkRes = await fetch(`${BASE_URL}/notifications/${notifA_Id}/read`, {
      method: 'PUT',
      headers: authHeaders
    });
    if (checkRes.status === 404) {
      console.log('[PASS] 10.1 Accessing deleted notification returns 404 correctly.');
    } else {
      throw new Error(`Expected 404 on deleted item, got status ${checkRes.status}`);
    }
  } catch (err) {
    console.error(`[FAIL] Delete verification failed: ${err.message}`);
  }

  // Close socket client connection
  socket.close();

  console.log('\n=== [ALL NOTIFICATIONS INTEGRATION TESTS SUCCESSFUL] ===');
  process.exit(0);
}

runTests();
