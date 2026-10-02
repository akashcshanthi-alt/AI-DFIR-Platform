const crypto = require('crypto');
const TimelineEvent = require('../models/TimelineEvent');
const Evidence = require('../models/Evidence');
const IOC = require('../models/IOC');
const Case = require('../models/Case');
const AuditLog = require('../models/AuditLog');

const MONTH_NAMES = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
};

/**
 * -----------------------------------------------------------------------------
 * TIMESTAMP PARSING & UTC NORMALIZATION
 * -----------------------------------------------------------------------------
 */

/**
 * Parses and normalizes an evidence timestamp into UTC Date while tracking precision,
 * timezone status, and forensic warnings.
 *
 * Never invents a missing timestamp. Missing or invalid timestamps are returned
 * with isUndated: true.
 *
 * @param {string} rawString - Original timestamp extracted from evidence
 * @param {number} [referenceYear=2026] - Year to use if log format lacks year (e.g. Syslog)
 * @returns {Object} Normalized timestamp metadata
 */
function parseAndNormalizeTimestamp(rawString, referenceYear = 2026) {
  if (!rawString || typeof rawString !== 'string' || !rawString.trim()) {
    return {
      utcDate: null,
      originalTimestamp: '',
      timestampPrecision: 'undated',
      timezoneStatus: 'undated',
      isUndated: true,
      warnings: ['No timestamp found in evidence record; categorized as undated.']
    };
  }

  const clean = rawString.trim();
  const warnings = [];

  // 1. ISO 8601 (e.g. 2026-09-29T14:05:00Z or 2026-09-29 14:05:00+02:00 or 2026-09-29T14:05:00)
  const isoMatch = clean.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2}(?:\.\d+)?)(Z|[+-]\d{2}:?\d{2})?$/i);
  if (isoMatch) {
    const datePart = isoMatch[1];
    const timePart = isoMatch[2];
    const tzPart = isoMatch[3];

    let timezoneStatus = 'timezone_unknown';
    let isoFormattedString = `${datePart}T${timePart}`;

    if (tzPart) {
      if (tzPart.toUpperCase() === 'Z') {
        timezoneStatus = 'explicit_utc';
        isoFormattedString += 'Z';
      } else {
        timezoneStatus = 'offset_provided';
        isoFormattedString += tzPart.includes(':') ? tzPart : `${tzPart.slice(0, 3)}:${tzPart.slice(3)}`;
      }
    } else {
      timezoneStatus = 'timezone_unknown';
      isoFormattedString += 'Z'; // Normalize to UTC for deterministic ordering
      warnings.push('ISO 8601 timestamp lacks explicit timezone offset; normalized assuming UTC.');
    }

    const d = new Date(isoFormattedString);
    if (!isNaN(d.getTime())) {
      return {
        utcDate: d,
        originalTimestamp: clean,
        timestampPrecision: 'iso8601',
        timezoneStatus,
        isUndated: false,
        warnings
      };
    }
  }

  // 2. Syslog format: MMM DD HH:MM:SS (e.g. Sep 29 14:07:20)
  const syslogMatch = clean.match(/^([A-Z][a-z]{2})\s+(\d{1,2})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (syslogMatch) {
    const monthStr = syslogMatch[1].toLowerCase();
    const day = parseInt(syslogMatch[2], 10);
    const hour = parseInt(syslogMatch[3], 10);
    const min = parseInt(syslogMatch[4], 10);
    const sec = parseInt(syslogMatch[5], 10);

    if (monthStr in MONTH_NAMES && day >= 1 && day <= 31) {
      const monthIdx = MONTH_NAMES[monthStr];
      const utcMs = Date.UTC(referenceYear, monthIdx, day, hour, min, sec);
      const d = new Date(utcMs);

      warnings.push(`Syslog timestamp lacks year and timezone offset; normalized to UTC using year ${referenceYear}.`);

      return {
        utcDate: d,
        originalTimestamp: clean,
        timestampPrecision: 'syslog',
        timezoneStatus: 'timezone_unknown',
        isUndated: false,
        warnings
      };
    }
  }

  // 3. Common Log Format (CLF): DD/MMM/YYYY:HH:MM:SS [+-]HHMM (e.g. 29/Sep/2026:14:07:20 +0000)
  const clfMatch = clean.match(/^(\d{2})\/([A-Z][a-z]{2})\/(\d{4}):(\d{2}):(\d{2}):(\d{2})(?:\s+([+-]\d{4}))?$/);
  if (clfMatch) {
    const day = parseInt(clfMatch[1], 10);
    const monthStr = clfMatch[2].toLowerCase();
    const year = parseInt(clfMatch[3], 10);
    const hour = parseInt(clfMatch[4], 10);
    const min = parseInt(clfMatch[5], 10);
    const sec = parseInt(clfMatch[6], 10);
    const offset = clfMatch[7];

    if (monthStr in MONTH_NAMES) {
      const monthIdx = MONTH_NAMES[monthStr];
      let timezoneStatus = 'timezone_unknown';

      if (offset) {
        timezoneStatus = 'offset_provided';
        const sign = offset[0] === '-' ? -1 : 1;
        const offHours = parseInt(offset.slice(1, 3), 10);
        const offMins = parseInt(offset.slice(3, 5), 10);
        const totalOffsetMs = sign * (offHours * 60 + offMins) * 60 * 1000;
        const utcMs = Date.UTC(year, monthIdx, day, hour, min, sec) - totalOffsetMs;
        return {
          utcDate: new Date(utcMs),
          originalTimestamp: clean,
          timestampPrecision: 'clf',
          timezoneStatus,
          isUndated: false,
          warnings
        };
      } else {
        timezoneStatus = 'timezone_unknown';
        warnings.push('Common Log Format timestamp lacks explicit timezone offset; normalized assuming UTC.');
        const utcMs = Date.UTC(year, monthIdx, day, hour, min, sec);
        return {
          utcDate: new Date(utcMs),
          originalTimestamp: clean,
          timestampPrecision: 'clf',
          timezoneStatus,
          isUndated: false,
          warnings
        };
      }
    }
  }

  // 4. General Date Parser Fallback
  const generalDate = new Date(clean);
  if (!isNaN(generalDate.getTime())) {
    warnings.push('Timestamp parsed via general fallback; timezone integrity may be unverified.');
    return {
      utcDate: generalDate,
      originalTimestamp: clean,
      timestampPrecision: 'iso8601',
      timezoneStatus: clean.includes('Z') ? 'explicit_utc' : 'timezone_unknown',
      isUndated: false,
      warnings
    };
  }

  // 5. Malformed / Unparseable
  return {
    utcDate: null,
    originalTimestamp: clean,
    timestampPrecision: 'undated',
    timezoneStatus: 'undated',
    isUndated: true,
    warnings: ['Malformed or unrecognized timestamp format in evidence record; marked as undated.']
  };
}

/**
 * -----------------------------------------------------------------------------
 * EVENT TYPE & SEVERITY CLASSIFICATION
 * -----------------------------------------------------------------------------
 */

/**
 * Classifies the event type, severity, confidence, and generated description from evidence.
 */
function classifyEventDetails(rawText, details = {}) {
  const text = (rawText || '').toLowerCase();
  let eventType = 'SYSTEM';
  let description = 'System Telemetry Event';
  let severity = 'Low';
  let confidence = 'Medium';
  let confidenceScore = 50;
  const ruleMatches = [];

  // Check 1: Authentication Events
  if (/(?:sshd|password|login|logoff|logon|auth-srv|authentication|sudo|su\b|unauthorized)/i.test(text)) {
    eventType = 'AUTH';
    if (/failed\s+password|invalid\s+user|unauthorized|access\s+denied|brute/i.test(text)) {
      severity = 'High';
      confidence = 'High';
      confidenceScore = 80;
      description = 'Authentication Failure / Unauthorized Login Attempt';
      ruleMatches.push({
        ruleId: 'RULE-TIMELINE-AUTH-FAIL',
        ruleName: 'Failed Authentication Attempt',
        rationale: 'Evidence record details rejected or unauthorized authentication activity.'
      });
    } else {
      severity = 'Informational';
      confidence = 'High';
      confidenceScore = 90;
      description = 'Authentication Session Activity';
      ruleMatches.push({
        ruleId: 'RULE-TIMELINE-AUTH-SUCCESS',
        ruleName: 'Standard Authentication Session',
        rationale: 'Baseline authentication or session lifecycle event.'
      });
    }
  }
  // Check 2: Process Execution
  else if (/(?:powershell|cmd\.exe|bash|sh\b|process|image|command|whoami\.exe|certutil|rundll32)/i.test(text)) {
    eventType = 'PROCESS';
    if (/powershell|cmd\.exe|whoami\.exe|certutil|mimikatz/i.test(text)) {
      severity = 'High';
      confidence = 'High';
      confidenceScore = 75;
      description = 'Execution of System Binary / Script Interpreter';
      ruleMatches.push({
        ruleId: 'RULE-TIMELINE-EXEC-LOLBAS',
        ruleName: 'System Shell / Execution Tool Invocation',
        rationale: 'Evidence record references execution of command-line interpreter or sensitive system binary.'
      });
    } else {
      severity = 'Low';
      confidence = 'Medium';
      confidenceScore = 50;
      description = 'Process Lifecycle Activity';
    }
  }
  // Check 3: Network Activity
  else if (/(?:firewall|connect|blocked|outbound|inbound|http|https|get |post |port\s+\d+|traffic)/i.test(text)) {
    eventType = 'NETWORK';
    if (/blocked\s+outbound|firewall:\s*blocked|connection\s+refused|payload\.sh|drop/i.test(text)) {
      severity = 'High';
      confidence = 'High';
      confidenceScore = 80;
      description = 'Suspicious or Blocked Network Transmission';
      ruleMatches.push({
        ruleId: 'RULE-TIMELINE-NET-BLOCKED',
        ruleName: 'Network Boundary Violation / Blocked Flow',
        rationale: 'Firewall or gateway record indicates dropped or suspicious outbound network connection.'
      });
    } else {
      severity = 'Low';
      confidence = 'Medium';
      confidenceScore = 40;
      description = 'Network Communication Telemetry';
    }
  }
  // Check 4: Exploit / Threat Alert
  else if (/(?:sqli|union\s+select|eval\(|mimikatz|exfiltration|ransomware|c2|beacon)/i.test(text)) {
    eventType = 'ALERT';
    severity = 'Critical';
    confidence = 'High';
    confidenceScore = 90;
    description = 'High-Confidence Threat Indicator Observed';
    ruleMatches.push({
      ruleId: 'RULE-TIMELINE-CRITICAL-ALERT',
      ruleName: 'Critical Threat Pattern Detection',
      rationale: 'Evidence record contains signature patterns matching exploitation, credential theft, or beaconing.'
    });
  }
  // Check 5: File Operations
  else if (/(?:download|upload|wrote|deleted\s+file|created\s+file|file_access)/i.test(text)) {
    eventType = 'FILE';
    severity = 'Low';
    confidence = 'Medium';
    confidenceScore = 50;
    description = 'Filesystem I/O Activity';
  }
  // Check 6: System / Healthcheck
  else if (/(?:healthcheck|internal-probe|daemon|kernel|service\s+status|boot)/i.test(text)) {
    eventType = 'SYSTEM';
    severity = 'Informational';
    confidence = 'High';
    confidenceScore = 90;
    description = 'System Health & Maintenance Activity';
    ruleMatches.push({
      ruleId: 'RULE-TIMELINE-SYS-BASELINE',
      ruleName: 'Routine System Telemetry',
      rationale: 'Internal operational probe or baseline maintenance event.'
    });
  }

  // Refine description with structured details if available
  if (details && typeof details === 'object') {
    if (details.user && details.ip) {
      description = `${description} (${details.user} from ${details.ip})`;
    } else if (details.process) {
      description = `${description} [${details.process}]`;
    }
  }

  return {
    eventType,
    description,
    severity,
    confidence,
    confidenceScore,
    ruleMatches
  };
}

/**
 * Generates a deterministic deduplication key for a timeline event.
 */
function createDeduplicationKey(evidenceId, lineOrRecord, rawExcerpt) {
  const excerptHash = crypto.createHash('md5').update(rawExcerpt || '').digest('hex').slice(0, 16);
  return `${evidenceId}:${lineOrRecord || 'meta'}:${excerptHash}`;
}

/**
 * -----------------------------------------------------------------------------
 * TIMELINE GENERATION ENGINE
 * -----------------------------------------------------------------------------
 */

/**
 * Deterministically generates or refreshes the forensic timeline for a case.
 * Aggregates evidence records, acquisition timestamps, and correlated IOCs.
 *
 * Guaranteed to be idempotent and repeatable.
 *
 * @param {string} caseId - Sequential case identifier (e.g. DF-1001)
 * @param {Object} options - { user?: Object }
 * @returns {Promise<Object>} Timeline generation metrics summary
 */
async function generateCaseTimeline(caseId, options = {}) {
  const { user = null } = options;

  // 1. Verify case existence
  const caseDoc = await Case.findOne({ caseId });
  if (!caseDoc) {
    throw new Error(`Case [${caseId}] not found in database.`);
  }

  // 2. Fetch all evidence items and detected IOCs for this case
  const [evidenceList, iocList] = await Promise.all([
    Evidence.find({ caseId }),
    IOC.find({ caseId })
  ]);

  const candidateEvents = [];

  // Helper: map of IOCs by normalized value for correlation lookup
  const iocMap = new Map();
  iocList.forEach(ioc => {
    iocMap.set(ioc.normalizedValue.toLowerCase(), ioc);
    if (ioc.value && ioc.value.toLowerCase() !== ioc.normalizedValue.toLowerCase()) {
      iocMap.set(ioc.value.toLowerCase(), ioc);
    }
  });

  // 3. Process Evidence Acquisition Events (Chain of Custody / Ingestion)
  for (const ev of evidenceList) {
    const tsMeta = parseAndNormalizeTimestamp(ev.uploadedAt ? ev.uploadedAt.toISOString() : null);
    const excerpt = `Evidence file ingested: ${ev.originalName} (${ev.fileSize} bytes, SHA-256: ${ev.sha256Hash || 'N/A'})`;
    const dedupKey = createDeduplicationKey(ev.evidenceId, 'ingest', excerpt);

    candidateEvents.push({
      caseId,
      case: caseDoc._id,
      deduplicationKey: dedupKey,
      timestamp: tsMeta.utcDate,
      originalTimestamp: tsMeta.originalTimestamp,
      timestampPrecision: tsMeta.timestampPrecision,
      timezoneStatus: tsMeta.timezoneStatus,
      isUndated: tsMeta.isUndated,
      eventType: 'EVIDENCE_INGESTED',
      description: `Evidence Acquisition: ${ev.originalName} (${ev.relativePath || 'root'})`,
      severity: 'Informational',
      confidence: 'High',
      confidenceScore: 100,
      source: {
        evidenceId: ev.evidenceId,
        evidence: ev._id,
        fileName: ev.originalName || ev.fileName,
        relativePath: ev.relativePath || ev.originalName || ev.fileName,
        lineNumber: null,
        recordIndex: null
      },
      relatedIocs: [],
      rawExcerpt: excerpt,
      provenanceWarnings: tsMeta.warnings,
      ruleMatches: [{
        ruleId: 'RULE-TIMELINE-INGESTION',
        ruleName: 'Forensic Acquisition Record',
        rationale: 'Official evidence intake event logged in chain of custody.'
      }]
    });

    // 4. Process Parsed Forensic Records within this Evidence Item
    if (ev.parsing && Array.isArray(ev.parsing.records)) {
      for (let rIdx = 0; rIdx < ev.parsing.records.length; rIdx++) {
        const rec = ev.parsing.records[rIdx];
        const rawText = rec.raw || (rec.details ? JSON.stringify(rec.details) : '');
        const excerptBounded = rawText.length > 500 ? rawText.slice(0, 500) + '...' : rawText;

        // Parse timestamp
        const tsMetaRecord = parseAndNormalizeTimestamp(rec.timestamp || null);

        // Classify event type and baseline severity
        const classification = classifyEventDetails(rawText, rec.details);

        // Correlate with detected IOCs
        const correlatedIocs = [];
        const lowerRaw = rawText.toLowerCase();

        for (const [val, ioc] of iocMap.entries()) {
          if (lowerRaw.includes(val)) {
            // Avoid duplicate IOC links
            if (!correlatedIocs.some(ci => ci.iocId === ioc.iocId)) {
              correlatedIocs.push({
                iocId: ioc.iocId,
                indicatorType: ioc.indicatorType,
                normalizedValue: ioc.normalizedValue,
                severity: ioc.severity
              });

              // Severity escalation if IOC is Critical or High
              if (ioc.severity === 'Critical') {
                classification.severity = 'Critical';
                classification.confidenceScore = Math.max(classification.confidenceScore, 90);
              } else if (ioc.severity === 'High' && classification.severity !== 'Critical') {
                classification.severity = 'High';
                classification.confidenceScore = Math.max(classification.confidenceScore, 80);
              }
            }
          }
        }

        const dedupKeyRecord = createDeduplicationKey(
          ev.evidenceId,
          rec.lineNumber || (rIdx + 1),
          excerptBounded
        );

        candidateEvents.push({
          caseId,
          case: caseDoc._id,
          deduplicationKey: dedupKeyRecord,
          timestamp: tsMetaRecord.utcDate,
          originalTimestamp: tsMetaRecord.originalTimestamp,
          timestampPrecision: tsMetaRecord.timestampPrecision,
          timezoneStatus: tsMetaRecord.timezoneStatus,
          isUndated: tsMetaRecord.isUndated,
          eventType: classification.eventType,
          description: classification.description,
          severity: classification.severity,
          confidence: classification.confidence,
          confidenceScore: classification.confidenceScore,
          source: {
            evidenceId: ev.evidenceId,
            evidence: ev._id,
            fileName: ev.originalName || ev.fileName,
            relativePath: ev.relativePath || ev.originalName || ev.fileName,
            lineNumber: rec.lineNumber || null,
            recordIndex: rIdx + 1
          },
          relatedIocs: correlatedIocs,
          rawExcerpt: excerptBounded,
          provenanceWarnings: tsMetaRecord.warnings,
          ruleMatches: classification.ruleMatches
        });
      }
    }
  }

  // 5. Query latest sequential TLE-XXXX ID sequence for safe sequential ID generation
  const lastEvent = await TimelineEvent.findOne({}, { eventId: 1 }, { sort: { eventId: -1 } });
  let nextSeq = 1001;
  if (lastEvent && lastEvent.eventId) {
    const m = lastEvent.eventId.match(/TLE-(\d+)/);
    if (m) nextSeq = parseInt(m[1], 10) + 1;
  }

  let newCount = 0;
  let updatedCount = 0;
  let datedCount = 0;
  let undatedCount = 0;

  // 6. Idempotently upsert timeline events
  for (const item of candidateEvents) {
    if (item.isUndated) {
      undatedCount++;
    } else {
      datedCount++;
    }

    let existingEvent = await TimelineEvent.findOne({
      caseId,
      deduplicationKey: item.deduplicationKey
    });

    if (existingEvent) {
      // Update fields
      existingEvent.timestamp = item.timestamp;
      existingEvent.originalTimestamp = item.originalTimestamp;
      existingEvent.timestampPrecision = item.timestampPrecision;
      existingEvent.timezoneStatus = item.timezoneStatus;
      existingEvent.isUndated = item.isUndated;
      existingEvent.eventType = item.eventType;
      existingEvent.description = item.description;
      existingEvent.severity = item.severity;
      existingEvent.confidence = item.confidence;
      existingEvent.confidenceScore = item.confidenceScore;
      existingEvent.source = item.source;
      existingEvent.relatedIocs = item.relatedIocs;
      existingEvent.rawExcerpt = item.rawExcerpt;
      existingEvent.provenanceWarnings = item.provenanceWarnings;
      existingEvent.ruleMatches = item.ruleMatches;

      await existingEvent.save();
      updatedCount++;
    } else {
      // Create new event
      existingEvent = new TimelineEvent({
        eventId: `TLE-${nextSeq++}`,
        ...item
      });

      await existingEvent.save();
      newCount++;
    }
  }

  // 7. Record Audit Log entry
  try {
    const auditDesc = `Generated timeline for Case [${caseId}]. Total events: ${candidateEvents.length} (${datedCount} dated, ${undatedCount} undated). New: ${newCount}, Updated: ${updatedCount}.`;
    await AuditLog.create({
      action: 'GENERATE_TIMELINE',
      module: 'TIMELINE_ENGINE',
      user: user?.username || user?.email || 'Authenticated Analyst',
      description: auditDesc,
      details: auditDesc,
      ip: '127.0.0.1',
      severity: 'Low',
      status: 'Success'
    });
  } catch (auditErr) {
    console.warn('[Audit Log Warning] Failed to log timeline generation:', auditErr.message);
  }

  return {
    success: true,
    caseId,
    totalEvents: candidateEvents.length,
    datedEvents: datedCount,
    undatedEvents: undatedCount,
    newEvents: newCount,
    updatedEvents: updatedCount
  };
}

module.exports = {
  parseAndNormalizeTimestamp,
  classifyEventDetails,
  createDeduplicationKey,
  generateCaseTimeline
};
