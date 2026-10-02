const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { authenticate } = require('../middleware/auth');

router.post('/analyze', authenticate, aiController.analyzeCase);
router.post('/chat', authenticate, aiController.chatCopilot);
router.post('/summarize', authenticate, aiController.summarizeCase);
router.post('/recommendations', authenticate, aiController.recommendMitigations);
router.post('/ioc-detection', authenticate, aiController.detectIOCs);

// Phase 6: AI Investigation Engine Endpoints
router.get('/readiness', authenticate, aiController.getReadiness);
router.post('/investigate', authenticate, aiController.startInvestigation);
router.get('/runs', authenticate, aiController.getInvestigationRuns);
router.get('/runs/:runId', authenticate, aiController.getInvestigationRun);
router.get('/runs/:runId/evidence', authenticate, aiController.getReferencedEvidence);

module.exports = router;
