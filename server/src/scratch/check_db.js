const mongoose = require('mongoose');
require('dotenv').config();

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const users = await mongoose.connection.db.collection('users').find({}).toArray();
  console.log('Total users:', users.length);

  const demoUser = await mongoose.connection.db.collection('users').findOne({ email: 'akash.demo@trace.local' });
  console.log('akash.demo@trace.local exists:', !!demoUser);

  const auditWithName = await mongoose.connection.db.collection('auditlogs').find({ user: 'AKASH C' }).toArray();
  console.log('Audit logs with user AKASH C:', auditWithName.length);

  const auditWithDemoEmail = await mongoose.connection.db.collection('auditlogs').find({ user: 'akash.demo@trace.local' }).toArray();
  console.log('Audit logs with user akash.demo@trace.local:', auditWithDemoEmail.length);

  const totalCases = await mongoose.connection.db.collection('cases').countDocuments();
  console.log('Total cases in DB:', totalCases);

  await mongoose.disconnect();
}

main().catch(console.error);
