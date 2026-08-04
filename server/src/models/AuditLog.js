const mongoose = require('mongoose');

/**
 * AuditLog database model schema.
 */
const AuditLogSchema = new mongoose.Schema({
  logId: {
    type: String,
    unique: true
  },
  eventId: {
    type: String,
    unique: true
  },
  user: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: 'Investigator'
  },
  action: {
    type: String,
    required: true
  },
  module: {
    type: String,
    default: 'SYSTEM'
  },
  resource: {
    type: String,
    default: 'Global'
  },
  ipAddress: {
    type: String,
    default: '127.0.0.1'
  },
  ip: {
    type: String,
    default: '127.0.0.1'
  },
  device: {
    type: String,
    default: 'web'
  },
  browser: {
    type: String,
    default: 'Chrome'
  },
  status: {
    type: String,
    enum: ['Success', 'Failed'],
    default: 'Success'
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'Low'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    default: ''
  }
});

// Auto-increment logic & legacy mapping compatibility hooks
AuditLogSchema.pre('save', async function (next) {
  try {
    if (this.isNew) {
      if (!this.logId || !this.eventId) {
        const count = await mongoose.model('AuditLog').countDocuments();
        const num = 1001 + count;
        if (!this.logId) this.logId = `LOG-${num}`;
        if (!this.eventId) this.eventId = `EVT-${num}`;
      }
    }

    // Standardize mapping values
    if (this.ipAddress && !this.ip) this.ip = this.ipAddress;
    if (this.ip && !this.ipAddress) this.ipAddress = this.ip;
    if (this.logId && !this.eventId) this.eventId = this.logId;
    if (this.eventId && !this.logId) this.logId = this.eventId;

    // Standardize casing for severity in DB to capitalize first letter
    if (this.severity) {
      const sevUpper = this.severity.toUpperCase();
      if (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(sevUpper)) {
        this.severity = sevUpper.charAt(0) + sevUpper.slice(1).toLowerCase();
      }
    }
    
    next();
  } catch (err) {
    next(err);
  }
});

// Single-field indexes for sorting/filtering
AuditLogSchema.index({ logId: 1 });
AuditLogSchema.index({ eventId: 1 });
AuditLogSchema.index({ user: 1 });
AuditLogSchema.index({ status: 1 });
AuditLogSchema.index({ severity: 1 });
AuditLogSchema.index({ timestamp: -1 });

// Text index for optimized, indexed text searches
AuditLogSchema.index({
  action: 'text',
  user: 'text',
  module: 'text',
  description: 'text',
  ipAddress: 'text',
  resource: 'text'
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
