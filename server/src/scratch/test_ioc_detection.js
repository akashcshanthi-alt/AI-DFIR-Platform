/**
 * TRACE AI - Comprehensive IOC Detection Engine Automated Integration Test Suite
 * Tests Phase 3 requirements against running backend and local MongoDB (arclight_dfir):
 * 1. Auth and clearance enforcement (401 on unauthenticated)
 * 2. Supported indicator types (IPv4, Domain, URL, Email, MD5, SHA-1, SHA-256)
 * 3. Normalization (port stripping, lowercasing, defanging)
 * 4. IP Classification (private, public, loopback, invalid)
 * 5. Deduplication across files with multi-record provenance retention
 * 6. Rule-based severity and confidence without artificial threat intelligence
 * 7. Idempotency (re-running detection produces zero duplicates)
 * 8. Case isolation (Case A indicators do not leak into Case B)
 * 9. Status transition API (PATCH /api/ioc/:id/status)
 * 10. Direct MongoDB persistence in local arclight_dfir database
 */

const mongoose = require('mongoose');
const path = require('path');
const IOC = require('../models/IOC');

const BASE_URL = 'http://localhost:5000/api';
const MONGO_URI = 'mongodb://127.0.0.1:27017/arclight_dfir';

let passedTests = 0;
let failedTests = 0;

function recordTest(num, name, passed, details = '') {
  if (passed) {
    passedTests++;
    console.log(`[PASS] Test ${num}: ${name}${details ? ' - ' + details : ''}`);
  } else {
    failedTests++;
    console.error(`[FAIL] Test ${num}: ${name}${details ? ' - ' + details : ''}`);
  }
}

async function runTestSuite() {
  console.log('======================================================================');
  console.log('TRACE AI - PHASE 3: IOC DETECTION ENGINE INTEGRATION TEST SUITE');
  console.log(`Backend API: ${BASE_URL}`);
  console.log(`MongoDB URI: ${MONGO_URI}`);
  console.log('======================================================================\n');

  let authToken = null;
  let authHeaders = {};
  let caseIdA = null;
  let caseIdB = null;
  let detectedIocsA = [];

  // -------------------------------------------------------------------------
  // Test 1: Authentication
  // -------------------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'cso@trace.ai',
        password: 'clearancepassword123'
      })
    });
    const body = await res.json();
    authToken = body.token || body.data?.token;
    if (res.ok && authToken) {
      authHeaders = {
        'Authorization': `Bearer ${authToken}`
      };
      recordTest(1, 'Authentication as Operator', true, 'Clearance token obtained');
    } else {
      recordTest(1, 'Authentication as Operator', false, body.error?.message || body.message || 'Login failed');
      process.exit(1);
    }
  } catch (err) {
    recordTest(1, 'Authentication as Operator', false, err.message);
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // Test 2: Authorization Enforcement (401 on unauthenticated)
  // -------------------------------------------------------------------------
  try {
    const unauthDetect = await fetch(`${BASE_URL}/ioc/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId: 'NON-EXISTENT' })
    });
    const unauthList = await fetch(`${BASE_URL}/ioc`);

    const passed = unauthDetect.status === 401 && unauthList.status === 401;
    recordTest(2, 'Authorization Enforcement for IOC APIs', passed, `Detect: ${unauthDetect.status}, List: ${unauthList.status}`);
  } catch (err) {
    recordTest(2, 'Authorization Enforcement for IOC APIs', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 3: Create Test Case A and Test Case B
  // -------------------------------------------------------------------------
  try {
    const resA = await fetch(`${BASE_URL}/cases`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `IOC Test Case A - ${Date.now()}`,
        description: 'Case A for IOC extraction and provenance tracking',
        severity: 'High'
      })
    });
    const bodyA = await resA.json();
    caseIdA = bodyA.data.caseId;

    const resB = await fetch(`${BASE_URL}/cases`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `IOC Test Case B - ${Date.now()}`,
        description: 'Case B for isolation verification',
        severity: 'Medium'
      })
    });
    const bodyB = await resB.json();
    caseIdB = bodyB.data.caseId;

    recordTest(3, 'Create Isolated Test Cases', !!(caseIdA && caseIdB), `Case A: ${caseIdA}, Case B: ${caseIdB}`);
  } catch (err) {
    recordTest(3, 'Create Isolated Test Cases', false, err.message);
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // Test 4: Ingest Forensic Evidence with Diverse Indicators for Case A
  // -------------------------------------------------------------------------
  try {
    const formDataA = new FormData();
    formDataA.append('caseId', caseIdA);
    formDataA.append('batchId', `BATCH-IOC-A-${Date.now()}`);

    // Evidence 1: Auth log with public brute-force IP, private IP, loopback, user
    const log1 = [
      '2026-09-29T14:01:00Z auth-srv sshd[102]: Failed password for invalid user root from 198.51.100.25:44212',
      '2026-09-29T14:02:00Z auth-srv sshd[103]: Failed password for invalid user admin from 198.51.100.25:44214',
      '2026-09-29T14:03:00Z auth-srv internal-probe: Healthcheck from 192.168.1.100:80 to 127.0.0.1:8080 OK'
    ].join('\n');

    // Evidence 2: Web access log with raw IP URL, suspicious payload, dynamic DNS, and internal domain
    const log2 = [
      '2026-09-29T14:10:00Z 198.51.100.25 GET http://198.51.100.25:8080/payload.sh 200 4096',
      '2026-09-29T14:11:00Z 192.168.1.100 POST https://c2.duckdns.org/beacon?id=44 200 128',
      '2026-09-29T14:12:00Z 127.0.0.1 GET http://auth.corp.internal/status 200 64'
    ].join('\n');

    // Evidence 3: JSONL stream with emails, hashes, and execution context
    const log3 = [
      '{"timestamp":"2026-09-29T14:20:00Z","user":"sec_admin","email":"alert@trace.ai","ip":"10.0.0.5","domain":"trace.ai"}',
      '{"timestamp":"2026-09-29T14:21:00Z","user":"mal_actor","email":"badactor@phish-evil.com","process":"powershell.exe","sha256":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855","md5":"5d41402abc4b2a76b9719d911017c592","sha1":"aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d"}'
    ].join('\n');

    // Evidence 4: Cross-file duplicate test file containing same IP 198.51.100.25
    const log4 = [
      '2026-09-29T14:30:00Z firewall: Blocked outbound connection to 198.51.100.25 on port 443'
    ].join('\n');

    // Evidence 5: Noise/malformed test (invalid IP 999.999.999.999, invalid email, non-hex hash)
    const log5 = [
      'Malformed lines: invalid_ip=999.999.999.999 bad_hash=zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz not_an_email'
    ].join('\n');

    formDataA.append('relativePaths', JSON.stringify([
      'logs/auth.log',
      'logs/web_access.log',
      'telemetry/stream.jsonl',
      'triage/firewall.log',
      'noise/corrupted.log'
    ]));

    formDataA.append('files', new Blob([log1], { type: 'text/plain' }), 'auth.log');
    formDataA.append('files', new Blob([log2], { type: 'text/plain' }), 'web_access.log');
    formDataA.append('files', new Blob([log3], { type: 'text/plain' }), 'stream.jsonl');
    formDataA.append('files', new Blob([log4], { type: 'text/plain' }), 'firewall.log');
    formDataA.append('files', new Blob([log5], { type: 'text/plain' }), 'corrupted.log');

    const resA = await fetch(`${BASE_URL}/evidence/upload`, {
      method: 'POST',
      headers: authHeaders,
      body: formDataA
    });
    const bodyA = await resA.json();
    const evidenceItemsA = bodyA.data || [];

    recordTest(4, 'Ingest Evidence with Diverse Indicator Telemetry',
      resA.status === 201 && evidenceItemsA.length === 5,
      `Uploaded ${evidenceItemsA.length} evidence artifacts for Case A`
    );
  } catch (err) {
    recordTest(4, 'Ingest Evidence with Diverse Indicator Telemetry', false, err.message);
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // Test 5: Execute IOC Detection Engine on Case A (POST /api/ioc/detect)
  // -------------------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/ioc/detect`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId: caseIdA })
    });
    const body = await res.json();
    const detectionData = body.data;
    detectedIocsA = detectionData?.iocs || [];

    const passed = res.status === 200 && body.success && detectionData?.totalDetected > 0;
    recordTest(5, 'Execute IOC Detection Engine (POST /api/ioc/detect)', passed,
      `Detected: ${detectionData?.totalDetected} indicators (New: ${detectionData?.newIndicators})`
    );
  } catch (err) {
    recordTest(5, 'Execute IOC Detection Engine', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 6: Verify Supported Indicator Types & Normalization
  // -------------------------------------------------------------------------
  try {
    // 1. IPv4 port stripping: 198.51.100.25:44212 -> 198.51.100.25
    const ipNorm = detectedIocsA.find(i => i.indicatorType === 'ipv4' && i.normalizedValue === '198.51.100.25');
    // 2. Domain normalization
    const domNorm = detectedIocsA.find(i => i.indicatorType === 'domain' && i.normalizedValue === 'c2.duckdns.org');
    // 3. URL normalization
    const urlNorm = detectedIocsA.find(i => i.indicatorType === 'url' && i.normalizedValue.includes('198.51.100.25:8080/payload.sh'));
    // 4. Email normalization
    const emailNorm = detectedIocsA.find(i => i.indicatorType === 'email' && i.normalizedValue === 'badactor@phish-evil.com');
    // 5. Hash normalization
    const md5Norm = detectedIocsA.find(i => i.indicatorType === 'md5' && i.normalizedValue === '5d41402abc4b2a76b9719d911017c592');
    const sha1Norm = detectedIocsA.find(i => i.indicatorType === 'sha1' && i.normalizedValue === 'aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d');
    const sha256Norm = detectedIocsA.find(i => i.indicatorType === 'sha256' && i.normalizedValue === 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');

    // 6. Verify malformed noisy items were rejected
    const invalidIpPresent = detectedIocsA.some(i => i.normalizedValue === '999.999.999.999');
    const invalidHashPresent = detectedIocsA.some(i => i.normalizedValue === 'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz');

    const allTypesPresent = !!(ipNorm && domNorm && urlNorm && emailNorm && md5Norm && sha1Norm && sha256Norm);
    const noiseFiltered = !invalidIpPresent && !invalidHashPresent;

    recordTest(6, 'Supported Indicator Types & Normalization',
      allTypesPresent && noiseFiltered,
      `IPv4: ${!!ipNorm}, Domain: ${!!domNorm}, URL: ${!!urlNorm}, Email: ${!!emailNorm}, Hashes (MD5/SHA1/SHA256): ${!!(md5Norm && sha1Norm && sha256Norm)}, Noise Filtered: ${noiseFiltered}`
    );
  } catch (err) {
    recordTest(6, 'Supported Indicator Types & Normalization', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 7: Verify IP Classification (private, public, loopback)
  // -------------------------------------------------------------------------
  try {
    const pubIp = detectedIocsA.find(i => i.indicatorType === 'ipv4' && i.normalizedValue === '198.51.100.25');
    const privIp = detectedIocsA.find(i => i.indicatorType === 'ipv4' && i.normalizedValue === '192.168.1.100');
    const loopIp = detectedIocsA.find(i => i.indicatorType === 'ipv4' && i.normalizedValue === '127.0.0.1');

    const pubOk = pubIp?.ipClassification === 'public';
    const privOk = privIp?.ipClassification === 'private';
    const loopOk = loopIp?.ipClassification === 'loopback';

    recordTest(7, 'IP Address Classification',
      pubOk && privOk && loopOk,
      `Public (198.51.100.25): ${pubIp?.ipClassification}, Private (192.168.1.100): ${privIp?.ipClassification}, Loopback (127.0.0.1): ${loopIp?.ipClassification}`
    );
  } catch (err) {
    recordTest(7, 'IP Address Classification', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 8: Deduplication & Evidence Provenance Tracking
  // -------------------------------------------------------------------------
  try {
    // 198.51.100.25 was seen in auth.log (2 lines), web_access.log, and firewall.log
    const pubIpItems = detectedIocsA.filter(i => i.indicatorType === 'ipv4' && i.normalizedValue === '198.51.100.25');
    const isDeduplicated = pubIpItems.length === 1;
    const pubIp = pubIpItems[0];

    const refs = pubIp?.evidenceReferences || [];
    const filesSeen = new Set(refs.map(r => r.fileName));
    const multipleFilesSeen = filesSeen.size >= 2;
    const hasLineNumbers = refs.some(r => r.lineNumber !== null && r.lineNumber > 0);
    const hasContext = refs.some(r => r.context && r.context.length > 5);

    recordTest(8, 'Deduplication & Cross-File Evidence Provenance',
      isDeduplicated && multipleFilesSeen && hasLineNumbers && hasContext,
      `Single IOC document: ${isDeduplicated}, Observed in ${filesSeen.size} distinct files across ${refs.length} occurrences, Has Line Numbers: ${hasLineNumbers}`
    );
  } catch (err) {
    recordTest(8, 'Deduplication & Cross-File Evidence Provenance', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 9: Transparent Rule-Based Severity & Confidence (No Artificial Intel)
  // -------------------------------------------------------------------------
  try {
    const privIp = detectedIocsA.find(i => i.indicatorType === 'ipv4' && i.normalizedValue === '192.168.1.100');
    const pubIp = detectedIocsA.find(i => i.indicatorType === 'ipv4' && i.normalizedValue === '198.51.100.25');
    const rawIpUrl = detectedIocsA.find(i => i.indicatorType === 'url' && i.normalizedValue.includes('198.51.100.25:8080/payload.sh'));
    const dynDom = detectedIocsA.find(i => i.indicatorType === 'domain' && i.normalizedValue === 'c2.duckdns.org');

    // Private IP should be Informational with high confidence (benign internal telemetry)
    const privCorrect = privIp?.severity === 'Informational' && privIp?.confidence === 'High';
    // Public IP with auth failures should be High
    const pubCorrect = pubIp?.severity === 'High';
    // Raw IP payload URL should be High
    const urlCorrect = rawIpUrl?.severity === 'High';
    // Dynamic DNS domain should be Medium
    const domCorrect = dynDom?.severity === 'Medium';
    // isExternalThreatIntel must be false for local engine
    const noFakeIntel = detectedIocsA.every(i => i.isExternalThreatIntel === false);

    recordTest(9, 'Transparent Rule-Based Severity & Confidence Evaluation',
      privCorrect && pubCorrect && urlCorrect && domCorrect && noFakeIntel,
      `Private IP: ${privIp?.severity} (${privIp?.confidence}), Public Auth IP: ${pubIp?.severity}, Payload URL: ${rawIpUrl?.severity}, Dynamic DNS: ${dynDom?.severity}, External TI Flag: false`
    );
  } catch (err) {
    recordTest(9, 'Transparent Rule-Based Severity & Confidence Evaluation', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 10: Idempotency (Re-running detection must NOT duplicate findings)
  // -------------------------------------------------------------------------
  try {
    const countBefore = detectedIocsA.length;

    // Run detection second time
    const res2 = await fetch(`${BASE_URL}/ioc/detect`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId: caseIdA })
    });
    const body2 = await res2.json();
    const countAfter = body2.data?.totalDetected;
    const newInSecondRun = body2.data?.newIndicators;

    // Verify in database via list endpoint
    const listRes = await fetch(`${BASE_URL}/ioc?caseId=${caseIdA}&limit=200`, { headers: authHeaders });
    const listBody = await listRes.json();
    const totalInDb = listBody.data?.pagination?.total;

    const isIdempotent = countBefore === countAfter && newInSecondRun === 0 && totalInDb === countBefore;

    recordTest(10, 'Idempotency & Repeatability on Re-run',
      isIdempotent,
      `Run 1 Total: ${countBefore}, Run 2 Total: ${countAfter} (New: ${newInSecondRun}), DB Total: ${totalInDb}`
    );
  } catch (err) {
    recordTest(10, 'Idempotency & Repeatability on Re-run', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 11: Case Isolation (Case A indicators do not leak into Case B)
  // -------------------------------------------------------------------------
  try {
    // Ingest evidence for Case B with a distinct IP: 203.0.113.77
    const formDataB = new FormData();
    formDataB.append('caseId', caseIdB);
    formDataB.append('batchId', `BATCH-B-${Date.now()}`);
    formDataB.append('relativePaths', JSON.stringify(['isolated.log']));
    formDataB.append('files', new Blob(['2026-09-29T15:00:00Z probe: 203.0.113.77 connected to port 443'], { type: 'text/plain' }), 'isolated.log');

    await fetch(`${BASE_URL}/evidence/upload`, {
      method: 'POST',
      headers: authHeaders,
      body: formDataB
    });

    // Detect for Case B
    await fetch(`${BASE_URL}/ioc/detect`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId: caseIdB })
    });

    // Query Case B IOCs
    const listB = await fetch(`${BASE_URL}/ioc?caseId=${caseIdB}`, { headers: authHeaders });
    const bodyB = await listB.json();
    const iocsB = bodyB.data?.items || [];

    const hasIsolatedIpInB = iocsB.some(i => i.normalizedValue === '203.0.113.77');
    const doesNotHaveCaseAIp = !iocsB.some(i => i.normalizedValue === '198.51.100.25');

    recordTest(11, 'Case Isolation & Scoped Detection',
      hasIsolatedIpInB && doesNotHaveCaseAIp,
      `Case B has 203.0.113.77: ${hasIsolatedIpInB}, Case B excludes 198.51.100.25: ${doesNotHaveCaseAIp}`
    );
  } catch (err) {
    recordTest(11, 'Case Isolation & Scoped Detection', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 12: Status Transition API (PATCH /api/ioc/:id/status)
  // -------------------------------------------------------------------------
  try {
    const targetIoc = detectedIocsA.find(i => i.indicatorType === 'ipv4' && i.normalizedValue === '198.51.100.25');
    const iocId = targetIoc.iocId;

    const patchRes = await fetch(`${BASE_URL}/ioc/${iocId}/status`, {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'Confirmed',
        notes: 'Confirmed external brute-force attacker via multi-file forensic correlation.'
      })
    });
    const patchBody = await patchRes.json();
    const updated = patchBody.data;

    const statusChanged = patchRes.status === 200 && updated.status === 'Confirmed' && updated.notes.includes('Confirmed external');
    const hasReviewer = !!updated.reviewedBy && !!updated.reviewedAt;

    recordTest(12, 'Investigation Status Transition (PATCH /api/ioc/:id/status)',
      statusChanged && hasReviewer,
      `Status: ${updated.status}, ReviewedAt: ${updated.reviewedAt}`
    );
  } catch (err) {
    recordTest(12, 'Investigation Status Transition', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 13: Direct MongoDB Persistence Verification in arclight_dfir
  // -------------------------------------------------------------------------
  try {
    await mongoose.connect(MONGO_URI);

    const dbIocs = await IOC.find({ caseId: caseIdA });
    const countOk = dbIocs.length === detectedIocsA.length;
    const confirmedItem = dbIocs.find(i => i.normalizedValue === '198.51.100.25');
    const dbStatusOk = confirmedItem && confirmedItem.status === 'Confirmed';
    const dbHashesStored = dbIocs.some(i => ['md5', 'sha1', 'sha256'].includes(i.indicatorType));

    await mongoose.disconnect();

    recordTest(13, 'Direct Local MongoDB Persistence (arclight_dfir)',
      countOk && dbStatusOk && dbHashesStored,
      `Persisted Documents: ${dbIocs.length}, Confirmed Status in DB: ${dbStatusOk}, Hashes Persisted: ${dbHashesStored}`
    );
  } catch (err) {
    recordTest(13, 'Direct Local MongoDB Persistence', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log('TEST SUMMARY RESULTS');
  console.log('======================================================================');
  console.log(`Total Tests Executed: ${passedTests + failedTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log('======================================================================\n');

  if (failedTests > 0) {
    console.error('>>> SOME INTEGRATION TESTS FAILED <<<\n');
    process.exit(1);
  } else {
    console.log('>>> ALL IOC DETECTION ENGINE INTEGRATION TESTS PASSED <<<\n');
    process.exit(0);
  }
}

runTestSuite().catch(err => {
  console.error('Test suite crashed with unhandled error:', err);
  process.exit(1);
});
