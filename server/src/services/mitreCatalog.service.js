/**
 * TRACE AI - Verified MITRE ATT&CK Enterprise Catalog Service
 * Data Source: MITRE ATT&CK v14.1 for Enterprise
 *
 * Implements a documented, verified catalog interface to guarantee
 * that no metadata, technique IDs, or tactic names are fabricated.
 */

const CATALOG_VERSION = 'v14.1';
const CATALOG_SOURCE = 'MITRE ATT&CK for Enterprise Matrix';
const CATALOG_RELEASE_DATE = '2023-10-31';

/**
 * 14 Standard Enterprise MITRE ATT&CK Tactics
 */
const ENTERPRISE_TACTICS = [
  { tacticId: 'TA0043', tacticName: 'Reconnaissance', order: 1 },
  { tacticId: 'TA0042', tacticName: 'Resource Development', order: 2 },
  { tacticId: 'TA0001', tacticName: 'Initial Access', order: 3 },
  { tacticId: 'TA0002', tacticName: 'Execution', order: 4 },
  { tacticId: 'TA0003', tacticName: 'Persistence', order: 5 },
  { tacticId: 'TA0004', tacticName: 'Privilege Escalation', order: 6 },
  { tacticId: 'TA0005', tacticName: 'Defense Evasion', order: 7 },
  { tacticId: 'TA0006', tacticName: 'Credential Access', order: 8 },
  { tacticId: 'TA0007', tacticName: 'Discovery', order: 9 },
  { tacticId: 'TA0008', tacticName: 'Lateral Movement', order: 10 },
  { tacticId: 'TA0009', tacticName: 'Collection', order: 11 },
  { tacticId: 'TA0011', tacticName: 'Command and Control', order: 12 },
  { tacticId: 'TA0010', tacticName: 'Exfiltration', order: 13 },
  { tacticId: 'TA0040', tacticName: 'Impact', order: 14 }
];

/**
 * Curated and Verified Standard Enterprise Techniques Catalog
 */
const ENTERPRISE_TECHNIQUES = {
  'T1110.001': {
    techniqueId: 'T1110.001',
    techniqueName: 'Brute Force: Password Guessing',
    tactics: [{ tacticId: 'TA0006', tacticName: 'Credential Access' }],
    description: 'Adversaries may guess passwords to gain access to accounts on systems through authentication interfaces.',
    url: 'https://attack.mitre.org/techniques/T1110/001/',
    isSubtechnique: true,
    parentTechniqueId: 'T1110'
  },
  'T1110.003': {
    techniqueId: 'T1110.003',
    techniqueName: 'Brute Force: Password Spraying',
    tactics: [{ tacticId: 'TA0006', tacticName: 'Credential Access' }],
    description: 'Adversaries may use a single or small list of commonly used passwords against many different accounts to avoid account lockouts.',
    url: 'https://attack.mitre.org/techniques/T1110/003/',
    isSubtechnique: true,
    parentTechniqueId: 'T1110'
  },
  'T1078': {
    techniqueId: 'T1078',
    techniqueName: 'Valid Accounts',
    tactics: [
      { tacticId: 'TA0001', tacticName: 'Initial Access' },
      { tacticId: 'TA0003', tacticName: 'Persistence' },
      { tacticId: 'TA0004', tacticName: 'Privilege Escalation' },
      { tacticId: 'TA0005', tacticName: 'Defense Evasion' }
    ],
    description: 'Adversaries may obtain and abuse credentials of existing accounts as a means of gaining Initial Access, Persistence, Privilege Escalation, or Defense Evasion.',
    url: 'https://attack.mitre.org/techniques/T1078/',
    isSubtechnique: false
  },
  'T1190': {
    techniqueId: 'T1190',
    techniqueName: 'Exploit Public-Facing Application',
    tactics: [{ tacticId: 'TA0001', tacticName: 'Initial Access' }],
    description: 'Adversaries may attempt to exploit a weakness in an Internet-facing computer or program using software, system, or service bugs.',
    url: 'https://attack.mitre.org/techniques/T1190/',
    isSubtechnique: false
  },
  'T1059.001': {
    techniqueId: 'T1059.001',
    techniqueName: 'Command and Scripting Interpreter: PowerShell',
    tactics: [{ tacticId: 'TA0002', tacticName: 'Execution' }],
    description: 'Adversaries may abuse PowerShell commands and scripts for execution on target systems.',
    url: 'https://attack.mitre.org/techniques/T1059/001/',
    isSubtechnique: true,
    parentTechniqueId: 'T1059'
  },
  'T1059.003': {
    techniqueId: 'T1059.003',
    techniqueName: 'Command and Scripting Interpreter: Windows Command Shell',
    tactics: [{ tacticId: 'TA0002', tacticName: 'Execution' }],
    description: 'Adversaries may abuse the Windows command shell for execution on target systems.',
    url: 'https://attack.mitre.org/techniques/T1059/003/',
    isSubtechnique: true,
    parentTechniqueId: 'T1059'
  },
  'T1059.004': {
    techniqueId: 'T1059.004',
    techniqueName: 'Command and Scripting Interpreter: Unix Shell',
    tactics: [{ tacticId: 'TA0002', tacticName: 'Execution' }],
    description: 'Adversaries may abuse Unix shells (e.g. bash, sh) for execution on target systems.',
    url: 'https://attack.mitre.org/techniques/T1059/004/',
    isSubtechnique: true,
    parentTechniqueId: 'T1059'
  },
  'T1021.001': {
    techniqueId: 'T1021.001',
    techniqueName: 'Remote Services: Remote Desktop Protocol',
    tactics: [{ tacticId: 'TA0008', tacticName: 'Lateral Movement' }],
    description: 'Adversaries may use Valid Accounts to log into remote machines using the Remote Desktop Protocol (RDP).',
    url: 'https://attack.mitre.org/techniques/T1021/001/',
    isSubtechnique: true,
    parentTechniqueId: 'T1021'
  },
  'T1021.002': {
    techniqueId: 'T1021.002',
    techniqueName: 'Remote Services: SMB/Windows Admin Shares',
    tactics: [{ tacticId: 'TA0008', tacticName: 'Lateral Movement' }],
    description: 'Adversaries may use Valid Accounts to interact with remote computers over Server Message Block (SMB).',
    url: 'https://attack.mitre.org/techniques/T1021/002/',
    isSubtechnique: true,
    parentTechniqueId: 'T1021'
  },
  'T1071.001': {
    techniqueId: 'T1071.001',
    techniqueName: 'Application Layer Protocol: Web Protocols',
    tactics: [{ tacticId: 'TA0011', tacticName: 'Command and Control' }],
    description: 'Adversaries may communicate using application layer protocols associated with web traffic (HTTP/HTTPS) to blend in with normal network traffic.',
    url: 'https://attack.mitre.org/techniques/T1071/001/',
    isSubtechnique: true,
    parentTechniqueId: 'T1071'
  },
  'T1105': {
    techniqueId: 'T1105',
    techniqueName: 'Ingress Tool Transfer',
    tactics: [{ tacticId: 'TA0011', tacticName: 'Command and Control' }],
    description: 'Adversaries may transfer tools or other files from an external system into a compromised environment.',
    url: 'https://attack.mitre.org/techniques/T1105/',
    isSubtechnique: false
  },
  'T1003.001': {
    techniqueId: 'T1003.001',
    techniqueName: 'OS Credential Dumping: LSASS Memory',
    tactics: [{ tacticId: 'TA0006', tacticName: 'Credential Access' }],
    description: 'Adversaries may attempt to access credential material stored in the process memory of the Local Security Authority Subsystem Service (LSASS).',
    url: 'https://attack.mitre.org/techniques/T1003/001/',
    isSubtechnique: true,
    parentTechniqueId: 'T1003'
  },
  'T1562.001': {
    techniqueId: 'T1562.001',
    techniqueName: 'Impair Defenses: Disable or Modify Tools',
    tactics: [{ tacticId: 'TA0005', tacticName: 'Defense Evasion' }],
    description: 'Adversaries may disable or modify security tools such as firewalls, antivirus, or endpoint monitoring daemons.',
    url: 'https://attack.mitre.org/techniques/T1562/001/',
    isSubtechnique: true,
    parentTechniqueId: 'T1562'
  },
  'T1070.004': {
    techniqueId: 'T1070.004',
    techniqueName: 'Indicator Removal: File Deletion',
    tactics: [{ tacticId: 'TA0005', tacticName: 'Defense Evasion' }],
    description: 'Adversaries may delete files left behind by the actions of their software to clean up their tracks.',
    url: 'https://attack.mitre.org/techniques/T1070/004/',
    isSubtechnique: true,
    parentTechniqueId: 'T1070'
  },
  'T1033': {
    techniqueId: 'T1033',
    techniqueName: 'System Owner/User Discovery',
    tactics: [{ tacticId: 'TA0007', tacticName: 'Discovery' }],
    description: 'Adversaries may attempt to identify the primary user, currently logged in user, or system administrator.',
    url: 'https://attack.mitre.org/techniques/T1033/',
    isSubtechnique: false
  },
  'T1046': {
    techniqueId: 'T1046',
    techniqueName: 'Network Service Discovery',
    tactics: [{ tacticId: 'TA0007', tacticName: 'Discovery' }],
    description: 'Adversaries may attempt to get a listing of services running on remote hosts or local network segments.',
    url: 'https://attack.mitre.org/techniques/T1046/',
    isSubtechnique: false
  },
  'T1082': {
    techniqueId: 'T1082',
    techniqueName: 'System Information Discovery',
    tactics: [{ tacticId: 'TA0007', tacticName: 'Discovery' }],
    description: 'Adversaries may attempt to get detailed information about the operating system and hardware.',
    url: 'https://attack.mitre.org/techniques/T1082/',
    isSubtechnique: false
  },
  'T1053.005': {
    techniqueId: 'T1053.005',
    techniqueName: 'Scheduled Task/Job: Scheduled Task',
    tactics: [
      { tacticId: 'TA0002', tacticName: 'Execution' },
      { tacticId: 'TA0003', tacticName: 'Persistence' },
      { tacticId: 'TA0004', tacticName: 'Privilege Escalation' }
    ],
    description: 'Adversaries may abuse the Windows Task Scheduler to perform task scheduling for initial or recurring execution of malicious code.',
    url: 'https://attack.mitre.org/techniques/T1053/005/',
    isSubtechnique: true,
    parentTechniqueId: 'T1053'
  },
  'T1560.001': {
    techniqueId: 'T1560.001',
    techniqueName: 'Archive Collected Data: Archive via Utility',
    tactics: [{ tacticId: 'TA0009', tacticName: 'Collection' }],
    description: 'Adversaries may compress or encrypt data that is collected prior to exfiltration using utilities such as 7-Zip, tar, or zip.',
    url: 'https://attack.mitre.org/techniques/T1560/001/',
    isSubtechnique: true,
    parentTechniqueId: 'T1560'
  },
  'T1048': {
    techniqueId: 'T1048',
    techniqueName: 'Exfiltration Over Alternative Protocol',
    tactics: [{ tacticId: 'TA0010', tacticName: 'Exfiltration' }],
    description: 'Adversaries may steal data by exfiltrating it over a different protocol than that of the existing command and control channel.',
    url: 'https://attack.mitre.org/techniques/T1048/',
    isSubtechnique: false
  }
};

/**
 * Retrieves verified metadata for a given technique ID.
 * If the technique is unverified or unknown, returns an explicit limitation notice
 * rather than inventing or guessing metadata.
 *
 * @param {string} techniqueId
 * @returns {Object} Technique metadata with verified status flag
 */
function getTechniqueMetadata(techniqueId) {
  if (!techniqueId || typeof techniqueId !== 'string') {
    return {
      verified: false,
      techniqueId: techniqueId || 'UNKNOWN',
      techniqueName: 'Unknown Technique',
      tactics: [],
      limitationNotice: 'Invalid or missing Technique ID parameter.'
    };
  }

  const cleanId = techniqueId.trim().toUpperCase();
  const tech = ENTERPRISE_TECHNIQUES[cleanId];

  if (tech) {
    return {
      verified: true,
      techniqueId: tech.techniqueId,
      techniqueName: tech.techniqueName,
      tactics: tech.tactics,
      description: tech.description,
      url: tech.url,
      isSubtechnique: tech.isSubtechnique,
      parentTechniqueId: tech.parentTechniqueId || null,
      catalogVersion: CATALOG_VERSION,
      source: CATALOG_SOURCE
    };
  }

  // Documented interface report when technique metadata is not available locally
  return {
    verified: false,
    techniqueId: cleanId,
    techniqueName: `Unverified Technique [${cleanId}]`,
    tactics: [],
    description: 'Detailed metadata for this technique ID is not available in the local verified ATT&CK catalog.',
    url: `https://attack.mitre.org/techniques/${cleanId.replace('.', '/')}/`,
    limitationNotice: `Technique ID [${cleanId}] is not present in local verified MITRE ATT&CK ${CATALOG_VERSION} dataset. Metadata cannot be fabricated.`
  };
}

/**
 * Returns all 14 standard enterprise tactics.
 */
function getAllTactics() {
  return [...ENTERPRISE_TACTICS];
}

/**
 * Returns catalog version and provenance metadata.
 */
function getCatalogProvenance() {
  return {
    version: CATALOG_VERSION,
    source: CATALOG_SOURCE,
    releaseDate: CATALOG_RELEASE_DATE,
    verifiedTechniqueCount: Object.keys(ENTERPRISE_TECHNIQUES).length,
    tacticsCount: ENTERPRISE_TACTICS.length
  };
}

/**
 * Checks whether a technique ID exists in the verified local catalog.
 */
function isVerifiedTechnique(techniqueId) {
  if (!techniqueId) return false;
  return !!ENTERPRISE_TECHNIQUES[techniqueId.trim().toUpperCase()];
}

module.exports = {
  CATALOG_VERSION,
  CATALOG_SOURCE,
  getTechniqueMetadata,
  getAllTactics,
  getCatalogProvenance,
  isVerifiedTechnique
};
