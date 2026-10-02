const mongoose = require('mongoose');

/**
 * Evidence Reference (Provenance) Subdocument Schema
 */
const EvidenceReferenceSchema = new mongoose.Schema({
  evidenceId: {
    type: String,
    required: true
  },
  evidence: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Evidence'
  },
  fileName: {
    type: String,
    required: true
  },
  relativePath: {
    type: String,
    default: ''
  },
  lineNumber: {
    type: Number,
    default: null
  },
  recordIndex: {
    type: Number,
    default: null
  },
  timestamp: {
    type: Date,
    default: null
  },
  context: {
    type: String,
    default: ''
  }
}, { _id: false });

/**
 * Rule Match Subdocument Schema
 */
const RuleMatchSchema = new mongoose.Schema({
  ruleId: {
    type: String,
    required: true
  },
  ruleName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['Informational', 'Low', 'Medium', 'High', 'Critical'],
    required: true
  },
  confidence: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    required: true
  }
}, { _id: false });

/**
 * IOC Finding Database Model Schema
 */
const IOCSchema = new mongoose.Schema({
  iocId: {
    type: String,
    unique: true,
    index: true
  },
  caseId: {
    type: String,
    required: true,
    index: true
  },
  case: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true
  },
  batchId: {
    type: String,
    default: '',
    index: true
  },
  indicatorType: {
    type: String,
    enum: ['ipv4', 'domain', 'url', 'email', 'md5', 'sha1', 'sha256'],
    required: true,
    index: true
  },
  value: {
    type: String,
    required: true
  },
  normalizedValue: {
    type: String,
    required: true,
    index: true
  },
  ipClassification: {
    type: String,
    enum: ['private', 'public', 'loopback', 'link-local', 'multicast', 'reserved', 'invalid', 'none'],
    default: 'none',
    index: true
  },
  firstSeen: {
    type: Date,
    default: null
  },
  lastSeen: {
    type: Date,
    default: null
  },
  evidenceReferences: {
    type: [EvidenceReferenceSchema],
    default: []
  },
  ruleMatches: {
    type: [RuleMatchSchema],
    default: []
  },
  severity: {
    type: String,
    enum: ['Informational', 'Low', 'Medium', 'High', 'Critical'],
    default: 'Low',
    index: true
  },
  confidence: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  confidenceScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  status: {
    type: String,
    enum: ['New', 'Under Review', 'Confirmed', 'False Positive', 'Dismissed'],
    default: 'New',
    index: true
  },
  notes: {
    type: String,
    default: ''
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  isExternalThreatIntel: {
    type: Boolean,
    default: false
  },
  sourceEngine: {
    type: String,
    default: 'Local Forensic Parsing & Rule Engine'
  }
}, {
  timestamps: true
});

// Compound unique index ensuring idempotency per case, indicator type, and normalized value
IOCSchema.index({ caseId: 1, indicatorType: 1, normalizedValue: 1 }, { unique: true });

// Pre-save hook to generate sequential iocId (e.g. IOC-1001)
IOCSchema.pre('save', async function(next) {
  if (!this.iocId) {
    try {
      const lastIoc = await this.constructor.findOne({}, { iocId: 1 }, { sort: { iocId: -1 } });
      let nextNum = 1001;
      if (lastIoc && lastIoc.iocId) {
        const match = lastIoc.iocId.match(/IOC-(\d+)/);
        if (match) {
          nextNum = parseInt(match[1], 10) + 1;
        }
      }
      this.iocId = `IOC-${nextNum}`;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model('IOC', IOCSchema);
