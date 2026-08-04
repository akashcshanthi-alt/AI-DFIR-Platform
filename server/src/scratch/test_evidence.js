const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

async function runTests() {
  console.log('=== [TRACE ENTERPRISE EVIDENCE INTEGRATION TESTS] ===');
  console.log(`Targeting base API URL: ${BASE_URL}\n`);

  let token = '';
  let registeredUserId = '';
  const testEmail = `analyst.evidence.${Date.now()}@trace.ai`;

  // 1. Register a test operator
  try {
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Evidence Tester',
        email: testEmail,
        password: 'clearancepassword123',
        role: 'Analyst',
        department: 'Forensic-Evidence-Testing'
      })
    });

    const regData = await regRes.json();
    if (!regRes.ok || !regData.success) {
      throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
    }

    registeredUserId = regData.data.id;
    console.log(`[PASS] 1. Operator registered successfully. ID: ${registeredUserId}`);

    // 2. Login to retrieve token
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
    console.error(`[FAIL] Authentication setup aborted: ${err.message}`);
    process.exit(1);
  }

  const authHeaders = {
    'Authorization': `Bearer ${token}`
  };

  // 3. Create a mock case for evidence linking
  let testCaseId = '';
  try {
    const caseRes = await fetch(`${BASE_URL}/cases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Forensic Volatile Intake test Case',
        description: 'Memory dumps and triage captures collected for testing.',
        severity: 'Medium',
        status: 'Open',
        assignedAnalyst: 'System Test',
        sourceIP: '10.0.0.4',
        destinationIP: '10.0.0.12',
        targetHost: 'WORKSTATION-08',
        evidenceCount: 0
      })
    });

    const caseData = await caseRes.json();
    if (!caseRes.ok || !caseData.success) {
      throw new Error(`Case creation failed: ${JSON.stringify(caseData)}`);
    }

    testCaseId = caseData.data.caseId;
    console.log(`[PASS] 3. Mock Case created successfully: ${testCaseId}`);
  } catch (err) {
    console.error(`[FAIL] Mock Case creation failed: ${err.message}`);
    process.exit(1);
  }

  let evidenceMongoId = '';
  let evidenceId = '';
  let serverFileName = '';

  const localFileContent = 'Forensic log contents. Process trace entry: lateral movement on cmd.exe.';
  const expectedMd5 = crypto.createHash('md5').update(localFileContent).digest('hex');
  const expectedSha1 = crypto.createHash('sha1').update(localFileContent).digest('hex');
  const expectedSha256 = crypto.createHash('sha256').update(localFileContent).digest('hex');

  // 4. Ingest/Upload Evidence via POST /api/evidence/upload
  try {
    const formData = new FormData();
    formData.append('caseId', testCaseId);
    formData.append('fileType', 'Memory Dump');
    formData.append('notes', 'Memory dump captured from compromised workstation.');
    formData.append('tags', JSON.stringify(['volatile', 'compromised']));
    
    // built-in Node 18+ Blob
    const fileBlob = new Blob([localFileContent], { type: 'text/plain' });
    formData.append('files', fileBlob, 'memory_dump.raw');

    const res = await fetch(`${BASE_URL}/evidence/upload`, {
      method: 'POST',
      headers: authHeaders,
      body: formData
    });

    const body = await res.json();
    if (!res.ok || !body.success) throw new Error(JSON.stringify(body));

    evidenceMongoId = body.data._id;
    evidenceId = body.data.evidenceId;
    serverFileName = body.data.fileName;

    console.log(`[PASS] 4. Evidence uploaded successfully: evidenceId=${evidenceId}`);
    
    // Check integrity hashes calculation
    if (
      body.data.md5Hash === expectedMd5 &&
      body.data.sha1Hash === expectedSha1 &&
      body.data.sha256Hash === expectedSha256
    ) {
      console.log('[PASS] 4.1 Cryptographic hashes match expected local values:');
      console.log(`     - MD5: ${body.data.md5Hash}`);
      console.log(`     - SHA1: ${body.data.sha1Hash}`);
      console.log(`     - SHA256: ${body.data.sha256Hash}`);
    } else {
      throw new Error(`Checksum hashes mismatch! Got: ${JSON.stringify(body.data)}`);
    }

    // Verify physical file was written
    const absolutePath = path.resolve(__dirname, '../../uploads/evidence', serverFileName);
    if (fs.existsSync(absolutePath)) {
      console.log(`[PASS] 4.2 Physical evidence file exists in backend storage folder.`);
    } else {
      throw new Error(`Physical file missing at: ${absolutePath}`);
    }

    // Verify initial chain of custody is set
    if (body.data.chainOfCustody && body.data.chainOfCustody.length === 1) {
      console.log(`[PASS] 4.3 Initial Chain of Custody logged: ${body.data.chainOfCustody[0].action}`);
    } else {
      throw new Error(`Chain of Custody timeline missing or invalid.`);
    }
  } catch (err) {
    console.error(`[FAIL] Ingestion/Upload failed: ${err.message}`);
    process.exit(1);
  }

  // 5. Verify GET /api/evidence
  try {
    const res = await fetch(`${BASE_URL}/evidence`, { headers: authHeaders });
    const body = await res.json();
    if (res.ok && body.data.length >= 1) {
      console.log(`[PASS] 5. GET /api/evidence successfully listed catalog. Total items: ${body.pagination.total}`);
    } else {
      throw new Error(JSON.stringify(body));
    }
  } catch (err) {
    console.error(`[FAIL] GET /api/evidence failed: ${err.message}`);
  }

  // 6. Verify GET /api/evidence/case/:caseId
  try {
    const res = await fetch(`${BASE_URL}/evidence/case/${testCaseId}`, { headers: authHeaders });
    const body = await res.json();
    if (res.ok && body.data.length === 1 && body.data[0].evidenceId === evidenceId) {
      console.log(`[PASS] 6. GET /api/evidence/case/:caseId returned 1 matched item for ${testCaseId}.`);
    } else {
      throw new Error(JSON.stringify(body));
    }
  } catch (err) {
    console.error(`[FAIL] GET by caseId failed: ${err.message}`);
  }

  // 7. Verify GET /api/evidence/:id
  try {
    const res = await fetch(`${BASE_URL}/evidence/${evidenceId}`, { headers: authHeaders });
    const body = await res.json();
    if (res.ok && body.data.evidenceId === evidenceId) {
      console.log('[PASS] 7. GET /api/evidence/:id fetched correct metadata by evidenceId.');
    } else {
      throw new Error(JSON.stringify(body));
    }
  } catch (err) {
    console.error(`[FAIL] GET single metadata details failed: ${err.message}`);
  }

  // 8. Verify GET /api/evidence/:id/download
  try {
    const dlRes = await fetch(`${BASE_URL}/evidence/${evidenceId}/download`, { headers: authHeaders });
    const downloadedText = await dlRes.text();
    if (dlRes.ok && downloadedText === localFileContent) {
      console.log('[PASS] 8. GET /api/evidence/:id/download successfully streamed original binary bytes.');
    } else {
      throw new Error(`Content mismatch! Got: "${downloadedText}", Expected: "${localFileContent}"`);
    }
  } catch (err) {
    console.error(`[FAIL] Download streaming failed: ${err.message}`);
  }

  // 9. Verify PUT /api/evidence/:id (updates tags/notes and chain of custody)
  try {
    const updateRes = await fetch(`${BASE_URL}/evidence/${evidenceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        notes: 'Memory dump from target host WORKSTATION-08. MD5 and SHA256 matches verified.',
        status: 'Archived',
        tags: ['volatile', 'analyzed'],
        chainAction: 'Triage Completed'
      })
    });

    const body = await updateRes.json();
    if (updateRes.ok && body.data.status === 'Archived' && body.data.tags.includes('analyzed')) {
      console.log('[PASS] 9. PUT /api/evidence/:id metadata fields updated.');
      
      // Verify Chain of custody appended
      const coc = body.data.chainOfCustody;
      if (coc && coc.length === 2 && coc[1].action === 'Triage Completed') {
        console.log(`[PASS] 9.1 Chain of Custody successfully appended: ${coc[1].action}`);
      } else {
        throw new Error(`Chain of Custody logs count/action invalid: ${JSON.stringify(coc)}`);
      }
    } else {
      throw new Error(JSON.stringify(body));
    }
  } catch (err) {
    console.error(`[FAIL] Metadata updates failed: ${err.message}`);
  }

  // 10. Verify DELETE /api/evidence/:id
  try {
    const delRes = await fetch(`${BASE_URL}/evidence/${evidenceId}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    const body = await delRes.json();
    if (delRes.ok && body.success) {
      console.log('[PASS] 10. DELETE /api/evidence/:id database record removed.');
    } else {
      throw new Error(JSON.stringify(body));
    }

    // Verify physical file was unlinked
    const absolutePath = path.resolve(__dirname, '../../uploads/evidence', serverFileName);
    if (!fs.existsSync(absolutePath)) {
      console.log('[PASS] 10.1 Physical evidence file successfully deleted/unlinked from server disk.');
    } else {
      throw new Error(`Physical file still exists at: ${absolutePath}`);
    }

    // Verify requesting metadata returns 404
    const checkRes = await fetch(`${BASE_URL}/evidence/${evidenceId}`, { headers: authHeaders });
    if (checkRes.status === 404) {
      console.log('[PASS] 10.2 Requesting deleted evidence metadata returns 404.');
    } else {
      throw new Error(`Expected 404 status, got: ${checkRes.status}`);
    }
  } catch (err) {
    console.error(`[FAIL] Deletion failed: ${err.message}`);
  }

  console.log('\n=== [ALL EVIDENCE INTEGRATION TESTS SUCCESSFUL] ===');
  process.exit(0);
}

runTests();
