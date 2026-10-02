const { analyzeEvidence } = require("./analyzers/evidenceAnalyzer");

const evidence = {
    fileName: "incident-log.txt",
    fileType: "TXT",
    fileSize: 24576,
    source: "Endpoint-01"
};

const result = analyzeEvidence(evidence);

console.log("=== TRACE AI EVIDENCE ANALYSIS ===");
console.log(JSON.stringify(result, null, 2));