const Case = require('../models/Case');
const Evidence = require('../models/Evidence');
const { getAnalysisPayload, generateChatResponse } = require('../services/aiMockService');

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

/**
 * POST /api/ai/chat
 */
const chatCopilot = async (req, res, next) => {
  try {
    const { caseId, messages } = req.body;
    if (!caseId || !messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: { message: 'caseId and messages array are required.', status: 400 }
      });
    }

    const caseData = await Case.findOne({ caseId });
    if (!caseData) {
      return res.status(404).json({
        success: false,
        error: { message: `Case [${caseId}] not found.`, status: 404 }
      });
    }

    const reply = generateChatResponse(caseData, messages);

    return res.status(200).json({
      success: true,
      data: {
        message: reply
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

module.exports = {
  analyzeCase,
  chatCopilot,
  summarizeCase,
  recommendMitigations,
  detectIOCs
};
