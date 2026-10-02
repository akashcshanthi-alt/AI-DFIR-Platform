const { analyzeEvidence } = require("./analyzers/evidenceAnalyzer");

const evidence = {
    fileName: "security-event.log",
    fileType: "LOG",
    fileSize: 52480,
    source: "Endpoint-01"
};

const evidenceText = `
Failed login detected from 192.168.1.50
Multiple authentication failure events detected.
Suspicious activity was detected.
Unauthorized access attempt detected.
Administrator account was involved.
`;

const result = analyzeEvidence(evidence, evidenceText);

console.log("=== TRACE AI ADVANCED EVIDENCE ANALYSIS ===");
console.log(JSON.stringify(result, null, 2));