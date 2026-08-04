const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Database Schema.
 */
const UserSchema = new mongoose.Schema({
  userId: {
    type: String,
    unique: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['Super Admin', 'Admin', 'Investigator', 'Analyst'],
    required: true
  },
  department: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  profileImage: {
    type: String,
    default: ''
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  accountStatus: {
    type: String,
    enum: ['Active', 'Suspended', 'Pending'],
    default: 'Active'
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  }
}, {
  timestamps: true
});

/**
 * Pre-save hooks:
 * 1. Hash passwords if modified
 * 2. Generate custom sequential user IDs (A/I/D + YYYY + MM + N + XXX)
 */
UserSchema.pre('save', async function (next) {
  const user = this;

  // Hash password
  if (user.isModified('password')) {
    try {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
    } catch (err) {
      return next(err);
    }
  }

  // Generate unique User ID
  if (user.isNew && !user.userId) {
    try {
      const roleMap = {
        'Analyst': 'A',
        'Investigator': 'I',
        'Admin': 'D',
        'Super Admin': 'S'
      };
      const roleCode = roleMap[user.role] || 'A';
      
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const yearMonthStr = `${year}${month}`;

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      // Find the latest user with matching role code and monthly sequence
      const latestUser = await mongoose.model('User').findOne({
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        userId: new RegExp(`^${roleCode}${yearMonthStr}`)
      }, {}, { sort: { userId: -1 } });

      let sequenceNum = 1;
      if (latestUser && latestUser.userId) {
        const lastSeqStr = latestUser.userId.slice(-3);
        const lastSeq = parseInt(lastSeqStr, 10);
        if (!isNaN(lastSeq)) {
          sequenceNum = lastSeq + 1;
        }
      }

      const sequenceStr = String(sequenceNum).padStart(3, '0');
      user.userId = `${roleCode}${yearMonthStr}N${sequenceStr}`;
    } catch (err) {
      return next(err);
    }
  }

  next();
});

/**
 * Utility method to compare candidate passwords with hashed storage.
 */
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
