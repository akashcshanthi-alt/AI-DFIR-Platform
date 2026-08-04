const selectThreatProfile = (caseData) => {
  const text = `${caseData.title} ${caseData.description}`.toLowerCase();
  
  if (text.includes('ad') || text.includes('kerber') || text.includes('lsass') || text.includes('active directory') || text.includes('directory') || text.includes('credential')) {
    return 'active-directory';
  }
  if (text.includes('ssh') || text.includes('brute') || text.includes('login') || text.includes('password') || text.includes('auth')) {
    return 'ssh-brute-force';
  }
  if (text.includes('bucket') || text.includes('s3') || text.includes('cloud') || text.includes('exfil') || text.includes('data')) {
    return 'data-exfiltration';
  }
  return 'generic';
};

const getAnalysisPayload = (caseData, evidenceItems = []) => {
  const profile = selectThreatProfile(caseData);
  const srcIP = caseData.sourceIP || '198.51.100.12';
  const dstIP = caseData.destinationIP || '10.0.0.122';
  const hostName = caseData.targetHost || 'WORKSTATION-01';

  let riskScore = 50;
  if (caseData.severity === 'CRITICAL') riskScore = 92;
  else if (caseData.severity === 'HIGH') riskScore = 78;
  else if (caseData.severity === 'MEDIUM') riskScore = 54;
  else if (caseData.severity === 'LOW') riskScore = 25;

  let basePayload = {};

  if (profile === 'active-directory') {
    basePayload = {
      analysis: `Detected anomalous TGS ticket requests targeting high-privilege service accounts (Kerberoasting) originating from source node [${srcIP}]. This was immediately followed by local admin access dumps targeting LSASS on host [${hostName}]. The threat actor is staging credentials for lateral movement across the AD Domain Controller.`,
      summary: `Active Directory Kerberoasting ticket gathering and LSASS credential dumping on host ${hostName} designed for lateral privilege escalation.`,
      rootCause: `Compromised local VPN gateway credentials on analyst workstation, leading to local administrator privilege elevation.`,
      recommendedActions: [
        `Terminate active Kerberos TGS sessions for host ${hostName}.`,
        `Force password resets for AD administrator accounts.`,
        `Isolate target host ${hostName} at local IP ${dstIP}.`
      ],
      confidence: 96,
      progress: 75,
      nextSteps: `Rotate AD ticket granting service accounts (krbtgt), block lateral RDP packets, and audit security logs.`,
      mitre: [
        { id: "T1558.003", name: "Kerberoasting", phase: "Credential Access" },
        { id: "T1003.001", name: "OS Credential Dumping: LSASS Memory", phase: "Credential Access" },
        { id: "T1021.001", name: "RDP Lateral Movement", phase: "Lateral Movement" }
      ],
      iocs: [
        { type: "IP", value: srcIP, description: "Threat source origin IP" },
        { type: "IP", value: dstIP, description: "Target host IP" },
        { type: "Domain", value: "auth-gateway.internal", description: "Authentication interface target" }
      ]
    };
  } else if (profile === 'ssh-brute-force') {
    basePayload = {
      analysis: `Massive SSH brute-force password spraying detected from external node [${srcIP}] against SSH Gateway interface. Over 4,500 authentication failures logged in a 15-minute window. Actor then launched scanning packages probing for CVE-2024-6387 (regreSSHion) indicators on host [${hostName}].`,
      summary: `Automated password spray campaign check on public-facing SSH server nodes seeking vulnerability exploits.`,
      rootCause: `Publicly accessible gateway port 22 with legacy password-based authentication enabled without rate limiters.`,
      recommendedActions: [
        `Add source address ${srcIP} to global firewall blocklist rules.`,
        `Disable password login policies on gateway servers, forcing PKI SSH keys only.`,
        `Enable Fail2Ban server rules to restrict login failure rates.`
      ],
      confidence: 88,
      progress: 90,
      nextSteps: `Enable multi-factor authorization (MFA) on SSH interfaces, and move default listening port from 22.`,
      mitre: [
        { id: "T1110.001", name: "Password Brute Forcing", phase: "Credential Access" },
        { id: "T1190", name: "Exploiting Public-Facing Application", phase: "Initial Access" }
      ],
      iocs: [
        { type: "IP", value: srcIP, description: "Brute force origin server" },
        { type: "Domain", value: "ssh-gateway.trace-dfir.net", description: "Target domain" }
      ]
    };
  } else if (profile === 'data-exfiltration') {
    basePayload = {
      analysis: `Local archive data staging operations detected on developer host [${hostName}]. Attacker compiled repositories into encrypted folders, subsequently exfiltrating data payloads to target S3 bucket location s3.us-east-1.amazonaws.com.`,
      summary: `Insider threat or compromised developer credentials exfiltrating database repositories to an external AWS S3 cloud bucket.`,
      rootCause: `Developer account access keys leaked or misused to stage files out of authorization boundaries.`,
      recommendedActions: [
        `Revoke access tokens and suspend authorization credentials.`,
        `Block outbound network requests directed to S3 cloud storage endpoints.`,
        `Run file-level audit checks to identify exactly what repositories were exfiltrated.`
      ],
      confidence: 92,
      progress: 60,
      nextSteps: `Rotate GitHub and cloud credentials, check AWS IAM roles, and enable DLP (Data Loss Prevention) monitors.`,
      mitre: [
        { id: "T1567.002", name: "Exfiltration to Cloud Storage", phase: "Exfiltration" },
        { id: "T1074.001", name: "Data Staged Locally", phase: "Collection" }
      ],
      iocs: [
        { type: "URL", value: "https://s3.us-east-1.amazonaws.com/exfiltrated-bucket-dump/", description: "Exfiltration bucket link" },
        { type: "Domain", value: "s3.us-east-1.amazonaws.com", description: "AWS S3 endpoint" }
      ]
    };
  } else {
    // Generic fallback
    basePayload = {
      analysis: `Identified unusual telemetry execution or logon signatures matching anomalous traffic routing. Triage heuristics indicate lateral movement attempts from IP [${srcIP}] directed at local host [${hostName}].`,
      summary: `Elevated system anomalies and network connections flagged on local workstation ${hostName}.`,
      rootCause: `Suspicious executable files execution or out-of-bounds user privilege escalations.`,
      recommendedActions: [
        `Isolate host ${hostName} from internal network interfaces.`,
        `Audit processes trees, registry entries, and logon events.`,
        `Rotate local system administrator password parameters.`
      ],
      confidence: 80,
      progress: 50,
      nextSteps: `Check local antivirus dashboards, capture active process memory, and trace network sockets.`,
      mitre: [
        { id: "T1204.002", name: "User Execution: Malicious File", phase: "Execution" }
      ],
      iocs: [
        { type: "IP", value: srcIP, description: "Suspicious peer host IP" }
      ]
    };
  }

  // Populate dynamic evidence hashes if available in evidence items
  evidenceItems.forEach(item => {
    if (item.sha256Hash) {
      basePayload.iocs.push({
        type: 'Hash',
        value: item.sha256Hash,
        description: `Evidence file ${item.originalName} SHA-256 hash`
      });
    }
  });

  return {
    ...basePayload,
    riskScore
  };
};

/**
 * Generates chat response based on case context and question content
 */
const generateChatResponse = (caseData, messages) => {
  const profile = selectThreatProfile(caseData);
  const srcIP = caseData.sourceIP || '198.51.100.12';
  const dstIP = caseData.destinationIP || '10.0.0.122';
  const hostName = caseData.targetHost || 'WORKSTATION-01';

  const lastUserMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';

  let reply = '';

  if (lastUserMessage.includes('mitigat') || lastUserMessage.includes('recom') || lastUserMessage.includes('action') || lastUserMessage.includes('fix')) {
    if (profile === 'active-directory') {
      reply = `Here are the active mitigation recommendations for AD Case #${caseData.caseId}:
1. Immediately **isolate Host ${hostName}** at IP address ${dstIP}.
2. **Reset credentials** for krbtgt accounts and compromise service accounts.
3. Review RDP access rules to block internal lateral hops.`;
    } else if (profile === 'ssh-brute-force') {
      reply = `Here is the recovery playbook for SSH Spray Case #${caseData.caseId}:
1. **Block source IP ${srcIP}** in global firewall rules.
2. Force public SSH key authorization, disabling standard password logins.
3. Implement Fail2Ban gateway block intervals.`;
    } else {
      reply = `Here are recommended mitigation steps for the host ${hostName}:
1. Isolate the node at ${dstIP}.
2. Check memory dumps for malicious files, and trace parent process IDs.
3. Force password resets for all active analyst sessions.`;
    }
  } else if (lastUserMessage.includes('ip') || lastUserMessage.includes('ioc') || lastUserMessage.includes('hash') || lastUserMessage.includes('indicator')) {
    reply = `Analyzing network telemetry logs for Case #${caseData.caseId}. The active threat indicators are:
- **Attacker Source IP**: \`${srcIP}\`
- **Target Host IP**: \`${dstIP}\`
- **Exposed Host**: \`${hostName}\`
- **Suspect signature hashes**: MD5/SHA-256 integrity models are correlated in the Indicators Tab. Let me know if you want me to search threat feeds for these hashes.`;
  } else if (lastUserMessage.includes('root') || lastUserMessage.includes('cause') || lastUserMessage.includes('phish') || lastUserMessage.includes('how')) {
    if (profile === 'active-directory') {
      reply = `The root cause appears to be **credential theft targeting administrative endpoints**, which allowed the attacker to gain initial access, execute LSASS credential dumping on workstation ${hostName}, and gather active TGS tickets.`;
    } else if (profile === 'ssh-brute-force') {
      reply = `The root cause is a **publicly exposed port 22 (SSH)** with weak password login rules and no rate limiting. This allowed brute force scripts to spray credentials.`;
    } else {
      reply = `Root cause is still being triaged, but indicators show **unauthorized privilege execution** or leaks of developer access tokens.`;
    }
  } else {
    // Default helpful responses
    reply = `I am analyzing the threat profile of Case #${caseData.caseId} (${caseData.title}).
- Attacker IP matches suspected signatures at \`${srcIP}\`.
- Compromised target host is identified as \`${hostName}\`.

I suggest isolates at node \`${dstIP}\` and auditing Active Directory session lifecycles. What specific files, hashes, or mitigation playbooks can I retrieve for you?`;
  }

  return {
    role: 'assistant',
    content: reply,
    timestamp: new Date()
  };
};

module.exports = {
  getAnalysisPayload,
  generateChatResponse
};
