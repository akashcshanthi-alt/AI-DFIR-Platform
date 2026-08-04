const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { authenticate } = require('../middleware/auth');

router.post('/analyze', authenticate, aiController.analyzeCase);
router.post('/chat', authenticate, aiController.chatCopilot);
router.post('/summarize', authenticate, aiController.summarizeCase);
router.post('/recommendations', authenticate, aiController.recommendMitigations);
router.post('/ioc-detection', authenticate, aiController.detectIOCs);

module.exports = router;
