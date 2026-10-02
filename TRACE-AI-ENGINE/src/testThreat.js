const { detectIOCs } = require("./analyzers/iocDetector");
const { classifyThreat } = require("./analyzers/threatClassifier");

const evidenceText = `
Suspicious connection from 192.168.1.50
Another connection from 10.10.20.15
Attacker contacted https://malicious-example.com/login
Contact email: attacker@example.com
`;

const iocResult = detectIOCs(evidenceText);

const threatResult = classifyThreat(iocResult.iocs);

console.log("=== TRACE AI THREAT CLASSIFICATION ===");
console.log(JSON.stringify(threatResult, null, 2));