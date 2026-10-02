const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const iocController = require('../controllers/ioc.controller');

/**
 * @route   POST /api/ioc/detect
 * @desc    Run IOC Detection on a case's forensic evidence
 * @access  Private (Authenticated)
 */
router.post('/detect', authenticate, iocController.detectIOCs);

/**
 * @route   GET /api/ioc/stats
 * @desc    Get aggregate IOC statistics for a case or all cases
 * @access  Private (Authenticated)
 */
router.get('/stats', authenticate, iocController.getIOCStats);

/**
 * @route   GET /api/ioc
 * @desc    Get paginated and filtered list of IOCs
 * @access  Private (Authenticated)
 */
router.get('/', authenticate, iocController.getIOCs);

/**
 * @route   GET /api/ioc/:id
 * @desc    Get details of a specific IOC by ID
 * @access  Private (Authenticated)
 */
router.get('/:id', authenticate, iocController.getIOCById);

/**
 * @route   PATCH /api/ioc/:id/status
 * @desc    Update investigation status and notes of an IOC
 * @access  Private (Authenticated)
 */
router.patch('/:id/status', authenticate, iocController.updateIOCStatus);

module.exports = router;
