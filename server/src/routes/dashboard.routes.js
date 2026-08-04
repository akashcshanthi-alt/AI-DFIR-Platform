const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth');

router.get('/overview', authenticate, dashboardController.getOverview);
router.get('/stats', authenticate, dashboardController.getStats);
router.get('/recent-cases', authenticate, dashboardController.getRecentCases);
router.get('/recent-alerts', authenticate, dashboardController.getRecentAlerts);
router.get('/activity', authenticate, dashboardController.getActivity);
router.get('/telemetry', authenticate, dashboardController.getTelemetry);
router.get('/charts', authenticate, dashboardController.getCharts);

module.exports = router;

