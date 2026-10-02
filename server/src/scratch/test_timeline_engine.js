/**
 * TRACE AI - Comprehensive Forensic Timeline Engine Automated Integration Test Suite
 * Tests Phase 4 requirements against running backend and local MongoDB (arclight_dfir):
 * 1. Auth and clearance enforcement (401 on unauthenticated)
 * 2. Multi-format timestamp parsing (ISO 8601 with Z, ISO with offset, Syslog, CLF)
 * 3. Accurate UTC normalization
 * 4. Missing and ambiguous timestamp handling (isUndated, timezone warnings)
 * 5. Strict chronological ordering (monotonic sequence)
 * 6. Evidence provenance tracking (evidenceId, filename, line number, excerpt)
 * 7. Correlated IOC associations
 * 8. Idempotency on repeated generation (zero duplicates)
 * 9. Case isolation (Case A events do not leak into Case B)
 * 10. Multi-dimensional filtering and pagination
 * 11. Direct MongoDB persistence in local arclight_dfir database & audit logging
 */

const mongoose = require('mongoose');
const TimelineEvent = require('../models/TimelineEvent');
const AuditLog = require('../models/AuditLog');

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
  console.log('TRACE AI - PHASE 4: FORENSIC TIMELINE ENGINE INTEGRATION TEST SUITE');
  console.log(`Backend API: ${BASE_URL}`);
  console.log(`MongoDB URI: ${MONGO_URI}`);
  console.log('======================================================================\n');

  let authToken = null;
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
    authToken = body.token || body.data?.token;
    if (res.ok && authToken) {
      authHeaders = {
        'Authorization': `Bearer ${authToken}`
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
  // Test 2: Authorization Enforcement (401 on unauthenticated)
  // -------------------------------------------------------------------------
  try {
    const unauthGen = await fetch(`${BASE_URL}/timeline/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId: 'TEST-UNAUTH' })
    });
    const unauthList = await fetch(`${BASE_URL}/timeline?caseId=TEST-UNAUTH`);

    const passed = unauthGen.status === 401 && unauthList.status === 401;
    recordTest(2, 'Authorization Enforcement for Timeline APIs', passed, `Generate: ${unauthGen.status}, List: ${unauthList.status}`);
  } catch (err) {
    recordTest(2, 'Authorization Enforcement for Timeline APIs', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 3: Create Test Case A and Test Case B
  // -------------------------------------------------------------------------
  try {
    const resA = await fetch(`${BASE_URL}/cases`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `Timeline Incident Investigation - ${Date.now()}`,
        description: 'Case A for forensic timeline sequence reconstruction',
        severity: 'High'
      })
    });
    const bodyA = await resA.json();
    caseIdA = bodyA.data.caseId;

    const resB = await fetch(`${BASE_URL}/cases`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `Timeline Isolation Incident - ${Date.now()}`,
        description: 'Case B for verifying strict case-level isolation',
        severity: 'Low'
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
  // Test 4: Ingest Multi-Format Evidence into Case A
  // -------------------------------------------------------------------------
  try {
    const formDataA = new FormData();
    formDataA.append('caseId', caseIdA);
    formDataA.append('batchId', `BATCH-TLE-A-${Date.now()}`);

    // Evidence 1: Syslog format (Sep 29 14:05:00) with brute force public IP
    const syslogContent = [
      'Sep 29 14:05:00 auth-srv sshd[102]: Failed password for invalid user root from 198.51.100.25:44212',
      'Sep 29 14:06:00 auth-srv sshd[103]: Failed password for invalid user admin from 198.51.100.25:44214',
      'Sep 29 14:07:00 auth-srv sudo: operator : TTY=pts/0 ; PWD=/home/operator ; USER=root ; COMMAND=/usr/bin/id'
    ].join('\n');

    // Evidence 2: Common Log Format (29/Sep/2026:14:10:00 +0000)
    const clfContent = [
      '198.51.100.25 - - [29/Sep/2026:14:10:00 +0000] "GET /payload.sh HTTP/1.1" 200 4096',
      '192.168.1.50 - - [29/Sep/2026:14:12:00 +0000] "GET /index.html HTTP/1.1" 200 1024'
    ].join('\n');

    // Evidence 3: JSONL with explicit ISO 8601 (with Z) and offset (+02:00)
    const jsonlContent = [
      '{"timestamp":"2026-09-29T14:15:00Z","user":"attacker_svc","ip":"198.51.100.25","process":"powershell.exe","action":"spawn"}',
      '{"timestamp":"2026-09-29T16:20:00+02:00","user":"sec_admin","ip":"10.0.0.5","action":"containment_applied"}'
    ].join('\n');

    // Evidence 4: Undated & Malformed timestamps (must be marked isUndated: true)
    const undatedContent = [
      '[SYSTEM_BOOT] Kernel initialization finished without time offset',
      'BAD_TIMESTAMP_XX_YY Firewall rule table updated'
    ].join('\n');

    formDataA.append('relativePaths', JSON.stringify([
      'syslog/auth.log',
      'web/access.log',
      'edr/events.jsonl',
      'system/undated.log'
    ]));

    formDataA.append('files', new Blob([syslogContent], { type: 'text/plain' }), 'auth.log');
    formDataA.append('files', new Blob([clfContent], { type: 'text/plain' }), 'access.log');
    formDataA.append('files', new Blob([jsonlContent], { type: 'text/plain' }), 'events.jsonl');
    formDataA.append('files', new Blob([undatedContent], { type: 'text/plain' }), 'undated.log');

    const res = await fetch(`${BASE_URL}/evidence/upload`, {
      method: 'POST',
      headers: authHeaders,
      body: formDataA
    });
    const body = await res.json();

    recordTest(4, 'Ingest Multi-Format Evidence with Diverse Timestamps',
      res.status === 201 && body.data.length === 4,
      `Uploaded 4 evidence files across Syslog, CLF, JSONL, and Undated sources`
    );
  } catch (err) {
    recordTest(4, 'Ingest Multi-Format Evidence with Diverse Timestamps', false, err.message);
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // Test 5: Run IOC Detection to Establish Linked Threat Indicators
  // -------------------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/ioc/detect`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId: caseIdA })
    });
    const body = await res.json();
    const count = body.data?.totalDetected || 0;

    recordTest(5, 'Pre-seed IOC Indicators for Timeline Correlation',
      res.status === 200 && count > 0,
      `Extracted ${count} IOCs ready for timeline event linking`
    );
  } catch (err) {
    recordTest(5, 'Pre-seed IOC Indicators for Timeline Correlation', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 6: Generate Timeline for Case A (POST /api/timeline/generate)
  // -------------------------------------------------------------------------
  let genMetrics = null;
  try {
    const res = await fetch(`${BASE_URL}/timeline/generate`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId: caseIdA })
    });
    const body = await res.json();
    genMetrics = body.data;

    const passed = res.status === 200 && body.success && genMetrics.totalEvents > 0 && genMetrics.datedEvents > 0 && genMetrics.undatedEvents > 0;
    recordTest(6, 'Generate Forensic Timeline (POST /api/timeline/generate)', passed,
      `Total: ${genMetrics?.totalEvents}, Dated: ${genMetrics?.datedEvents}, Undated: ${genMetrics?.undatedEvents}`
    );
  } catch (err) {
    recordTest(6, 'Generate Forensic Timeline', false, err.message);
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // Test 7: Timestamp Parsing & UTC Normalization
  // -------------------------------------------------------------------------
  let datedEvents = [];
  try {
    const res = await fetch(`${BASE_URL}/timeline?caseId=${caseIdA}&sortOrder=asc&limit=100`, {
      headers: authHeaders
    });
    const body = await res.json();
    datedEvents = body.data.items || [];

    // Verify ISO 8601 with Z
    const isoEvent = datedEvents.find(e => e.originalTimestamp === '2026-09-29T14:15:00Z');
    const isoUtc = isoEvent && new Date(isoEvent.timestamp).toISOString() === '2026-09-29T14:15:00.000Z';

    // Verify ISO 8601 with offset (+02:00): 16:20:00+02:00 converts to 14:20:00 UTC
    const offsetEvent = datedEvents.find(e => e.originalTimestamp === '2026-09-29T16:20:00+02:00');
    const offsetUtc = offsetEvent && new Date(offsetEvent.timestamp).toISOString() === '2026-09-29T14:20:00.000Z';

    // Verify CLF format with offset (+0000)
    const clfEvent = datedEvents.find(e => e.originalTimestamp && e.originalTimestamp.includes('29/Sep/2026:14:10:00'));
    const clfUtc = clfEvent && new Date(clfEvent.timestamp).toISOString().includes('2026-09-29T14:10:00');

    // Verify Syslog format normalized
    const syslogEvent = datedEvents.find(e => e.originalTimestamp === 'Sep 29 14:05:00');
    const syslogUtc = syslogEvent && new Date(syslogEvent.timestamp).toISOString().includes('2026-09-29T14:05:00');

    const allNormalized = isoUtc && offsetUtc && clfUtc && syslogUtc;

    recordTest(7, 'Multi-Format Timestamp Parsing & UTC Normalization',
      allNormalized,
      `ISO Z: ${isoUtc}, ISO +02:00->UTC: ${offsetUtc}, CLF: ${clfUtc}, Syslog: ${syslogUtc}`
    );
  } catch (err) {
    recordTest(7, 'Multi-Format Timestamp Parsing & UTC Normalization', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 8: Missing and Ambiguous Timestamp Handling (Undated records)
  // -------------------------------------------------------------------------
  try {
    // 1. By default, undated events must be excluded from chronological queries
    const defaultRes = await fetch(`${BASE_URL}/timeline?caseId=${caseIdA}`, { headers: authHeaders });
    const defaultBody = await defaultRes.json();
    const defaultHasUndated = defaultBody.data.items.some(e => e.isUndated === true || e.timestamp === null);

    // 2. When includeUndated=true is requested, undated events are returned
    const undatedRes = await fetch(`${BASE_URL}/timeline?caseId=${caseIdA}&includeUndated=true&limit=100`, { headers: authHeaders });
    const undatedBody = await undatedRes.json();
    const undatedItems = undatedBody.data.items.filter(e => e.isUndated === true);

    const hasUndatedItems = undatedItems.length >= 2;
    const undatedHaveWarning = undatedItems.every(e => e.provenanceWarnings.length > 0 && e.timezoneStatus === 'undated');

    // 3. Syslog events should be marked as timezone_unknown
    const syslogEvent = datedEvents.find(e => e.originalTimestamp === 'Sep 29 14:05:00');
    const syslogAmbiguous = syslogEvent?.timezoneStatus === 'timezone_unknown' && syslogEvent?.provenanceWarnings.some(w => w.includes('Syslog'));

    const passed = !defaultHasUndated && hasUndatedItems && undatedHaveWarning && syslogAmbiguous;

    recordTest(8, 'Missing and Ambiguous Timestamp Handling',
      passed,
      `Default Excludes Undated: ${!defaultHasUndated}, Retrieved Undated: ${undatedItems.length}, Syslog Flagged Unknown TZ: ${syslogAmbiguous}`
    );
  } catch (err) {
    recordTest(8, 'Missing and Ambiguous Timestamp Handling', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 9: Strict Chronological Ordering
  // -------------------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/timeline?caseId=${caseIdA}&sortOrder=asc&limit=100`, { headers: authHeaders });
    const body = await res.json();
    const items = body.data.items || [];

    let isStrictlyChronological = true;
    for (let i = 0; i < items.length - 1; i++) {
      const t1 = new Date(items[i].timestamp).getTime();
      const t2 = new Date(items[i + 1].timestamp).getTime();
      if (t1 > t2) {
        isStrictlyChronological = false;
        break;
      }
    }

    recordTest(9, 'Strict Chronological Event Sequence Verification',
      isStrictlyChronological && items.length > 0,
      `Verified monotonic non-decreasing timestamp progression across ${items.length} chronological events`
    );
  } catch (err) {
    recordTest(9, 'Strict Chronological Event Sequence Verification', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 10: Evidence Provenance Retention
  // -------------------------------------------------------------------------
  try {
    const eventWithLine = datedEvents.find(e => e.source?.fileName === 'auth.log' && e.source?.lineNumber === 1);
    const hasEvidenceId = !!eventWithLine?.source?.evidenceId;
    const hasRelativePath = eventWithLine?.source?.relativePath === 'syslog/auth.log';
    const hasLineNumber = eventWithLine?.source?.lineNumber === 1;
    const hasExcerpt = eventWithLine?.rawExcerpt && eventWithLine.rawExcerpt.includes('Failed password for invalid user root');

    const passed = hasEvidenceId && hasRelativePath && hasLineNumber && hasExcerpt;

    recordTest(10, 'Complete Evidence Provenance Retention',
      passed,
      `Evidence ID: ${eventWithLine?.source?.evidenceId}, Relative Path: ${eventWithLine?.source?.relativePath}, Line: ${eventWithLine?.source?.lineNumber}`
    );
  } catch (err) {
    recordTest(10, 'Complete Evidence Provenance Retention', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 11: Correlated IOC Association
  // -------------------------------------------------------------------------
  try {
    // The ssh brute-force event from 198.51.100.25 should correlate with the IOC for 198.51.100.25
    const correlatedAuthEvent = datedEvents.find(e => e.source?.fileName === 'auth.log' && e.rawExcerpt.includes('198.51.100.25'));
    const linkedIocs = correlatedAuthEvent?.relatedIocs || [];

    const hasLinkedIoc = linkedIocs.some(i => i.normalizedValue === '198.51.100.25');
    // Severity should have been escalated to High or Critical
    const severityEscalated = correlatedAuthEvent?.severity === 'High' || correlatedAuthEvent?.severity === 'Critical';

    recordTest(11, 'Correlated IOC Association & Severity Escalation',
      hasLinkedIoc && severityEscalated,
      `Correlated IOCs: ${linkedIocs.map(i => i.normalizedValue).join(', ')}, Event Severity: ${correlatedAuthEvent?.severity}`
    );
  } catch (err) {
    recordTest(11, 'Correlated IOC Association & Severity Escalation', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 12: Repeatability & Idempotency on Re-generation
  // -------------------------------------------------------------------------
  try {
    const countBefore = genMetrics.totalEvents;

    // Run generate again for Case A
    const res2 = await fetch(`${BASE_URL}/timeline/generate`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId: caseIdA })
    });
    const body2 = await res2.json();
    const countAfter = body2.data.totalEvents;
    const newInSecondRun = body2.data.newEvents;

    // Direct check in DB
    await mongoose.connect(MONGO_URI);
    const dbTotal = await TimelineEvent.countDocuments({ caseId: caseIdA });
    await mongoose.disconnect();

    const isIdempotent = countBefore === countAfter && newInSecondRun === 0 && dbTotal === countBefore;

    recordTest(12, 'Timeline Generation Idempotency & Duplicate Prevention',
      isIdempotent,
      `Run 1: ${countBefore}, Run 2: ${countAfter} (New: ${newInSecondRun}), DB Total: ${dbTotal}`
    );
  } catch (err) {
    recordTest(12, 'Timeline Generation Idempotency & Duplicate Prevention', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 13: Case Isolation (Case A events do not leak into Case B)
  // -------------------------------------------------------------------------
  try {
    // Ingest single evidence file into Case B
    const formDataB = new FormData();
    formDataB.append('caseId', caseIdB);
    formDataB.append('batchId', `BATCH-TLE-B-${Date.now()}`);
    formDataB.append('relativePaths', JSON.stringify(['caseB_isolated.log']));
    formDataB.append('files', new Blob(['2026-09-29T18:00:00Z hostB daemon: Case B unique event trace'], { type: 'text/plain' }), 'caseB_isolated.log');

    await fetch(`${BASE_URL}/evidence/upload`, {
      method: 'POST',
      headers: authHeaders,
      body: formDataB
    });

    // Generate timeline for Case B
    await fetch(`${BASE_URL}/timeline/generate`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId: caseIdB })
    });

    // Query Case B timeline
    const resB = await fetch(`${BASE_URL}/timeline?caseId=${caseIdB}`, { headers: authHeaders });
    const bodyB = await resB.json();
    const eventsB = bodyB.data.items || [];

    const hasCaseBEvent = eventsB.some(e => e.rawExcerpt && e.rawExcerpt.includes('Case B unique event trace'));
    const doesNotHaveCaseAEvent = !eventsB.some(e => e.source?.fileName === 'auth.log');

    recordTest(13, 'Case-Scoped Isolation & Authorization Boundary',
      hasCaseBEvent && doesNotHaveCaseAEvent,
      `Case B contains Case B events: ${hasCaseBEvent}, Case B excludes Case A events: ${doesNotHaveCaseAEvent}`
    );
  } catch (err) {
    recordTest(13, 'Case-Scoped Isolation & Authorization Boundary', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 14: Multi-Dimensional Filtering & Event Details API
  // -------------------------------------------------------------------------
  try {
    // 1. Filter by eventType=AUTH
    const authRes = await fetch(`${BASE_URL}/timeline?caseId=${caseIdA}&eventType=AUTH`, { headers: authHeaders });
    const authBody = await authRes.json();
    const allAuth = authBody.data.items.every(e => e.eventType === 'AUTH');

    // 2. Filter by severity=High
    const sevRes = await fetch(`${BASE_URL}/timeline?caseId=${caseIdA}&severity=High`, { headers: authHeaders });
    const sevBody = await sevRes.json();
    const allHigh = sevBody.data.items.every(e => e.severity === 'High');

    // 3. Single event retrieval by eventId
    const sampleEventId = datedEvents[0].eventId;
    const detailRes = await fetch(`${BASE_URL}/timeline/${sampleEventId}`, { headers: authHeaders });
    const detailBody = await detailRes.json();
    const detailRetrieved = detailRes.status === 200 && detailBody.data?.eventId === sampleEventId && !!detailBody.data?.source;

    recordTest(14, 'Multi-Dimensional Filtering & Detailed Event Provenance API',
      allAuth && allHigh && detailRetrieved,
      `AUTH Filter: ${allAuth}, High Severity Filter: ${allHigh}, Event Detail: ${detailRetrieved}`
    );
  } catch (err) {
    recordTest(14, 'Multi-Dimensional Filtering & Detailed Event Provenance API', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 15: Direct Local MongoDB Persistence & Audit Logging
  // -------------------------------------------------------------------------
  try {
    await mongoose.connect(MONGO_URI);

    const dbEventsCount = await TimelineEvent.countDocuments({ caseId: caseIdA });
    const dbAuditEntry = await AuditLog.findOne({
      action: 'GENERATE_TIMELINE',
      $or: [
        { description: { $regex: caseIdA } },
        { details: { $regex: caseIdA } }
      ]
    });

    await mongoose.disconnect();

    const passed = dbEventsCount > 0 && !!dbAuditEntry;

    recordTest(15, 'Direct Local MongoDB Persistence & Audit Trail',
      passed,
      `Persisted Timeline Events: ${dbEventsCount}, Audit Log Recorded: ${!!dbAuditEntry}`
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
    console.error('>>> SOME INTEGRATION TESTS FAILED <<<\n');
    process.exit(1);
  } else {
    console.log('>>> ALL FORENSIC TIMELINE ENGINE INTEGRATION TESTS PASSED <<<\n');
    process.exit(0);
  }
}

runTestSuite().catch(err => {
  console.error('Test suite encountered unexpected fatal error:', err);
  process.exit(1);
});
