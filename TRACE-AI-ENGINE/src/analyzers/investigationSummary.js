function generateInvestigationSummary(threatResult, iocs) {
    if (!threatResult || !Array.isArray(iocs)) {
        throw new Error("Invalid investigation data");
    }

    const threatLevel = threatResult.threatLevel;
    const threatScore = threatResult.threatScore;
    const iocCount = threatResult.iocCount;

    let summary;

    if (threatLevel === "CRITICAL") {
        summary =
            "Critical threat indicators were identified. Immediate investigation and containment are recommended.";
    } else if (threatLevel === "HIGH") {
        summary =
            "High-risk indicators were identified. Further investigation and appropriate containment actions are recommended.";
    } else if (threatLevel === "MEDIUM") {
        summary =
            "Suspicious indicators were identified. Additional investigation is recommended.";
    } else {
        summary =
            "No significant threat indicators were identified from the analyzed evidence.";
    }

    return {
        title: "TRACE AI Investigation Summary",
        threatLevel,
        threatScore,
        iocCount,
        summary,
        findings: iocs,
        recommendation:
            threatLevel === "HIGH" || threatLevel === "CRITICAL"
                ? "Review the identified indicators and investigate the affected system."
                : "Continue monitoring and collect additional evidence."
    };
}

module.exports = {
    generateInvestigationSummary
};