const { investigate } = require("./investigationEngine");

const evidence = {
    fileName: "security-event.log",
    fileType: "LOG",
    fileSize: 52480,
    source: "Endpoint-01"
};

const evidenceText = `
Failed login detected from 192.168.1.50
Multiple authentication failures detected.
Suspicious activity was detected.
Unauthorized access attempt detected.
Administrator account was involved.

Connection observed:
10.10.20.15

Suspicious URL:
https://malicious-example.com/login

Contact:
attacker@example.com
`;

const result = investigate(evidence, evidenceText);

console.log("========================================");
console.log("     TRACE AI FULL INVESTIGATION");
console.log("========================================");

console.log(JSON.stringify(result, null, 2));
