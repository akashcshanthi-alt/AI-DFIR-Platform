function detectIOCs(text) {
    if (typeof text !== "string") {
        throw new Error("Input must be text");
    }

    const iocs = [];

    // IPv4 addresses
    const ipPattern = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;

    // Email addresses
    const emailPattern =
        /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

    // URLs
    const urlPattern =
        /https?:\/\/[^\s"'<>]+/gi;

    const ips = text.match(ipPattern) || [];
    const emails = text.match(emailPattern) || [];
    const urls = text.match(urlPattern) || [];

    ips.forEach(value => {
        iocs.push({
            type: "IP_ADDRESS",
            value,
            severity: "MEDIUM"
        });
    });

    emails.forEach(value => {
        iocs.push({
            type: "EMAIL",
            value,
            severity: "LOW"
        });
    });

    urls.forEach(value => {
        iocs.push({
            type: "URL",
            value,
            severity: "MEDIUM"
        });
    });

    return {
        total: iocs.length,
        iocs
    };
}

module.exports = {
    detectIOCs
};