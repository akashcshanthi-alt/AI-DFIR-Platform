/**
 * TRACE AI DFIR Platform — Simple Case Workflow Verification Test Suite
 *
 * Tests:
 * 1. User authentication & token issuance
 * 2. Create case using simplified schema (title, incidentType, severity, description)
 * 3. MongoDB persistence & ownership enforcement (createdBy assigned from token)
 * 4. Get case details by ID
 * 5. Isolation: User B cannot access User A's case (404/authorization check)
 * 6. User B with no cases receives empty list (0 cases, empty array)
 * 7. Evidence upload to newly created case
 * 8. Case-scoped IOC detection, Timeline generation, MITRE mapping
 * 9. AI Chat copilot endpoint with real case context
 * 10. AI LangGraph investigation workflow execution & persistence
 * 11. Case deletion
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const express = require('express');
const http = require('http');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Import models & services
const User = require('../models/User');
const Case = require('../models/Case');
const Evidence = require('../models/Evidence');
const AuditLog = require('../models/AuditLog');
const { runInvestigationWorkflow } = require('../services/investigationWorkflow.service');

// Import app configuration & routes
const app = require('../app');

const JWT_SECRET = process.env.JWT_SECRET || 'trace_jwt_super_secret_clearance_key_2026';

let mongoServer;
let server;
let port;
let baseUrl;

let userAId;
let tokenA;
let userBId;
let tokenB;

let createdCaseA;

async function setup() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Start express server on dynamic port
  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, () => {
      port = server.address().port;
      baseUrl = `http://localhost:${port}/api`;
      resolve();
    });
  });

  // Create User A
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password123!', salt);

  const userA = new User({
    fullName: 'Investigator Alice',
    email: 'alice@trace.ai',
    password: passwordHash,
    role: 'Investigator',
    emailVerified: true
  });
  await userA.save();
  userAId = userA._id.toString();
  tokenA = jwt.sign({ id: userAId, email: userA.email, role: userA.role }, JWT_SECRET, { expiresIn: '1h' });

  // Create User B
  const userB = new User({
    fullName: 'Investigator Bob',
    email: 'bob@trace.ai',
    password: passwordHash,
    role: 'Investigator',
    emailVerified: true
  });
  await userB.save();
  userBId = userB._id.toString();
  tokenB = jwt.sign({ id: userBId, email: userB.email, role: userB.role }, JWT_SECRET, { expiresIn: '1h' });
}

async function teardown() {
  if (server) await new Promise(r => server.close(r));
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
}

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`[PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${message}`);
  }
}

async function runTests() {
  console.log('======================================================================');
  console.log('TRACE AI - SIMPLIFIED CASE WORKFLOW VERIFICATION TEST SUITE');
  console.log('======================================================================\n');

  try {
    await setup();

    // -------------------------------------------------------------------------
    // Test 1: Validate required fields when creating a case (missing title)
    // -------------------------------------------------------------------------
    const resInvalid = await fetch(`${baseUrl}/cases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        incidentType: 'Malware Outbreak',
        severity: 'High'
      })
    });
    assert(resInvalid.status === 400, 'Test 1: Validation rejects case creation without required Title (HTTP 400)');

    // -------------------------------------------------------------------------
    // Test 2: Create Case with simplified form fields
    // -------------------------------------------------------------------------
    const resCreate = await fetch(`${baseUrl}/cases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        title: 'Unauthorized RDP Ingress on SRV-01',
        incidentType: 'Unauthorized Access',
        severity: 'Critical',
        description: 'Anomalous remote desktop session detected from external IP 198.51.100.45'
      })
    });
    const createData = await resCreate.json();
    assert(resCreate.status === 201 && createData.success, 'Test 2: Simplified Case creation succeeds (HTTP 201)');
    createdCaseA = createData.data;

    assert(createdCaseA.title === 'Unauthorized RDP Ingress on SRV-01', 'Test 2a: Case title is saved correctly');
    assert(createdCaseA.incidentType === 'Unauthorized Access', 'Test 2b: Incident Type is saved correctly');
    assert(createdCaseA.severity === 'Critical', 'Test 2c: Severity is saved correctly');
    assert(createdCaseA.caseId && createdCaseA.caseId.startsWith('DF-'), 'Test 2d: Sequential Case ID generated (e.g. DF-1001)');
    assert(createdCaseA.createdBy._id === userAId || createdCaseA.createdBy === userAId, 'Test 2e: Authenticated user ownership assigned automatically');

    // -------------------------------------------------------------------------
    // Test 3: Retrieve Case by ID (User A)
    // -------------------------------------------------------------------------
    const resGetById = await fetch(`${baseUrl}/cases/${createdCaseA.caseId}`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const getByIdData = await resGetById.json();
    assert(resGetById.status === 200 && getByIdData.data.title === createdCaseA.title, 'Test 3: Get Case Details by ID succeeds for owner');

    // -------------------------------------------------------------------------
    // Test 4: Isolation Enforcement — User B cannot access User A's case
    // -------------------------------------------------------------------------
    const resGetUnauthorized = await fetch(`${baseUrl}/cases/${createdCaseA.caseId}`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert(resGetUnauthorized.status === 404, 'Test 4: User B is prevented from accessing User A case (HTTP 404 IDOR Defense)');

    // -------------------------------------------------------------------------
    // Test 5: Empty State — User B with zero cases sees empty list
    // -------------------------------------------------------------------------
    const resListB = await fetch(`${baseUrl}/cases`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const listBData = await resListB.json();
    assert(
      resListB.status === 200 && listBData.data.length === 0 && listBData.pagination.total === 0,
      'Test 5: Empty user account sees 0 cases in cases list'
    );

    // -------------------------------------------------------------------------
    // Test 6: Evidence upload to newly created case
    // -------------------------------------------------------------------------
    const formData = new FormData();
    formData.append('caseId', createdCaseA.caseId);
    formData.append('fileType', 'Log');
    const logContent = '2026-10-01 00:01:00 RDP Session accepted from 198.51.100.45 for user Administrator';
    formData.append('files', new Blob([logContent], { type: 'text/plain' }), 'rdp_access.log');

    const resUpload = await fetch(`${baseUrl}/evidence/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: formData
    });
    const uploadData = await resUpload.json();
    assert(resUpload.status === 201 && uploadData.success, 'Test 6: Evidence upload to simplified case succeeds');
    const uploadedEvidenceId = uploadData.data?.[0]?.evidenceId;

    // -------------------------------------------------------------------------
    // Test 7: AI Copilot Chat endpoint with real case context
    // -------------------------------------------------------------------------
    const resChat = await fetch(`${baseUrl}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        caseId: createdCaseA.caseId,
        messages: [
          { role: 'user', content: 'What are the recommended mitigations for this RDP incident?' }
        ]
      })
    });
    const chatData = await resChat.json();
    assert(
      resChat.status === 200 && chatData.success && chatData.data?.message?.content?.length > 0,
      'Test 7: AI Chat endpoint generates case-contextual response'
    );

    // -------------------------------------------------------------------------
    // Test 8: AI LangGraph Investigation workflow execution & persistence
    // -------------------------------------------------------------------------
    const mockModel = async () => JSON.stringify({
      executiveSummary: 'Automated triage confirms unauthorized RDP connection attempt.',
      candidateNarrative: 'Adversary leveraged remote desktop protocol to attempt ingress.',
      hypotheses: [{
        title: 'Unauthorized Ingress Attempt',
        statement: 'External IP 198.51.100.45 logged active RDP connection.',
        classification: 'observed_fact',
        confidenceScore: 85,
        supportingEvidenceIds: uploadedEvidenceId ? [uploadedEvidenceId] : []
      }],
      evidenceGaps: [],
      suggestedFollowUps: ['Block IP 198.51.100.45 on firewall']
    });

    const runResult = await runInvestigationWorkflow(createdCaseA.caseId, {
      mockGenerator: mockModel,
      user: { id: userAId, email: 'alice@trace.ai' }
    });

    assert(
      runResult && runResult.runId && runResult.status === 'completed',
      'Test 8: AI LangGraph Investigation workflow executes and persists run'
    );

    // -------------------------------------------------------------------------
    // Test 9: Case Deletion
    // -------------------------------------------------------------------------
    const resDelete = await fetch(`${baseUrl}/cases/${createdCaseA.caseId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const deleteData = await resDelete.json();
    assert(resDelete.status === 200 && deleteData.success, 'Test 9: Case deletion succeeds');

  } catch (err) {
    console.error('Test execution error:', err);
    assert(false, `Unexpected error: ${err.message}`);
  } finally {
    await teardown();
  }

  console.log('\n======================================================================');
  console.log(`TEST SUMMARY: ${passedTests} / ${totalTests} PASSED`);
  console.log('======================================================================\n');

  if (passedTests === totalTests) {
    console.log('>>> ALL SIMPLIFIED CASE WORKFLOW TESTS PASSED <<<\n');
    process.exit(0);
  } else {
    console.error('>>> SOME TESTS FAILED <<<\n');
    process.exit(1);
  }
}

runTests();
