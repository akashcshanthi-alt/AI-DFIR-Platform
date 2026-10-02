const { runInvestigationWorkflow } = require("./agents/investigationWorkflow");

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

async function main() {
    console.log("=========================================");
    console.log("   TRACE AI LANGGRAPH WORKFLOW TEST");
    console.log("=========================================");

    try {
        const result = await runInvestigationWorkflow(evidence, evidenceText);
        console.log(JSON.stringify(result, null, 2));
        
        if (result.error) {
            console.error("\nWorkflow completed with error status:", result.error);
            process.exit(1);
        } else {
            console.log("\nWorkflow completed successfully.");
        }
    } catch (err) {
        console.error("Test execution failed:", err);
        process.exit(1);
    }
}

main();
