const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const timelineController = require('../controllers/timeline.controller');

/**
 * @route   POST /api/timeline/generate
 * @desc    Generate or refresh the forensic timeline for a case
 * @access  Private (Authenticated)
 */
router.post('/generate', authenticate, timelineController.generateTimeline);

/**
 * @route   GET /api/timeline/stats
 * @desc    Get aggregate metrics and time bounds for a case timeline
 * @access  Private (Authenticated)
 */
router.get('/stats', authenticate, timelineController.getTimelineStats);

/**
 * @route   GET /api/timeline
 * @desc    Get paginated and filtered timeline events for a case
 * @access  Private (Authenticated)
 */
router.get('/', authenticate, timelineController.getTimelineEvents);

/**
 * @route   GET /api/timeline/:id
 * @desc    Get details and complete evidence provenance of a specific timeline event
 * @access  Private (Authenticated)
 */
router.get('/:id', authenticate, timelineController.getTimelineEventById);

module.exports = router;
