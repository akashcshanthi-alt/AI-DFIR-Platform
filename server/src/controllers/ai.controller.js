const Case = require('../models/Case');
const Evidence = require('../models/Evidence');
const IOC = require('../models/IOC');
const TimelineEvent = require('../models/TimelineEvent');
const MitreMapping = require('../models/MitreMapping');
const InvestigationRun = require('../models/InvestigationRun');
const { getAnalysisPayload } = require('../services/aiMockService');
const { runCaseDetection } = require('../services/iocDetection.service');

/**
 * POST /api/ai/analyze
 */
const analyzeCase = async (req, res, next) => {
  try {
    const { caseId } = req.body;
    if (!caseId) {
      return res.status(400).json({
        success: false,
        error: { message: 'caseId is required.', status: 400 }
      });
    }

    const caseData = await Case.findOne({ caseId });
    if (!caseData) {
      return res.status(404).json({
        success: false,
        error: { message: `Case [${caseId}] not found.`, status: 404 }
      });
    }

    const evidenceItems = await Evidence.find({ caseId });

    const payload = getAnalysisPayload(caseData, evidenceItems);

    return res.status(200).json({
      success: true,
      data: payload
    });

  } catch (error) {
    next(error);
  }
};

const chatCopilot = async (req, res, next) => {
  try {
    const { caseId, messages, message } = req.body;
    const messageList = Array.isArray(messages) ? messages : (message ? [{ role: 'user', content: message }] : null);
    if (!caseId || !messageList || messageList.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'caseId and messages array (or message string) are required.', status: 400 }
      });
    }

    const userId = req.user?.id || req.user?._id;
    const caseData = await Case.findOne({ caseId, createdBy: userId }) || await Case.findOne({ caseId });
    if (!caseData) {
      return res.status(404).json({
        success: false,
        error: { message: `Case [${caseId}] not found or access unauthorized.`, status: 404 }
      });
    }

    // Verify live Ollama connectivity
    const readiness = await checkReadiness().catch(() => ({ ready: false }));
    if (!readiness.ready) {
      return res.status(200).json({
        success: true,
        data: {
          message: {
            role: 'assistant',
            content: 'Ollama is unavailable. AI analysis cannot be completed.',
            timestamp: new Date()
          }
        }
      });
    }

    // Fetch real evidence and derived deterministic findings for this case
    const [evidenceItems, iocList, timelineEvents, mitreMappings, lastRun] = await Promise.all([
      Evidence.find({ caseId }).lean(),
      IOC.find({ caseId }).lean(),
      TimelineEvent.find({ caseId }).sort({ timestamp: 1 }).lean(),
      MitreMapping.find({ caseId }).lean(),
      InvestigationRun.findOne({ caseId }).sort({ createdAt: -1 }).lean()
    ]);

    const lastUserMsg = messageList[messageList.length - 1]?.content || '';

    // Build context strictly from real evidence items
    const evidenceLines = [];
    evidenceItems.forEach(ev => {
      evidenceLines.push(`[${ev.evidenceId}] File: ${ev.originalName} (${ev.fileType}, ${ev.fileSize} bytes, SHA-256: ${ev.sha256Hash || 'N/A'}) | Parsing Status: ${ev.parsing?.status || 'N/A'}`);
      if (ev.parsing?.artifacts) {
        const art = ev.parsing.artifacts;
        if (art.ips?.length) evidenceLines.push(`   - Extracted IPs: ${art.ips.join(', ')}`);
        if (art.domains?.length) evidenceLines.push(`   - Extracted Domains: ${art.domains.join(', ')}`);
        if (art.urls?.length) evidenceLines.push(`   - Extracted URLs: ${art.urls.join(', ')}`);
        if (art.users?.length) evidenceLines.push(`   - Extracted Users: ${art.users.join(', ')}`);
        if (art.processes?.length) evidenceLines.push(`   - Extracted Processes: ${art.processes.join(', ')}`);
      }
      if (ev.parsing?.records?.length) {
        evidenceLines.push(`   - Sample Parsed Records (${Math.min(10, ev.parsing.records.length)}):`);
        ev.parsing.records.slice(0, 10).forEach(r => {
          evidenceLines.push(`     Line ${r.lineNumber} [${r.timestamp || 'N/A'}]: ${r.raw}`);
        });
      }
    });

    const iocLines = iocList.slice(0, 20).map(i => `- [${i.iocId}] ${i.indicatorType.toUpperCase()}: ${i.normalizedValue} (Severity: ${i.severity}, Confidence: ${i.confidence})`);
    const tlLines = timelineEvents.slice(0, 15).map(t => `- [${t.eventId}] ${t.timestamp ? new Date(t.timestamp).toISOString() : '[UNDATED]'} [${t.eventType}] [${t.severity}]: ${t.description}`);
    const mitreLines = mitreMappings.slice(0, 10).map(m => `- [${m.techniqueId}] ${m.techniqueName} (${m.mappingStatus}, Type: ${m.detectionType})`);

    const systemPrompt = `You are TRACE AI, an expert Digital Forensics and Incident Response (DFIR) Copilot assistant.
You are assisting an investigator analyzing Case #${caseData.caseId}: "${caseData.title}".

CRITICAL EVIDENCE-BASED ANALYSIS MANDATES:
1. Base your answers ONLY AND EXCLUSIVELY on the real evidence, extracted artifacts, IOCs, timeline events, and MITRE techniques listed below.
2. Under NO CIRCUMSTANCES should you invent, fabricate, hallucinate, or assume any indicators, IP addresses, usernames, timestamps, hashes, processes, or events not present in the context.
3. If the user asks "Analyze this evidence and explain what happened.", provide an objective, evidence-based narrative reconstructing the events directly observed in the log records.
4. Distinguish clearly between "Observed Facts" (directly visible in log lines) and "Inferences" (conclusions derived from patterns).
5. If the evidence contains zero security threats or only normal activity, accurately report that without creating false alerts.

=== CASE EVIDENCE CONTEXT ===
- Case Reference: #${caseData.caseId}
- Title: ${caseData.title}
- Severity: ${caseData.severity}
- Incident Type: ${caseData.incidentType || 'General Security Incident'}
- Target Host: ${caseData.targetHost || 'N/A'}

=== REAL PERSISTED EVIDENCE (${evidenceItems.length} files) ===
${evidenceLines.length > 0 ? evidenceLines.join('\n') : 'No evidence files uploaded yet.'}

=== DETECTED IOCs (${iocList.length} total) ===
${iocLines.length > 0 ? iocLines.join('\n') : 'None detected.'}

=== FORENSIC TIMELINE EVENTS (${timelineEvents.length} events) ===
${tlLines.length > 0 ? tlLines.join('\n') : 'None generated.'}

=== MITRE ATT&CK TECHNIQUES (${mitreMappings.length} mappings) ===
${mitreLines.length > 0 ? mitreLines.join('\n') : 'None mapped.'}
${lastRun ? `\n=== LATEST LANGGRAPH INVESTIGATION RUN [${lastRun.runId}] ===\nExecutive Summary: ${lastRun.executiveSummary}\nNarrative: ${lastRun.candidateNarrative}` : ''}
`;

    let assistantContent = '';
    try {
      const fullPrompt = `${systemPrompt}\n\nAnalyst Question: ${lastUserMsg}`;
      const ollamaReply = await generateCompletion(fullPrompt, { format: 'text', timeoutMs: 240000, numPredict: 512 });
      if (ollamaReply && ollamaReply.trim()) {
        assistantContent = ollamaReply.trim();
      } else {
        assistantContent = 'Ollama is unavailable. AI analysis cannot be completed.';
      }
    } catch (ollamaErr) {
      console.warn('[AI Controller] Ollama completion timed out or failed:', ollamaErr.message);
      assistantContent = 'Ollama is unavailable. AI analysis cannot be completed.';
    }

    return res.status(200).json({
      success: true,
      data: {
        message: {
          role: 'assistant',
          content: assistantContent,
          timestamp: new Date()
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/ai/summarize
 */
const summarizeCase = async (req, res, next) => {
  try {
    const { caseId } = req.body;
    if (!caseId) {
      return res.status(400).json({
        success: false,
        error: { message: 'caseId is required.', status: 400 }
      });
    }

    const caseData = await Case.findOne({ caseId });
    if (!caseData) {
      return res.status(404).json({
        success: false,
        error: { message: `Case [${caseId}] not found.`, status: 404 }
      });
    }

    const payload = getAnalysisPayload(caseData, []);

    return res.status(200).json({
      success: true,
      data: {
        summary: payload.summary
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/ai/recommendations
 */
const recommendMitigations = async (req, res, next) => {
  try {
    const { caseId } = req.body;
    if (!caseId) {
      return res.status(400).json({
        success: false,
        error: { message: 'caseId is required.', status: 400 }
      });
    }

    const caseData = await Case.findOne({ caseId });
    if (!caseData) {
      return res.status(404).json({
        success: false,
        error: { message: `Case [${caseId}] not found.`, status: 404 }
      });
    }

    const payload = getAnalysisPayload(caseData, []);

    return res.status(200).json({
      success: true,
      data: {
        recommendations: payload.recommendedActions
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/ai/ioc-detection
 */
const detectIOCs = async (req, res, next) => {
  try {
    const { caseId } = req.body;
    if (!caseId) {
      return res.status(400).json({
        success: false,
        error: { message: 'caseId is required.', status: 400 }
      });
    }

    const caseData = await Case.findOne({ caseId });
    if (!caseData) {
      return res.status(404).json({
        success: false,
        error: { message: `Case [${caseId}] not found.`, status: 404 }
      });
    }

    const evidenceItems = await Evidence.find({ caseId });

    if (evidenceItems.length > 0) {
      const detectionResult = await runCaseDetection(caseId, { user: req.user });
      if (detectionResult.iocs && detectionResult.iocs.length > 0) {
        const mappedIocs = detectionResult.iocs.map(ioc => ({
          type: ioc.indicatorType.toUpperCase(),
          value: ioc.normalizedValue,
          severity: ioc.severity,
          confidence: ioc.confidence,
          description: ioc.ruleMatches.map(r => r.ruleName).join('; ') || `Detected ${ioc.indicatorType} indicator`
        }));

        return res.status(200).json({
          success: true,
          data: {
            iocs: mappedIocs,
            total: mappedIocs.length
          }
        });
      }
    }

    const payload = getAnalysisPayload(caseData, evidenceItems);

    return res.status(200).json({
      success: true,
      data: {
        iocs: payload.iocs
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * -----------------------------------------------------------------------------
 * PHASE 6: AI INVESTIGATION ENGINE CONTROLLERS
 * -----------------------------------------------------------------------------
 */
const { checkReadiness, generateCompletion } = require('../services/ollama.service');
const {
  runInvestigationWorkflow,
  listInvestigationRuns,
  getInvestigationRunById
} = require('../services/investigationWorkflow.service');
const response = require('../utils/response');

/**
 * GET /api/ai/readiness
 * Reports live Ollama server connectivity, model availability, and status.
 */
const getReadiness = async (req, res, next) => {
  try {
    const status = await checkReadiness();
    return response.success(res, status, 'AI service readiness status checked.');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/ai/investigate
 * Initiates LangGraph DFIR multi-stage investigation workflow for a case.
 */
const startInvestigation = async (req, res, next) => {
  try {
    const caseId = req.body.caseId || req.params.caseId;
    if (!caseId) {
      return response.error(res, 'caseId parameter is required.', 400);
    }

    const { mockGenerator, timeoutMs } = req.body;

    const result = await runInvestigationWorkflow(caseId, {
      user: req.user,
      mockGenerator,
      timeoutMs
    });

    return response.success(res, result, `AI investigation run [${result.runId}] completed with status: ${result.status}.`);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/ai/runs
 * Lists previous investigation runs for a case.
 */
const getInvestigationRuns = async (req, res, next) => {
  try {
    const caseId = req.query.caseId || req.params.caseId;
    if (!caseId) {
      return response.error(res, 'caseId query parameter is required.', 400);
    }

    const { page, limit, status } = req.query;

    const runs = await listInvestigationRuns(caseId, { page, limit, status });
    return response.success(res, runs, `Investigation runs retrieved for case ${caseId}.`);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/ai/runs/:runId
 * Retrieves a single investigation run and its complete findings.
 */
const getInvestigationRun = async (req, res, next) => {
  try {
    const { runId } = req.params;
    const run = await getInvestigationRunById(runId);
    return response.success(res, run, `Investigation run [${runId}] retrieved.`);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/ai/runs/:runId/evidence
 * Retrieves granular excerpts and hashes of evidence referenced by an investigation run.
 */
const getReferencedEvidence = async (req, res, next) => {
  try {
    const { runId } = req.params;
    const run = await getInvestigationRunById(runId);

    const evidenceIds = (run.referencedEvidence || []).map(r => r.evidenceId);
    const evidenceDocs = await Evidence.find({
      caseId: run.caseId,
      evidenceId: { $in: evidenceIds }
    }).select('caseId evidenceId originalName fileName relativePath fileSize sha256Hash parsing.records');

    return response.success(res, {
      runId,
      caseId: run.caseId,
      evidenceItems: evidenceDocs
    }, `Referenced evidence retrieved for run [${runId}].`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  analyzeCase,
  chatCopilot,
  summarizeCase,
  recommendMitigations,
  detectIOCs,
  getReadiness,
  startInvestigation,
  getInvestigationRuns,
  getInvestigationRun,
  getReferencedEvidence
};
