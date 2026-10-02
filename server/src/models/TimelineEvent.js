const mongoose = require('mongoose');

/**
 * Related IOC Subdocument Schema
 */
const RelatedIocSchema = new mongoose.Schema({
  iocId: {
    type: String,
    required: true
  },
  indicatorType: {
    type: String,
    enum: ['ipv4', 'domain', 'url', 'email', 'md5', 'sha1', 'sha256'],
    required: true
  },
  normalizedValue: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['Informational', 'Low', 'Medium', 'High', 'Critical'],
    default: 'Low'
  }
}, { _id: false });

/**
 * Event Source (Provenance) Subdocument Schema
 */
const EventSourceSchema = new mongoose.Schema({
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
  rationale: {
    type: String,
    required: true
  }
}, { _id: false });

/**
 * Timeline Event Database Model Schema
 */
const TimelineEventSchema = new mongoose.Schema({
  eventId: {
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
  deduplicationKey: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: null,
    index: true
  },
  originalTimestamp: {
    type: String,
    default: ''
  },
  timestampPrecision: {
    type: String,
    enum: ['iso8601', 'syslog', 'clf', 'epoch', 'undated'],
    default: 'undated'
  },
  timezoneStatus: {
    type: String,
    enum: ['explicit_utc', 'offset_provided', 'timezone_unknown', 'undated'],
    default: 'undated'
  },
  isUndated: {
    type: Boolean,
    default: false,
    index: true
  },
  eventType: {
    type: String,
    enum: ['AUTH', 'NETWORK', 'PROCESS', 'FILE', 'ALERT', 'SYSTEM', 'IOC_OBSERVED', 'EVIDENCE_INGESTED'],
    default: 'SYSTEM',
    index: true
  },
  description: {
    type: String,
    required: true
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
  source: {
    type: EventSourceSchema,
    required: true
  },
  relatedIocs: {
    type: [RelatedIocSchema],
    default: []
  },
  rawExcerpt: {
    type: String,
    default: ''
  },
  provenanceWarnings: {
    type: [String],
    default: []
  },
  ruleMatches: {
    type: [RuleMatchSchema],
    default: []
  }
}, {
  timestamps: true
});

// Compound unique index for idempotency per case and deduplicationKey
TimelineEventSchema.index({ caseId: 1, deduplicationKey: 1 }, { unique: true });

// Compound indexes for high-performance chronological queries
TimelineEventSchema.index({ caseId: 1, isUndated: 1, timestamp: 1 });
TimelineEventSchema.index({ caseId: 1, eventType: 1 });
TimelineEventSchema.index({ caseId: 1, severity: 1 });
TimelineEventSchema.index({ 'source.evidenceId': 1 });

// Pre-save hook to generate sequential eventId (e.g. TLE-1001)
TimelineEventSchema.pre('save', async function(next) {
  if (!this.eventId) {
    try {
      const lastEvent = await this.constructor.findOne({}, { eventId: 1 }, { sort: { eventId: -1 } });
      let nextNum = 1001;
      if (lastEvent && lastEvent.eventId) {
        const match = lastEvent.eventId.match(/TLE-(\d+)/);
        if (match) {
          nextNum = parseInt(match[1], 10) + 1;
        }
      }
      this.eventId = `TLE-${nextNum}`;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model('TimelineEvent', TimelineEventSchema);
