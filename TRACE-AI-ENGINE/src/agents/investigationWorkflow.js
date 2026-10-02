const { analyzeEvidence } = require("../analyzers/evidenceAnalyzer");
const { detectIOCs } = require("../analyzers/iocDetector");
const { classifyThreat } = require("../analyzers/threatClassifier");
const { generateInvestigationSummary } = require("../analyzers/investigationSummary");
const { generateNarrative } = require("./aiNarrative");

/**
 * Runs the deterministic LangGraph-based investigation workflow with dynamic routing
 * and optional AI-narrative generation.
 * 
 * @param {Object} evidence Metadata of the evidence file
 * @param {string} evidenceText The content of the evidence
 * @returns {Promise<Object>} The final investigation state/result
 */
async function runInvestigationWorkflow(evidence, evidenceText) {
    // Dynamically import @langchain/langgraph to support ESM in a CommonJS setup
    const { StateGraph, Annotation, START, END } = await import("@langchain/langgraph");

    // 1. Define the typed/shared investigation state
    const InvestigationState = Annotation.Root({
        evidence: Annotation,
        evidenceText: Annotation,
        evidenceFindings: Annotation,
        iocs: Annotation,
        threatScore: Annotation,
        threatLevel: Annotation,
        summary: Annotation,
        recommendations: Annotation,
        requiresManualReview: Annotation,
        narrativeInputTruncated: Annotation,
        narrative: Annotation,
        error: Annotation
    });

    // 2. Define Nodes wrapping existing analyzer functions
    
    // Node A: Evidence Analysis
    const evidenceAnalysisNode = (state) => {
        if (state.error) return {};
        try {
            const result = analyzeEvidence(state.evidence, state.evidenceText || "");
            return {
                evidenceFindings: result.findings
            };
        } catch (err) {
            return {
                error: `Evidence Analysis failed: ${err.message}`
            };
        }
    };

    // Node B: IOC Detection
    const iocDetectionNode = (state) => {
        if (state.error) return {};
        try {
            const result = detectIOCs(state.evidenceText || "");
            return {
                iocs: result.iocs
            };
        } catch (err) {
            return {
                error: `IOC Detection failed: ${err.message}`
            };
        }
    };

    // Node C: Threat Classification
    const threatClassificationNode = (state) => {
        if (state.error) return {};
        try {
            const result = classifyThreat(state.iocs || []);
            return {
                threatScore: result.threatScore,
                threatLevel: result.threatLevel
            };
        } catch (err) {
            return {
                error: `Threat Classification failed: ${err.message}`
            };
        }
    };

    // Node D: Deep Dive Node
    const deepDiveNode = (state) => {
        if (state.error) return {};
        try {
            console.log(`>>> [Node: deepDive] Threat score ${state.threatScore} is high. Flagging for manual review.`);
            return {
                requiresManualReview: true
            };
        } catch (err) {
            return {
                error: `Deep Dive analysis failed: ${err.message}`
            };
        }
    };

    // Node E: Investigation Summary
    const investigationSummaryNode = (state) => {
        if (state.error) return {};
        try {
            const threatResult = {
                threatLevel: state.threatLevel || "LOW",
                threatScore: state.threatScore || 0,
                iocCount: (state.iocs || []).length
            };
            const result = generateInvestigationSummary(threatResult, state.iocs || []);
            return {
                summary: result.summary,
                recommendations: result.recommendation
            };
        } catch (err) {
            return {
                error: `Investigation Summary failed: ${err.message}`
            };
        }
    };

    // Node F: AI Narrative Node
    const aiNarrativeNode = async (state) => {
        if (state.error) return {};
        try {
            const result = await generateNarrative(state);
            return result;
        } catch (err) {
            return {
                error: `AI Narrative generation failed: ${err.message}`
            };
        }
    };

    // 3. Define routing functions for conditional edges
    
    // Route after Evidence Analysis
    const routeAfterEvidenceAnalysis = (state) => {
        if (state.error) return "generateSummary";
        
        const findings = state.evidenceFindings || [];
        const hasMediumOrHigh = findings.some(
            f => f.severity === "MEDIUM" || f.severity === "HIGH"
        );

        if (!hasMediumOrHigh) {
            console.log(">>> [Routing] No MEDIUM/HIGH findings. Skipping IOC detection and Threat Classification.");
            return "skipToSummary";
        }
        
        console.log(">>> [Routing] MEDIUM/HIGH findings found. Proceeding to detectIOCs.");
        return "detectIOCs";
    };

    // Route after Threat Classification
    const routeAfterThreatClassification = (state) => {
        if (state.error) return "generateSummary";

        if (state.threatScore >= 8) {
            console.log(`>>> [Routing] Threat score ${state.threatScore} >= 8. Routing to deepDive.`);
            return "deepDive";
        }

        console.log(`>>> [Routing] Threat score ${state.threatScore} < 8. Routing to generateSummary.`);
        return "generateSummary";
    };

    // Route after generateSummary (New)
    const routeAfterSummary = (state) => {
        if (state.error) return "end";

        if (process.env.ENABLE_AI_NARRATIVE === "true") {
            console.log(">>> [Routing] ENABLE_AI_NARRATIVE is true. Routing to aiNarrative.");
            return "aiNarrative";
        }

        console.log(">>> [Routing] ENABLE_AI_NARRATIVE is false/unset. Routing to END.");
        return "end";
    };

    // 4. Connect nodes with conditional and standard edges
    const workflow = new StateGraph(InvestigationState)
        .addNode("analyzeEvidence", evidenceAnalysisNode)
        .addNode("detectIOCs", iocDetectionNode)
        .addNode("classifyThreat", threatClassificationNode)
        .addNode("deepDive", deepDiveNode)
        .addNode("generateSummary", investigationSummaryNode)
        .addNode("aiNarrative", aiNarrativeNode)
        
        .addEdge(START, "analyzeEvidence")
        
        // Conditional route after analyzeEvidence
        .addConditionalEdges(
            "analyzeEvidence",
            routeAfterEvidenceAnalysis,
            {
                "detectIOCs": "detectIOCs",
                "skipToSummary": "generateSummary"
            }
        )
        
        // Standard edge from detectIOCs to classifyThreat
        .addEdge("detectIOCs", "classifyThreat")
        
        // Conditional route after classifyThreat
        .addConditionalEdges(
            "classifyThreat",
            routeAfterThreatClassification,
            {
                "deepDive": "deepDive",
                "generateSummary": "generateSummary"
            }
        )
        
        // Edge from deepDive to generateSummary
        .addEdge("deepDive", "generateSummary")
        
        // Conditional route after generateSummary
        .addConditionalEdges(
            "generateSummary",
            routeAfterSummary,
            {
                "aiNarrative": "aiNarrative",
                "end": END
            }
        )
        
        // Edge from aiNarrative to END
        .addEdge("aiNarrative", END);

    const app = workflow.compile();

    // Initialize state
    const initialState = {
        evidence,
        evidenceText,
        evidenceFindings: [],
        iocs: [],
        threatScore: 0,
        threatLevel: "LOW",
        summary: "",
        recommendations: "",
        requiresManualReview: false,
        narrativeInputTruncated: false,
        narrative: null,
        error: null
    };

    const finalState = await app.invoke(initialState);

    // Return a clean, structured JSON result
    return {
        evidence: finalState.evidence,
        evidenceFindings: finalState.evidenceFindings || [],
        iocs: finalState.iocs || [],
        threatScore: finalState.threatScore || 0,
        threatLevel: finalState.threatLevel || "LOW",
        summary: finalState.summary || "",
        recommendations: finalState.recommendations || "",
        requiresManualReview: finalState.requiresManualReview || false,
        narrativeInputTruncated: finalState.narrativeInputTruncated || false,
        narrative: finalState.narrative || null,
        error: finalState.error || null
    };
}

module.exports = {
    runInvestigationWorkflow
};
