const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const { sendNotification } = require('../services/socket.service');

/**
 * POST /api/notifications
 */
const createNotification = async (req, res, next) => {
  try {
    const { title, message, type, priority, userId } = req.body;

    const notification = new Notification({
      title,
      message,
      type: type || 'Info',
      priority: priority || 'Medium',
      userId: userId || req.user.id
    });

    await notification.save();

    // Broadcast or push to specific user socket room in real-time
    sendNotification(notification.userId, notification);

    return res.status(201).json({
      success: true,
      message: 'Notification created successfully.',
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/notifications
 */
const getNotifications = async (req, res, next) => {
  try {
    const query = {
      $or: [
        { userId: req.user.id },
        { userId: null }
      ]
    };

    // Search query
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: searchRegex },
          { message: searchRegex }
        ]
      });
    }

    // Filters
    if (req.query.type) {
      query.type = req.query.type;
    }
    if (req.query.priority) {
      query.priority = req.query.priority;
    }
    if (req.query.isRead !== undefined) {
      query.isRead = req.query.isRead === 'true';
    }

    // Sort parameters
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Execute queries in parallel
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query).sort(sort).skip(skip).limit(limit),
      Notification.countDocuments(query),
      Notification.countDocuments({
        $or: [
          { userId: req.user.id },
          { userId: null }
        ],
        isRead: false
      })
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          total,
          page,
          limit,
          pages: totalPages
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/notifications/unread
 */
const getUnreadNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({
      $or: [
        { userId: req.user.id },
        { userId: null }
      ],
      isRead: false
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount: notifications.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/notifications/:id/read
 */
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = {
      $and: [
        {
          $or: [
            isObjectId ? { _id: id } : { _id: null },
            { notificationId: id }
          ]
        },
        {
          $or: [
            { userId: req.user.id },
            { userId: null }
          ]
        }
      ]
    };

    const notification = await Notification.findOne(query);
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Notification not found or access denied.',
          status: 404
        }
      });
    }

    notification.isRead = true;
    await notification.save();

    // Get updated unread count
    const unreadCount = await Notification.countDocuments({
      $or: [
        { userId: req.user.id },
        { userId: null }
      ],
      isRead: false
    });

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      data: {
        notification,
        unreadCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/notifications/read-all
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const query = {
      $or: [
        { userId: req.user.id },
        { userId: null }
      ],
      isRead: false
    };

    await Notification.updateMany(query, { $set: { isRead: true } });

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
      data: {
        unreadCount: 0
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/notifications/:id
 */
const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = {
      $and: [
        {
          $or: [
            isObjectId ? { _id: id } : { _id: null },
            { notificationId: id }
          ]
        },
        {
          $or: [
            { userId: req.user.id },
            { userId: null }
          ]
        }
      ]
    };

    const notification = await Notification.findOne(query);
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Notification not found or access denied.',
          status: 404
        }
      });
    }

    await Notification.deleteOne({ _id: notification._id });

    // Get updated unread count
    const unreadCount = await Notification.countDocuments({
      $or: [
        { userId: req.user.id },
        { userId: null }
      ],
      isRead: false
    });

    return res.status(200).json({
      success: true,
      message: 'Notification deleted successfully.',
      data: {
        unreadCount
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createNotification,
  getNotifications,
  getUnreadNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
