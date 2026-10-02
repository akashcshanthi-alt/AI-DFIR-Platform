const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000/api';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/arclight_dfir';

async function verifyPersistence() {
  console.log('=== [LOCAL MONGODB COMMUNITY SERVER PERSISTENCE TEST] ===');
  console.log(`Backend API: ${BASE_URL}`);
  console.log(`MongoDB URI: ${MONGO_URI}\n`);

  // 1. Authenticate with seeded administrator
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
    throw new Error(`Authentication failed: ${JSON.stringify(loginData)}`);
  }
  const token = loginData.token;
  console.log('[PASS] 1. Authenticated as CSO operator. Token obtained.');

  const authHeaders = {
    'Authorization': `Bearer ${token}`
  };

  // 2. Create a persistent test case
  const caseRes = await fetch(`${BASE_URL}/cases`, {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: 'Local MongoDB Verification Case',
      description: 'Persistent case created to verify local MongoDB Community Server storage.',
      severity: 'Critical',
      status: 'Investigating',
      assignedAnalyst: 'Lead Investigator',
      sourceIP: '10.0.10.5',
      destinationIP: '198.51.100.22',
      targetHost: 'SRV-LOCAL-01'
    })
  });
  const caseData = await caseRes.json();
  if (!caseRes.ok || !caseData.success) {
    throw new Error(`Case creation failed: ${JSON.stringify(caseData)}`);
  }
  const createdCaseId = caseData.data.caseId;
  const createdCaseMongoId = caseData.data._id;
  console.log(`[PASS] 2. Case created via API: ${createdCaseId} (ObjectId: ${createdCaseMongoId})`);

  // 3. Upload evidence attached to this case
  const evidenceContent = 'Local forensic memory buffer verification: MD5 and SHA256 integrity validation.';
  const formData = new FormData();
  formData.append('caseId', createdCaseId);
  formData.append('fileType', 'Memory Dump');
  formData.append('notes', 'Verified against local MongoDB Community Server instance.');
  formData.append('tags', JSON.stringify(['local-db', 'verified']));
  formData.append('files', new Blob([evidenceContent], { type: 'text/plain' }), 'forensic_capture.raw');

  const evRes = await fetch(`${BASE_URL}/evidence/upload`, {
    method: 'POST',
    headers: authHeaders,
    body: formData
  });
  const evData = await evRes.json();
  if (!evRes.ok || !evData.success) {
    throw new Error(`Evidence upload failed: ${JSON.stringify(evData)}`);
  }
  const createdEvidenceId = evData.data.evidenceId;
  const createdEvidenceMongoId = evData.data._id;
  console.log(`[PASS] 3. Evidence uploaded via API: ${createdEvidenceId} (SHA256: ${evData.data.sha256Hash})`);

  // 4. Retrieve data back via Express API
  const getCaseRes = await fetch(`${BASE_URL}/cases/${createdCaseId}`, { headers: authHeaders });
  const getCaseData = await getCaseRes.json();
  if (!getCaseRes.ok || getCaseData.data.caseId !== createdCaseId) {
    throw new Error(`Failed to retrieve case via API: ${JSON.stringify(getCaseData)}`);
  }
  console.log(`[PASS] 4. Retrieved Case via API: Status=${getCaseData.data.status}, EvidenceCount=${getCaseData.data.evidenceCount}`);

  const getEvRes = await fetch(`${BASE_URL}/evidence/${createdEvidenceId}`, { headers: authHeaders });
  const getEvData = await getEvRes.json();
  if (!getEvRes.ok || getEvData.data.evidenceId !== createdEvidenceId) {
    throw new Error(`Failed to retrieve evidence via API: ${JSON.stringify(getEvData)}`);
  }
  console.log(`[PASS] 5. Retrieved Evidence via API: Type=${getEvData.data.fileType}, Status=${getEvData.data.status}`);

  // 5. Query MongoDB directly (independent database client verification)
  console.log('\n--- Direct Independent MongoDB Verification ---');
  await mongoose.connect(MONGO_URI);
  console.log(`[PASS] Connected directly to MongoDB at ${MONGO_URI}`);

  const caseInDb = await mongoose.connection.db.collection('cases').findOne({ caseId: createdCaseId });
  if (!caseInDb) {
    throw new Error(`Direct MongoDB query failed: Case ${createdCaseId} not found in 'cases' collection!`);
  }
  console.log(`[PASS] 6. Direct MongoDB verification of Case: Title="${caseInDb.title}", Severity="${caseInDb.severity}", EvidenceCount=${caseInDb.evidenceCount}`);

  const evInDb = await mongoose.connection.db.collection('evidences').findOne({ evidenceId: createdEvidenceId });
  if (!evInDb) {
    throw new Error(`Direct MongoDB query failed: Evidence ${createdEvidenceId} not found in 'evidences' collection!`);
  }
  console.log(`[PASS] 7. Direct MongoDB verification of Evidence: File="${evInDb.originalName}", SHA256="${evInDb.sha256Hash}"`);

  // Print current collection counts in arclight_dfir
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('\n--- Current arclight_dfir Database Collections Summary ---');
  for (const c of collections) {
    const count = await mongoose.connection.db.collection(c.name).countDocuments();
    console.log(`  * ${c.name}: ${count} document(s)`);
  }

  await mongoose.disconnect();
  console.log('\n=== [ALL LOCAL MONGODB VERIFICATION CHECKS PASSED] ===');
}

verifyPersistence().catch(err => {
  console.error('[FAIL] Persistence verification error:', err);
  process.exit(1);
});
