/**
 * isolation_test.js
 * Directly tests data isolation without relying on email verification flow.
 * Uses Mongoose to create test users with emailVerified=true, then tests via HTTP.
 */
require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const http = require('http');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/arclight_dfir';
const JWT_SECRET = process.env.JWT_SECRET;
const PORT = 5000;

if (!JWT_SECRET) {
  console.error('ERROR: JWT_SECRET not in environment.');
  process.exit(1);
}

const get = (path, token) => new Promise((resolve, reject) => {
  const opts = { hostname: '127.0.0.1', port: PORT, path, method: 'GET', headers: {} };
  if (token) opts.headers['Authorization'] = 'Bearer ' + token;
  const req = http.request(opts, r => {
    let d = ''; r.on('data', c => d += c);
    r.on('end', () => { try { resolve({ status: r.statusCode, body: JSON.parse(d) }); } catch (e) { reject(e); } });
  });
  req.on('error', reject); req.end();
});

const post = (path, body, token) => new Promise((resolve, reject) => {
  const data = JSON.stringify(body);
  const opts = { hostname: '127.0.0.1', port: PORT, path, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }};
  if (token) opts.headers['Authorization'] = 'Bearer ' + token;
  const req = http.request(opts, r => {
    let d = ''; r.on('data', c => d += c);
    r.on('end', () => { try { resolve({ status: r.statusCode, body: JSON.parse(d) }); } catch (e) { reject(e); } });
  });
  req.on('error', reject); req.write(data); req.end();
});

let passed = 0, failed = 0;
function check(label, actual, expected) {
  const ok = actual === expected;
  const sym = ok ? '✅' : '❌';
  if (ok) passed++; else failed++;
  console.log(`  ${sym} ${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
}

async function run() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  TRACE DFIR — Data Isolation Verification   ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  await mongoose.connect(MONGO_URI);
  console.log('  [DB] Connected to MongoDB\n');

  const User = require('./src/models/User');
  const ts = Date.now();

  // Create Alice directly in DB (email pre-verified)
  const aliceEmail = `alice${ts}@trace.ai`;
  const bobEmail = `bob${ts}@trace.ai`;

  const alice = new User({ fullName: 'Alice DFIR', email: aliceEmail, password: 'AliceIso@1234!', emailVerified: true, accountStatus: 'Active', role: 'Investigator' });
  await alice.save();

  const bob = new User({ fullName: 'Bob DFIR', email: bobEmail, password: 'BobIso@5678!', emailVerified: true, accountStatus: 'Active', role: 'Investigator' });
  await bob.save();

  console.log(`  [DB] Created Alice (${aliceEmail}) and Bob (${bobEmail})`);

  // Sign JWT tokens directly
  const tokenA = jwt.sign({ id: alice._id, role: alice.role, email: alice.email }, JWT_SECRET, { expiresIn: '1h' });
  const tokenB = jwt.sign({ id: bob._id, role: bob.role, email: bob.email }, JWT_SECRET, { expiresIn: '1h' });
  console.log('  [JWT] Tokens signed for both users\n');

  await mongoose.disconnect();

  // --- HTTP Tests ---

  // Alice creates a case
  let r = await post('/api/cases', { title: 'Alice Secret Case', severity: 'Critical', description: 'Alice only.' }, tokenA);
  const aliceCaseId = r.body.data?.caseId;
  console.log(`  [Setup] Alice created case: ${aliceCaseId || 'FAILED: ' + JSON.stringify(r.body.error)}\n`);

  console.log('--- Cross-User Dashboard Isolation ---');
  r = await get('/api/dashboard/overview', tokenB);
  check('Bob dashboard totalCases = 0', r.body.data?.stats?.totalCases, 0);
  check('Bob dashboard recentCases empty', r.body.data?.recentCases?.length, 0);
  check('Bob dashboard openCases = 0', r.body.data?.stats?.openCases, 0);
  check('Bob dashboard totalIOCs = 0', r.body.data?.stats?.totalIOCs, 0);

  console.log('\n--- Case List Isolation ---');
  r = await get('/api/cases', tokenB);
  check('Bob cases list pagination.total = 0', r.body.pagination?.total, 0);
  check('Bob cases data array empty', r.body.data?.length, 0);

  console.log('\n--- IDOR Prevention (Direct Case Access) ---');
  if (aliceCaseId) {
    r = await get('/api/cases/' + aliceCaseId, tokenB);
    check('Bob IDOR on Alice case returns 404', r.status, 404);
  } else {
    console.log('  ⚠️  Skipped IDOR test — Alice case creation failed');
  }

  console.log('\n--- Owner Access Verification ---');
  r = await get('/api/cases', tokenA);
  check('Alice cases total = 1', r.body.pagination?.total, 1);
  r = await get('/api/dashboard/overview', tokenA);
  check('Alice dashboard totalCases = 1', r.body.data?.stats?.totalCases, 1);
  check('Alice dashboard openCases = 1', r.body.data?.stats?.openCases, 1);
  check('Alice recentCases count = 1', r.body.data?.recentCases?.length, 1);

  console.log('\n--- IOC Isolation ---');
  r = await get('/api/ioc', tokenB);
  const bobIocTotal = r.body.data?.pagination?.total ?? r.body.data?.items?.length ?? 0;
  check('Bob IOC total = 0', bobIocTotal, 0);

  console.log('\n─────────────────────────────────────────────');
  if (failed === 0) {
    console.log(`  ✅ ALL ${passed} ISOLATION CHECKS PASSED`);
  } else {
    console.log(`  Results: ${passed} passed, ${failed} FAILED`);
    console.log('  ❌ ISOLATION VULNERABILITIES DETECTED — review above');
  }
  console.log('─────────────────────────────────────────────\n');
  process.exit(failed === 0 ? 0 : 1);
}

run().catch(e => {
  console.error('\nTEST ERROR:', e.message);
  process.exit(1);
});
