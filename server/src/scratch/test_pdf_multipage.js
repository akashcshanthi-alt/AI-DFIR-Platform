const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Case = require('../models/Case');
const Evidence = require('../models/Evidence');
const IOC = require('../models/IOC');
const TimelineEvent = require('../models/TimelineEvent');
const InvestigationRun = require('../models/InvestigationRun');
const MitreMapping = require('../models/MitreMapping');

async function testGenerate() {
  await mongoose.connect('mongodb://127.0.0.1:27017/arclight_dfir');
  const activeCase = await Case.findOne({ caseId: 'DF-1111' }).lean();
  const [evidenceList, iocList, timelineList, latestAiRun, mitreList] = await Promise.all([
    Evidence.find({ caseId: 'DF-1111' }).lean(),
    IOC.find({ caseId: 'DF-1111' }).lean(),
    TimelineEvent.find({ caseId: 'DF-1111' }).sort({ timestamp: 1 }).lean(),
    InvestigationRun.findOne({ caseId: 'DF-1111', status: 'completed' }).sort({ createdAt: -1 }).lean(),
    MitreMapping.find({ caseId: 'DF-1111' }).lean()
  ]);

  const reportData = {
    reportId: 'REP-TEST',
    title: `Forensic Investigation Report - ${activeCase.caseId}`,
    caseId: activeCase.caseId,
    caseTitle: activeCase.title,
    caseDescription: activeCase.description,
    severity: activeCase.severity,
    status: activeCase.status,
    sourceIP: activeCase.sourceIP,
    destinationIP: activeCase.destinationIP,
    evidenceCount: evidenceList.length,
    targetHost: activeCase.targetHost,
    operatorName: 'Akash Shanthi',
    operatorEmail: 'akash.demo@trace.local',
    reportType: 'Technical Investigation',
    evidenceList,
    iocList,
    timelineList,
    latestAiRun,
    mitreList: mitreList || [],
    analystConclusion: 'The forensic log analysis of trace_ai_security_test (1).log confirms unauthorized access followed by elevated administrative actions. Immediate host isolation and credential reset recommended.',
    createdAt: new Date()
  };

  const outputPath = path.join(__dirname, 'output_test.pdf');
  const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const contentWidth = pageWidth - 100;

  const ensureSpace = (needed) => {
    if (doc.y + needed > pageHeight - 65) {
      doc.addPage();
    }
  };

  const drawSectionTitle = (num, title) => {
    ensureSpace(45);
    doc.moveDown(0.6);
    const startY = doc.y;
    doc.rect(50, startY, 4, 15).fill('#0284C7');
    doc.fillColor('#0F172A').fontSize(11).font('Helvetica-Bold').text(`${num}. ${title}`, 60, startY + 2);
    doc.moveTo(50, startY + 18).lineTo(pageWidth - 50, startY + 18).lineWidth(0.75).stroke('#CBD5E1');
    doc.y = startY + 24;
  };

  // --- PAGE 1: HEADER & BANNER ---
  doc.rect(0, 0, pageWidth, 95).fill('#0B1220');
  doc.fillColor('#FFFFFF').fontSize(18).font('Helvetica-Bold').text('TRACE AI DFIR PLATFORM', 50, 28);
  doc.fillColor('#47FAF3').fontSize(8.5).font('Helvetica-Bold').text('ENTERPRISE DIGITAL FORENSICS & INCIDENT RESPONSE', 50, 52);
  doc.rect(pageWidth - 190, 30, 140, 20).fill('#1E293B');
  doc.fillColor('#F8FAFC').fontSize(7.5).font('Helvetica-Bold').text('INTERNAL USE // TLP:AMBER', pageWidth - 185, 36);

  doc.y = 110;
  doc.fillColor('#0F172A').fontSize(14).font('Helvetica-Bold').text('DIGITAL FORENSIC INVESTIGATION REPORT', 50, doc.y);
  doc.moveDown(0.2);

  // Metadata Card
  const metaStartY = doc.y;
  doc.rect(50, metaStartY, contentWidth, 75).fill('#F8FAFC');
  doc.rect(50, metaStartY, contentWidth, 75).lineWidth(0.5).stroke('#E2E8F0');

  // Left Meta Column
  doc.fillColor('#64748B').fontSize(7.5).font('Helvetica-Bold').text('REPORT METADATA', 60, metaStartY + 8);
  doc.fillColor('#334155').fontSize(8).font('Helvetica');
  doc.text(`Report ID: `, 60, metaStartY + 22, { continued: true }).font('Helvetica-Bold').text(reportData.reportId);
  doc.font('Helvetica').text(`Type: `, 60, metaStartY + 35, { continued: true }).font('Helvetica-Bold').text(reportData.reportType);
  doc.font('Helvetica').text(`Generated: `, 60, metaStartY + 48, { continued: true }).text(new Date(reportData.createdAt).toLocaleString());
  doc.font('Helvetica').text(`Examiner: `, 60, metaStartY + 61, { continued: true }).text(`${reportData.operatorName} (${reportData.operatorEmail})`);

  // Right Meta Column
  doc.fillColor('#64748B').fontSize(7.5).font('Helvetica-Bold').text('CASE TELEMETRY', 310, metaStartY + 8);
  doc.fillColor('#334155').fontSize(8).font('Helvetica');
  doc.text(`Case ID: `, 310, metaStartY + 22, { continued: true }).font('Helvetica-Bold').text(reportData.caseId);
  doc.font('Helvetica').text(`Title: `, 310, metaStartY + 35, { continued: true }).text(reportData.caseTitle);
  doc.font('Helvetica').text(`Severity: `, 310, metaStartY + 48, { continued: true }).font('Helvetica-Bold').fillColor(reportData.severity === 'High' ? '#DC2626' : '#D97706').text(reportData.severity.toUpperCase());
  doc.fillColor('#334155').font('Helvetica').text(`Status: `, 310, metaStartY + 61, { continued: true }).font('Helvetica-Bold').text(reportData.status);

  doc.y = metaStartY + 85;

  // SECTION 1: CASE INFORMATION
  drawSectionTitle('1', 'Case Information');
  doc.fillColor('#334155').fontSize(8.5).font('Helvetica');
  const caseInfoItems = [
    ['Case Identifier:', reportData.caseId, 'Target Host:', reportData.targetHost || 'N/A'],
    ['Incident Classification:', reportData.reportType, 'Source IP:', reportData.sourceIP || 'N/A'],
    ['Investigation Status:', reportData.status, 'Destination IP:', reportData.destinationIP || 'N/A'],
    ['Assigned Investigator:', reportData.operatorName, 'Ingested Artifacts:', `${reportData.evidenceCount} items`]
  ];
  caseInfoItems.forEach(([k1, v1, k2, v2]) => {
    ensureSpace(14);
    const y = doc.y;
    doc.font('Helvetica-Bold').text(k1, 55, y, { width: 110 });
    doc.font('Helvetica').text(v1, 165, y, { width: 120 });
    doc.font('Helvetica-Bold').text(k2, 310, y, { width: 100 });
    doc.font('Helvetica').text(v2, 410, y, { width: 120 });
    doc.y = y + 13;
  });

  // SECTION 2: INCIDENT SUMMARY
  drawSectionTitle('2', 'Incident Summary & Scope');
  doc.fillColor('#334155').fontSize(8.5).font('Helvetica').text(
    reportData.caseDescription || 'No description recorded for this incident case.',
    55,
    doc.y,
    { width: contentWidth - 10, align: 'justify', lineHeight: 1.35 }
  );

  // SECTION 3: EVIDENCE SUMMARY & CRYPTOGRAPHIC INTEGRITY
  drawSectionTitle('3', 'Evidence Summary & Cryptographic Integrity');
  if (reportData.evidenceList && reportData.evidenceList.length > 0) {
    reportData.evidenceList.forEach((ev, idx) => {
      ensureSpace(42);
      const evBoxY = doc.y;
      doc.rect(55, evBoxY, contentWidth - 10, 36).fill('#F8FAFC');
      doc.rect(55, evBoxY, contentWidth - 10, 36).lineWidth(0.5).stroke('#E2E8F0');

      doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica-Bold').text(
        `Artifact ${idx + 1}: ${ev.originalName || ev.fileName}`,
        65,
        evBoxY + 5
      );
      doc.fillColor('#64748B').fontSize(7.5).font('Helvetica').text(
        `Type: ${ev.fileType || 'Forensic Log'}  |  Size: ${ev.fileSize ? (ev.fileSize / 1024).toFixed(1) + ' KB' : 'N/A'}  |  Status: Verified (Integrity Confirmed)`,
        65,
        evBoxY + 16
      );
      doc.fillColor('#0284C7').fontSize(7.5).font('Courier').text(
        `SHA-256: ${ev.sha256Hash || 'N/A'}`,
        65,
        evBoxY + 26
      );
      doc.y = evBoxY + 41;
    });
  } else {
    doc.fillColor('#64748B').fontSize(8.5).font('Helvetica-Oblique').text(
      'No evidence artifacts ingested for this incident case.',
      55,
      doc.y
    );
  }

  // SECTION 4: THREAT INDICATORS OF COMPROMISE (IOC FINDINGS)
  drawSectionTitle('4', `Threat Indicators of Compromise (${reportData.iocList?.length || 0} Detected)`);
  if (reportData.iocList && reportData.iocList.length > 0) {
    // Table Header
    ensureSpace(20);
    const thY = doc.y;
    doc.rect(55, thY, contentWidth - 10, 15).fill('#F1F5F9');
    doc.fillColor('#475569').fontSize(7.5).font('Helvetica-Bold');
    doc.text('Indicator Value', 65, thY + 4, { width: 220 });
    doc.text('Type', 285, thY + 4, { width: 70 });
    doc.text('Severity', 355, thY + 4, { width: 60 });
    doc.text('Provenance', 425, thY + 4, { width: 110 });
    doc.y = thY + 17;

    reportData.iocList.forEach((ioc) => {
      ensureSpace(16);
      const rowY = doc.y;
      doc.fillColor('#0F172A').fontSize(7.5).font('Courier').text(
        ioc.value,
        65,
        rowY + 2,
        { width: 215, ellipsis: true }
      );
      doc.fillColor('#475569').font('Helvetica').text(
        (ioc.type || 'Indicator').toUpperCase(),
        285,
        rowY + 2,
        { width: 65 }
      );
      const sevColor = ['Critical', 'High'].includes(ioc.severity) ? '#DC2626' : '#D97706';
      doc.fillColor(sevColor).font('Helvetica-Bold').text(
        ioc.severity || 'Medium',
        355,
        rowY + 2,
        { width: 55 }
      );
      doc.fillColor('#64748B').font('Helvetica').text(
        ioc.evidenceRefs?.[0]?.fileName || ioc.source || 'Evidence Extraction',
        425,
        rowY + 2,
        { width: 110, ellipsis: true }
      );
      doc.moveTo(55, rowY + 14).lineTo(pageWidth - 55, rowY + 14).lineWidth(0.5).stroke('#F1F5F9');
      doc.y = rowY + 15;
    });
  } else {
    doc.fillColor('#64748B').fontSize(8.5).font('Helvetica-Oblique').text(
      'No indicators of compromise (IOCs) detected for this case.',
      55,
      doc.y
    );
  }

  // SECTION 5: FORENSIC TIMELINE SEQUENCE
  drawSectionTitle('5', `Forensic Timeline Sequence (${reportData.timelineList?.length || 0} Events)`);
  if (reportData.timelineList && reportData.timelineList.length > 0) {
    reportData.timelineList.forEach((ev) => {
      ensureSpace(22);
      const evY = doc.y;
      const timeStr = ev.timestamp ? new Date(ev.timestamp).toISOString().replace('T', ' ').slice(0, 19) + ' UTC' : 'N/A';
      doc.fillColor('#0284C7').fontSize(7.5).font('Courier-Bold').text(timeStr, 55, evY, { width: 140 });
      doc.fillColor('#0F172A').fontSize(8).font('Helvetica-Bold').text(ev.title || ev.summary || ev.eventType, 195, evY, { width: contentWidth - 150 });
      if (ev.description) {
        doc.fillColor('#475569').fontSize(7.5).font('Helvetica').text(ev.description, 195, doc.y + 1, { width: contentWidth - 150, lineHeight: 1.2 });
      }
      doc.y += 4;
    });
  } else {
    doc.fillColor('#64748B').fontSize(8.5).font('Helvetica-Oblique').text(
      'No forensic timeline events recorded for this incident case.',
      55,
      doc.y
    );
  }

  // SECTION 6: MITRE ATT&CK FRAMEWORK CORRELATIONS
  drawSectionTitle('6', `MITRE ATT&CK Findings (${reportData.mitreList?.length || 0} Techniques)`);
  if (reportData.mitreList && reportData.mitreList.length > 0) {
    reportData.mitreList.forEach((m) => {
      ensureSpace(18);
      const mY = doc.y;
      doc.fillColor('#0284C7').fontSize(8).font('Helvetica-Bold').text(m.techniqueId, 55, mY, { width: 70 });
      doc.fillColor('#0F172A').font('Helvetica-Bold').text(m.techniqueName, 130, mY, { width: 180 });
      doc.fillColor('#64748B').font('Helvetica').text(`Tactic: ${m.tacticName || 'N/A'}`, 320, mY, { width: 120 });
      doc.fillColor('#10B981').font('Helvetica-Bold').text(`Conf: ${m.confidenceScore || 75}%`, 450, mY, { width: 80 });
      doc.y = mY + 14;
    });
  } else {
    doc.fillColor('#64748B').fontSize(8.5).font('Helvetica-Oblique').text(
      'No MITRE ATT&CK technique mappings correlated for this case.',
      55,
      doc.y
    );
  }

  // SECTION 7: COGNITIVE AI INVESTIGATION FINDINGS
  drawSectionTitle('7', 'Cognitive AI Investigation Findings');
  if (reportData.latestAiRun) {
    const ai = reportData.latestAiRun;
    ensureSpace(35);
    doc.rect(55, doc.y, contentWidth - 10, 20).fill('#EFF6FF');
    doc.fillColor('#1E40AF').fontSize(8).font('Helvetica-Bold').text(
      `LangGraph Multi-Stage Reasoning Run [${ai.runId}]  •  Model: ${ai.model || 'mistral:latest'}  •  Status: ${ai.status.toUpperCase()}  •  Duration: ${Math.round((ai.runDurationMs || 0) / 1000)}s`,
      65,
      doc.y - 15
    );
    doc.moveDown(0.6);

    doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica-Bold').text('Executive Narrative:');
    doc.fillColor('#334155').fontSize(8).font('Helvetica').text(
      ai.executiveSummary || 'No executive summary generated.',
      { width: contentWidth - 10, align: 'justify', lineHeight: 1.3 }
    );
    doc.moveDown(0.4);

    if (ai.hypotheses && ai.hypotheses.length > 0) {
      ensureSpace(25);
      doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica-Bold').text(`Validated Candidate Hypotheses (${ai.hypotheses.length}):`);
      ai.hypotheses.forEach((h, i) => {
        ensureSpace(28);
        doc.fillColor('#0284C7').fontSize(8).font('Helvetica-Bold').text(`${i + 1}. ${h.title} (Confidence: ${h.confidence?.score || 50}%)`, 65, doc.y);
        doc.fillColor('#334155').fontSize(7.5).font('Helvetica').text(h.statement, 65, doc.y, { width: contentWidth - 25, lineHeight: 1.25 });
        if (h.supportingEvidenceIds?.length > 0) {
          doc.fillColor('#64748B').fontSize(7).font('Courier').text(`Evidence Provenance: ${h.supportingEvidenceIds.join(', ')}`, 65, doc.y);
        }
        doc.moveDown(0.3);
      });
    }

    if (ai.evidenceGaps && ai.evidenceGaps.length > 0) {
      ensureSpace(25);
      doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica-Bold').text('Identified Visibility Blindspots & Gaps:');
      ai.evidenceGaps.forEach((g) => {
        ensureSpace(14);
        doc.fillColor('#B45309').fontSize(7.5).font('Helvetica').text(`• ${g}`, 65, doc.y, { width: contentWidth - 25 });
      });
      doc.moveDown(0.3);
    }
  } else {
    doc.fillColor('#64748B').fontSize(8.5).font('Helvetica-Oblique').text(
      'No AI investigation run has been executed for this incident case yet.',
      55,
      doc.y
    );
  }

  // SECTION 8: QUANTITATIVE RISK ASSESSMENT
  drawSectionTitle('8', 'Quantitative Risk Assessment');
  const sev = (reportData.severity || 'Medium').toLowerCase();
  const baseScore = sev === 'critical' ? 90 : sev === 'high' ? 75 : sev === 'medium' ? 50 : 25;
  const highIocs = (reportData.iocList || []).filter(i => ['High', 'Critical'].includes(i.severity)).length;
  const calcScore = Math.min(100, baseScore + Math.min(10, highIocs * 3));

  ensureSpace(40);
  const rY = doc.y;
  doc.rect(55, rY, contentWidth - 10, 32).fill('#F8FAFC');
  doc.rect(55, rY, contentWidth - 10, 32).lineWidth(0.5).stroke('#E2E8F0');

  doc.fillColor('#64748B').fontSize(7.5).font('Helvetica-Bold').text('OVERALL RISK SCORE', 65, rY + 6);
  doc.fillColor(calcScore >= 75 ? '#DC2626' : '#0284C7').fontSize(12).font('Helvetica-Bold').text(`${calcScore} / 100`, 65, rY + 16);

  doc.fillColor('#64748B').fontSize(7.5).font('Helvetica-Bold').text('THREAT LEVEL', 190, rY + 6);
  doc.fillColor(calcScore >= 75 ? '#DC2626' : '#0284C7').fontSize(10).font('Helvetica-Bold').text(reportData.severity.toUpperCase(), 190, rY + 18);

  doc.fillColor('#64748B').fontSize(7.5).font('Helvetica-Bold').text('ACTIVE INDICATORS', 300, rY + 6);
  doc.fillColor('#0F172A').fontSize(10).font('Helvetica-Bold').text(`${reportData.iocList?.length || 0}`, 300, rY + 18);

  doc.fillColor('#64748B').fontSize(7.5).font('Helvetica-Bold').text('CHRONOLOGICAL EVENTS', 410, rY + 6);
  doc.fillColor('#0F172A').fontSize(10).font('Helvetica-Bold').text(`${reportData.timelineList?.length || 0}`, 410, rY + 18);

  doc.y = rY + 38;

  // SECTION 9: ANALYST CONCLUSION & OFFICIAL SIGN-OFF
  drawSectionTitle('9', 'Analyst Conclusion & Official Sign-off');
  doc.fillColor('#334155').fontSize(8.5).font('Helvetica').text(
    reportData.analystConclusion || 'Investigation findings validated based on available cryptographic evidence and telemetry logs.',
    55,
    doc.y,
    { width: contentWidth - 10, align: 'justify', lineHeight: 1.35 }
  );
  doc.moveDown(0.8);

  ensureSpace(50);
  const signY = doc.y;
  doc.rect(55, signY, contentWidth - 10, 45).fill('#F8FAFC');
  doc.rect(55, signY, contentWidth - 10, 45).lineWidth(0.5).stroke('#E2E8F0');

  doc.fillColor('#0F172A').fontSize(7.5).font('Helvetica-Bold').text('LEAD INVESTIGATOR SIGN-OFF:', 65, signY + 7);
  doc.fillColor('#334155').fontSize(8).font('Helvetica').text(`${reportData.operatorName}  (${reportData.operatorEmail})`, 65, signY + 18);
  doc.fillColor('#64748B').fontSize(7).font('Helvetica').text(`Digital Verification Timestamp: ${new Date(reportData.createdAt).toUTCString()}`, 65, signY + 30);

  doc.fillColor('#0F172A').fontSize(7.5).font('Helvetica-Bold').text('VERIFICATION SIGNATURE:', 330, signY + 7);
  doc.moveTo(330, signY + 28).lineTo(pageWidth - 75, signY + 28).lineWidth(0.75).stroke('#94A3B8');
  doc.fillColor('#94A3B8').fontSize(6.5).font('Helvetica').text('Cryptographically Audited Report Document', 330, signY + 31);

  // --- FOOTERS & RUNNING HEADERS ON ALL BUFFERED PAGES ---
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);

    // Running Header on pages 2+
    if (i > 0) {
      doc.fillColor('#64748B').fontSize(7).font('Helvetica').text(
        `TRACE AI DFIR • Investigation Report: Case ${reportData.caseId}`,
        50,
        25,
        { width: contentWidth, align: 'left' }
      );
      doc.text(
        'CONFIDENTIAL // TLP:AMBER',
        50,
        25,
        { width: contentWidth, align: 'right' }
      );
      doc.moveTo(50, 35).lineTo(pageWidth - 50, 35).lineWidth(0.5).stroke('#E2E8F0');
    }

    // Running Footer on ALL pages
    const footerY = pageHeight - 35;
    doc.moveTo(50, footerY - 5).lineTo(pageWidth - 50, footerY - 5).lineWidth(0.5).stroke('#E2E8F0');
    doc.fillColor('#64748B').fontSize(7).font('Helvetica').text(
      `TRACE AI DFIR PLATFORM • Case [${reportData.caseId}] • Cryptographic Integrity Verified`,
      50,
      footerY,
      { width: contentWidth, align: 'left' }
    );
    doc.text(
      `Page ${i + 1} of ${range.count}`,
      50,
      footerY,
      { width: contentWidth, align: 'right' }
    );
  }

  doc.end();
  stream.on('finish', () => {
    console.log(`Report generated successfully: ${outputPath} (Pages: ${range.count})`);
    mongoose.disconnect();
  });
}

testGenerate().catch(err => {
  console.error(err);
  process.exit(1);
});
