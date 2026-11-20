// Shared setup for every test file.
// - Starts a temporary in-memory MongoDB (no Atlas account needed)
// - Loads the Express app WITHOUT opening a network port
// - Gives each test a clean database
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Test settings must be in place BEFORE the app (and config.js) is imported.
export const JWT_SECRET = crypto.randomBytes(32).toString('hex');
process.env.NODE_ENV = 'development';
process.env.JWT_SECRET = JWT_SECRET;
process.env.ALLOW_BULK_DELETE = 'true';

let mongo;

export async function startTestServer() {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: 'api-tests' });
  const { default: app } = await import('../../server/express.js');
  // Build indexes (e.g. the unique email index) before tests run.
  for (const name of ['Contact', 'Project', 'Qualification', 'User']) {
    await mongoose.model(name).init();
  }
  return request(app);
}

export async function stopTestServer() {
  await mongoose.disconnect();
  await mongo?.stop();
}

export async function clearDatabase() {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
}

// Signs up a user, signs in, and returns { user, token }.
export async function createUserAndSignIn(api, overrides = {}) {
  const account = {
    name: 'Test User',
    email: `user${crypto.randomInt(1e9)}@example.com`,
    password: 'secret123',
    ...overrides
  };
  const signup = await api.post('/api/users').send(account);
  if (signup.status !== 201) throw new Error(`Sign up failed: ${signup.status}`);
  const signin = await api.post('/auth/signin').send({ email: account.email, password: account.password });
  if (signin.status !== 200) throw new Error(`Sign in failed: ${signin.status}`);
  return { user: signin.body.user, token: signin.body.token, account };
}

export const bearer = (token) => ({ Authorization: `Bearer ${token}` });
