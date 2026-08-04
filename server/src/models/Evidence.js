const mongoose = require('mongoose');

/**
 * Chain of Custody log schema
 */
const ChainOfCustodySchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  performedBy: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    default: ''
  },
  ipAddress: {
    type: String,
    default: '127.0.0.1'
  }
}, { _id: false });

/**
 * Evidence database model schema
 */
const EvidenceSchema = new mongoose.Schema({
  evidenceId: {
    type: String,
    unique: true
  },
  caseId: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  md5Hash: {
    type: String,
    required: true
  },
  sha1Hash: {
    type: String,
    required: true
  },
  sha256Hash: {
    type: String,
    required: true
  },
  tags: {
    type: [String],
    default: []
  },
  notes: {
    type: String,
    default: ''
  },
  chainOfCustody: {
    type: [ChainOfCustodySchema],
    default: []
  },
  status: {
    type: String,
    enum: ['Active', 'Archived', 'Processing', 'Deleted'],
    default: 'Active'
  }
});

// Pre-save hook to generate sequential evidenceId (e.g. EVD-1001)
EvidenceSchema.pre('save', async function(next) {
  if (!this.evidenceId) {
    try {
      const lastEvidence = await this.constructor.findOne({}, { evidenceId: 1 }, { sort: { evidenceId: -1 } });
      let nextNum = 1001;
      if (lastEvidence && lastEvidence.evidenceId) {
        const match = lastEvidence.evidenceId.match(/EVD-(\d+)/);
        if (match) {
          nextNum = parseInt(match[1], 10) + 1;
        }
      }
      this.evidenceId = `EVD-${nextNum}`;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model('Evidence', EvidenceSchema);
