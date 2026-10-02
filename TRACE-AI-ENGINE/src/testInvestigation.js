const { investigate } = require("./investigationEngine");

const evidence = {
    fileName: "security-event.log",
    fileType: "LOG",
    fileSize: 52480,
    source: "Endpoint-01"
};

const evidenceText = `
Multiple suspicious connections detected.

Source IP: 192.168.1.50
Secondary IP: 10.10.20.15

Suspicious URL:
https://malicious-example.com/login

Contact:
attacker@example.com
`;

const result = investigate(evidence, evidenceText);

console.log("=================================");
console.log("   TRACE AI INVESTIGATION ENGINE");
console.log("=================================");

console.log(JSON.stringify(result, null, 2));