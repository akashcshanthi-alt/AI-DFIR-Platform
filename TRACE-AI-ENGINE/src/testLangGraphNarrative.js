const { runInvestigationWorkflow } = require("./agents/investigationWorkflow");
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

async function runTests() {
    console.log("=========================================");
    console.log("   TRACE AI LANGGRAPH NARRATIVE LAYER TEST");
    console.log("=========================================\n");

    // Test 1: Flag set to "false" (or unset)
    console.log("-----------------------------------------");
    console.log(" RUN 1: ENABLE_AI_NARRATIVE = false");
    console.log("-----------------------------------------");
    process.env.ENABLE_AI_NARRATIVE = "false";
    setMockAnthropicInstance(null);
    
    try {
        const resultDisabled = await runInvestigationWorkflow(evidence, evidenceText);
        console.log(`- Narrative populated: ${resultDisabled.narrative !== null}`);
        console.log(`- Narrative value: ${resultDisabled.narrative}`);
        
        if (resultDisabled.narrative === null) {
            console.log("✅ Run 1 passed (Narrative is null as expected).");
        } else {
            console.error("❌ Run 1 failed: Narrative should be null.");
        }
    } catch (err) {
        console.error("❌ Run 1 execution failed:", err);
    }

    console.log("\n");

    // Test 2: Flag set to "true"
    console.log("-----------------------------------------");
    console.log(" RUN 2: ENABLE_AI_NARRATIVE = true");
    console.log("-----------------------------------------");
    process.env.ENABLE_AI_NARRATIVE = "true";
    
    // Set a mock client to avoid calling actual API or failing on missing key
    const mockClient = {
        messages: {
            create: async () => {
                return {
                    content: [{
                        text: JSON.stringify({ narrative: "Mocked narrative output for narrative test" })
                    }]
                };
            }
        }
    };
    setMockAnthropicInstance(mockClient);
    
    try {
        const resultEnabled = await runInvestigationWorkflow(evidence, evidenceText);
        console.log(`- Narrative populated: ${resultEnabled.narrative !== null}`);
        console.log(`- Narrative value: "${resultEnabled.narrative}"`);
        
        if (resultEnabled.narrative !== null && typeof resultEnabled.narrative === "string" && resultEnabled.narrative.length > 0) {
            console.log("✅ Run 2 passed (Narrative is populated as expected).");
        } else {
            console.error("❌ Run 2 failed: Narrative should be a non-empty string.");
        }
    } catch (err) {
        console.error("❌ Run 2 execution failed:", err);
    }
    
    console.log("\n");
    setMockAnthropicInstance(null);
}

runTests();
