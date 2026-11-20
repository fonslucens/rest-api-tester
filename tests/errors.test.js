// Error handling: every error comes back as JSON with the right status code.
import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
// Import the test helper BEFORE config.js: the helper sets the test environment variables.
import { startTestServer, stopTestServer, clearDatabase, createUserAndSignIn, bearer } from './helpers/testServer.js';
import config from '../config/config.js';

let api;
let token;
before(async () => { api = await startTestServer(); });
after(stopTestServer);
beforeEach(async () => {
  await clearDatabase();
  ({ token } = await createUserAndSignIn(api));
});

describe('General responses', () => {
  it('TC-ERR-01 GET / -> 200 welcome message', async () => {
    const res = await api.get('/');
    assert.equal(res.status, 200);
    assert.equal(res.body.message, 'Welcome to My Portfolio application.');
  });

  it('TC-ERR-02 unknown route -> 404 JSON', async () => {
    const res = await api.get('/api/does-not-exist');
    assert.equal(res.status, 404);
    assert.match(res.headers['content-type'], /application\/json/);
    assert.equal(res.body.error, 'Route not found');
  });

  it('TC-ERR-03 broken JSON body -> 400', async () => {
    const res = await api.post('/api/contacts')
      .set('Content-Type', 'application/json')
      .send('{"firstname": "Ada",');
    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'Invalid JSON request body');
  });

  it('TC-ERR-04 badly formatted id -> 400', async () => {
    const res = await api.get('/api/projects/12345');
    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'Invalid project ID');
  });

  it('TC-ERR-05 well-formed id that does not exist -> 404', async () => {
    const res = await api.get('/api/projects/64b7f0c2a1b2c3d4e5f60718');
    assert.equal(res.status, 404);
    assert.equal(res.body.error, 'Project not found');
  });

  it('TC-ERR-06 security headers are set (helmet)', async () => {
    const res = await api.get('/');
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
    assert.equal(res.headers['x-powered-by'], undefined);
  });
});

describe('Bulk delete safety guard  (DELETE /api/contacts)', () => {
  beforeEach(async () => {
    await api.post('/api/contacts').send({ firstname: 'A' });
    await api.post('/api/contacts').send({ firstname: 'B' });
  });

  it('TC-ERR-07 without the confirmation header -> 400 and nothing is deleted', async () => {
    const res = await api.delete('/api/contacts').set(bearer(token));
    assert.equal(res.status, 400);
    const list = await api.get('/api/contacts');
    assert.equal(list.body.length, 2);
  });

  it('TC-ERR-08 with the confirmation header -> 200 and deletedCount = 2', async () => {
    const res = await api.delete('/api/contacts').set(bearer(token)).set('X-Confirm-Delete-All', 'DELETE ALL');
    assert.equal(res.status, 200);
    assert.equal(res.body.deletedCount, 2);
  });

  it('TC-ERR-09 when bulk delete is disabled -> 403', async () => {
    config.allowBulkDelete = false;
    try {
      const res = await api.delete('/api/contacts').set(bearer(token)).set('X-Confirm-Delete-All', 'DELETE ALL');
      assert.equal(res.status, 403);
    } finally {
      config.allowBulkDelete = true;
    }
  });
});
