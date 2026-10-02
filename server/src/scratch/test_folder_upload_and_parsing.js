/**
 * Automated Integration Test Suite:
 * Folder-Based Evidence Upload and Forensic Parsing
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000/api';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/arclight_dfir';

const results = [];
function recordTest(id, name, passed, detail = '') {
  results.push({ id, name, passed, detail });
  const status = passed ? '[PASS]' : '[FAIL]';
  console.log(`${status} Test ${id}: ${name}${detail ? ` - ${detail}` : ''}`);
}

async function runTests() {
  console.log('======================================================================');
  console.log('TRACE AI - FOLDER-BASED EVIDENCE UPLOAD & FORENSIC PARSING TEST SUITE');
  console.log(`Backend API: ${BASE_URL}`);
  console.log(`MongoDB URI: ${MONGO_URI}`);
  console.log('======================================================================\n');

  let token = '';

  // 1. Authenticate with seeded administrator
  try {
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'cso@trace.ai', password: 'clearancepassword123' })
    });
    const loginData = await loginRes.json();
    token = loginData.token;
    recordTest(1, 'Authentication as Operator', loginRes.ok && !!token, 'Token acquired');
  } catch (err) {
    recordTest(1, 'Authentication as Operator', false, err.message);
    process.exit(1);
  }

  const authHeaders = {
    'Authorization': `Bearer ${token}`
  };

  // 2. Create a dedicated test case
  let testCaseId = '';
  try {
    const caseRes = await fetch(`${BASE_URL}/cases`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Forensic Folder Ingestion Incident',
        description: 'Case for testing multi-file and recursive folder uploads with forensic parsing.',
        severity: 'Critical',
        status: 'Investigating',
        assignedAnalyst: 'Forensic Lead'
      })
    });
    const caseData = await caseRes.json();
    testCaseId = caseData.data.caseId;
    recordTest(2, 'Create Test Case for Ingestion', caseRes.ok && !!testCaseId, `Case ID: ${testCaseId}`);
  } catch (err) {
    recordTest(2, 'Create Test Case for Ingestion', false, err.message);
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // Test 3: Single-file upload, hash computation, and parsing
  // -------------------------------------------------------------------------
  try {
    const singleContent = [
      'Sep 29 14:00:01 host-edge-01 sshd[1420]: Accepted password for admin from 198.51.100.25 port 42212 ssh2',
      'Sep 29 14:02:10 host-edge-01 kernel: Outbound connection to malicious C2 https://malicious-c2.net/beacon from 10.0.0.14',
      'Sep 29 14:05:00 host-edge-01 sudo: admin : TTY=pts/0 ; PWD=/root ; USER=root ; COMMAND=/bin/bash EventID=4624'
    ].join('\n');

    const expectedMd5 = crypto.createHash('md5').update(singleContent).digest('hex');
    const expectedSha1 = crypto.createHash('sha1').update(singleContent).digest('hex');
    const expectedSha256 = crypto.createHash('sha256').update(singleContent).digest('hex');

    const formData = new FormData();
    formData.append('caseId', testCaseId);
    formData.append('fileType', 'Log File');
    formData.append('notes', 'Single file forensic sample');
    formData.append('files', new Blob([singleContent], { type: 'text/plain' }), 'auth_audit.log');

    const res = await fetch(`${BASE_URL}/evidence/upload`, {
      method: 'POST',
      headers: authHeaders,
      body: formData
    });
    const data = await res.json();

    const item = Array.isArray(data.data) ? data.data[0] : data.data;
    const passedHashes = item.md5Hash === expectedMd5 && item.sha1Hash === expectedSha1 && item.sha256Hash === expectedSha256;
    const passedParsing = item.parsing && item.parsing.status === 'Parsed' && item.parsing.parserType === 'TEXT_LOG';
    const hasIps = item.parsing?.artifacts?.ips?.includes('198.51.100.25') && item.parsing?.artifacts?.ips?.includes('10.0.0.14');
    const hasUsers = item.parsing?.artifacts?.users?.includes('admin');
    const hasCustody = item.chainOfCustody?.length >= 2; // Ingested + Forensic Parsing

    recordTest(3, 'Single File Upload, Hash Verification, and Parsing', 
      res.status === 201 && passedHashes && passedParsing && hasIps && hasUsers && hasCustody,
      `Evidence ID: ${item.evidenceId}, Records: ${item.parsing?.recordCount}, IPs: ${item.parsing?.artifacts?.ips?.join(', ')}`
    );
  } catch (err) {
    recordTest(3, 'Single File Upload, Hash Verification, and Parsing', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 4: Nested Folder Upload (Multiple files with relative paths & batch ID)
  // -------------------------------------------------------------------------
  const batchId = `BATCH-TEST-${Date.now()}`;
  let folderUploadedItems = [];
  try {
    const filesData = [
      {
        path: 'triage/logs/system.syslog',
        content: '<34>Sep 29 14:10:00 srv-app01 nginx[8891]: 192.168.1.100 - user_admin [29/Sep/2026:14:10:00] "GET /api/v1/data HTTP/1.1" 200 process=nginx.exe EventID=1001'
      },
      {
        path: 'triage/network/traffic.csv',
        content: 'timestamp,src_ip,dst_ip,url,event_id\n2026-09-29T14:15:00Z,10.0.1.5,203.0.113.88,https://data-exfil.org/api,5002\n2026-09-29T14:16:00Z,10.0.1.6,203.0.113.89,https://c2-beacon.com/v2,5003'
      },
      {
        path: 'triage/cloud/events.json',
        content: JSON.stringify([
          { timestamp: '2026-09-29T14:20:00Z', username: 'attacker_svc', targetHost: 'IAM-CLUSTER-01', ip: '198.51.100.99', eventId: '9901' },
          { timestamp: '2026-09-29T14:21:00Z', username: 'sec_admin', targetHost: 'IAM-CLUSTER-01', email: 'alert@trace.ai', eventId: '9902' }
        ], null, 2)
      },
      {
        path: 'triage/cloud/stream.jsonl',
        content: '{"timestamp":"2026-09-29T14:25:00Z","user":"j.doe","ip":"172.16.0.4","process":"cmd.exe"}\n{"timestamp":"2026-09-29T14:26:00Z","user":"s.smith","ip":"172.16.0.5","domain":"corp.internal"}'
      },
      {
        path: 'triage/binaries/memdump.raw',
        content: 'BINARY_SAMPLE_PAYLOAD_UNSUPPORTED_TEST_BYTES_010203040506070809'
      }
    ];

    const formData = new FormData();
    formData.append('caseId', testCaseId);
    formData.append('batchId', batchId);
    formData.append('fileType', 'Folder Ingestion');
    formData.append('notes', 'Nested directory acquisition');

    const relativePaths = filesData.map(f => f.path);
    formData.append('relativePaths', JSON.stringify(relativePaths));

    filesData.forEach(f => {
      formData.append('files', new Blob([f.content], { type: 'text/plain' }), path.basename(f.path));
    });

    const res = await fetch(`${BASE_URL}/evidence/upload`, {
      method: 'POST',
      headers: authHeaders,
      body: formData
    });
    const body = await res.json();
    folderUploadedItems = Array.isArray(body.data) ? body.data : [body.data];

    const allPreservedPaths = folderUploadedItems.every((item, idx) => item.relativePath === filesData[idx].path);
    const allHaveBatchId = folderUploadedItems.every(item => item.batchId === batchId);
    const distinctEvidenceIds = new Set(folderUploadedItems.map(i => i.evidenceId)).size === folderUploadedItems.length;

    recordTest(4, 'Nested Folder Upload & Relative Path Preservation',
      res.status === 201 && folderUploadedItems.length === 5 && allPreservedPaths && allHaveBatchId && distinctEvidenceIds,
      `Batch ID: ${batchId}, Uploaded: ${folderUploadedItems.length} items with relative folder structures preserved.`
    );
  } catch (err) {
    recordTest(4, 'Nested Folder Upload & Relative Path Preservation', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 5: Duplicate filenames in different folders preserved without overwrite
  // -------------------------------------------------------------------------
  try {
    const formData = new FormData();
    formData.append('caseId', testCaseId);
    formData.append('batchId', `BATCH-DUP-${Date.now()}`);
    formData.append('relativePaths', JSON.stringify(['subA/audit.log', 'subB/audit.log']));

    formData.append('files', new Blob(['Log A content from subfolder A'], { type: 'text/plain' }), 'audit.log');
    formData.append('files', new Blob(['Log B content from subfolder B'], { type: 'text/plain' }), 'audit.log');

    const res = await fetch(`${BASE_URL}/evidence/upload`, {
      method: 'POST',
      headers: authHeaders,
      body: formData
    });
    const body = await res.json();
    const items = body.data;

    const bothCreated = items.length === 2;
    const differentEvidenceIds = items[0].evidenceId !== items[1].evidenceId;
    const differentPaths = items[0].relativePath === 'subA/audit.log' && items[1].relativePath === 'subB/audit.log';
    const differentFileNames = items[0].fileName !== items[1].fileName;

    recordTest(5, 'Duplicate Filenames in Different Folders Handled Distinctly',
      res.status === 201 && bothCreated && differentEvidenceIds && differentPaths && differentFileNames,
      `IDs: ${items[0].evidenceId} (${items[0].relativePath}) vs ${items[1].evidenceId} (${items[1].relativePath})`
    );
  } catch (err) {
    recordTest(5, 'Duplicate Filenames in Different Folders Handled Distinctly', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 6: Format-specific parsing verification (CSV, JSON, JSONL, SYSLOG, UNSUPPORTED)
  // -------------------------------------------------------------------------
  try {
    const syslogItem = folderUploadedItems.find(i => i.originalName === 'system.syslog');
    const csvItem = folderUploadedItems.find(i => i.originalName === 'traffic.csv');
    const jsonItem = folderUploadedItems.find(i => i.originalName === 'events.json');
    const jsonlItem = folderUploadedItems.find(i => i.originalName === 'stream.jsonl');
    const unsupportedItem = folderUploadedItems.find(i => i.originalName === 'memdump.raw');

    const syslogOk = syslogItem?.parsing?.parserType === 'TEXT_LOG' && syslogItem?.parsing?.status === 'Parsed' && syslogItem?.parsing?.artifacts?.ips?.includes('192.168.1.100');
    const csvOk = csvItem?.parsing?.parserType === 'CSV' && csvItem?.parsing?.status === 'Parsed' && csvItem?.parsing?.recordCount === 2 && csvItem?.parsing?.artifacts?.ips?.includes('203.0.113.88');
    const jsonOk = jsonItem?.parsing?.parserType === 'JSON' && jsonItem?.parsing?.status === 'Parsed' && jsonItem?.parsing?.recordCount === 2 && jsonItem?.parsing?.artifacts?.users?.includes('attacker_svc');
    const jsonlOk = jsonlItem?.parsing?.parserType === 'JSONL' && jsonlItem?.parsing?.status === 'Parsed' && jsonlItem?.parsing?.recordCount === 2 && jsonlItem?.parsing?.artifacts?.processes?.includes('cmd.exe');
    const unsupportedOk = unsupportedItem?.parsing?.parserType === 'UNSUPPORTED' && unsupportedItem?.parsing?.status === 'Unsupported' && unsupportedItem?.parsing?.recordCount === 0;

    recordTest(6, 'Format-Specific Forensic Parsing Verification',
      syslogOk && csvOk && jsonOk && jsonlOk && unsupportedOk,
      `Syslog: ${syslogOk}, CSV: ${csvOk}, JSON: ${jsonOk}, JSONL: ${jsonlOk}, Unsupported: ${unsupportedOk}`
    );
  } catch (err) {
    recordTest(6, 'Format-Specific Forensic Parsing Verification', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 7: Empty and Malformed file parsing resilience
  // -------------------------------------------------------------------------
  try {
    const formData = new FormData();
    formData.append('caseId', testCaseId);
    formData.append('batchId', `BATCH-EDGE-${Date.now()}`);
    formData.append('relativePaths', JSON.stringify(['empty.txt', 'malformed.json', 'partial.jsonl']));

    formData.append('files', new Blob([''], { type: 'text/plain' }), 'empty.txt');
    formData.append('files', new Blob(['{ "bad_json": not_a_string '], { type: 'application/json' }), 'malformed.json');
    formData.append('files', new Blob(['{"valid": 1, "ip": "10.0.0.1"}\nnot_json\n{"valid": 2}'], { type: 'text/plain' }), 'partial.jsonl');

    const res = await fetch(`${BASE_URL}/evidence/upload`, {
      method: 'POST',
      headers: authHeaders,
      body: formData
    });
    const body = await res.json();
    const items = body.data;

    const emptyDoc = items.find(i => i.originalName === 'empty.txt');
    const malformedDoc = items.find(i => i.originalName === 'malformed.json');
    const partialDoc = items.find(i => i.originalName === 'partial.jsonl');

    const emptyHandled = emptyDoc && emptyDoc.parsing?.recordCount === 0 && emptyDoc.parsing?.warnings?.length > 0;
    const malformedHandled = malformedDoc && malformedDoc.parsing?.status === 'Failed' && malformedDoc.parsing?.errors?.length > 0;
    const partialHandled = partialDoc && partialDoc.parsing?.status === 'Partially Parsed' && partialDoc.parsing?.recordCount === 2;

    recordTest(7, 'Empty, Malformed, and Partially Parsed File Handling',
      res.status === 201 && emptyHandled && malformedHandled && partialHandled,
      `Empty: ${emptyHandled}, Malformed JSON (Failed): ${malformedHandled}, Partial JSONL: ${partialHandled}`
    );
  } catch (err) {
    recordTest(7, 'Empty, Malformed, and Partially Parsed File Handling', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 8: Security: Path Traversal Prevention
  // -------------------------------------------------------------------------
  try {
    const formData = new FormData();
    formData.append('caseId', testCaseId);
    formData.append('batchId', `BATCH-SEC-${Date.now()}`);
    // Inject malicious path traversal attempts
    formData.append('relativePaths', JSON.stringify([
      '../../../../etc/passwd',
      '..\\..\\Windows\\System32\\cmd.exe',
      '../../../secret.log'
    ]));

    formData.append('files', new Blob(['passwd dummy'], { type: 'text/plain' }), 'passwd');
    formData.append('files', new Blob(['cmd dummy'], { type: 'text/plain' }), 'cmd.exe');
    formData.append('files', new Blob(['secret dummy'], { type: 'text/plain' }), 'secret.log');

    const res = await fetch(`${BASE_URL}/evidence/upload`, {
      method: 'POST',
      headers: authHeaders,
      body: formData
    });
    const body = await res.json();
    const items = body.data;

    const allSanitized = items.every(item => {
      const p = item.relativePath;
      return !p.includes('..') && !p.startsWith('/') && !p.startsWith('\\');
    });

    recordTest(8, 'Path Traversal Prevention Sanitization',
      res.status === 201 && allSanitized,
      `Sanitized paths: ${items.map(i => i.relativePath).join(', ')}`
    );
  } catch (err) {
    recordTest(8, 'Path Traversal Prevention Sanitization', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 9: Security: Unauthorized Request Rejected
  // -------------------------------------------------------------------------
  try {
    const formData = new FormData();
    formData.append('caseId', testCaseId);
    formData.append('files', new Blob(['unauthorized test'], { type: 'text/plain' }), 'unauth.txt');

    const res = await fetch(`${BASE_URL}/evidence/upload`, {
      method: 'POST',
      body: formData
    });

    recordTest(9, 'Unauthorized Upload Request Rejected (401)', res.status === 401, `Status: ${res.status}`);
  } catch (err) {
    recordTest(9, 'Unauthorized Upload Request Rejected (401)', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 10: Batch Retrieval API (GET /api/evidence/batch/:batchId)
  // -------------------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/evidence/batch/${batchId}`, { headers: authHeaders });
    const data = await res.json();

    const batchSummary = data.data;
    const ok = res.status === 200 && data.success &&
      batchSummary.batchId === batchId &&
      batchSummary.totalFiles === 5 &&
      batchSummary.parsedCount >= 4 &&
      batchSummary.unsupportedCount === 1 &&
      batchSummary.items.length === 5;

    recordTest(10, 'Batch Summary Retrieval API (GET /evidence/batch/:id)', ok,
      `Total: ${batchSummary?.totalFiles}, Parsed: ${batchSummary?.parsedCount}, Unsupported: ${batchSummary?.unsupportedCount}`
    );
  } catch (err) {
    recordTest(10, 'Batch Summary Retrieval API (GET /evidence/batch/:id)', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 11: Direct Independent MongoDB Verification
  // -------------------------------------------------------------------------
  try {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;

    const batchDocs = await db.collection('evidences').find({ batchId }).toArray();
    const directOk = batchDocs.length === 5 &&
      batchDocs.every(d => d.sha256Hash && d.parsing && d.chainOfCustody && d.relativePath);

    // Verify Case evidenceCount was incremented properly
    const caseDoc = await db.collection('cases').findOne({ caseId: testCaseId });
    const caseCountOk = caseDoc && caseDoc.evidenceCount >= 6;

    await mongoose.disconnect();

    recordTest(11, 'Direct MongoDB Persistence & Case Count Verification',
      directOk && caseCountOk,
      `Persisted batch documents: ${batchDocs.length}, Case evidenceCount: ${caseDoc?.evidenceCount}`
    );
  } catch (err) {
    recordTest(11, 'Direct MongoDB Persistence & Case Count Verification', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log('TEST SUMMARY RESULTS');
  console.log('======================================================================');
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  console.log(`Total Tests Executed: ${totalCount}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${totalCount - passedCount}`);
  console.log('======================================================================\n');

  if (passedCount === totalCount) {
    console.log('>>> ALL FOLDER UPLOAD & FORENSIC PARSING INTEGRATION TESTS PASSED <<<');
    process.exit(0);
  } else {
    console.error('>>> SOME INTEGRATION TESTS FAILED <<<');
    process.exit(1);
  }
}

runTests();
