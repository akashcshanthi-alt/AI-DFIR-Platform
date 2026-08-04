const mongoose = require('mongoose');

/**
 * Case database model schema.
 */
const CaseSchema = new mongoose.Schema({
  caseId: {
    type: String,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'High'
  },
  status: {
    type: String,
    enum: ['Open', 'Investigating', 'Closed'],
    default: 'Open'
  },
  assignedAnalyst: {
    type: String,
    default: 'Unassigned'
  },
  sourceIP: {
    type: String,
    default: ''
  },
  destinationIP: {
    type: String,
    default: ''
  },
  evidenceCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Retention for backward compatibility with existing dashboard code
  targetHost: {
    type: String,
    default: 'N/A'
  }
}, {
  timestamps: true
});

// Pre-save hook to generate sequential caseId (e.g. DF-1001)
CaseSchema.pre('save', async function(next) {
  if (!this.caseId) {
    try {
      const lastCase = await this.constructor.findOne({}, { caseId: 1 }, { sort: { caseId: -1 } });
      let nextNum = 1001;
      if (lastCase && lastCase.caseId) {
        const match = lastCase.caseId.match(/DF-(\d+)/);
        if (match) {
          nextNum = parseInt(match[1], 10) + 1;
        }
      }
      this.caseId = `DF-${nextNum}`;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model('Case', CaseSchema);

