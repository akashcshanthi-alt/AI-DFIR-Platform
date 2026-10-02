function classifyThreat(iocs) {
    if (!Array.isArray(iocs)) {
        throw new Error("IOCs must be an array");
    }

    let score = 0;

    for (const ioc of iocs) {
        if (ioc.type === "IP_ADDRESS") {
            score += 2;
        }

        if (ioc.type === "URL") {
            score += 3;
        }

        if (ioc.type === "EMAIL") {
            score += 1;
        }

        if (ioc.severity === "HIGH") {
            score += 3;
        }

        if (ioc.severity === "CRITICAL") {
            score += 5;
        }
    }

    let level = "LOW";

    if (score >= 10) {
        level = "CRITICAL";
    } else if (score >= 7) {
        level = "HIGH";
    } else if (score >= 4) {
        level = "MEDIUM";
    }

    return {
        threatLevel: level,
        threatScore: score,
        iocCount: iocs.length
    };
}

module.exports = {
    classifyThreat
};