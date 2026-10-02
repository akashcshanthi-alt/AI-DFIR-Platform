const mongoose = require('mongoose');

/**
 * Validated Candidate Hypothesis Subdocument Schema
 */
const HypothesisSchema = new mongoose.Schema({
  hypothesisId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  statement: {
    type: String,
    required: true
  },
  techniqueId: {
    type: String,
    default: null
  },
  classification: {
    type: String,
    enum: ['observed_fact', 'inferred_hypothesis'],
    default: 'inferred_hypothesis'
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
      default: 'Medium'
    },
    uncertaintyRationale: {
      type: String,
      default: ''
    }
  },
  supportingEvidenceIds: [{
    type: String
  }],
  supportingTimelineEventIds: [{
    type: String
  }],
  contradictoryEvidence: {
    type: String,
    default: 'None observed'
  },
  missingInformation: {
    type: String,
    default: 'None identified'
  },
  validationStatus: {
    type: String,
    enum: ['validated', 'unsupported', 'partial'],
    default: 'validated'
  }
}, { _id: false });

/**
 * Rejected Hypothesis Subdocument Schema (Hallucinated/Fabricated references)
 */
const RejectedHypothesisSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  statement: {
    type: String,
    required: true
  },
  rejectionReason: {
    type: String,
    required: true
  },
  invalidReferences: [{
    type: String
  }]
}, { _id: false });

/**
 * Referenced Evidence Provenance Subdocument Schema
 */
const ReferencedEvidenceSchema = new mongoose.Schema({
  evidenceId: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  relativePath: {
    type: String,
    default: ''
  },
  hash: {
    type: String,
    default: ''
  }
}, { _id: false });

/**
 * Investigation Run Database Model Schema
 */
const InvestigationRunSchema = new mongoose.Schema({
  runId: {
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
  model: {
    type: String,
    required: true,
    default: 'mistral:latest'
  },
  workflowVersion: {
    type: String,
    default: 'LangGraph-DFIR-v1.0'
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'failed'],
    default: 'in_progress',
    index: true
  },
  executiveSummary: {
    type: String,
    default: ''
  },
  candidateNarrative: {
    type: String,
    default: ''
  },
  hypotheses: {
    type: [HypothesisSchema],
    default: []
  },
  rejectedHypotheses: {
    type: [RejectedHypothesisSchema],
    default: []
  },
  evidenceGaps: [{
    type: String
  }],
  suggestedFollowUps: [{
    type: String
  }],
  referencedEvidence: {
    type: [ReferencedEvidenceSchema],
    default: []
  },
  referencedTimelineEvents: [{
    type: String
  }],
  referencedMitreTechniques: [{
    type: String
  }],
  limitations: [{
    type: String
  }],
  error: {
    type: String,
    default: null
  },
  runDurationMs: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: String,
    default: 'AI Investigation Engine'
  }
}, {
  timestamps: true
});

// Query optimization indexes
InvestigationRunSchema.index({ caseId: 1, createdAt: -1 });
InvestigationRunSchema.index({ caseId: 1, status: 1 });

module.exports = mongoose.model('InvestigationRun', InvestigationRunSchema);
