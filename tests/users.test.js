// User endpoints: who is allowed to read, update and delete an account.
import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, stopTestServer, clearDatabase, createUserAndSignIn, bearer } from './helpers/testServer.js';

let api;
before(async () => { api = await startTestServer(); });
after(stopTestServer);
beforeEach(clearDatabase);

describe('Users  (/api/users)', () => {
  it('TC-USR-01 GET list -> 200, only public fields', async () => {
    await createUserAndSignIn(api);
    await createUserAndSignIn(api);

    const res = await api.get('/api/users');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.equal(res.body.length, 2);
    for (const user of res.body) {
      assert.deepEqual(Object.keys(user).filter((k) => !['_id', '__v'].includes(k)).sort(), ['created', 'email', 'name', 'updated']);
      assert.equal(user.hashed_password, undefined);
    }
  });

  it('TC-USR-02 GET one user with a token -> 200', async () => {
    const { user, token } = await createUserAndSignIn(api, { name: 'Reader' });
    const res = await api.get(`/api/users/${user._id}`).set(bearer(token));
    assert.equal(res.status, 200);
    assert.equal(res.body.name, 'Reader');
    assert.equal(res.body.salt, undefined);
  });

  it('TC-USR-03 PUT own profile -> 200 and the change is saved', async () => {
    const { user, token } = await createUserAndSignIn(api);
    const res = await api.put(`/api/users/${user._id}`).set(bearer(token)).send({ name: 'New Name' });
    assert.equal(res.status, 200);
    assert.equal(res.body.name, 'New Name');

    const check = await api.get(`/api/users/${user._id}`).set(bearer(token));
    assert.equal(check.body.name, 'New Name');
  });

  it("TC-USR-04 PUT someone else's profile -> 403", async () => {
    const alice = await createUserAndSignIn(api, { name: 'Alice' });
    const bob = await createUserAndSignIn(api, { name: 'Bob' });

    const res = await api.put(`/api/users/${alice.user._id}`).set(bearer(bob.token)).send({ name: 'Hacked' });
    assert.equal(res.status, 403);
    assert.equal(res.body.error, 'User is not authorized');
  });

  it('TC-USR-05 changed password -> old password fails, new password works', async () => {
    const { user, token, account } = await createUserAndSignIn(api);
    await api.put(`/api/users/${user._id}`).set(bearer(token)).send({ password: 'newpass456' }).expect(200);

    await api.post('/auth/signin').send({ email: account.email, password: account.password }).expect(401);
    await api.post('/auth/signin').send({ email: account.email, password: 'newpass456' }).expect(200);
  });

  it('TC-USR-06 DELETE own account -> 200, then the old token stops working (401)', async () => {
    const { user, token } = await createUserAndSignIn(api);

    const res = await api.delete(`/api/users/${user._id}`).set(bearer(token));
    assert.equal(res.status, 200);
    assert.equal(res.body.message, 'User deleted');

    const after = await api.post('/api/projects').set(bearer(token)).send({ title: 'x' });
    assert.equal(after.status, 401);
    assert.equal(after.body.error, 'User no longer exists. Sign in again.');
  });
});
