const fs = require('fs');
const path = require('path');
const readline = require('readline');

/**
 * Common regex indicators for IOC / artifact extraction
 */
const IPV4_REGEX = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;
const URL_REGEX = /https?:\/\/[^\s"'<>\)\]\}]+/gi;
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const SHA256_REGEX = /\b[a-fA-F0-9]{64}\b/g;
const SHA1_REGEX = /\b[a-fA-F0-9]{40}\b/g;
const MD5_REGEX = /\b[a-fA-F0-9]{32}\b/g;
const DOMAIN_REGEX = /\b(?:[a-zA-Z0-9-]+\.)+(?:com|org|net|edu|gov|io|ai|co|xyz|info|biz|local|internal|corp|lan|cloud|dev)\b/gi;

// Ignored domain-like file extensions or common false positives
const IGNORED_DOMAINS = new Set([
  'example.com', 'localhost.local', 'txt', 'log', 'csv', 'json', 'jsonl', 'syslog', 'bin', 'raw', 'pcap', 'exe'
]);

// Field names common in structured logs (JSON, CSV)
const USER_FIELD_NAMES = /^(?:user|username|user_name|account|targetusername|subjectusername|operator)$/i;
const HOST_FIELD_NAMES = /^(?:host|hostname|host_name|computer|computername|targethost|sourcehost)$/i;
const PROCESS_FIELD_NAMES = /^(?:process|process_name|processname|image|proc|command|commandline)$/i;
const EVENT_ID_FIELD_NAMES = /^(?:eventid|event_id|id)$/i;
const TIMESTAMP_FIELD_NAMES = /^(?:timestamp|time|@timestamp|datetime|date|eventtime|created_at)$/i;

/**
 * Helper to deduplicate an array
 */
const dedupe = (arr) => Array.from(new Set(arr)).filter(Boolean);

/**
 * Extract artifacts from an arbitrary string of text
 */
function extractArtifactsFromText(text) {
  const artifacts = {
    ips: [],
    domains: [],
    urls: [],
    emails: [],
    hashes: { md5: [], sha1: [], sha256: [] },
    users: [],
    hosts: [],
    processes: [],
    eventIds: []
  };

  if (!text || typeof text !== 'string') return artifacts;

  // 1. URLs
  const matchedUrls = text.match(URL_REGEX) || [];
  artifacts.urls.push(...matchedUrls);

  // 2. Domains (from URLs and standalone)
  matchedUrls.forEach(urlStr => {
    try {
      const parsed = new URL(urlStr);
      if (parsed.hostname && !IPV4_REGEX.test(parsed.hostname)) {
        artifacts.domains.push(parsed.hostname.toLowerCase());
      }
    } catch (e) {}
  });

  const matchedDomains = text.match(DOMAIN_REGEX) || [];
  matchedDomains.forEach(dom => {
    const cleanDom = dom.toLowerCase();
    if (!IGNORED_DOMAINS.has(cleanDom) && !cleanDom.startsWith('0.') && !cleanDom.startsWith('127.')) {
      artifacts.domains.push(cleanDom);
    }
  });

  // 3. Emails
  const matchedEmails = text.match(EMAIL_REGEX) || [];
  artifacts.emails.push(...matchedEmails.map(e => e.toLowerCase()));

  // 4. IPv4
  const matchedIps = text.match(IPV4_REGEX) || [];
  artifacts.ips.push(...matchedIps.filter(ip => ip !== '0.0.0.0'));

  // 5. Hashes (extract SHA-256 first, then SHA-1, then MD5 to avoid prefix/substring matching)
  const sha256s = text.match(SHA256_REGEX) || [];
  artifacts.hashes.sha256.push(...sha256s.map(h => h.toLowerCase()));

  const sha1s = (text.match(SHA1_REGEX) || []).filter(h => !sha256s.some(s256 => s256.includes(h)));
  artifacts.hashes.sha1.push(...sha1s.map(h => h.toLowerCase()));

  const md5s = (text.match(MD5_REGEX) || []).filter(h => !sha256s.some(s256 => s256.includes(h)) && !sha1s.some(s1 => s1.includes(h)));
  artifacts.hashes.md5.push(...md5s.map(h => h.toLowerCase()));

  // 6. Usernames from common log syntax
  const userMatches = [
    ...text.matchAll(/["']?(?:user(?:name)?|account|operator)["']?[=:\s]+["']?([a-zA-Z0-9_.-]+)["']?/gi),
    ...text.matchAll(/(?:for (?:invalid user |user ))([a-zA-Z0-9_.-]+)/gi),
    ...text.matchAll(/(?:Accepted|Failed) password for (?:invalid user )?([a-zA-Z0-9_.-]+)/gi)
  ];
  userMatches.forEach(m => {
    if (m[1] && m[1].length > 1 && !/^(?:true|false|null|undefined|\d+)$/i.test(m[1])) {
      artifacts.users.push(m[1]);
    }
  });

  // 7. Hostnames from log syntax
  const hostMatches = text.matchAll(/["']?(?:host(?:name)?|targetHost|computer)["']?[=:\s]+["']?([a-zA-Z0-9_.-]+)["']?/gi);
  for (const m of hostMatches) {
    if (m[1] && m[1].length > 1 && !/^(?:true|false|null|undefined|\d+)$/i.test(m[1])) {
      artifacts.hosts.push(m[1]);
    }
  }

  // Syslog hostname pattern: <PRI>MMM DD HH:MM:SS hostname process:...
  const syslogMatch = text.match(/^(?:<\d+>)?(?:[A-Z][a-z]{2}\s+\d+\s+\d{2}:\d{2}:\d{2})\s+([a-zA-Z0-9_.-]+)\s+([a-zA-Z0-9_.-]+)(?:\[\d+\])?:/);
  if (syslogMatch) {
    if (syslogMatch[1]) artifacts.hosts.push(syslogMatch[1]);
    if (syslogMatch[2]) artifacts.processes.push(syslogMatch[2]);
  }

  // 8. Processes
  const procMatches = text.matchAll(/["']?(?:process(?:_name)?|image|proc)["']?[=:\s]+["']?([a-zA-Z0-9_.-]+(?:\.exe)?)["']?/gi);
  for (const m of procMatches) {
    if (m[1] && m[1].length > 1 && !/^(?:true|false|null|undefined|\d+)$/i.test(m[1])) {
      artifacts.processes.push(m[1]);
    }
  }

  // 9. Event IDs
  const eventIdMatches = text.matchAll(/["']?(?:EventID|event_?id)["']?[=:\s]+["']?(\d+)["']?/gi);
  for (const m of eventIdMatches) {
    if (m[1]) artifacts.eventIds.push(m[1]);
  }

  return artifacts;
}

/**
 * Merge two artifacts collections with deduplication
 */
function mergeArtifacts(target, source) {
  target.ips = dedupe([...target.ips, ...source.ips]);
  target.domains = dedupe([...target.domains, ...source.domains]);
  target.urls = dedupe([...target.urls, ...source.urls]);
  target.emails = dedupe([...target.emails, ...source.emails]);
  target.hashes.md5 = dedupe([...target.hashes.md5, ...source.hashes.md5]);
  target.hashes.sha1 = dedupe([...target.hashes.sha1, ...source.hashes.sha1]);
  target.hashes.sha256 = dedupe([...target.hashes.sha256, ...source.hashes.sha256]);
  target.users = dedupe([...target.users, ...source.users]);
  target.hosts = dedupe([...target.hosts, ...source.hosts]);
  target.processes = dedupe([...target.processes, ...source.processes]);
  target.eventIds = dedupe([...target.eventIds, ...source.eventIds]);
}

/**
 * Recursive inspection of structured JSON properties for IOCs and DFIR fields
 */
function inspectJsonObject(obj, artifactsCollector, recordDetails) {
  if (!obj || typeof obj !== 'object') return;

  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'string') {
      const art = extractArtifactsFromText(val);
      mergeArtifacts(artifactsCollector, art);

      if (USER_FIELD_NAMES.test(key) && val.length > 1) {
        artifactsCollector.users = dedupe([...artifactsCollector.users, val]);
        if (recordDetails && typeof recordDetails === 'object') {
          recordDetails.users = dedupe([...(recordDetails.users || []), val]);
        }
      }
      if (HOST_FIELD_NAMES.test(key) && val.length > 1) {
        artifactsCollector.hosts = dedupe([...artifactsCollector.hosts, val]);
      }
      if (PROCESS_FIELD_NAMES.test(key) && val.length > 1) {
        artifactsCollector.processes = dedupe([...artifactsCollector.processes, val]);
      }
      if (EVENT_ID_FIELD_NAMES.test(key)) {
        artifactsCollector.eventIds = dedupe([...artifactsCollector.eventIds, String(val)]);
        if (recordDetails && typeof recordDetails === 'object') {
          recordDetails.eventIds = dedupe([...(recordDetails.eventIds || []), String(val)]);
        }
      }
    } else if (typeof val === 'number') {
      if (EVENT_ID_FIELD_NAMES.test(key)) {
        artifactsCollector.eventIds = dedupe([...artifactsCollector.eventIds, String(val)]);
        if (recordDetails && typeof recordDetails === 'object') {
          recordDetails.eventIds = dedupe([...(recordDetails.eventIds || []), String(val)]);
        }
      }
    } else if (typeof val === 'object' && val !== null) {
      inspectJsonObject(val, artifactsCollector, recordDetails);
    }
  }
}

/**
 * Extract timestamp string from a line of text if present
 */
function extractTimestamp(text) {
  if (!text || typeof text !== 'string') return null;
  // ISO 8601
  const isoMatch = text.match(/\b\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?\b/);
  if (isoMatch) return isoMatch[0];

  // Syslog date (e.g. Sep 29 14:07:20)
  const syslogMatch = text.match(/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}\b/);
  if (syslogMatch) return syslogMatch[0];

  // Common Log / Apache date (e.g. 29/Sep/2026:14:07:20)
  const clfMatch = text.match(/\b\d{2}\/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\/\d{4}:\d{2}:\d{2}:\d{2}\b/);
  if (clfMatch) return clfMatch[0];

  return null;
}

/**
 * Deterministic parser for TXT, LOG, and SYSLOG files
 */
async function parseTextLog(filePath) {
  const result = {
    parserType: 'TEXT_LOG',
    status: 'Parsed',
    recordCount: 0,
    artifacts: {
      ips: [], domains: [], urls: [], emails: [],
      hashes: { md5: [], sha1: [], sha256: [] },
      users: [], hosts: [], processes: [], eventIds: []
    },
    records: [],
    warnings: [],
    errors: [],
    parsedAt: new Date()
  };

  const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineNum = 0;
  const maxSampleRecords = 100;

  for await (const line of rl) {
    lineNum++;
    const trimmed = line.trim();
    if (!trimmed) continue;

    result.recordCount++;

    const lineArtifacts = extractArtifactsFromText(trimmed);
    mergeArtifacts(result.artifacts, lineArtifacts);

    if (result.records.length < maxSampleRecords) {
      result.records.push({
        lineNumber: lineNum,
        timestamp: extractTimestamp(trimmed),
        raw: trimmed.length > 500 ? trimmed.substring(0, 500) + '...' : trimmed,
        details: {
          ips: lineArtifacts.ips,
          users: lineArtifacts.users,
          eventIds: lineArtifacts.eventIds
        }
      });
    }
  }

  if (result.recordCount === 0) {
    result.warnings.push('File is empty: no log entries or records discovered.');
  }

  return result;
}

/**
 * Deterministic parser for JSON files
 */
async function parseJson(filePath) {
  const result = {
    parserType: 'JSON',
    status: 'Parsed',
    recordCount: 0,
    artifacts: {
      ips: [], domains: [], urls: [], emails: [],
      hashes: { md5: [], sha1: [], sha256: [] },
      users: [], hosts: [], processes: [], eventIds: []
    },
    records: [],
    warnings: [],
    errors: [],
    parsedAt: new Date()
  };

  let rawContent = '';
  try {
    rawContent = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    result.status = 'Failed';
    result.errors.push(`Failed to read file: ${err.message}`);
    return result;
  }

  if (!rawContent.trim()) {
    result.recordCount = 0;
    result.warnings.push('File is empty: no JSON data present.');
    return result;
  }

  let parsedData;
  try {
    parsedData = JSON.parse(rawContent);
  } catch (err) {
    result.status = 'Failed';
    result.errors.push(`JSON Syntax Error: ${err.message}`);
    return result;
  }

  const items = Array.isArray(parsedData) ? parsedData : [parsedData];
  result.recordCount = items.length;

  const maxSampleRecords = 100;
  items.slice(0, maxSampleRecords).forEach((item, idx) => {
    let timestamp = null;
    const details = {};

    if (item && typeof item === 'object') {
      for (const [k, v] of Object.entries(item)) {
        if (TIMESTAMP_FIELD_NAMES.test(k) && typeof v === 'string') {
          timestamp = v;
          break;
        }
      }
      inspectJsonObject(item, result.artifacts, details);
    }

    result.records.push({
      lineNumber: idx + 1,
      timestamp: timestamp || extractTimestamp(JSON.stringify(item)),
      raw: JSON.stringify(item).substring(0, 500),
      details
    });
  });

  // If there are more items beyond sample, inspect them for artifacts too
  if (items.length > maxSampleRecords) {
    items.slice(maxSampleRecords).forEach((item) => {
      inspectJsonObject(item, result.artifacts, null);
    });
  }

  return result;
}

/**
 * Deterministic parser for JSONL (Newline Delimited JSON)
 */
async function parseJsonl(filePath) {
  const result = {
    parserType: 'JSONL',
    status: 'Parsed',
    recordCount: 0,
    artifacts: {
      ips: [], domains: [], urls: [], emails: [],
      hashes: { md5: [], sha1: [], sha256: [] },
      users: [], hosts: [], processes: [], eventIds: []
    },
    records: [],
    warnings: [],
    errors: [],
    parsedAt: new Date()
  };

  const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineNum = 0;
  let parseErrors = 0;
  const maxSampleRecords = 100;

  for await (const line of rl) {
    lineNum++;
    const trimmed = line.trim();
    if (!trimmed) continue;

    try {
      const parsed = JSON.parse(trimmed);
      result.recordCount++;

      // Extract artifacts from raw text and structured object
      const lineArt = extractArtifactsFromText(trimmed);
      mergeArtifacts(result.artifacts, lineArt);

      if (parsed && typeof parsed === 'object') {
        inspectJsonObject(parsed, result.artifacts, parsed);
      }

      let timestamp = null;
      if (parsed && typeof parsed === 'object') {
        for (const [k, v] of Object.entries(parsed)) {
          if (TIMESTAMP_FIELD_NAMES.test(k) && typeof v === 'string') {
            timestamp = v;
            break;
          }
        }
      }

      if (result.records.length < maxSampleRecords) {
        result.records.push({
          lineNumber: lineNum,
          timestamp: timestamp || extractTimestamp(trimmed),
          raw: trimmed.length > 500 ? trimmed.substring(0, 500) + '...' : trimmed,
          details: parsed
        });
      }
    } catch (err) {
      parseErrors++;
      if (result.errors.length < 20) {
        result.errors.push(`Line ${lineNum}: Malformed JSON - ${err.message}`);
      }
    }
  }

  if (result.recordCount === 0 && parseErrors === 0) {
    result.warnings.push('File is empty: no JSONL records found.');
  } else if (result.recordCount > 0 && parseErrors > 0) {
    result.status = 'Partially Parsed';
    result.warnings.push(`Processed ${result.recordCount} valid lines with ${parseErrors} malformed lines.`);
  } else if (result.recordCount === 0 && parseErrors > 0) {
    result.status = 'Failed';
    result.errors.unshift(`All ${parseErrors} lines in JSONL file failed parsing.`);
  }

  return result;
}

/**
 * Helper to parse a single CSV row respecting quoted fields
 */
function parseCsvRow(rowText, delimiter = ',') {
  const fields = [];
  let inQuotes = false;
  let current = '';

  for (let i = 0; i < rowText.length; i++) {
    const char = rowText[i];
    if (char === '"') {
      if (inQuotes && rowText[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

/**
 * Deterministic parser for CSV files
 */
async function parseCsv(filePath) {
  const result = {
    parserType: 'CSV',
    status: 'Parsed',
    recordCount: 0,
    artifacts: {
      ips: [], domains: [], urls: [], emails: [],
      hashes: { md5: [], sha1: [], sha256: [] },
      users: [], hosts: [], processes: [], eventIds: []
    },
    records: [],
    warnings: [],
    errors: [],
    parsedAt: new Date()
  };

  const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineNum = 0;
  let headers = null;
  const maxSampleRecords = 100;

  for await (const line of rl) {
    lineNum++;
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (!headers) {
      headers = parseCsvRow(trimmed).map(h => h.replace(/^["']|["']$/g, '').trim());
      continue;
    }

    result.recordCount++;
    const values = parseCsvRow(trimmed);
    const rowObj = {};
    let timestamp = null;

    headers.forEach((colName, colIdx) => {
      const val = values[colIdx] !== undefined ? values[colIdx] : '';
      rowObj[colName] = val;

      if (TIMESTAMP_FIELD_NAMES.test(colName) && val) {
        timestamp = val;
      }
      if (USER_FIELD_NAMES.test(colName) && val && val.length > 1) {
        result.artifacts.users = dedupe([...result.artifacts.users, val]);
      }
      if (HOST_FIELD_NAMES.test(colName) && val && val.length > 1) {
        result.artifacts.hosts = dedupe([...result.artifacts.hosts, val]);
      }
      if (PROCESS_FIELD_NAMES.test(colName) && val && val.length > 1) {
        result.artifacts.processes = dedupe([...result.artifacts.processes, val]);
      }
      if (EVENT_ID_FIELD_NAMES.test(colName) && val) {
        result.artifacts.eventIds = dedupe([...result.artifacts.eventIds, String(val)]);
      }
    });

    // Also run artifact extraction on the entire line
    const lineArt = extractArtifactsFromText(trimmed);
    mergeArtifacts(result.artifacts, lineArt);

    if (result.records.length < maxSampleRecords) {
      result.records.push({
        lineNumber: lineNum,
        timestamp: timestamp || extractTimestamp(trimmed),
        raw: trimmed.length > 500 ? trimmed.substring(0, 500) + '...' : trimmed,
        details: rowObj
      });
    }
  }

  if (!headers) {
    result.recordCount = 0;
    result.warnings.push('File is empty: no CSV headers or rows found.');
  } else if (result.recordCount === 0) {
    result.warnings.push('CSV contains header row but 0 data records.');
  }

  return result;
}

/**
 * Primary dispatch function: inspects file extension/type and invokes appropriate parser
 */
async function parseEvidenceFile(filePath, originalName) {
  const ext = (path.extname(originalName || filePath) || '').toLowerCase();

  switch (ext) {
    case '.txt':
    case '.log':
    case '.syslog':
    case '.out':
      return parseTextLog(filePath);

    case '.json':
      return parseJson(filePath);

    case '.jsonl':
    case '.ndjson':
      return parseJsonl(filePath);

    case '.csv':
      return parseCsv(filePath);

    default:
      // Unsupported format (e.g. .evtx, .bin, .raw, .pcap, .e01, .vmdk, etc.)
      return {
        parserType: 'UNSUPPORTED',
        status: 'Unsupported',
        recordCount: 0,
        artifacts: {
          ips: [], domains: [], urls: [], emails: [],
          hashes: { md5: [], sha1: [], sha256: [] },
          users: [], hosts: [], processes: [], eventIds: []
        },
        records: [],
        warnings: [
          'File uploaded successfully, but content parsing for this format is not currently supported.'
        ],
        errors: [],
        parsedAt: new Date()
      };
  }
}

module.exports = {
  parseEvidenceFile,
  extractArtifactsFromText,
  parseTextLog,
  parseJson,
  parseJsonl,
  parseCsv
};
