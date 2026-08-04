const mongoose = require('mongoose');

/**
 * Notification database model schema.
 */
const NotificationSchema = new mongoose.Schema({
  notificationId: {
    type: String,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Info', 'Warning', 'Critical', 'Success'],
    default: 'Info'
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isRead: {
    type: Boolean,
    default: false
  },
  recipient: {
    type: String,
    default: 'All'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to generate sequential notificationId (e.g. NTF-1001)
NotificationSchema.pre('save', async function(next) {
  if (!this.notificationId) {
    try {
      const lastNtf = await this.constructor.findOne({}, { notificationId: 1 }, { sort: { createdAt: -1 } });
      let nextNum = 1001;
      if (lastNtf && lastNtf.notificationId) {
        const match = lastNtf.notificationId.match(/NTF-(\d+)/);
        if (match) {
          nextNum = parseInt(match[1], 10) + 1;
        }
      }
      this.notificationId = `NTF-${nextNum}`;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model('Notification', NotificationSchema);
