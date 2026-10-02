function analyzeEvidence(evidence, evidenceText = "") {
    if (!evidence || typeof evidence !== "object") {
        throw new Error("Invalid evidence data");
    }

    if (typeof evidenceText !== "string") {
        throw new Error("Evidence text must be a string");
    }

    const {
        fileName = "Unknown",
        fileType = "Unknown",
        fileSize = 0,
        source = "Unknown"
    } = evidence;

    const findings = [];

    // Authentication-related findings
    if (/failed login|authentication failure|login failed/i.test(evidenceText)) {
        findings.push({
            category: "AUTHENTICATION",
            finding: "Multiple or failed authentication activity detected",
            severity: "MEDIUM"
        });
    }

    // Suspicious activity
    if (/suspicious|malicious|unauthorized|attack/i.test(evidenceText)) {
        findings.push({
            category: "SECURITY_EVENT",
            finding: "Suspicious security activity detected",
            severity: "HIGH"
        });
    }

    // Administrative activity
    if (/\badmin\b|\badministrator\b/i.test(evidenceText)) {
        findings.push({
            category: "PRIVILEGED_ACTIVITY",
            finding: "Administrative account activity detected",
            severity: "MEDIUM"
        });
    }

    let riskLevel = "LOW";

    if (findings.some(f => f.severity === "HIGH")) {
        riskLevel = "HIGH";
    } else if (findings.some(f => f.severity === "MEDIUM")) {
        riskLevel = "MEDIUM";
    }

    return {
        analyzer: "TRACE AI Evidence Analyzer",
        status: "ANALYZED",

        evidence: {
            fileName,
            fileType,
            fileSize,
            source
        },

        findings,
        riskLevel,

        summary:
            findings.length > 0
                ? `${findings.length} security finding(s) detected in the evidence.`
                : "No significant security findings detected in the evidence."
    };
}

module.exports = {
    analyzeEvidence
};