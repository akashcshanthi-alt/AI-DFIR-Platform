const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, notificationController.createNotification);
router.get('/', authenticate, notificationController.getNotifications);
router.get('/unread', authenticate, notificationController.getUnreadNotifications);
router.put('/read-all', authenticate, notificationController.markAllAsRead);
router.put('/:id/read', authenticate, notificationController.markAsRead);
router.delete('/:id', authenticate, notificationController.deleteNotification);

module.exports = router;
