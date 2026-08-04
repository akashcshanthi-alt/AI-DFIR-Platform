const mongoose = require('mongoose');

/**
 * Settings database model schema.
 * Configured across 9 distinct categories.
 */
const SettingsSchema = new mongoose.Schema({
  // 1. Organization
  organization: {
    companyName: { type: String, default: 'TRACE DFIR Labs' },
    contactEmail: { type: String, default: 'security@trace.local' },
    timezone: { type: String, default: 'UTC' }
  },

  // 2. Security
  security: {
    mfaEnabled: { type: Boolean, default: true },
    inactivityTimeout: { type: Number, default: 45 }
  },

  // 3. Authentication
  authentication: {
    allowOAuth: { type: Boolean, default: false },
    ssoProvider: { type: String, default: 'None' }
  },

  // 4. Email
  email: {
    smtpHost: { type: String, default: 'smtp.trace.local' },
    smtpPort: { type: Number, default: 587 },
    smtpUser: { type: String, default: 'notifications@trace.local' },
    useTls: { type: Boolean, default: true }
  },

  // 5. AI Configuration
  aiConfiguration: {
    aiSensitivity: { type: Number, default: 8 },
    confidenceThreshold: { type: Number, default: 92 }
  },

  // 6. Notifications
  notifications: {
    emailAlerts: { type: Boolean, default: true },
    slackWebhook: { type: String, default: '' },
    webPushEnabled: { type: Boolean, default: true }
  },

  // 7. Theme
  theme: {
    isDark: { type: Boolean, default: true },
    primaryColor: { type: String, default: '#0070f3' }
  },

  // 8. Appearance
  appearance: {
    density: { type: String, default: 'Compact' }, // 'Comfortable', 'Compact', 'Cozy'
    sidebarCollapsed: { type: Boolean, default: false }
  },

  // 9. Password Policy
  passwordPolicy: {
    pwSpecial: { type: Boolean, default: true },
    pwNumeric: { type: Boolean, default: true },
    pwHistory: { type: Boolean, default: false },
    minLength: { type: Number, default: 8 }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Settings', SettingsSchema);
