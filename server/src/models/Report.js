const mongoose = require('mongoose');

/**
 * Report database model schema.
 */
const ReportSchema = new mongoose.Schema({
  reportId: {
    type: String,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  caseId: {
    type: String,
    required: true
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  format: {
    type: String,
    enum: ['PDF', 'CSV'],
    required: true
  },
  reportType: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to generate sequential reportId (e.g. REP-1001)
ReportSchema.pre('save', async function(next) {
  if (!this.reportId) {
    try {
      const lastReport = await this.constructor.findOne({}, { reportId: 1 }, { sort: { createdAt: -1 } });
      let nextNum = 1001;
      if (lastReport && lastReport.reportId) {
        const match = lastReport.reportId.match(/REP-(\d+)/);
        if (match) {
          nextNum = parseInt(match[1], 10) + 1;
        }
      }
      this.reportId = `REP-${nextNum}`;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model('Report', ReportSchema);
