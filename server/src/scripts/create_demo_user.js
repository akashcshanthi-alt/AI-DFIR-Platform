const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const Case = require('../models/Case');
const Evidence = require('../models/Evidence');
const IOC = require('../models/IOC');
const Report = require('../models/Report');
const TimelineEvent = require('../models/TimelineEvent');
const InvestigationRun = require('../models/InvestigationRun');

async function createDemoUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[CreateDemoUser] Connected to MongoDB');

    const email = 'akash.demo@trace.local';
    const fullName = 'AKASH C';
    const rawPassword = 'AKASHC2026!';
    const role = 'Investigator';

    let user = await User.findOne({ email });

    if (user) {
      console.log(`[CreateDemoUser] User ${email} already exists with userId: ${user.userId}`);
      // Update password to ensure it matches the requested credential
      user.password = rawPassword;
      user.fullName = fullName;
      user.role = role;
      user.emailVerified = true;
      user.accountStatus = 'Active';
      await user.save();
      console.log('[CreateDemoUser] User password and profile updated.');
    } else {
      console.log(`[CreateDemoUser] Creating new user ${email}...`);
      user = new User({
        fullName,
        email,
        password: rawPassword,
        role,
        emailVerified: true,
        accountStatus: 'Active'
      });
      await user.save();
      console.log(`[CreateDemoUser] Created demo user with userId: ${user.userId}`);
    }

    // Verify password hashing with comparePassword
    const isPasswordValid = await user.comparePassword(rawPassword);
    console.log(`[CreateDemoUser] Password verification check: ${isPasswordValid ? 'PASSED' : 'FAILED'}`);

    // Verify forensic data isolation (all counts must be 0)
    const userId = user._id;
    const casesCount = await Case.countDocuments({ createdBy: userId });
    const userCaseDocs = await Case.find({ createdBy: userId }, { caseId: 1, _id: 0 }).lean();
    const userCaseIds = userCaseDocs.map(c => c.caseId);

    const evidenceCount = await Evidence.countDocuments({ caseId: { $in: userCaseIds } });
    const investigationsCount = await InvestigationRun.countDocuments({
      $or: [{ createdBy: userId }, { caseId: { $in: userCaseIds } }]
    });
    const iocCount = await IOC.countDocuments({ caseId: { $in: userCaseIds } });
    const timelineCount = await TimelineEvent.countDocuments({ caseId: { $in: userCaseIds } });
    const reportsCount = await Report.countDocuments({
      $or: [{ generatedBy: userId }, { caseId: { $in: userCaseIds } }]
    });

    console.log('\n--- Data Isolation Verification ---');
    console.log(`User ID: ${user.userId} (_id: ${user._id})`);
    console.log(`Cases: ${casesCount}`);
    console.log(`Evidence: ${evidenceCount}`);
    console.log(`Investigations: ${investigationsCount}`);
    console.log(`IOCs: ${iocCount}`);
    console.log(`Timeline Events: ${timelineCount}`);
    console.log(`Reports: ${reportsCount}`);
    console.log('------------------------------------\n');

    await mongoose.disconnect();
    console.log('[CreateDemoUser] Done.');
  } catch (err) {
    console.error('[CreateDemoUser] Error:', err);
    process.exit(1);
  }
}

createDemoUser();
