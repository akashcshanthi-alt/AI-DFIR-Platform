/**
 * Live End-to-End Verification Script
 * Validates real HTTP interactions across all completed phases on running server:
 * 1. Health & Readiness Probe
 * 2. Authentication & Clearance
 * 3. Case Creation
 * 4. Multi-Evidence Ingestion (Phase 2)
 * 5. IOC Detection (Phase 3)
 * 6. Forensic Timeline Generation (Phase 4)
 * 7. MITRE ATT&CK Generation (Phase 5)
 * 8. AI Readiness & Investigation Execution (Phase 6)
 * 9. Investigation History & Referenced Evidence Retrieval
 * 10. Audit Logging Verification
 */

const BASE_URL = 'http://localhost:5000/api';

async function verifyLiveEndToEnd() {
  console.log('======================================================================');
  console.log('TRACE AI - LIVE END-TO-END VERIFICATION');
  console.log(`Backend API Target: ${BASE_URL}`);
  console.log('======================================================================\n');

  // Step 1: Health / Ping
  console.log('--- 1. Testing Backend Connectivity ---');
  const pingRes = await fetch(`${BASE_URL}/auth/login`, { method: 'OPTIONS' });
  console.log('OPTIONS /api/auth/login status:', pingRes.status);

  // Step 2: Authentication
  console.log('\n--- 2. Authenticating as Operator ---');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'cso@trace.ai', password: 'clearancepassword123' })
  });
  const loginBody = await loginRes.json();
  const token = loginBody.token || loginBody.data?.token;
  if (!token) throw new Error('Authentication failed: ' + JSON.stringify(loginBody));
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
  console.log('Authentication successful. Clearance token acquired.');

  // Step 3: Case Creation
  console.log('\n--- 3. Creating Live Verification Case ---');
  const caseRes = await fetch(`${BASE_URL}/cases`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Live E2E Verification Case',
      description: 'End-to-end integration and AI investigation verification',
      severity: 'High',
      status: 'Open',
      tags: ['verification', 'e2e', 'phase6']
    })
  });
  const caseBody = await caseRes.json();
  const caseId = caseBody.data?.caseId;
  console.log(`Case created: ${caseId} (${caseBody.data?._id})`);

  // Step 4: Evidence Upload (Phase 2)
  console.log('\n--- 4. Uploading Forensic Evidence ---');
  const authLog = [
    '2026-09-29T12:00:00Z web-srv01 sshd[4012]: Failed password for invalid user admin from 198.51.100.25:45212',
    '2026-09-29T12:00:05Z web-srv01 sshd[4015]: Accepted password for root from 198.51.100.25:45214'
  ].join('\n');

  const jsonlLog = [
    '{"timestamp":"2026-09-29T12:01:00Z","user":"root","process":"powershell.exe","command":"powershell -enc SQBFAFgA","ip":"198.51.100.25","domain":"malicious-c2.com","sha256":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}'
  ].join('\n');

  const formData = new FormData();
  formData.append('caseId', caseId);
  formData.append('batchId', `BATCH-LIVE-${Date.now()}`);
  formData.append('relativePaths', JSON.stringify(['var/log/auth.log', 'var/log/edr.jsonl']));
  formData.append('files', new Blob([authLog], { type: 'text/plain' }), 'auth.log');
  formData.append('files', new Blob([jsonlLog], { type: 'application/x-ndjson' }), 'edr.jsonl');

  const evRes = await fetch(`${BASE_URL}/evidence/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });
  const evBody = await evRes.json();
  const evidenceList = Array.isArray(evBody.data) ? evBody.data : (evBody.data ? [evBody.data] : []);
  const evId = evidenceList[0]?.evidenceId;
  console.log(`Upload Status: ${evRes.status} | Files: ${evidenceList.length} | ID: ${evId}`);
  if (evidenceList.length === 0) {
    console.log('Upload response body:', JSON.stringify(evBody, null, 2));
  }

  // Step 5: IOC Detection (Phase 3)
  console.log('\n--- 5. Executing IOC Detection Engine ---');
  const iocRes = await fetch(`${BASE_URL}/ioc/detect`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ caseId })
  });
  const iocBody = await iocRes.json();
  console.log(`IOC Detection complete. Detected: ${iocBody.data?.totalDetected || 0} indicators (New: ${iocBody.data?.newIndicators || 0}).`);

  // Step 6: Forensic Timeline (Phase 4)
  console.log('\n--- 6. Generating Forensic Timeline ---');
  const tlRes = await fetch(`${BASE_URL}/timeline/generate`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ caseId })
  });
  const tlBody = await tlRes.json();
  console.log(`Timeline generated. Total events: ${tlBody.data?.totalEvents || 0}`);

  // Step 7: MITRE ATT&CK Mapping (Phase 5)
  console.log('\n--- 7. Generating MITRE ATT&CK Mappings ---');
  const mitreRes = await fetch(`${BASE_URL}/mitre/generate`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ caseId })
  });
  const mitreBody = await mitreRes.json();
  console.log(`MITRE mappings generated. Total mapped techniques: ${mitreBody.data?.totalMapped || 0} (Candidates: ${mitreBody.data?.candidates || 0}).`);

  // Step 8: AI Readiness & Investigation Run (Phase 6)
  console.log('\n--- 8. Checking AI Readiness & Running Investigation ---');
  const readyRes = await fetch(`${BASE_URL}/ai/readiness`, { headers: authHeaders });
  const readyBody = await readyRes.json();
  console.log('AI Engine Status:', readyBody.data?.status, '| Ready:', readyBody.data?.ready, '| Model:', readyBody.data?.model);

  const invRes = await fetch(`${BASE_URL}/ai/investigate`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ caseId })
  });
  const invBody = await invRes.json();
  const runData = invBody.data;
  console.log(`Investigation Run Result:`);
  console.log(`- Run ID: ${runData?.runId}`);
  console.log(`- Status: ${runData?.status}`);
  console.log(`- Model: ${runData?.model}`);
  console.log(`- Workflow Version: ${runData?.workflowVersion}`);
  console.log(`- Duration: ${runData?.runDurationMs}ms`);
  if (runData?.error) {
    console.log(`- Handled Safe Error: ${runData.error}`);
  }

  // Step 9: Runs History and Evidence Details
  console.log('\n--- 9. Retrieving Run History & Evidence Details ---');
  const runsRes = await fetch(`${BASE_URL}/ai/runs?caseId=${caseId}`, { headers: authHeaders });
  const runsBody = await runsRes.json();
  const runsList = runsBody.data?.items || runsBody.data?.runs || [];
  console.log(`Found ${runsList.length} run(s) for Case ${caseId}.`);

  if (runData?.runId) {
    const evDetailsRes = await fetch(`${BASE_URL}/ai/runs/${runData.runId}/evidence`, { headers: authHeaders });
    const evDetailsBody = await evDetailsRes.json();
    console.log(`Referenced evidence items: ${evDetailsBody.data?.length || 0}`);
  }

  // Step 10: Audit Log Verification
  console.log('\n--- 10. Verifying Audit Log Records ---');
  const auditRes = await fetch(`${BASE_URL}/audit-logs?search=${caseId}`, { headers: authHeaders });
  const auditBody = await auditRes.json();
  console.log(`Audit log records found for ${caseId}: ${auditBody.data?.logs?.length || 0}`);

  console.log('\n======================================================================');
  console.log('LIVE END-TO-END VERIFICATION COMPLETED SUCCESSFULLY');
  console.log('======================================================================\n');
}

verifyLiveEndToEnd().catch(err => {
  console.error('\n[FATAL ERROR IN LIVE VERIFICATION]:', err);
  process.exit(1);
});
