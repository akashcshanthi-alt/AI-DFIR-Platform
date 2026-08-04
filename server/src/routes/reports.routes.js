const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports.controller');
const { authenticate } = require('../middleware/auth');

router.post('/generate', authenticate, reportsController.generateReport);
router.get('/', authenticate, reportsController.getReports);
router.get('/:id', authenticate, reportsController.getReportById);
router.get('/:id/download', authenticate, reportsController.downloadReport);
router.delete('/:id', authenticate, reportsController.deleteReport);

module.exports = router;
