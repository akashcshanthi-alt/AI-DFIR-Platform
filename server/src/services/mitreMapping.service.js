const mongoose = require('mongoose');
const MitreMapping = require('../models/MitreMapping');
const Case = require('../models/Case');
const Evidence = require('../models/Evidence');
const TimelineEvent = require('../models/TimelineEvent');
const IOC = require('../models/IOC');
const AuditLog = require('../models/AuditLog');
const { getTechniqueMetadata, getAllTactics } = require('./mitreCatalog.service');

/**
 * -----------------------------------------------------------------------------
 * DETERMINISTIC FORENSIC MAPPING RULES
 * -----------------------------------------------------------------------------
 * Every rule has an explicit rationale, documented detection type, and
 * inspects persisted forensic evidence, timeline events, and correlated IOCs.
 */
const MITRE_RULES = [
  // 1. T1110.001 - Password Guessing / Brute Force
  {
    ruleId: 'RULE-MITRE-T1110.001-BRUTEFORCE',
    ruleName: 'Authentication Service Password Guessing Pattern',
    techniqueId: 'T1110.001',
    detectionType: 'inferred',
    baseScore: 75,
    evaluator: (evidenceList, timelineEvents, iocList) => {
      const supportingEvidence = [];
      const supportingTimelineIds = [];
      let failCount = 0;

      // Check timeline events for failed auth
      timelineEvents.forEach(evt => {
        if (evt.eventType === 'AUTH' && /failed|invalid user|unauthorized/i.test(evt.description || evt.rawExcerpt)) {
          failCount++;
          if (evt.eventId && !supportingTimelineIds.includes(evt.eventId)) {
            supportingTimelineIds.push(evt.eventId);
          }
          if (evt.source && evt.source.evidenceId) {
            supportingEvidence.push({
              evidenceId: evt.source.evidenceId,
              fileName: evt.source.fileName || 'auth.log',
              relativePath: evt.source.relativePath || '',
              lineNumber: evt.source.lineNumber,
              recordIndex: evt.source.recordIndex,
              excerpt: evt.rawExcerpt ? evt.rawExcerpt.slice(0, 300) : ''
            });
          }
        }
      });

      // Also check raw evidence records
      evidenceList.forEach(ev => {
        if (ev.parsing && Array.isArray(ev.parsing.records)) {
          ev.parsing.records.forEach((rec, idx) => {
            const raw = rec.raw || (rec.details ? JSON.stringify(rec.details) : '');
            if (/failed\s+password|invalid\s+user|authentication\s+failure/i.test(raw)) {
              failCount++;
              supportingEvidence.push({
                evidenceId: ev.evidenceId,
                fileName: ev.originalName || ev.fileName,
                relativePath: ev.relativePath || '',
                lineNumber: rec.lineNumber || idx + 1,
                recordIndex: idx + 1,
                excerpt: raw.slice(0, 300)
              });
            }
          });
        }
      });

      if (failCount >= 2 || supportingTimelineIds.length >= 1) {
        return {
          matched: true,
          rationale: `Detected ${failCount} failed authentication attempts with invalid credentials or unknown usernames, indicating automated password guessing.`,
          matchedTelemetry: `Observed ${failCount} rejection entries across auth telemetry.`,
          supportingEvidence: deduplicateEvidence(supportingEvidence),
          supportingTimelineIds
        };
      }
      return { matched: false };
    }
  },

  // 2. T1078 - Valid Accounts
  {
    ruleId: 'RULE-MITRE-T1078-VALID-ACCOUNTS',
    ruleName: 'Valid Account Authentication Session Establishment',
    techniqueId: 'T1078',
    detectionType: 'inferred',
    baseScore: 70,
    evaluator: (evidenceList, timelineEvents, iocList) => {
      const supportingEvidence = [];
      const supportingTimelineIds = [];
      let successCount = 0;

      timelineEvents.forEach(evt => {
        if (evt.eventType === 'AUTH' && /accepted password|session opened|logon success|admin/i.test(evt.description || evt.rawExcerpt)) {
          successCount++;
          if (evt.eventId && !supportingTimelineIds.includes(evt.eventId)) {
            supportingTimelineIds.push(evt.eventId);
          }
          if (evt.source && evt.source.evidenceId) {
            supportingEvidence.push({
              evidenceId: evt.source.evidenceId,
              fileName: evt.source.fileName || '',
              relativePath: evt.source.relativePath || '',
              lineNumber: evt.source.lineNumber,
              recordIndex: evt.source.recordIndex,
              excerpt: evt.rawExcerpt ? evt.rawExcerpt.slice(0, 300) : ''
            });
          }
        }
      });

      evidenceList.forEach(ev => {
        if (ev.parsing && Array.isArray(ev.parsing.records)) {
          ev.parsing.records.forEach((rec, idx) => {
            const raw = rec.raw || (rec.details ? JSON.stringify(rec.details) : '');
            if (/accepted\s+password|session\s+opened\s+for\s+user|logon\s+success/i.test(raw)) {
              successCount++;
              supportingEvidence.push({
                evidenceId: ev.evidenceId,
                fileName: ev.originalName || ev.fileName,
                relativePath: ev.relativePath || '',
                lineNumber: rec.lineNumber || idx + 1,
                recordIndex: idx + 1,
                excerpt: raw.slice(0, 300)
              });
            }
          });
        }
      });

      if (successCount >= 1) {
        return {
          matched: true,
          rationale: `Evidence records successful logon or session opening using existing accounts (potentially abused or compromised).`,
          matchedTelemetry: `Observed ${successCount} successful authentication events.`,
          supportingEvidence: deduplicateEvidence(supportingEvidence),
          supportingTimelineIds
        };
      }
      return { matched: false };
    }
  },

  // 3. T1190 - Exploit Public-Facing Application
  {
    ruleId: 'RULE-MITRE-T1190-EXPLOIT-APP',
    ruleName: 'Web Application Vulnerability Exploitation Pattern',
    techniqueId: 'T1190',
    detectionType: 'observed',
    baseScore: 85,
    evaluator: (evidenceList, timelineEvents, iocList) => {
      const supportingEvidence = [];
      const supportingTimelineIds = [];
      let exploitFound = false;
      let matchedSnippet = '';

      timelineEvents.forEach(evt => {
        if (/(?:union\s+select|' or '1'='1|eval\(|\.\.\/|\.\.%2f|<script>|;\s*cat\s+\/etc)/i.test(evt.rawExcerpt || evt.description)) {
          exploitFound = true;
          matchedSnippet = evt.rawExcerpt || evt.description;
          if (evt.eventId && !supportingTimelineIds.includes(evt.eventId)) {
            supportingTimelineIds.push(evt.eventId);
          }
          if (evt.source && evt.source.evidenceId) {
            supportingEvidence.push({
              evidenceId: evt.source.evidenceId,
              fileName: evt.source.fileName || '',
              relativePath: evt.source.relativePath || '',
              lineNumber: evt.source.lineNumber,
              recordIndex: evt.source.recordIndex,
              excerpt: evt.rawExcerpt ? evt.rawExcerpt.slice(0, 300) : ''
            });
          }
        }
      });

      evidenceList.forEach(ev => {
        if (ev.parsing && Array.isArray(ev.parsing.records)) {
          ev.parsing.records.forEach((rec, idx) => {
            const raw = rec.raw || (rec.details ? JSON.stringify(rec.details) : '');
            if (/(?:union\s+select|' or '1'='1|eval\(|\.\.\/|\.\.%2f|<script>|;\s*cat\s+\/etc)/i.test(raw)) {
              exploitFound = true;
              matchedSnippet = raw;
              supportingEvidence.push({
                evidenceId: ev.evidenceId,
                fileName: ev.originalName || ev.fileName,
                relativePath: ev.relativePath || '',
                lineNumber: rec.lineNumber || idx + 1,
                recordIndex: idx + 1,
                excerpt: raw.slice(0, 300)
              });
            }
          });
        }
      });

      if (exploitFound) {
        return {
          matched: true,
          rationale: 'Web server access logs contain application exploitation syntax (SQL injection, directory traversal, or code evaluation syntax).',
          matchedTelemetry: matchedSnippet.slice(0, 150),
          supportingEvidence: deduplicateEvidence(supportingEvidence),
          supportingTimelineIds
        };
      }
      return { matched: false };
    }
  },

  // 4. T1059.001 - PowerShell Execution
  {
    ruleId: 'RULE-MITRE-T1059.001-POWERSHELL',
    ruleName: 'PowerShell Interpreter Command Invocation',
    techniqueId: 'T1059.001',
    detectionType: 'observed',
    baseScore: 85,
    evaluator: (evidenceList, timelineEvents, iocList) => {
      const supportingEvidence = [];
      const supportingTimelineIds = [];
      let count = 0;
      let sampleCmd = '';

      timelineEvents.forEach(evt => {
        if (/powershell(?:\.exe)?|downloadstring|invoke-expression|\biex\b/i.test(evt.rawExcerpt || evt.description)) {
          count++;
          sampleCmd = evt.rawExcerpt || evt.description;
          if (evt.eventId && !supportingTimelineIds.includes(evt.eventId)) {
            supportingTimelineIds.push(evt.eventId);
          }
          if (evt.source && evt.source.evidenceId) {
            supportingEvidence.push({
              evidenceId: evt.source.evidenceId,
              fileName: evt.source.fileName || '',
              relativePath: evt.source.relativePath || '',
              lineNumber: evt.source.lineNumber,
              recordIndex: evt.source.recordIndex,
              excerpt: evt.rawExcerpt ? evt.rawExcerpt.slice(0, 300) : ''
            });
          }
        }
      });

      evidenceList.forEach(ev => {
        if (ev.parsing && Array.isArray(ev.parsing.records)) {
          ev.parsing.records.forEach((rec, idx) => {
            const raw = rec.raw || (rec.details ? JSON.stringify(rec.details) : '');
            if (/powershell(?:\.exe)?|downloadstring|invoke-expression|\biex\b/i.test(raw)) {
              count++;
              sampleCmd = raw;
              supportingEvidence.push({
                evidenceId: ev.evidenceId,
                fileName: ev.originalName || ev.fileName,
                relativePath: ev.relativePath || '',
                lineNumber: rec.lineNumber || idx + 1,
                recordIndex: idx + 1,
                excerpt: raw.slice(0, 300)
              });
            }
          });
        }
      });

      if (count >= 1) {
        return {
          matched: true,
          rationale: 'Process execution records explicitly document invocation of the PowerShell command-line interpreter or encoded script blocks.',
          matchedTelemetry: sampleCmd.slice(0, 150),
          supportingEvidence: deduplicateEvidence(supportingEvidence),
          supportingTimelineIds
        };
      }
      return { matched: false };
    }
  },

  // 5. T1059.003 - Windows Command Shell
  {
    ruleId: 'RULE-MITRE-T1059.003-CMDSHELL',
    ruleName: 'Windows Command Prompt Execution',
    techniqueId: 'T1059.003',
    detectionType: 'observed',
    baseScore: 80,
    evaluator: (evidenceList, timelineEvents, iocList) => {
      const supportingEvidence = [];
      const supportingTimelineIds = [];
      let count = 0;
      let sampleCmd = '';

      const regex = /cmd\.exe(?:\s+\/c|\s+\/k)?|certutil(?:\.exe)?\s+-urlcache/i;

      timelineEvents.forEach(evt => {
        if (regex.test(evt.rawExcerpt || evt.description)) {
          count++;
          sampleCmd = evt.rawExcerpt || evt.description;
          if (evt.eventId && !supportingTimelineIds.includes(evt.eventId)) {
            supportingTimelineIds.push(evt.eventId);
          }
          if (evt.source && evt.source.evidenceId) {
            supportingEvidence.push({
              evidenceId: evt.source.evidenceId,
              fileName: evt.source.fileName || '',
              relativePath: evt.source.relativePath || '',
              lineNumber: evt.source.lineNumber,
              recordIndex: evt.source.recordIndex,
              excerpt: evt.rawExcerpt ? evt.rawExcerpt.slice(0, 300) : ''
            });
          }
        }
      });

      evidenceList.forEach(ev => {
        if (ev.parsing && Array.isArray(ev.parsing.records)) {
          ev.parsing.records.forEach((rec, idx) => {
            const raw = rec.raw || (rec.details ? JSON.stringify(rec.details) : '');
            if (regex.test(raw)) {
              count++;
              sampleCmd = raw;
              supportingEvidence.push({
                evidenceId: ev.evidenceId,
                fileName: ev.originalName || ev.fileName,
                relativePath: ev.relativePath || '',
                lineNumber: rec.lineNumber || idx + 1,
                recordIndex: idx + 1,
                excerpt: raw.slice(0, 300)
              });
            }
          });
        }
      });

      if (count >= 1) {
        return {
          matched: true,
          rationale: 'Process audit logs record execution of Windows Command Shell (cmd.exe) spawning administrative or utility commands.',
          matchedTelemetry: sampleCmd.slice(0, 150),
          supportingEvidence: deduplicateEvidence(supportingEvidence),
          supportingTimelineIds
        };
      }
      return { matched: false };
    }
  },

  // 6. T1021.001 - Remote Desktop Protocol
  {
    ruleId: 'RULE-MITRE-T1021.001-RDP',
    ruleName: 'Remote Desktop Protocol Lateral Session Activity',
    techniqueId: 'T1021.001',
    detectionType: 'observed',
    baseScore: 80,
    evaluator: (evidenceList, timelineEvents, iocList) => {
      const supportingEvidence = [];
      const supportingTimelineIds = [];
      let count = 0;

      const regex = /mstsc(?:\.exe)?|port\s+3389|logon\s+type\s+10|rdp\s+session/i;

      timelineEvents.forEach(evt => {
        if (regex.test(evt.rawExcerpt || evt.description)) {
          count++;
          if (evt.eventId && !supportingTimelineIds.includes(evt.eventId)) {
            supportingTimelineIds.push(evt.eventId);
          }
          if (evt.source && evt.source.evidenceId) {
            supportingEvidence.push({
              evidenceId: evt.source.evidenceId,
              fileName: evt.source.fileName || '',
              relativePath: evt.source.relativePath || '',
              lineNumber: evt.source.lineNumber,
              recordIndex: evt.source.recordIndex,
              excerpt: evt.rawExcerpt ? evt.rawExcerpt.slice(0, 300) : ''
            });
          }
        }
      });

      evidenceList.forEach(ev => {
        if (ev.parsing && Array.isArray(ev.parsing.records)) {
          ev.parsing.records.forEach((rec, idx) => {
            const raw = rec.raw || (rec.details ? JSON.stringify(rec.details) : '');
            if (regex.test(raw)) {
              count++;
              supportingEvidence.push({
                evidenceId: ev.evidenceId,
                fileName: ev.originalName || ev.fileName,
                relativePath: ev.relativePath || '',
                lineNumber: rec.lineNumber || idx + 1,
                recordIndex: idx + 1,
                excerpt: raw.slice(0, 300)
              });
            }
          });
        }
      });

      if (count >= 1) {
        return {
          matched: true,
          rationale: 'Telemetry records inbound or outbound Remote Desktop Protocol (port 3389 / mstsc) activity.',
          matchedTelemetry: `Observed ${count} RDP connection indicators.`,
          supportingEvidence: deduplicateEvidence(supportingEvidence),
          supportingTimelineIds
        };
      }
      return { matched: false };
    }
  },

  // 7. T1071.001 - Application Layer Protocol: Web Protocols (C2)
  {
    ruleId: 'RULE-MITRE-T1071.001-WEBC2',
    ruleName: 'Outbound HTTP/HTTPS Command and Control Communication',
    techniqueId: 'T1071.001',
    detectionType: 'inferred',
    baseScore: 75,
    evaluator: (evidenceList, timelineEvents, iocList) => {
      const supportingEvidence = [];
      const supportingTimelineIds = [];
      let netCount = 0;

      // Only map if there is explicit outbound network telemetry matching blocked/suspicious external destination
      timelineEvents.forEach(evt => {
        if (evt.eventType === 'NETWORK' && /blocked\s+outbound|connection\s+refused|firewall:\s*blocked|payload\.sh/i.test(evt.rawExcerpt || evt.description)) {
          netCount++;
          if (evt.eventId && !supportingTimelineIds.includes(evt.eventId)) {
            supportingTimelineIds.push(evt.eventId);
          }
          if (evt.source && evt.source.evidenceId) {
            supportingEvidence.push({
              evidenceId: evt.source.evidenceId,
              fileName: evt.source.fileName || '',
              relativePath: evt.source.relativePath || '',
              lineNumber: evt.source.lineNumber,
              recordIndex: evt.source.recordIndex,
              excerpt: evt.rawExcerpt ? evt.rawExcerpt.slice(0, 300) : ''
            });
          }
        }
      });

      // Check if evidence records outbound connection to high/critical IOC
      evidenceList.forEach(ev => {
        if (ev.parsing && Array.isArray(ev.parsing.records)) {
          ev.parsing.records.forEach((rec, idx) => {
            const raw = rec.raw || (rec.details ? JSON.stringify(rec.details) : '');
            if (/firewall:\s*blocked\s+outbound|outbound\s+connect\s+to/i.test(raw)) {
              netCount++;
              supportingEvidence.push({
                evidenceId: ev.evidenceId,
                fileName: ev.originalName || ev.fileName,
                relativePath: ev.relativePath || '',
                lineNumber: rec.lineNumber || idx + 1,
                recordIndex: idx + 1,
                excerpt: raw.slice(0, 300)
              });
            }
          });
        }
      });

      if (netCount >= 1) {
        return {
          matched: true,
          rationale: 'Network egress logs observe repeated or blocked HTTP/HTTPS transmissions to external non-internal endpoints, consistent with application layer command and control.',
          matchedTelemetry: `Observed ${netCount} outbound suspicious or blocked traffic records.`,
          supportingEvidence: deduplicateEvidence(supportingEvidence),
          supportingTimelineIds
        };
      }
      return { matched: false };
    }
  },

  // 8. T1105 - Ingress Tool Transfer
  {
    ruleId: 'RULE-MITRE-T1105-INGRESS-TOOL',
    ruleName: 'Command-Line Tool Download & Retrieval',
    techniqueId: 'T1105',
    detectionType: 'observed',
    baseScore: 80,
    evaluator: (evidenceList, timelineEvents, iocList) => {
      const supportingEvidence = [];
      const supportingTimelineIds = [];
      let count = 0;
      let matchedCmd = '';

      const regex = /certutil(?:\.exe)?\s+(?:-urlcache|-f)|curl\s+(?:-[a-zA-Z]*O|http)|wget\s+http|bitsadmin(?:\.exe)?\s+\/transfer/i;

      timelineEvents.forEach(evt => {
        if (regex.test(evt.rawExcerpt || evt.description)) {
          count++;
          matchedCmd = evt.rawExcerpt || evt.description;
          if (evt.eventId && !supportingTimelineIds.includes(evt.eventId)) {
            supportingTimelineIds.push(evt.eventId);
          }
          if (evt.source && evt.source.evidenceId) {
            supportingEvidence.push({
              evidenceId: evt.source.evidenceId,
              fileName: evt.source.fileName || '',
              relativePath: evt.source.relativePath || '',
              lineNumber: evt.source.lineNumber,
              recordIndex: evt.source.recordIndex,
              excerpt: evt.rawExcerpt ? evt.rawExcerpt.slice(0, 300) : ''
            });
          }
        }
      });

      evidenceList.forEach(ev => {
        if (ev.parsing && Array.isArray(ev.parsing.records)) {
          ev.parsing.records.forEach((rec, idx) => {
            const raw = rec.raw || (rec.details ? JSON.stringify(rec.details) : '');
            if (regex.test(raw)) {
              count++;
              matchedCmd = raw;
              supportingEvidence.push({
                evidenceId: ev.evidenceId,
                fileName: ev.originalName || ev.fileName,
                relativePath: ev.relativePath || '',
                lineNumber: rec.lineNumber || idx + 1,
                recordIndex: idx + 1,
                excerpt: raw.slice(0, 300)
              });
            }
          });
        }
      });

      if (count >= 1) {
        return {
          matched: true,
          rationale: 'System telemetry records file download from remote web servers via built-in system utilities (e.g. certutil, curl, wget).',
          matchedTelemetry: matchedCmd.slice(0, 150),
          supportingEvidence: deduplicateEvidence(supportingEvidence),
          supportingTimelineIds
        };
      }
      return { matched: false };
    }
  },

  // 9. T1003.001 - OS Credential Dumping: LSASS Memory
  {
    ruleId: 'RULE-MITRE-T1003.001-LSASS',
    ruleName: 'LSASS Memory Dumping / Credential Extraction',
    techniqueId: 'T1003.001',
    detectionType: 'observed',
    baseScore: 90,
    evaluator: (evidenceList, timelineEvents, iocList) => {
      const supportingEvidence = [];
      const supportingTimelineIds = [];
      let count = 0;
      let matchedText = '';

      const regex = /mimikatz|sekurlsa|lsass(?:\.exe)?|procdump(?:\.exe)?\s+.*lsass/i;

      timelineEvents.forEach(evt => {
        if (regex.test(evt.rawExcerpt || evt.description)) {
          count++;
          matchedText = evt.rawExcerpt || evt.description;
          if (evt.eventId && !supportingTimelineIds.includes(evt.eventId)) {
            supportingTimelineIds.push(evt.eventId);
          }
          if (evt.source && evt.source.evidenceId) {
            supportingEvidence.push({
              evidenceId: evt.source.evidenceId,
              fileName: evt.source.fileName || '',
              relativePath: evt.source.relativePath || '',
              lineNumber: evt.source.lineNumber,
              recordIndex: evt.source.recordIndex,
              excerpt: evt.rawExcerpt ? evt.rawExcerpt.slice(0, 300) : ''
            });
          }
        }
      });

      evidenceList.forEach(ev => {
        if (ev.parsing && Array.isArray(ev.parsing.records)) {
          ev.parsing.records.forEach((rec, idx) => {
            const raw = rec.raw || (rec.details ? JSON.stringify(rec.details) : '');
            if (regex.test(raw)) {
              count++;
              matchedText = raw;
              supportingEvidence.push({
                evidenceId: ev.evidenceId,
                fileName: ev.originalName || ev.fileName,
                relativePath: ev.relativePath || '',
                lineNumber: rec.lineNumber || idx + 1,
                recordIndex: idx + 1,
                excerpt: raw.slice(0, 300)
              });
            }
          });
        }
      });

      if (count >= 1) {
        return {
          matched: true,
          rationale: 'Host telemetry or process commands reference extraction of credential material from the LSASS process.',
          matchedTelemetry: matchedText.slice(0, 150),
          supportingEvidence: deduplicateEvidence(supportingEvidence),
          supportingTimelineIds
        };
      }
      return { matched: false };
    }
  },

  // 10. T1033 - System Owner/User Discovery
  {
    ruleId: 'RULE-MITRE-T1033-USER-DISCOVERY',
    ruleName: 'Account Discovery via Identity Inspection Utilities',
    techniqueId: 'T1033',
    detectionType: 'observed',
    baseScore: 75,
    evaluator: (evidenceList, timelineEvents, iocList) => {
      const supportingEvidence = [];
      const supportingTimelineIds = [];
      let count = 0;
      let matchedCmd = '';

      const regex = /whoami(?:\.exe)?|\bid\s+-u\b|\bquser\b|\bnet\s+user\b/i;

      timelineEvents.forEach(evt => {
        if (regex.test(evt.rawExcerpt || evt.description)) {
          count++;
          matchedCmd = evt.rawExcerpt || evt.description;
          if (evt.eventId && !supportingTimelineIds.includes(evt.eventId)) {
            supportingTimelineIds.push(evt.eventId);
          }
          if (evt.source && evt.source.evidenceId) {
            supportingEvidence.push({
              evidenceId: evt.source.evidenceId,
              fileName: evt.source.fileName || '',
              relativePath: evt.source.relativePath || '',
              lineNumber: evt.source.lineNumber,
              recordIndex: evt.source.recordIndex,
              excerpt: evt.rawExcerpt ? evt.rawExcerpt.slice(0, 300) : ''
            });
          }
        }
      });

      evidenceList.forEach(ev => {
        if (ev.parsing && Array.isArray(ev.parsing.records)) {
          ev.parsing.records.forEach((rec, idx) => {
            const raw = rec.raw || (rec.details ? JSON.stringify(rec.details) : '');
            if (regex.test(raw)) {
              count++;
              matchedCmd = raw;
              supportingEvidence.push({
                evidenceId: ev.evidenceId,
                fileName: ev.originalName || ev.fileName,
                relativePath: ev.relativePath || '',
                lineNumber: rec.lineNumber || idx + 1,
                recordIndex: idx + 1,
                excerpt: raw.slice(0, 300)
              });
            }
          });
        }
      });

      if (count >= 1) {
        return {
          matched: true,
          rationale: 'Commands were executed to query the current logged-in user or active system identity (e.g. whoami, id).',
          matchedTelemetry: matchedCmd.slice(0, 150),
          supportingEvidence: deduplicateEvidence(supportingEvidence),
          supportingTimelineIds
        };
      }
      return { matched: false };
    }
  },

  // 11. T1562.001 - Impair Defenses
  {
    ruleId: 'RULE-MITRE-T1562.001-DEFENSE-IMPAIR',
    ruleName: 'Endpoint Defense & Security Control Tampering',
    techniqueId: 'T1562.001',
    detectionType: 'observed',
    baseScore: 85,
    evaluator: (evidenceList, timelineEvents, iocList) => {
      const supportingEvidence = [];
      const supportingTimelineIds = [];
      let count = 0;

      const regex = /disable-realtime|firewall\s+set\s+opmode\s+disable|stop\s+auditd|wevtutil\s+cl|iptables\s+-F/i;

      timelineEvents.forEach(evt => {
        if (regex.test(evt.rawExcerpt || evt.description)) {
          count++;
          if (evt.eventId && !supportingTimelineIds.includes(evt.eventId)) {
            supportingTimelineIds.push(evt.eventId);
          }
          if (evt.source && evt.source.evidenceId) {
            supportingEvidence.push({
              evidenceId: evt.source.evidenceId,
              fileName: evt.source.fileName || '',
              relativePath: evt.source.relativePath || '',
              lineNumber: evt.source.lineNumber,
              recordIndex: evt.source.recordIndex,
              excerpt: evt.rawExcerpt ? evt.rawExcerpt.slice(0, 300) : ''
            });
          }
        }
      });

      evidenceList.forEach(ev => {
        if (ev.parsing && Array.isArray(ev.parsing.records)) {
          ev.parsing.records.forEach((rec, idx) => {
            const raw = rec.raw || (rec.details ? JSON.stringify(rec.details) : '');
            if (regex.test(raw)) {
              count++;
              supportingEvidence.push({
                evidenceId: ev.evidenceId,
                fileName: ev.originalName || ev.fileName,
                relativePath: ev.relativePath || '',
                lineNumber: rec.lineNumber || idx + 1,
                recordIndex: idx + 1,
                excerpt: raw.slice(0, 300)
              });
            }
          });
        }
      });

      if (count >= 1) {
        return {
          matched: true,
          rationale: 'Logs record attempts to tamper with, disable, or modify security daemons, auditing services, or firewall configurations.',
          matchedTelemetry: `Observed ${count} defense impairment entries.`,
          supportingEvidence: deduplicateEvidence(supportingEvidence),
          supportingTimelineIds
        };
      }
      return { matched: false };
    }
  }
];

/**
 * Deduplicates supporting evidence references by evidenceId + line/record.
 */
function deduplicateEvidence(refs) {
  const seen = new Set();
  const deduped = [];
  for (const r of refs) {
    const key = `${r.evidenceId}:${r.lineNumber || r.recordIndex || 'raw'}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(r);
    }
  }
  return deduped;
}

/**
 * -----------------------------------------------------------------------------
 * CORE SERVICE METHODS
 * -----------------------------------------------------------------------------
 */

/**
 * Deterministically generates or refreshes MITRE ATT&CK technique mappings for a case.
 *
 * Rules strictly preserve analyst decisions (confirmed, rejected, analyst_review)
 * across repeated runs.
 *
 * @param {string} caseId - Sequential case identifier (e.g. DF-1001)
 * @param {Object} options - { user?: Object }
 * @returns {Promise<Object>} Generation metrics summary
 */
async function generateCaseMappings(caseId, options = {}) {
  const { user = null } = options;

  // 1. Verify case
  const caseDoc = await Case.findOne({ caseId });
  if (!caseDoc) {
    throw new Error(`Case [${caseId}] was not found in the database.`);
  }

  // 2. Fetch all persisted forensic inputs for this case
  const [evidenceList, timelineEvents, iocList] = await Promise.all([
    Evidence.find({ caseId }),
    TimelineEvent.find({ caseId }),
    IOC.find({ caseId })
  ]);

  // Map timeline events by eventId for lookup
  const timelineIdMap = new Map();
  timelineEvents.forEach(te => {
    if (te.eventId) timelineIdMap.set(te.eventId, te._id);
  });

  // Track technique mappings to insert or update
  const candidateMappings = [];

  for (const rule of MITRE_RULES) {
    const evalResult = rule.evaluator(evidenceList, timelineEvents, iocList);

    if (evalResult.matched) {
      // Fetch verified metadata from the official catalog
      const techMeta = getTechniqueMetadata(rule.techniqueId);

      // Calculate confidence
      let confidenceScore = rule.baseScore;

      // Boost if multiple distinct evidence sources corroborate
      const uniqueFiles = new Set(evalResult.supportingEvidence.map(e => e.fileName));
      if (uniqueFiles.size > 1) {
        confidenceScore = Math.min(confidenceScore + 10, 95);
      }

      // Boost if timeline event count >= 3
      if (evalResult.supportingTimelineIds.length >= 3) {
        confidenceScore = Math.min(confidenceScore + 5, 95);
      }

      // Boost if correlated with any High or Critical IOC
      const hasHighIoc = iocList.some(i => i.severity === 'High' || i.severity === 'Critical');
      if (hasHighIoc) {
        confidenceScore = Math.min(confidenceScore + 5, 95);
      }

      const confidenceLevel = confidenceScore >= 80 ? 'High' : (confidenceScore >= 50 ? 'Medium' : 'Low');

      // Resolve MongoDB ObjectIds for timeline events
      const resolvedTimelineObjectIds = [];
      evalResult.supportingTimelineIds.forEach(id => {
        const objId = timelineIdMap.get(id);
        if (objId) resolvedTimelineObjectIds.push(objId);
      });

      candidateMappings.push({
        caseId,
        case: caseDoc._id,
        techniqueId: techMeta.techniqueId,
        techniqueName: techMeta.techniqueName,
        tactics: techMeta.tactics,
        attackVersion: techMeta.catalogVersion || 'v14.1 Enterprise ATT&CK',
        source: techMeta.source || 'Curated MITRE Enterprise Matrix',
        detectionType: rule.detectionType,
        confidence: {
          score: confidenceScore,
          level: confidenceLevel
        },
        evidenceReferences: evalResult.supportingEvidence,
        timelineEventIds: evalResult.supportingTimelineIds,
        timelineEvents: resolvedTimelineObjectIds,
        matchedRules: [{
          ruleId: rule.ruleId,
          ruleName: rule.ruleName,
          rationale: evalResult.rationale,
          matchedTelemetry: evalResult.matchedTelemetry || ''
        }]
      });
    }
  }

  // 3. Query next sequential MTR-XXXX mapping ID sequence
  const lastMapping = await MitreMapping.findOne({}, { mappingId: 1 }, { sort: { mappingId: -1 } });
  let nextSeq = 1001;
  if (lastMapping && lastMapping.mappingId) {
    const m = lastMapping.mappingId.match(/MTR-(\d+)/);
    if (m) nextSeq = parseInt(m[1], 10) + 1;
  }

  let newCount = 0;
  let updatedCount = 0;
  let candidateCount = 0;
  let confirmedCount = 0;
  let underReviewCount = 0;
  let rejectedCount = 0;
  const tacticsSet = new Set();

  // 4. Idempotently save or update mappings while PRESERVING analyst decisions
  for (const item of candidateMappings) {
    let existing = await MitreMapping.findOne({
      caseId,
      techniqueId: item.techniqueId
    });

    if (existing) {
      // PRESERVE analyst decisions!
      // If the analyst has reviewed, confirmed, or rejected this mapping, preserve their decision.
      const currentStatus = existing.mappingStatus;

      // Update telemetry, evidence references, and rules
      existing.evidenceReferences = item.evidenceReferences;
      existing.timelineEventIds = item.timelineEventIds;
      existing.timelineEvents = item.timelineEvents;
      existing.matchedRules = item.matchedRules;
      existing.confidence = item.confidence;
      existing.detectionType = item.detectionType;

      await existing.save();
      updatedCount++;

      // Track tally by current status
      if (currentStatus === 'confirmed') confirmedCount++;
      else if (currentStatus === 'rejected') rejectedCount++;
      else if (currentStatus === 'analyst_review') underReviewCount++;
      else candidateCount++;
    } else {
      // Create new candidate mapping
      const newMapping = new MitreMapping({
        mappingId: `MTR-${nextSeq++}`,
        mappingStatus: 'candidate', // Always starts as candidate!
        ...item
      });

      await newMapping.save();
      newCount++;
      candidateCount++;
    }

    item.tactics.forEach(t => tacticsSet.add(t.tacticId));
  }

  // 5. Record Audit Log entry
  try {
    const auditDesc = `Generated MITRE ATT&CK mappings for Case [${caseId}]. Mapped ${candidateMappings.length} techniques (${newCount} new, ${updatedCount} refreshed). Tactics covered: ${tacticsSet.size}.`;
    await AuditLog.create({
      action: 'GENERATE_MITRE_MAPPINGS',
      module: 'MITRE_ENGINE',
      user: user?.username || user?.email || 'Authenticated Analyst',
      description: auditDesc,
      details: auditDesc,
      ip: '127.0.0.1',
      severity: 'Low',
      status: 'Success'
    });
  } catch (auditErr) {
    console.warn('[Audit Log Warning] Failed to log MITRE mapping generation:', auditErr.message);
  }

  return {
    success: true,
    caseId,
    totalMapped: candidateMappings.length,
    newMappings: newCount,
    updatedMappings: updatedCount,
    candidates: candidateCount,
    confirmed: confirmedCount,
    underReview: underReviewCount,
    rejected: rejectedCount,
    tacticsCovered: tacticsSet.size
  };
}

/**
 * Updates mapping review status (analyst confirm/reject/review).
 *
 * @param {string} id - mappingId or MongoDB _id
 * @param {string} newStatus - candidate | analyst_review | confirmed | rejected
 * @param {Object} options - { notes, user }
 */
async function updateMappingStatus(id, newStatus, options = {}) {
  const { notes = '', user = null } = options;

  const validStatuses = ['candidate', 'analyst_review', 'confirmed', 'rejected'];
  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Invalid mapping status [${newStatus}]. Allowed values: ${validStatuses.join(', ')}`);
  }

  let query = { mappingId: id };
  if (mongoose.Types.ObjectId.isValid(id)) {
    query = { $or: [{ mappingId: id }, { _id: id }] };
  }

  const mapping = await MitreMapping.findOne(query);
  if (!mapping) {
    throw new Error(`MITRE mapping [${id}] not found.`);
  }

  const oldStatus = mapping.mappingStatus;
  mapping.mappingStatus = newStatus;
  if (notes) mapping.analystNotes = notes;
  mapping.reviewedBy = user?.username || user?.email || 'Authenticated Analyst';
  mapping.reviewedAt = new Date();

  await mapping.save();

  // Audit log entry
  try {
    const auditDesc = `Analyst transition for MITRE mapping [${mapping.mappingId}] (${mapping.techniqueId}): Status changed from ${oldStatus} to ${newStatus}.`;
    await AuditLog.create({
      action: 'REVIEW_MITRE_MAPPING',
      module: 'MITRE_ENGINE',
      user: user?.username || user?.email || 'Authenticated Analyst',
      description: auditDesc,
      details: auditDesc,
      ip: '127.0.0.1',
      severity: newStatus === 'confirmed' ? 'Medium' : 'Low',
      status: 'Success'
    });
  } catch (auditErr) {
    console.warn('[Audit Log Warning] Failed to log MITRE mapping review:', auditErr.message);
  }

  return mapping;
}

/**
 * Retrieves case-level MITRE ATT&CK statistics and matrix summary.
 *
 * @param {string} caseId
 * @returns {Promise<Object>} Aggregated metrics
 */
async function getCaseMappingStats(caseId) {
  const mappings = await MitreMapping.find({ caseId });

  const total = mappings.length;
  let candidates = 0;
  let confirmed = 0;
  let underReview = 0;
  let rejected = 0;
  let observedCount = 0;
  let inferredCount = 0;

  const tacticsMap = {};
  const allTactics = getAllTactics();
  allTactics.forEach(t => {
    tacticsMap[t.tacticId] = {
      tacticId: t.tacticId,
      tacticName: t.tacticName,
      count: 0,
      techniques: []
    };
  });

  mappings.forEach(m => {
    if (m.mappingStatus === 'confirmed') confirmed++;
    else if (m.mappingStatus === 'rejected') rejected++;
    else if (m.mappingStatus === 'analyst_review') underReview++;
    else candidates++;

    if (m.detectionType === 'observed') observedCount++;
    else inferredCount++;

    m.tactics.forEach(tac => {
      if (tacticsMap[tac.tacticId]) {
        tacticsMap[tac.tacticId].count++;
        tacticsMap[tac.tacticId].techniques.push({
          techniqueId: m.techniqueId,
          techniqueName: m.techniqueName,
          status: m.mappingStatus,
          confidence: m.confidence.level
        });
      }
    });
  });

  const coveredTacticsCount = Object.values(tacticsMap).filter(t => t.count > 0).length;

  return {
    caseId,
    totalMappings: total,
    candidates,
    confirmed,
    underReview,
    rejected,
    observedFacts: observedCount,
    inferredTechniques: inferredCount,
    tacticsCoverage: {
      covered: coveredTacticsCount,
      total: allTactics.length,
      percentage: Math.round((coveredTacticsCount / allTactics.length) * 100)
    },
    tactics: Object.values(tacticsMap)
  };
}

module.exports = {
  MITRE_RULES,
  generateCaseMappings,
  updateMappingStatus,
  getCaseMappingStats
};
