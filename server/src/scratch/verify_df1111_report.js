const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

async function verifyCase1111Report() {
  console.log('=== [VERIFY CASE DF-1111 REPORT END-TO-END] ===');

  // 1. Authenticate as the case owner
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'akash.demo@trace.local',
      password: 'AKASHC2026!'
    })
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok || !loginData.success) {
    throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
  }
  const token = loginData.token;
  console.log(`[PASS] Logged in as ${loginData.user.fullName} (${loginData.user.email})`);

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 2. Request PDF generation for DF-1111
  console.log('Requesting PDF generation for DF-1111...');
  const genRes = await fetch(`${BASE_URL}/reports/generate`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      caseId: 'DF-1111',
      title: 'DFIR Investigation Report - DF-1111',
      reportType: 'DFIR Comprehensive Report',
      format: 'PDF',
      analystConclusion: 'Forensic evaluation confirms brute force intrusion attempts against root account with suspicious process execution from /tmp.'
    })
  });

  const genData = await genRes.json();
  console.log('Generate response:', genData);
  if (!genRes.ok || !genData.success) {
    throw new Error(`Report generation failed: ${JSON.stringify(genData)}`);
  }

  const reportId = genData.data.reportId;
  console.log(`Generated Report ID: ${reportId}`);

  // 3. Download the PDF file
  const downloadRes = await fetch(`${BASE_URL}/reports/${reportId}/download`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!downloadRes.ok) {
    throw new Error(`Download failed with status ${downloadRes.status}`);
  }

  const arrayBuffer = await downloadRes.arrayBuffer();
  const pdfBuffer = Buffer.from(arrayBuffer);
  const outputPath = path.resolve(__dirname, 'downloaded_df1111_report.pdf');
  fs.writeFileSync(outputPath, pdfBuffer);
  console.log(`Saved PDF to ${outputPath} (${pdfBuffer.length} bytes)`);

  // 4. Verify text content in the PDF by decompressing streams and extracting glyph text
  const zlib = require('zlib');
  const pdfRaw = pdfBuffer.toString('latin1');
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let sMatch;
  let extractedChunks = [];

  while ((sMatch = streamRegex.exec(pdfRaw)) !== null) {
    try {
      const decomp = zlib.inflateSync(Buffer.from(sMatch[1], 'latin1'));
      const textContent = decomp.toString('utf8');
      const hexRegex = /<([0-9a-fA-F]+)>/g;
      let hMatch;
      let chunk = '';
      while ((hMatch = hexRegex.exec(textContent)) !== null) {
        chunk += Buffer.from(hMatch[1], 'hex').toString('latin1');
      }
      if (chunk.length > 0) extractedChunks.push(chunk);
    } catch (e) {
      // not a zlib stream (e.g. metadata or image)
    }
  }

  const pdfFullText = extractedChunks.join(' ');

  // Check for required real case data
  const checks = [
    { label: 'Case ID DF-1111', passed: pdfFullText.includes('DF-1111') },
    { label: 'Real Evidence file (trace_ai_security_test (1).log)', passed: pdfFullText.includes('trace_ai_security_test (1).log') },
    { label: 'Real SHA-256 Hash', passed: pdfFullText.includes('50df7166b1dbccd224fd41aa44e05d9ac499a15f0c64d35da230476dd1f6340b') },
    { label: 'Real AI Investigation Run IRUN-1048', passed: pdfFullText.includes('IRUN-1048') },
    { label: 'Real AI Model mistral:latest', passed: pdfFullText.includes('mistral:latest') },
    { label: 'Section 1: Case Information', passed: pdfFullText.includes('Case Information') },
    { label: 'Section 2: Incident Summary', passed: pdfFullText.includes('Incident Summary') },
    { label: 'Section 3: Evidence Summary', passed: pdfFullText.includes('Evidence Summary') },
    { label: 'Section 4: Indicators of Compromise', passed: pdfFullText.includes('Indicators of Compromise') },
    { label: 'Section 5: Forensic Timeline', passed: pdfFullText.includes('Forensic Timeline') },
    { label: 'Section 6: MITRE ATT&CK', passed: pdfFullText.includes('MITRE ATT&CK') },
    { label: 'Section 7: AI Investigation Findings', passed: pdfFullText.includes('AI Investigation Findings') },
    { label: 'Section 8: Risk Assessment', passed: pdfFullText.includes('Risk Assessment') },
    { label: 'Section 9: Analyst Conclusion', passed: pdfFullText.includes('Analyst Conclusion') },
    // Anti-checks: Ensure demo artifacts are NOT present
    { label: 'NO demo security.evtx', passed: !pdfFullText.includes('security.evtx') },
    { label: 'NO demo memory.raw', passed: !pdfFullText.includes('memory.raw') },
    { label: 'NO demo network.pcap', passed: !pdfFullText.includes('network.pcap') },
    { label: 'NO demo auth-log.txt', passed: !pdfFullText.includes('auth-log.txt') },
    { label: 'NO demo APT-29 mock findings', passed: !pdfFullText.includes('APT-29') }
  ];

  console.log('\n--- Content Verification Results ---');
  let allPassed = true;
  for (const c of checks) {
    console.log(`[${c.passed ? 'PASS' : 'FAIL'}] ${c.label}`);
    if (!c.passed) allPassed = false;
  }

  // Count /Type /Page in PDF structure to verify page count
  const pageMatches = pdfRaw.match(/\/Type\s*\/Page\b/g);
  const pageCount = pageMatches ? pageMatches.length : 1;
  console.log(`\nPDF Total Page Count: ${pageCount}`);
  if (pageCount < 2) {
    console.warn('[WARN] Expected multi-page PDF output for comprehensive report');
  } else {
    console.log(`[PASS] PDF is multi-page (${pageCount} pages)`);
  }

  await mongoose.disconnect();

  if (allPassed) {
    console.log('\n=== ALL DF-1111 VERIFICATIONS PASSED SUCCESSFULLY ===');
  } else {
    console.error('\n=== SOME VERIFICATIONS FAILED ===');
    process.exit(1);
  }
}

verifyCase1111Report().catch(err => {
  console.error(err);
  process.exit(1);
});
