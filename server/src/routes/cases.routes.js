const express = require('express');
const router = express.Router();
const casesController = require('../controllers/cases.controller');
const { validateCreateCase, validateUpdateCase } = require('../validators/case.validator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

const iocController = require('../controllers/ioc.controller');
const timelineController = require('../controllers/timeline.controller');
const mitreController = require('../controllers/mitre.controller');
const aiController = require('../controllers/ai.controller');

router.get('/', authenticate, casesController.getCases);
router.post('/', authenticate, validateCreateCase, validate, casesController.createCase);
router.get('/:id', authenticate, casesController.getCaseById);
router.put('/:id', authenticate, validateUpdateCase, validate, casesController.updateCase);
router.delete('/:id', authenticate, casesController.deleteCase);

// Case-scoped IOC detection & listing
router.post('/:caseId/ioc/detect', authenticate, iocController.detectIOCs);
router.get('/:caseId/ioc', authenticate, (req, res, next) => {
  req.query.caseId = req.params.caseId;
  return iocController.getIOCs(req, res, next);
});
router.get('/:caseId/ioc/stats', authenticate, (req, res, next) => {
  req.query.caseId = req.params.caseId;
  return iocController.getIOCStats(req, res, next);
});

// Case-scoped Timeline generation & listing
router.post('/:caseId/timeline/generate', authenticate, timelineController.generateTimeline);
router.get('/:caseId/timeline', authenticate, (req, res, next) => {
  req.query.caseId = req.params.caseId;
  return timelineController.getTimelineEvents(req, res, next);
});
router.get('/:caseId/timeline/stats', authenticate, (req, res, next) => {
  req.query.caseId = req.params.caseId;
  return timelineController.getTimelineStats(req, res, next);
});

// Case-scoped MITRE ATT&CK mapping & listing
router.post('/:caseId/mitre/generate', authenticate, mitreController.generateMappings);
router.get('/:caseId/mitre', authenticate, (req, res, next) => {
  req.query.caseId = req.params.caseId;
  return mitreController.getMappings(req, res, next);
});
router.get('/:caseId/mitre/stats', authenticate, (req, res, next) => {
  req.query.caseId = req.params.caseId;
  return mitreController.getMappingStats(req, res, next);
});

// Case-scoped AI Investigation Engine
router.post('/:caseId/ai/investigate', authenticate, aiController.startInvestigation);
router.get('/:caseId/ai/runs', authenticate, (req, res, next) => {
  req.query.caseId = req.params.caseId;
  return aiController.getInvestigationRuns(req, res, next);
});

module.exports = router;

