const { runInvestigationWorkflow } = require("./agents/investigationWorkflow");

const testCases = [
    {
        name: "Case A: Low Findings Path (Skip to Summary)",
        evidence: {
            fileName: "clean.log",
            fileType: "LOG",
            fileSize: 100,
            source: "Workstation-A"
        },
        evidenceText: "All services operating normally. No issues reported."
    },
    {
        name: "Case B: Normal Path (No Deep Dive)",
        evidence: {
            fileName: "auth.log",
            fileType: "LOG",
            fileSize: 500,
            source: "Workstation-B"
        },
        evidenceText: "failed login for user admin. Source IP: 192.168.1.1"
    },
    {
        name: "Case C: High Threat Path (Triggers Deep Dive)",
        evidence: {
            fileName: "security-event.log",
            fileType: "LOG",
            fileSize: 52480,
            source: "Endpoint-01"
        },
        evidenceText: `
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
        `
    }
];

async function runTests() {
    console.log("=========================================");
    console.log("   TRACE AI LANGGRAPH DYNAMIC ROUTING TEST");
    console.log("=========================================\n");

    for (const testCase of testCases) {
        console.log(`-----------------------------------------`);
        console.log(` RUNNING: ${testCase.name}`);
        console.log(`-----------------------------------------`);

        try {
            const result = await runInvestigationWorkflow(testCase.evidence, testCase.evidenceText);
            console.log("Result:");
            console.log(JSON.stringify(result, null, 2));
            console.log("\nExecution verification:");
            console.log(`- Findings count: ${result.evidenceFindings.length}`);
            console.log(`- IOC count: ${result.iocs.length}`);
            console.log(`- Threat Score: ${result.threatScore}`);
            console.log(`- Threat Level: ${result.threatLevel}`);
            console.log(`- Requires Manual Review: ${result.requiresManualReview}`);
            
            // Branch Verification
            if (testCase.name.includes("Case A")) {
                if (result.iocs.length === 0 && result.threatScore === 0 && !result.requiresManualReview) {
                    console.log("✅ Case A verification PASSED (Successfully skipped IOC/Threat nodes).");
                } else {
                    console.error("❌ Case A verification FAILED.");
                }
            } else if (testCase.name.includes("Case B")) {
                if (result.iocs.length > 0 && result.threatScore > 0 && result.threatScore < 8 && !result.requiresManualReview) {
                    console.log("✅ Case B verification PASSED (Ran all nodes, skipped deepDive).");
                } else {
                    console.error("❌ Case B verification FAILED.");
                }
            } else if (testCase.name.includes("Case C")) {
                if (result.threatScore >= 8 && result.requiresManualReview) {
                    console.log("✅ Case C verification PASSED (Ran all nodes, triggered deepDive).");
                } else {
                    console.error("❌ Case C verification FAILED.");
                }
            }
        } catch (err) {
            console.error(`❌ Test execution failed for ${testCase.name}:`, err);
        }
        console.log("\n");
    }
}

runTests();
