const mongoose = require('mongoose');
const IOC = require('../models/IOC');
const Case = require('../models/Case');
const Evidence = require('../models/Evidence');

// Severity levels ordered by priority
const SEVERITY_WEIGHTS = {
  'Informational': 1,
  'Low': 2,
  'Medium': 3,
  'High': 4,
  'Critical': 5
};

const SEVERITY_NAMES = ['Informational', 'Low', 'Medium', 'High', 'Critical'];

// Suspicious execution / attack keywords in log context
const SUSPICIOUS_CONTEXT_REGEX = /\b(failed\s+password|invalid\s+user|unauthorized|access\s+denied|brute\s*force|sqli|union\s+select|eval\(|base64|mimikatz|powershell|cmd\.exe|whoami\.exe|certutil|netcat|nc\.exe|\/etc\/shadow|\/etc\/passwd|exfiltration|ransomware|c2|beacon)\b/i;

// Abused or Dynamic DNS TLDs / services
const SUSPICIOUS_DOMAINS_REGEX = /\.(duckdns\.org|ngrok\.io|onion|top|xyz|tk|ml|ga|cf|gq|work|click|link|buzz|monster)$/i;

// Internal / Private Domain extensions
const INTERNAL_DOMAINS_REGEX = /\.(local|internal|corp|lan|home|intra)$/i;

// Suspicious URL payload extensions or patterns
const SUSPICIOUS_URL_REGEX = /\.(sh|exe|bat|ps1|vbs|elf|bin|dll|scr|hta)(\?.*)?$/i;

// Known LOLBAS or sensitive execution processes
const EXEC_TOOLS_REGEX = /\b(powershell\.exe|cmd\.exe|certutil\.exe|whoami\.exe|mimikatz\.exe|net\.exe|rundll32\.exe|cscript\.exe|wscript\.exe|bitsadmin\.exe)\b/i;

/**
 * -----------------------------------------------------------------------------
 * NORMALIZATION FUNCTIONS
 * -----------------------------------------------------------------------------
 */

/**
 * Normalizes an IPv4 address:
 * - Trims whitespace
 * - Removes square brackets if defanged (e.g. [192.168.1.1])
 * - Removes port (e.g. 192.168.1.1:8080 -> 192.168.1.1)
 * - Removes leading zeroes in octets (e.g. 192.168.001.001 -> 192.168.1.1)
 * - Validates standard 4-octet IPv4 range (0-255).
 * Returns canonical string or null if invalid.
 */
function normalizeIpv4(rawIp) {
  if (!rawIp || typeof rawIp !== 'string') return null;
  let clean = rawIp.trim().replace(/^\[|\]$/g, '');
  
  // Strip trailing port if present (e.g., 10.0.0.1:443)
  if (clean.includes(':')) {
    clean = clean.split(':')[0];
  }

  // Validate format
  const parts = clean.split('.');
  if (parts.length !== 4) return null;

  const normalizedParts = [];
  for (const part of parts) {
    if (!/^\d+$/.test(part)) return null;
    const num = parseInt(part, 10);
    if (num < 0 || num > 255) return null;
    normalizedParts.push(String(num));
  }

  return normalizedParts.join('.');
}

/**
 * Classifies an IPv4 address into networking scope:
 * 'private' | 'public' | 'loopback' | 'link-local' | 'multicast' | 'reserved' | 'invalid'
 */
function classifyIpv4(ip) {
  const norm = normalizeIpv4(ip);
  if (!norm) return 'invalid';

  const [o1, o2] = norm.split('.').map(Number);

  // Loopback (127.0.0.0/8)
  if (o1 === 127) return 'loopback';

  // Reserved/Unspecified (0.0.0.0/8 or 255.255.255.255)
  if (o1 === 0 || norm === '255.255.255.255') return 'reserved';

  // RFC 1918 Private:
  // 10.0.0.0/8
  if (o1 === 10) return 'private';
  // 172.16.0.0/12 (172.16.x.x - 172.31.x.x)
  if (o1 === 172 && o2 >= 16 && o2 <= 31) return 'private';
  // 192.168.0.0/16
  if (o1 === 192 && o2 === 168) return 'private';

  // Link-Local (169.254.0.0/16)
  if (o1 === 169 && o2 === 254) return 'link-local';

  // Multicast (224.0.0.0/4 -> 224 - 239)
  if (o1 >= 224 && o1 <= 239) return 'multicast';

  // Public routable
  return 'public';
}

/**
 * Normalizes a Domain:
 * - Defangs [.] -> .
 * - Lowercases
 * - Strips protocol scheme (http://, https://) if present
 * - Strips port / path / trailing dot
 */
function normalizeDomain(rawDomain) {
  if (!rawDomain || typeof rawDomain !== 'string') return null;
  let clean = rawDomain.trim().replace(/\[\.\]/g, '.').toLowerCase();

  // If passed with protocol, strip it
  clean = clean.replace(/^[a-z]+:\/\//, '');

  // Strip trailing path or queries
  clean = clean.split('/')[0].split('?')[0];

  // Strip port
  clean = clean.split(':')[0];

  // Strip trailing dot
  clean = clean.replace(/\.+$/, '');

  // Reject if looks like an IP address
  if (normalizeIpv4(clean)) return null;

  // Domain must contain at least one dot and valid characters
  if (!clean.includes('.') || !/^[a-z0-9_.-]+$/.test(clean)) return null;

  // Ignore bare file extensions
  if (['txt', 'log', 'csv', 'json', 'jsonl', 'syslog', 'bin', 'raw', 'pcap', 'exe'].includes(clean)) {
    return null;
  }

  return clean;
}

/**
 * Normalizes a URL:
 * - Defangs hxxp:// -> http://, hxxps:// -> https://, [.] -> .
 * - Lowercases scheme and hostname
 * - Preserves path casing
 */
function normalizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  let clean = rawUrl.trim()
    .replace(/\[\.\]/g, '.')
    .replace(/^hxxp:\/\//i, 'http://')
    .replace(/^hxxps:\/\//i, 'https://');

  try {
    const parsed = new URL(clean);
    // Canonical format: protocol + '//' + lowercase host (including non-default port) + path
    return `${parsed.protocol}//${parsed.host.toLowerCase()}${parsed.pathname}${parsed.search}`;
  } catch (e) {
    // If not parseable as full URL, try fallback
    if (/^https?:\/\//i.test(clean)) {
      return clean.toLowerCase();
    }
    return null;
  }
}

/**
 * Normalizes an Email:
 * - Lowercases and trims
 * - Validates standard user@domain.tld
 */
function normalizeEmail(rawEmail) {
  if (!rawEmail || typeof rawEmail !== 'string') return null;
  const clean = rawEmail.trim().toLowerCase();
  if (/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(clean)) {
    return clean;
  }
  return null;
}

/**
 * Normalizes a Cryptographic Hash:
 * - Lowercases hex string
 * - Validates exact length for type
 */
function normalizeHash(rawHash, expectedType) {
  if (!rawHash || typeof rawHash !== 'string') return null;
  const clean = rawHash.trim().toLowerCase();
  if (!/^[0-9a-f]+$/.test(clean)) return null;

  if (expectedType === 'md5' && clean.length === 32) return clean;
  if (expectedType === 'sha1' && clean.length === 40) return clean;
  if (expectedType === 'sha256' && clean.length === 64) return clean;

  return null;
}

/**
 * -----------------------------------------------------------------------------
 * RULE-BASED SEVERITY & CONFIDENCE EVALUATION ENGINE
 * -----------------------------------------------------------------------------
 */

/**
 * Evaluates documented, transparent rules against an indicator and its evidence context.
 * Does NOT label an indicator malicious solely because it appears in a log file.
 */
function evaluateIndicatorRules(indicatorType, normalizedValue, ipClassification, contextSnippets = []) {
  const ruleMatches = [];
  const combinedContext = contextSnippets.join(' ');
  const hasSuspiciousContext = SUSPICIOUS_CONTEXT_REGEX.test(combinedContext);
  const hasExecTools = EXEC_TOOLS_REGEX.test(combinedContext);

  let confidenceScore = 50;

  switch (indicatorType) {
    case 'ipv4': {
      if (ipClassification === 'private') {
        ruleMatches.push({
          ruleId: 'RULE-IP-RFC1918',
          ruleName: 'RFC 1918 Private IPv4 Address',
          description: 'Internal non-routable private address (10.0.0.0/8, 172.16.0.0/12, or 192.168.0.0/16). Expected internal enterprise network telemetry.',
          severity: 'Informational',
          confidence: 'High'
        });
        confidenceScore = 95;
      } else if (ipClassification === 'loopback') {
        ruleMatches.push({
          ruleId: 'RULE-IP-LOOPBACK',
          ruleName: 'Loopback Host Address',
          description: 'Localhost address (127.0.0.0/8). Local inter-process or self-diagnostic traffic.',
          severity: 'Informational',
          confidence: 'High'
        });
        confidenceScore = 100;
      } else if (ipClassification === 'reserved' || ipClassification === 'link-local') {
        ruleMatches.push({
          ruleId: 'RULE-IP-RESERVED-OR-LOCAL',
          ruleName: 'Reserved or Link-Local Network Address',
          description: 'Special-use broadcast, link-local, or reserved network address.',
          severity: 'Informational',
          confidence: 'High'
        });
        confidenceScore = 90;
      } else if (ipClassification === 'public') {
        if (hasSuspiciousContext) {
          ruleMatches.push({
            ruleId: 'RULE-IP-AUTH-FAIL-CONTEXT',
            ruleName: 'Public IPv4 Associated with High-Risk Activity',
            description: 'Publicly routable IPv4 address observed in evidence records with authentication failures, brute-force indicators, or unauthorized access attempts.',
            severity: 'High',
            confidence: 'High'
          });
          confidenceScore = 80;
        } else {
          ruleMatches.push({
            ruleId: 'RULE-IP-PUBLIC-ROUTABLE',
            ruleName: 'Public Routable IPv4 Address',
            description: 'External Internet-routable IPv4 address observed in evidence telemetry. Neutral baseline finding.',
            severity: 'Low',
            confidence: 'Low'
          });
          confidenceScore = 35;
        }
      }
      break;
    }

    case 'url': {
      let isRawIpHost = false;
      try {
        const parsed = new URL(normalizedValue);
        if (normalizeIpv4(parsed.hostname)) {
          isRawIpHost = true;
        }
      } catch (e) {}

      if (isRawIpHost) {
        ruleMatches.push({
          ruleId: 'RULE-URL-RAW-IP-HOST',
          ruleName: 'URL Hosted Directly on Raw IP Address',
          description: 'URL references a host by unmapped IP address rather than standard domain name. Common indicator in malware staging and C2 callbacks.',
          severity: 'High',
          confidence: 'High'
        });
        confidenceScore = 85;
      }

      if (SUSPICIOUS_URL_REGEX.test(normalizedValue)) {
        ruleMatches.push({
          ruleId: 'RULE-URL-SUSPICIOUS-PAYLOAD',
          ruleName: 'URL Referencing Executable or Script Payload',
          description: 'URL target ends in executable or script extension (.sh, .exe, .bat, .ps1, .vbs, .elf).',
          severity: 'High',
          confidence: 'High'
        });
        confidenceScore = 85;
      }

      if (ruleMatches.length === 0) {
        ruleMatches.push({
          ruleId: 'RULE-URL-STANDARD',
          ruleName: 'Observed Web URL Reference',
          description: 'Standard HTTP/HTTPS URL observed in evidence records. Neutral baseline finding.',
          severity: 'Informational',
          confidence: 'Low'
        });
        confidenceScore = 30;
      }
      break;
    }

    case 'domain': {
      if (INTERNAL_DOMAINS_REGEX.test(normalizedValue)) {
        ruleMatches.push({
          ruleId: 'RULE-DOMAIN-INTERNAL',
          ruleName: 'Internal Enterprise Domain',
          description: 'Internal domain suffix (.local, .internal, .corp, .lan). Benign internal infrastructure.',
          severity: 'Informational',
          confidence: 'High'
        });
        confidenceScore = 90;
      } else if (SUSPICIOUS_DOMAINS_REGEX.test(normalizedValue)) {
        ruleMatches.push({
          ruleId: 'RULE-DOMAIN-DYNAMIC-OR-ABUSED',
          ruleName: 'Dynamic DNS or High-Abuse TLD Domain',
          description: 'Domain utilizes dynamic DNS (e.g. .duckdns.org, .ngrok.io) or frequently abused TLD (.xyz, .top, .onion).',
          severity: 'Medium',
          confidence: 'Medium'
        });
        confidenceScore = 65;
      } else {
        ruleMatches.push({
          ruleId: 'RULE-DOMAIN-STANDARD',
          ruleName: 'Standard Registered Domain',
          description: 'Standard domain name observed in forensic evidence. Neutral baseline finding.',
          severity: 'Informational',
          confidence: 'Low'
        });
        confidenceScore = 30;
      }
      break;
    }

    case 'email': {
      if (normalizedValue.endsWith('@trace.ai') || INTERNAL_DOMAINS_REGEX.test(normalizedValue.split('@')[1] || '')) {
        ruleMatches.push({
          ruleId: 'RULE-EMAIL-INTERNAL',
          ruleName: 'Internal Organization Email',
          description: 'Email identity matching internal domain. Benign operational identity.',
          severity: 'Informational',
          confidence: 'High'
        });
        confidenceScore = 90;
      } else {
        ruleMatches.push({
          ruleId: 'RULE-EMAIL-EXTERNAL',
          ruleName: 'External Email Address',
          description: 'External email identity observed in communications or log records.',
          severity: 'Low',
          confidence: 'Low'
        });
        confidenceScore = 40;
      }
      break;
    }

    case 'md5':
    case 'sha1':
    case 'sha256': {
      if (hasExecTools) {
        ruleMatches.push({
          ruleId: 'RULE-HASH-EXEC-CONTEXT',
          ruleName: 'Cryptographic Hash in Execution Tool Context',
          description: `Cryptographic ${indicatorType.toUpperCase()} hash associated with system binary, script engine, or execution activity (${EXEC_TOOLS_REGEX.source}).`,
          severity: 'High',
          confidence: 'High'
        });
        confidenceScore = 75;
      } else {
        ruleMatches.push({
          ruleId: 'RULE-HASH-BASELINE',
          ruleName: `Cryptographic File Hash (${indicatorType.toUpperCase()})`,
          description: `Exact cryptographic ${indicatorType.toUpperCase()} digest extracted from evidence file or metadata. Neutral baseline indicator.`,
          severity: 'Low',
          confidence: 'Medium'
        });
        confidenceScore = 55;
      }
      break;
    }
  }

  // Derive maximum severity
  let maxSeverity = 'Informational';
  let maxWeight = 1;
  for (const match of ruleMatches) {
    const weight = SEVERITY_WEIGHTS[match.severity] || 1;
    if (weight > maxWeight) {
      maxWeight = weight;
      maxSeverity = match.severity;
    }
  }

  // Derive confidence category
  const confidenceCategory = confidenceScore >= 70 ? 'High' : confidenceScore >= 40 ? 'Medium' : 'Low';

  return {
    ruleMatches,
    severity: maxSeverity,
    confidence: confidenceCategory,
    confidenceScore
  };
}

/**
 * -----------------------------------------------------------------------------
 * DETECTION ENGINE CORE
 * -----------------------------------------------------------------------------
 */

/**
 * Helper to safely extract a Date object from evidence timestamps
 */
function parseEvidenceTimestamp(ts) {
  if (!ts) return null;
  const d = new Date(ts);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Runs IOC Detection across all persisted evidence items for a given case.
 * Guaranteed to be idempotent and repeatable.
 *
 * @param {string} caseId - Sequential case identifier (e.g. DF-1001)
 * @param {Object} options - { batchId?: string, user?: Object }
 * @returns {Promise<Object>} Detection results summary
 */
async function runCaseDetection(caseId, options = {}) {
  const { batchId = null, user = null } = options;

  // 1. Verify case existence
  const caseDoc = await Case.findOne({ caseId });
  if (!caseDoc) {
    throw new Error(`Case [${caseId}] not found in database.`);
  }

  // 2. Fetch evidence for this case
  const evidenceQuery = { caseId };
  if (batchId) {
    evidenceQuery.batchId = batchId;
  }
  const evidenceList = await Evidence.find(evidenceQuery);

  if (evidenceList.length === 0) {
    return {
      success: true,
      caseId,
      batchId,
      totalEvidenceScanned: 0,
      totalDetected: 0,
      newIndicators: 0,
      updatedIndicators: 0,
      iocs: []
    };
  }

  // 3. Collect and normalize all candidate indicators with provenance
  // Key format: `${indicatorType}:${normalizedValue}`
  const indicatorMap = new Map();

  function registerCandidate(type, rawVal, ref) {
    if (!rawVal || typeof rawVal !== 'string') return;
    let normalized = null;
    let ipClass = 'none';

    switch (type) {
      case 'ipv4':
        normalized = normalizeIpv4(rawVal);
        if (normalized) ipClass = classifyIpv4(normalized);
        break;
      case 'domain':
        normalized = normalizeDomain(rawVal);
        break;
      case 'url':
        normalized = normalizeUrl(rawVal);
        break;
      case 'email':
        normalized = normalizeEmail(rawVal);
        break;
      case 'md5':
        normalized = normalizeHash(rawVal, 'md5');
        break;
      case 'sha1':
        normalized = normalizeHash(rawVal, 'sha1');
        break;
      case 'sha256':
        normalized = normalizeHash(rawVal, 'sha256');
        break;
    }

    if (!normalized) return;

    const key = `${type}:${normalized}`;
    if (!indicatorMap.has(key)) {
      indicatorMap.set(key, {
        indicatorType: type,
        value: rawVal,
        normalizedValue: normalized,
        ipClassification: ipClass,
        evidenceBatch: ref.batchId || batchId || '',
        evidenceReferences: [],
        timestamps: [],
        contexts: []
      });
    }

    const entry = indicatorMap.get(key);
    if (ref) {
      entry.evidenceReferences.push({
        evidenceId: ref.evidenceId,
        evidence: ref.evidenceObjectId,
        fileName: ref.fileName,
        relativePath: ref.relativePath || '',
        lineNumber: ref.lineNumber || null,
        recordIndex: ref.recordIndex || null,
        timestamp: ref.timestamp || null,
        context: ref.context ? String(ref.context).substring(0, 300) : ''
      });

      if (ref.timestamp) {
        const d = parseEvidenceTimestamp(ref.timestamp);
        if (d) entry.timestamps.push(d);
      }
      if (ref.context) {
        entry.contexts.push(ref.context);
      }
    }
  }

  // 4. Traverse evidence documents
  for (const ev of evidenceList) {
    const evRefBase = {
      evidenceId: ev.evidenceId,
      evidenceObjectId: ev._id,
      fileName: ev.fileName,
      relativePath: ev.relativePath || ev.fileName,
      batchId: ev.batchId
    };

    // A. File-level hashes
    if (ev.md5Hash) {
      registerCandidate('md5', ev.md5Hash, {
        ...evRefBase,
        lineNumber: null,
        recordIndex: null,
        timestamp: ev.uploadedAt,
        context: `File MD5 hash for evidence file: ${ev.originalName}`
      });
    }
    if (ev.sha1Hash) {
      registerCandidate('sha1', ev.sha1Hash, {
        ...evRefBase,
        lineNumber: null,
        recordIndex: null,
        timestamp: ev.uploadedAt,
        context: `File SHA-1 hash for evidence file: ${ev.originalName}`
      });
    }
    if (ev.sha256Hash) {
      registerCandidate('sha256', ev.sha256Hash, {
        ...evRefBase,
        lineNumber: null,
        recordIndex: null,
        timestamp: ev.uploadedAt,
        context: `File SHA-256 hash for evidence file: ${ev.originalName}`
      });
    }

    // B. Parsed structured records (detailed line/record level provenance)
    if (ev.parsing && Array.isArray(ev.parsing.records)) {
      for (let rIdx = 0; rIdx < ev.parsing.records.length; rIdx++) {
        const rec = ev.parsing.records[rIdx];
        const rawText = rec.raw || (rec.details ? JSON.stringify(rec.details) : '');
        const recRef = {
          ...evRefBase,
          lineNumber: rec.lineNumber || (rIdx + 1),
          recordIndex: rIdx + 1,
          timestamp: rec.timestamp ? parseEvidenceTimestamp(rec.timestamp) : null,
          context: rawText
        };

        // Extract from record raw text / details
        if (rawText) {
          // IPv4
          const ips = rawText.match(/\b(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?\b/g) || [];
          ips.forEach(ip => registerCandidate('ipv4', ip, recRef));

          // URLs
          const urls = rawText.match(/\b(?:https?|hxxps?):\/\/[^\s"'<>\\]+/gi) || [];
          urls.forEach(u => registerCandidate('url', u, recRef));

          // Emails
          const emails = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
          emails.forEach(e => registerCandidate('email', e, recRef));

          // Hashes
          const sha256s = rawText.match(/\b[A-Fa-f0-9]{64}\b/g) || [];
          sha256s.forEach(h => registerCandidate('sha256', h, recRef));

          const sha1s = (rawText.match(/\b[A-Fa-f0-9]{40}\b/g) || []).filter(h => !sha256s.some(s => s.includes(h)));
          sha1s.forEach(h => registerCandidate('sha1', h, recRef));

          const md5s = (rawText.match(/\b[A-Fa-f0-9]{32}\b/g) || []).filter(h => !sha256s.some(s => s.includes(h)) && !sha1s.some(s => s.includes(h)));
          md5s.forEach(h => registerCandidate('md5', h, recRef));
        }

        // Structured details field checks
        if (rec.details && typeof rec.details === 'object') {
          if (rec.details.domain) registerCandidate('domain', rec.details.domain, recRef);
          if (rec.details.email) registerCandidate('email', rec.details.email, recRef);
          if (rec.details.ip) registerCandidate('ipv4', rec.details.ip, recRef);
        }
      }
    }

    // C. File-level extracted artifacts (catch any indicators not in sample records)
    if (ev.parsing && ev.parsing.artifacts) {
      const art = ev.parsing.artifacts;
      const genericRef = {
        ...evRefBase,
        lineNumber: null,
        recordIndex: null,
        timestamp: ev.uploadedAt,
        context: `Extracted from evidence file: ${ev.originalName}`
      };

      (art.ips || []).forEach(ip => registerCandidate('ipv4', ip, genericRef));
      (art.domains || []).forEach(dom => registerCandidate('domain', dom, genericRef));
      (art.urls || []).forEach(u => registerCandidate('url', u, genericRef));
      (art.emails || []).forEach(e => registerCandidate('email', e, genericRef));
      if (art.hashes) {
        (art.hashes.md5 || []).forEach(h => registerCandidate('md5', h, genericRef));
        (art.hashes.sha1 || []).forEach(h => registerCandidate('sha1', h, genericRef));
        (art.hashes.sha256 || []).forEach(h => registerCandidate('sha256', h, genericRef));
      }
    }
  }

  // 5. Query the latest IOC ID sequence once for safe sequential ID generation
  const lastIoc = await IOC.findOne({}, { iocId: 1 }, { sort: { iocId: -1 } });
  let nextSeq = 1001;
  if (lastIoc && lastIoc.iocId) {
    const m = lastIoc.iocId.match(/IOC-(\d+)/);
    if (m) nextSeq = parseInt(m[1], 10) + 1;
  }

  let newCount = 0;
  let updatedCount = 0;
  const savedIocs = [];

  // 6. Idempotently upsert findings
  for (const item of indicatorMap.values()) {
    // Deduplicate evidence references
    const seenRefs = new Set();
    const dedupeRefs = [];
    for (const ref of item.evidenceReferences) {
      const refKey = `${ref.evidenceId}:${ref.lineNumber || ''}:${ref.recordIndex || ''}:${ref.context || ''}`;
      if (!seenRefs.has(refKey)) {
        seenRefs.add(refKey);
        dedupeRefs.push(ref);
      }
    }

    // Compute firstSeen and lastSeen from timestamps
    let firstSeen = null;
    let lastSeen = null;
    if (item.timestamps.length > 0) {
      const sortedTs = item.timestamps.sort((a, b) => a.getTime() - b.getTime());
      firstSeen = sortedTs[0];
      lastSeen = sortedTs[sortedTs.length - 1];
    }

    // Rule evaluation
    const evaluation = evaluateIndicatorRules(
      item.indicatorType,
      item.normalizedValue,
      item.ipClassification,
      item.contexts
    );

    // Check for existing record
    let iocDoc = await IOC.findOne({
      caseId,
      indicatorType: item.indicatorType,
      normalizedValue: item.normalizedValue
    });

    if (iocDoc) {
      // Merge existing references with newly found ones
      const existingRefKeys = new Set(iocDoc.evidenceReferences.map(r => `${r.evidenceId}:${r.lineNumber || ''}:${r.recordIndex || ''}:${r.context || ''}`));
      for (const ref of dedupeRefs) {
        const refKey = `${ref.evidenceId}:${ref.lineNumber || ''}:${ref.recordIndex || ''}:${ref.context || ''}`;
        if (!existingRefKeys.has(refKey)) {
          iocDoc.evidenceReferences.push(ref);
        }
      }

      // Merge timestamps
      if (firstSeen) {
        if (!iocDoc.firstSeen || firstSeen < iocDoc.firstSeen) {
          iocDoc.firstSeen = firstSeen;
        }
      }
      if (lastSeen) {
        if (!iocDoc.lastSeen || lastSeen > iocDoc.lastSeen) {
          iocDoc.lastSeen = lastSeen;
        }
      }

      // Update rules & severity
      iocDoc.ruleMatches = evaluation.ruleMatches;
      iocDoc.severity = evaluation.severity;
      iocDoc.confidence = evaluation.confidence;
      iocDoc.confidenceScore = evaluation.confidenceScore;
      iocDoc.ipClassification = item.ipClassification;

      if (!iocDoc.batchId && item.evidenceBatch) {
        iocDoc.batchId = item.evidenceBatch;
      }

      await iocDoc.save();
      updatedCount++;
      savedIocs.push(iocDoc);
    } else {
      // Create new IOC
      iocDoc = new IOC({
        iocId: `IOC-${nextSeq++}`,
        caseId,
        case: caseDoc._id,
        batchId: item.evidenceBatch || batchId || '',
        indicatorType: item.indicatorType,
        value: item.value,
        normalizedValue: item.normalizedValue,
        ipClassification: item.ipClassification,
        firstSeen,
        lastSeen,
        evidenceReferences: dedupeRefs,
        ruleMatches: evaluation.ruleMatches,
        severity: evaluation.severity,
        confidence: evaluation.confidence,
        confidenceScore: evaluation.confidenceScore,
        status: 'New',
        isExternalThreatIntel: false,
        sourceEngine: 'Local Forensic Parsing & Rule Engine'
      });

      await iocDoc.save();
      newCount++;
      savedIocs.push(iocDoc);
    }
  }

  return {
    success: true,
    caseId,
    batchId,
    totalEvidenceScanned: evidenceList.length,
    totalDetected: savedIocs.length,
    newIndicators: newCount,
    updatedIndicators: updatedCount,
    iocs: savedIocs
  };
}

module.exports = {
  normalizeIpv4,
  classifyIpv4,
  normalizeDomain,
  normalizeUrl,
  normalizeEmail,
  normalizeHash,
  evaluateIndicatorRules,
  runCaseDetection
};
