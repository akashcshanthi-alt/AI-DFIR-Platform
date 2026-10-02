const { detectIOCs } = require("./analyzers/iocDetector");

const evidenceText = `
Suspicious login detected from 192.168.1.50.
Attacker contacted https://malicious-example.com/login
Contact: attacker@example.com
Another connection came from 10.10.20.15
`;

const result = detectIOCs(evidenceText);

console.log("=== TRACE AI IOC DETECTION ===");
console.log(JSON.stringify(result, null, 2));