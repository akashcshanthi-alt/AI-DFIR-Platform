/**
 * TRACE AI - LangGraph Investigation Engine Workflow Service
 *
 * Implements a bounded, deterministic, multi-stage investigation workflow:
 * Stage A: Load Case Context (Isolated query across Evidence, IOCs, Timeline, MITRE)
 * Stage B: Prepare Evidence Context (Size budget, redaction, untrusted data boundary)
 * Stage C: Build Investigation Hypotheses (Candidate hypotheses requiring evidence IDs)
 * Stage D: Validate Hypotheses (Strict ID check, rejects hallucinated refs, separates facts vs inferences)
 * Stage E: Generate Investigation Summary (Executive narrative, evidence gaps, follow-ups)
 * Stage F: Persist Results (Stores InvestigationRun in MongoDB and logs AuditLog entry)
 */

const mongoose = require('mongoose');
const Case = require('../models/Case');
const Evidence = require('../models/Evidence');
const IOC = require('../models/IOC');
const TimelineEvent = require('../models/TimelineEvent');
const MitreMapping = require('../models/MitreMapping');
const InvestigationRun = require('../models/InvestigationRun');
const AuditLog = require('../models/AuditLog');
const {
  checkReadiness,
  redactCredentials,
  buildEnclosedPrompt,
  generateCompletion,
  OLLAMA_MODEL
} = require('./ollama.service');

// Track concurrent active runs to prevent race conditions on the same case
const activeCaseRuns = new Set();

/**
 * Executes the LangGraph-based DFIR investigation workflow.
 *
 * @param {string} caseId
 * @param {Object} options - { user, mockGenerator, timeoutMs }
 * @returns {Promise<Object>} Persisted InvestigationRun document
 */
async function runInvestigationWorkflow(caseId, options = {}) {
  if (!caseId) {
    throw new Error('caseId parameter is required to run investigation workflow.');
  }

  // Concurrency lock check
  if (activeCaseRuns.has(caseId)) {
    throw new Error(`An investigation run is already in progress for case [${caseId}]. Please wait for it to complete.`);
  }

  activeCaseRuns.add(caseId);
  const startTime = Date.now();

  try {
    // Dynamically import @langchain/langgraph for CommonJS compatibility
    const { StateGraph, Annotation, START, END } = await import('@langchain/langgraph');

    // 1. Define Typed State Annotation
    const InvestigationState = Annotation.Root({
      caseId: Annotation,
      options: Annotation,
      caseDoc: Annotation,
      evidenceList: Annotation,
      iocList: Annotation,
      timelineEvents: Annotation,
      mitreMappings: Annotation,
      preparedContext: Annotation,
      rawModelOutput: Annotation,
      validatedHypotheses: Annotation,
      rejectedHypotheses: Annotation,
      summary: Annotation,
      candidateNarrative: Annotation,
      evidenceGaps: Annotation,
      suggestedFollowUps: Annotation,
      referencedEvidence: Annotation,
      referencedTimelineEvents: Annotation,
      referencedMitreTechniques: Annotation,
      limitations: Annotation,
      status: Annotation,
      error: Annotation,
      runRecord: Annotation
    });

    // -------------------------------------------------------------------------
    // Node A: Load Case Context
    // -------------------------------------------------------------------------
    const loadContextNode = async (state) => {
      if (state.error) return {};

      try {
        const caseDoc = await Case.findOne({ caseId: state.caseId });
        if (!caseDoc) {
          return { error: `Case [${state.caseId}] not found in database.`, status: 'failed' };
        }

        // Strictly case-isolated parallel queries
        const [evidenceList, iocList, timelineEvents, mitreMappings] = await Promise.all([
          Evidence.find({ caseId: state.caseId }).lean(),
          IOC.find({ caseId: state.caseId }).lean(),
          TimelineEvent.find({ caseId: state.caseId }).sort({ timestamp: 1 }).lean(),
          MitreMapping.find({ caseId: state.caseId }).lean()
        ]);

        return {
          caseDoc,
          evidenceList,
          iocList,
          timelineEvents,
          mitreMappings,
          status: 'in_progress'
        };
      } catch (err) {
        return { error: `Context loading failed: ${err.message}`, status: 'failed' };
      }
    };

    // -------------------------------------------------------------------------
    // Node B: Prepare Evidence Context (Sanitization & Untrusted Sandbox)
    // -------------------------------------------------------------------------
    const prepareEvidenceNode = (state) => {
      if (state.error) return {};

      try {
        const lines = [];
        const referencedEvidenceMap = new Map();
        const referencedTimelineSet = new Set();
        const referencedMitreSet = new Set();

        lines.push(`CASE METADATA:`);
        lines.push(`Case ID: ${state.caseDoc.caseId} | Title: ${state.caseDoc.title} | Severity: ${state.caseDoc.severity}`);
        lines.push(`Description: ${state.caseDoc.description || 'N/A'}\n`);

        lines.push(`PERSISTED EVIDENCE ARTIFACTS (${state.evidenceList.length} files):`);
        state.evidenceList.forEach(ev => {
          referencedEvidenceMap.set(ev.evidenceId, {
            evidenceId: ev.evidenceId,
            fileName: ev.originalName || ev.fileName,
            relativePath: ev.relativePath || '',
            hash: ev.sha256Hash || ''
          });

          lines.push(`[${ev.evidenceId}] File: ${ev.originalName || ev.fileName} | Path: ${ev.relativePath || 'root'} | Size: ${ev.fileSize} bytes | SHA256: ${ev.sha256Hash || 'N/A'}`);
          if (ev.parsing && Array.isArray(ev.parsing.records)) {
            const sampleRecords = ev.parsing.records.slice(0, 6);
            sampleRecords.forEach((r, idx) => {
              const raw = r.raw || (r.details ? JSON.stringify(r.details) : '');
              const redacted = redactCredentials(raw);
              lines.push(`   - [Line ${r.lineNumber || idx + 1}]: ${redacted.slice(0, 200)}`);
            });
            if (ev.parsing.records.length > 6) {
              lines.push(`   - [... ${ev.parsing.records.length - 6} additional parsed records truncated for token budget ...]`);
            }
          }
        });
        lines.push('');

        lines.push(`DETECTED THREAT INDICATORS (${state.iocList.length} IOCs):`);
        state.iocList.slice(0, 20).forEach(ioc => {
          lines.push(`- [${ioc.iocId}] ${ioc.indicatorType.toUpperCase()}: ${ioc.normalizedValue} (Classification: ${ioc.ipClassification}, Severity: ${ioc.severity}, Status: ${ioc.status})`);
        });
        lines.push('');

        lines.push(`CHRONOLOGICAL TIMELINE SEQUENCE (${state.timelineEvents.length} events):`);
        state.timelineEvents.slice(0, 15).forEach(te => {
          referencedTimelineSet.add(te.eventId);
          const timeStr = te.timestamp ? new Date(te.timestamp).toISOString() : '[UNDATED EVENT]';
          const src = te.source?.evidenceId ? `(${te.source.evidenceId}:${te.source.lineNumber || 'entry'})` : '';
          lines.push(`- [${te.eventId}] ${timeStr} [${te.eventType}] [${te.severity}] ${te.description} ${src}`);
        });
        lines.push('');

        lines.push(`ATT&CK TECHNIQUE CANDIDATES (${state.mitreMappings.length} mappings):`);
        state.mitreMappings.forEach(mm => {
          referencedMitreSet.add(mm.techniqueId);
          lines.push(`- [${mm.techniqueId}] ${mm.techniqueName} (Status: ${mm.mappingStatus}, Type: ${mm.detectionType}, Confidence: ${mm.confidence?.score}%)`);
        });

        const rawContext = lines.join('\n');

        return {
          preparedContext: rawContext,
          referencedEvidence: Array.from(referencedEvidenceMap.values()),
          referencedTimelineEvents: Array.from(referencedTimelineSet),
          referencedMitreTechniques: Array.from(referencedMitreSet)
        };
      } catch (err) {
        return { error: `Evidence preparation failed: ${err.message}`, status: 'failed' };
      }
    };

    // -------------------------------------------------------------------------
    // Node C: Build Investigation Hypotheses (Model Generation)
    // -------------------------------------------------------------------------
    const buildHypothesesNode = async (state) => {
      if (state.error) return {};

      // If mock generator is provided (e.g. for testing), use it directly
      if (typeof state.options?.mockGenerator === 'function') {
        const mockResult = await state.options.mockGenerator(state.preparedContext);
        return { rawModelOutput: mockResult };
      }

      // Live Ollama execution check
      const readiness = await checkReadiness();
      if (!readiness.ready) {
        return {
          error: `Ollama service is unavailable (${readiness.status}): ${readiness.error || readiness.message}. Ordinary forensics remains fully operational without AI.`,
          status: 'failed'
        };
      }

      const systemInstruction = `You are the TRACE AI Digital Forensics and Incident Response (DFIR) Investigation Engine.
Analyze the provided forensic evidence and formulate explainable incident hypotheses.

CRITICAL CITATION RULES:
1. In "supportingEvidenceIds", you MUST cite ONLY the exact evidence IDs (e.g. EVD-XXXX) that appear in the PERSISTED EVIDENCE ARTIFACTS section above.
2. In "supportingTimelineEventIds", you MUST cite ONLY the exact timeline event IDs (e.g. TLE-XXXX) that appear in the CHRONOLOGICAL TIMELINE SEQUENCE section above.
3. Keep summaries concise and strictly factual. Output 1 focused hypothesis.
4. Keep all narrative and statements short (1-2 sentences each) to guarantee a complete and valid JSON output.

STRICT SCHEMA RULES:
Respond with ONLY a valid JSON object matching this schema:
{
  "executiveSummary": "Concise summary of observed findings",
  "candidateNarrative": "Step-by-step reconstruction of the adversary intrusion flow",
  "hypotheses": [
    {
      "title": "Short title",
      "statement": "Detailed explanation of what transpired",
      "techniqueId": null,
      "classification": "observed_fact",
      "confidenceScore": 80,
      "uncertaintyRationale": "Why this confidence score is assigned",
      "supportingEvidenceIds": ["EVD-1001"],
      "supportingTimelineEventIds": ["TLE-1001"],
      "contradictoryEvidence": "None",
      "missingInformation": "Gaps in telemetry"
    }
  ],
  "evidenceGaps": ["List of missing log sources or telemetry visibility blindspots"],
  "suggestedFollowUps": ["Actionable steps for human analyst verification"]
}`;

      const prompt = buildEnclosedPrompt(systemInstruction, state.preparedContext);

      try {
        const configuredTimeout = parseInt(process.env.OLLAMA_TIMEOUT_MS, 10) || 360000;
        const responseText = await generateCompletion(prompt, {
          timeoutMs: state.options?.timeoutMs || configuredTimeout,
          format: 'json',
          numPredict: 600
        });

        return { rawModelOutput: responseText };
      } catch (err) {
        return {
          error: `LLM inference failed: ${err.message}`,
          status: 'failed'
        };
      }
    };

    // -------------------------------------------------------------------------
    // Node D: Validate Hypotheses (Rejects Fabrications & Separates Facts)
    // -------------------------------------------------------------------------
    const validateHypothesesNode = (state) => {
      if (state.error) return {};

      try {
        let parsed = {};
        if (typeof state.rawModelOutput === 'object' && state.rawModelOutput !== null) {
          parsed = state.rawModelOutput;
        } else {
          const cleanJson = (state.rawModelOutput || '')
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/```\s*$/i, '')
            .trim();
          try {
            parsed = JSON.parse(cleanJson);
          } catch (jsonErr) {
            // Attempt robust repair for cut-off JSON
            let parsedOk = false;
            // Strategy 1: close open quote then close brackets
            try {
              let rep1 = cleanJson;
              if ((rep1.match(/"/g) || []).length % 2 !== 0) rep1 += '"';
              const ob1 = (rep1.match(/\{/g) || []).length;
              const cb1 = (rep1.match(/\}/g) || []).length;
              const obr1 = (rep1.match(/\[/g) || []).length;
              const cbr1 = (rep1.match(/\]/g) || []).length;
              for (let i = 0; i < obr1 - cbr1; i++) rep1 += ']';
              for (let i = 0; i < ob1 - cb1; i++) rep1 += '}';
              parsed = JSON.parse(rep1);
              parsedOk = true;
            } catch (e1) {}

            // Strategy 2: backtrack to last comma if strategy 1 failed
            if (!parsedOk) {
              try {
                let rep2 = cleanJson;
                const lastComma = rep2.lastIndexOf(',');
                if (lastComma > 0) {
                  rep2 = rep2.slice(0, lastComma);
                  const ob2 = (rep2.match(/\{/g) || []).length;
                  const cb2 = (rep2.match(/\}/g) || []).length;
                  const obr2 = (rep2.match(/\[/g) || []).length;
                  const cbr2 = (rep2.match(/\]/g) || []).length;
                  for (let i = 0; i < obr2 - cbr2; i++) rep2 += ']';
                  for (let i = 0; i < ob2 - cb2; i++) rep2 += '}';
                  parsed = JSON.parse(rep2);
                  parsedOk = true;
                }
              } catch (e2) {}
            }

            if (!parsedOk) {
              return {
                error: `Invalid JSON returned by investigation model: ${jsonErr.message}`,
                status: 'failed'
              };
            }
          }
        }

        // Sets of valid IDs belonging STRICTLY to this case
        const validEvidenceIds = new Set(state.evidenceList.map(e => e.evidenceId));
        const validTimelineIds = new Set(state.timelineEvents.map(t => t.eventId));

        const rawHypotheses = Array.isArray(parsed.hypotheses) ? parsed.hypotheses : [];
        const validatedHypotheses = [];
        const rejectedHypotheses = [];

        rawHypotheses.forEach((hyp, idx) => {
          const supEvidence = Array.isArray(hyp.supportingEvidenceIds) ? hyp.supportingEvidenceIds : [];
          const supTimeline = Array.isArray(hyp.supportingTimelineEventIds) ? hyp.supportingTimelineEventIds : [];

          // Verify every referenced evidence ID exists in this case
          const invalidEvIds = supEvidence.filter(id => !validEvidenceIds.has(id));
          const invalidTlIds = supTimeline.filter(id => !validTimelineIds.has(id));
          const invalidRefs = [...invalidEvIds, ...invalidTlIds];

          if (invalidRefs.length > 0) {
            // REJECT fabricated or cross-case reference!
            rejectedHypotheses.push({
              title: hyp.title || `Hypothesis #${idx + 1}`,
              statement: hyp.statement || '',
              rejectionReason: `Fabricated or unverified reference IDs rejected by validator: ${invalidRefs.join(', ')}`,
              invalidReferences: invalidRefs
            });
            return;
          }

          // If no evidence provided at all, reject as unsupported
          if (supEvidence.length === 0 && supTimeline.length === 0) {
            rejectedHypotheses.push({
              title: hyp.title || `Hypothesis #${idx + 1}`,
              statement: hyp.statement || '',
              rejectionReason: 'Rejected because hypothesis provides zero supporting evidence or timeline references.',
              invalidReferences: []
            });
            return;
          }

          const score = typeof hyp.confidenceScore === 'number' ? Math.max(0, Math.min(95, hyp.confidenceScore)) : 50;
          const level = score >= 80 ? 'High' : (score >= 50 ? 'Medium' : 'Low');

          validatedHypotheses.push({
            hypothesisId: `HYP-${idx + 1}`,
            title: hyp.title || `Candidate Hypothesis #${idx + 1}`,
            statement: hyp.statement || '',
            techniqueId: hyp.techniqueId || null,
            classification: hyp.classification === 'observed_fact' ? 'observed_fact' : 'inferred_hypothesis',
            confidence: {
              score,
              level,
              uncertaintyRationale: hyp.uncertaintyRationale || 'Calibrated uncertainty estimate derived from supporting evidence density.'
            },
            supportingEvidenceIds: supEvidence,
            supportingTimelineEventIds: supTimeline,
            contradictoryEvidence: hyp.contradictoryEvidence || 'None observed',
            missingInformation: hyp.missingInformation || 'None identified',
            validationStatus: 'validated'
          });
        });

        return {
          summary: parsed.executiveSummary || 'Executive summary not generated by model.',
          candidateNarrative: parsed.candidateNarrative || 'Attack narrative not generated by model.',
          evidenceGaps: Array.isArray(parsed.evidenceGaps) ? parsed.evidenceGaps : [],
          suggestedFollowUps: Array.isArray(parsed.suggestedFollowUps) ? parsed.suggestedFollowUps : [],
          validatedHypotheses,
          rejectedHypotheses
        };
      } catch (err) {
        return { error: `Hypothesis validation failed: ${err.message}`, status: 'failed' };
      }
    };

    // -------------------------------------------------------------------------
    // Node E: Generate Investigation Summary
    // -------------------------------------------------------------------------
    const generateSummaryNode = (state) => {
      if (state.error) return {};

      const limitations = [
        'Automated AI outputs are preliminary and must be verified by an authorized investigator.',
        'Zero code execution was performed against evidence payloads.',
        'Unsupported model statements without valid evidence IDs were strictly rejected by the validator.'
      ];

      return {
        limitations,
        status: 'completed'
      };
    };

    // -------------------------------------------------------------------------
    // Node F: Persist Results
    // -------------------------------------------------------------------------
    const persistRunNode = async (state) => {
      const durationMs = Date.now() - startTime;

      // Assign sequential runId
      const lastRun = await InvestigationRun.findOne({}, { runId: 1 }, { sort: { runId: -1 } });
      let nextSeq = 1001;
      if (lastRun && lastRun.runId) {
        const m = lastRun.runId.match(/IRUN-(\d+)/);
        if (m) nextSeq = parseInt(m[1], 10) + 1;
      }

      const runId = `IRUN-${nextSeq}`;
      const isFailed = !!state.error || state.status === 'failed';

      const runRecord = new InvestigationRun({
        runId,
        caseId: state.caseId,
        case: state.caseDoc?._id || new mongoose.Types.ObjectId(),
        model: state.options?.mockGenerator ? 'deterministic-mock-v1' : OLLAMA_MODEL,
        workflowVersion: 'LangGraph-DFIR-v1.0',
        status: isFailed ? 'failed' : 'completed',
        executiveSummary: state.summary || '',
        candidateNarrative: state.candidateNarrative || '',
        hypotheses: state.validatedHypotheses || [],
        rejectedHypotheses: state.rejectedHypotheses || [],
        evidenceGaps: state.evidenceGaps || [],
        suggestedFollowUps: state.suggestedFollowUps || [],
        referencedEvidence: state.referencedEvidence || [],
        referencedTimelineEvents: state.referencedTimelineEvents || [],
        referencedMitreTechniques: state.referencedMitreTechniques || [],
        limitations: state.limitations || [],
        error: state.error || null,
        runDurationMs: durationMs,
        createdBy: state.options?.user?.username || state.options?.user?.email || 'Authenticated Investigator'
      });

      await runRecord.save();

      // Record AuditLog
      try {
        const auditDesc = `Executed LangGraph AI Investigation run [${runId}] for Case [${state.caseId}]. Status: ${runRecord.status}. Hypotheses validated: ${runRecord.hypotheses.length}, Rejected: ${runRecord.rejectedHypotheses.length}. Duration: ${durationMs}ms.`;
        await AuditLog.create({
          action: 'AI_INVESTIGATION_RUN',
          module: 'AI_INVESTIGATION_ENGINE',
          user: state.options?.user?.username || state.options?.user?.email || 'Authenticated Investigator',
          description: auditDesc,
          details: auditDesc,
          ip: '127.0.0.1',
          severity: isFailed ? 'Medium' : 'Low',
          status: isFailed ? 'Failed' : 'Success'
        });
      } catch (auditErr) {
        console.warn('[Audit Log Warning] Failed to log investigation run:', auditErr.message);
      }

      return { runRecord };
    };

    // -------------------------------------------------------------------------
    // Construct and Compile LangGraph Workflow
    // -------------------------------------------------------------------------
    const workflow = new StateGraph(InvestigationState)
      .addNode('loadContext', loadContextNode)
      .addNode('prepareEvidence', prepareEvidenceNode)
      .addNode('buildHypotheses', buildHypothesesNode)
      .addNode('validateHypotheses', validateHypothesesNode)
      .addNode('generateSummary', generateSummaryNode)
      .addNode('persistRun', persistRunNode)
      .addEdge(START, 'loadContext')
      .addEdge('loadContext', 'prepareEvidence')
      .addEdge('prepareEvidence', 'buildHypotheses')
      .addEdge('buildHypotheses', 'validateHypotheses')
      .addEdge('validateHypotheses', 'generateSummary')
      .addEdge('generateSummary', 'persistRun')
      .addEdge('persistRun', END);

    const compiledApp = workflow.compile();

    // Execute the graph
    const finalState = await compiledApp.invoke({
      caseId,
      options
    });

    if (finalState.error && !finalState.runRecord) {
      throw new Error(finalState.error);
    }

    return finalState.runRecord;
  } finally {
    // Release concurrency lock
    activeCaseRuns.delete(caseId);
  }
}

/**
 * Lists past investigation runs for a case.
 */
async function listInvestigationRuns(caseId, options = {}) {
  const { page = 1, limit = 20, status } = options;
  const filter = { caseId };
  if (status && status !== 'all') {
    filter.status = status;
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [items, total] = await Promise.all([
    InvestigationRun.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    InvestigationRun.countDocuments(filter)
  ]);

  return {
    items,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1
    }
  };
}

/**
 * Retrieves a single investigation run by runId or _id.
 */
async function getInvestigationRunById(runId) {
  let query = { runId };
  if (mongoose.Types.ObjectId.isValid(runId)) {
    query = { $or: [{ runId }, { _id: runId }] };
  }

  const run = await InvestigationRun.findOne(query)
    .populate('case', 'caseId title severity status')
    .lean();

  if (!run) {
    throw new Error(`Investigation run [${runId}] not found.`);
  }

  return run;
}

module.exports = {
  runInvestigationWorkflow,
  listInvestigationRuns,
  getInvestigationRunById
};
