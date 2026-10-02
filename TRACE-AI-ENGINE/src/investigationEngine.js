const { runInvestigationWorkflow } = require("./agents/investigationWorkflow");
const { analyzeEvidence } = require("./analyzers/evidenceAnalyzer");
const { detectIOCs } = require("./analyzers/iocDetector");
const { classifyThreat } = require("./analyzers/threatClassifier");
const { generateInvestigationSummary } = require("./analyzers/investigationSummary");

/**
 * Original synchronous investigation engine.
 * Calls deterministic analyzers sequentially and returns synchronous results.
 * 
 * @param {Object} evidence Evidence metadata
 * @param {string} evidenceText Content of evidence
 * @returns {Object} Deterministic security report
 */
function investigate(evidence, evidenceText) {
    const evidenceResult = analyzeEvidence(
        evidence,
        evidenceText
    );

    const iocResult = detectIOCs(evidenceText);

    const threatResult = classifyThreat(
        iocResult.iocs
    );

    const summary = generateInvestigationSummary(
        threatResult,
        iocResult.iocs
    );

    return {
        evidence: evidenceResult,
        iocs: iocResult,
        threat: threatResult,
        summary
    };
}

/**
 * Additive async investigation engine utilizing the LangGraph workflow.
 * 
 * @param {Object} evidence Evidence metadata
 * @param {string} evidenceText Content of evidence
 * @returns {Promise<Object>} Reconstructed normalized structure with LangGraph-specific fields
 */
async function investigateWithGraph(evidence, evidenceText) {
    try {
        const finalState = await runInvestigationWorkflow(evidence, evidenceText);
        
        // Reconstruct riskLevel expected by legacy evidenceResult
        let riskLevel = "LOW";
        if (finalState.evidenceFindings && finalState.evidenceFindings.some(f => f.severity === "HIGH")) {
            riskLevel = "HIGH";
        } else if (finalState.evidenceFindings && finalState.evidenceFindings.some(f => f.severity === "MEDIUM")) {
            riskLevel = "MEDIUM";
        }

        const evidenceResult = {
            analyzer: "TRACE AI Evidence Analyzer",
            status: "ANALYZED",
            evidence: {
                fileName: finalState.evidence?.fileName || "Unknown",
                fileType: finalState.evidence?.fileType || "Unknown",
                fileSize: finalState.evidence?.fileSize || 0,
                source: finalState.evidence?.source || "Unknown"
            },
            findings: finalState.evidenceFindings || [],
            riskLevel,
            summary: finalState.evidenceFindings && finalState.evidenceFindings.length > 0
                ? `${finalState.evidenceFindings.length} security finding(s) detected in the evidence.`
                : "No significant security findings detected in the evidence."
        };

        const iocResult = {
            total: (finalState.iocs || []).length,
            iocs: finalState.iocs || []
        };

        const threatResult = {
            threatLevel: finalState.threatLevel || "LOW",
            threatScore: finalState.threatScore || 0,
            iocCount: (finalState.iocs || []).length
        };

        const summary = {
            title: "TRACE AI Investigation Summary",
            threatLevel: finalState.threatLevel || "LOW",
            threatScore: finalState.threatScore || 0,
            iocCount: (finalState.iocs || []).length,
            summary: finalState.summary || "",
            findings: finalState.iocs || [],
            recommendation: finalState.recommendations || ""
        };

        return {
            evidence: evidenceResult,
            iocs: iocResult,
            threat: threatResult,
            summary,
            requiresManualReview: finalState.requiresManualReview || false,
            narrativeInputTruncated: finalState.narrativeInputTruncated || false,
            narrative: finalState.narrative || null,
            error: finalState.error || null
        };
    } catch (err) {
        // Safe error handling: return error metadata instead of crashing
        return {
            evidence: null,
            iocs: null,
            threat: null,
            summary: null,
            requiresManualReview: false,
            narrativeInputTruncated: false,
            narrative: null,
            error: `Workflow execution failed: ${err.message}`
        };
    }
}

module.exports = {
    investigate,
    investigateWithGraph
};