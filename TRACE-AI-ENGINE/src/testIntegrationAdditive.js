const { investigate, investigateWithGraph } = require("./investigationEngine");
const { setMockAnthropicInstance } = require("./agents/aiNarrative");

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
    console.log("  TRACE AI ENGINE ADDITIVE INTEGRATION TEST");
    console.log("=========================================\n");

    // A. Verify that the original investigate function still works synchronously
    console.log("-----------------------------------------");
    console.log(" VERIFYING: Original Synchronous investigate()");
    console.log("-----------------------------------------");
    const syncStart = Date.now();
    const syncResult = investigate(evidence, evidenceText);
    const syncDuration = Date.now() - syncStart;
    
    console.log(`- Execution duration: ${syncDuration}ms (expected close to 0ms)`);
    console.log(`- Returned keys:`, Object.keys(syncResult));
    console.log(`- threatLevel (Expect HIGH): ${syncResult.threat?.threatLevel}`);
    console.log(`- has requiresManualReview (Expect undefined): ${syncResult.requiresManualReview === undefined}`);
    
    if (syncResult.threat?.threatLevel === "HIGH" && syncResult.requiresManualReview === undefined) {
        console.log("✅ Synchronous investigate() verification passed.");
    } else {
        console.error("❌ Synchronous investigate() verification failed.");
        process.exit(1);
    }

    console.log("\n");

    // B. Verify investigateWithGraph() successfully executes the LangGraph workflow
    console.log("-----------------------------------------");
    console.log(" VERIFYING: investigateWithGraph() - Narrative Off");
    console.log("-----------------------------------------");
    process.env.ENABLE_AI_NARRATIVE = "false";
    setMockAnthropicInstance(null);
    
    try {
        const graphResult = await investigateWithGraph(evidence, evidenceText);
        console.log(`- Returned keys:`, Object.keys(graphResult));
        console.log(`- threatLevel (Expect HIGH): ${graphResult.threat?.threatLevel}`);
        console.log(`- threatScore (Expect 8): ${graphResult.threat?.threatScore}`);
        console.log(`- requiresManualReview (Expect true): ${graphResult.requiresManualReview}`);
        console.log(`- narrative (Expect null): ${graphResult.narrative}`);
        
        const passed = graphResult.threat?.threatLevel === "HIGH" &&
                       graphResult.threat?.threatScore === 8 &&
                       graphResult.requiresManualReview === true &&
                       graphResult.narrative === null;

        if (passed) {
            console.log("✅ investigateWithGraph() verification passed (Narrative Off).");
        } else {
            console.error("❌ investigateWithGraph() verification failed (Narrative Off).");
            process.exit(1);
        }
    } catch (err) {
        console.error("❌ Execution failed for investigateWithGraph():", err);
        process.exit(1);
    }

    console.log("\n");

    // C. Verify investigateWithGraph() with narrative enabled
    console.log("-----------------------------------------");
    console.log(" VERIFYING: investigateWithGraph() - Narrative On");
    console.log("-----------------------------------------");
    process.env.ENABLE_AI_NARRATIVE = "true";
    
    // Set a mock client to avoid calling actual API or failing on missing key
    const mockClient = {
        messages: {
            create: async () => {
                return {
                    content: [{
                        text: JSON.stringify({ narrative: "Mocked narrative output for additive integration test" })
                    }]
                };
            }
        }
    };
    setMockAnthropicInstance(mockClient);
    
    try {
        const graphResultNarrative = await investigateWithGraph(evidence, evidenceText);
        console.log(`- requiresManualReview (Expect true): ${graphResultNarrative.requiresManualReview}`);
        console.log(`- narrative (Expect non-empty string): "${graphResultNarrative.narrative}"`);
        
        const passed = graphResultNarrative.requiresManualReview === true &&
                       graphResultNarrative.narrative !== null &&
                       typeof graphResultNarrative.narrative === "string" &&
                       graphResultNarrative.narrative.length > 0;

        if (passed) {
            console.log("✅ investigateWithGraph() verification passed (Narrative On).");
        } else {
            console.error("❌ investigateWithGraph() verification failed (Narrative On).");
            process.exit(1);
        }
    } catch (err) {
        console.error("❌ Execution failed for investigateWithGraph():", err);
        process.exit(1);
    }

    console.log("\nAll integration test cases passed successfully!");
    setMockAnthropicInstance(null);
}

main();
