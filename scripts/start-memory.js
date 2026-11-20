// Starts the API with a temporary in-memory MongoDB, so you can try the
// Thunder Client collection without a MongoDB Atlas account.
// All data is deleted when you stop the server (Ctrl + C).
import crypto from 'node:crypto';
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongo = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongo.getUri();
process.env.JWT_SECRET ||= crypto.randomBytes(32).toString('hex');
process.env.ALLOW_BULK_DELETE ||= 'true';
console.log('In-memory MongoDB started (data is temporary).');

process.on('exit', () => { mongo.stop().catch(() => {}); });
await import('../server.js');
