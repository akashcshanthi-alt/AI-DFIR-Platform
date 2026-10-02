const mongoose = require('mongoose');

/**
 * Evidence Reference Subdocument Schema
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
  excerpt: {
    type: String,
    default: ''
  }
}, { _id: false });

/**
 * Tactic Subdocument Schema
 */
const TacticSchema = new mongoose.Schema({
  tacticId: {
    type: String,
    required: true
  },
  tacticName: {
    type: String,
    required: true
  }
}, { _id: false });

/**
 * Matched Rule Subdocument Schema
 */
const MatchedRuleSchema = new mongoose.Schema({
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
  },
  matchedTelemetry: {
    type: String,
    default: ''
  }
}, { _id: false });

/**
 * MITRE ATT&CK Mapping Database Model Schema
 */
const MitreMappingSchema = new mongoose.Schema({
  mappingId: {
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
  techniqueId: {
    type: String,
    required: true,
    index: true
  },
  techniqueName: {
    type: String,
    required: true
  },
  tactics: {
    type: [TacticSchema],
    default: []
  },
  attackVersion: {
    type: String,
    default: 'v14.1 Enterprise ATT&CK'
  },
  source: {
    type: String,
    default: 'Curated MITRE Enterprise Matrix'
  },
  mappingStatus: {
    type: String,
    enum: ['candidate', 'analyst_review', 'confirmed', 'rejected'],
    default: 'candidate',
    index: true
  },
  detectionType: {
    type: String,
    enum: ['observed', 'inferred'],
    default: 'inferred'
  },
  confidence: {
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 50
    },
    level: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
      index: true
    }
  },
  evidenceReferences: {
    type: [EvidenceReferenceSchema],
    default: []
  },
  timelineEventIds: {
    type: [String],
    default: []
  },
  timelineEvents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimelineEvent'
  }],
  matchedRules: {
    type: [MatchedRuleSchema],
    default: []
  },
  analystNotes: {
    type: String,
    default: ''
  },
  reviewedBy: {
    type: String,
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Ensure a single unique technique mapping per case
MitreMappingSchema.index({ caseId: 1, techniqueId: 1 }, { unique: true });

// Query optimization indexes
MitreMappingSchema.index({ caseId: 1, mappingStatus: 1 });
MitreMappingSchema.index({ caseId: 1, 'tactics.tacticId': 1 });
MitreMappingSchema.index({ caseId: 1, 'confidence.level': 1 });
MitreMappingSchema.index({ caseId: 1, detectionType: 1 });

module.exports = mongoose.model('MitreMapping', MitreMappingSchema);
