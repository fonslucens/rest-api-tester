// The same CRUD checklist runs against every resource:
// POST (create) -> GET (read list + one) -> PUT (update) -> DELETE -> GET again (404)
import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, stopTestServer, clearDatabase, createUserAndSignIn, bearer } from './helpers/testServer.js';

const resources = [
  {
    name: 'contacts',
    createNeedsToken: false, // the public contact form can POST without signing in
    sample: { firstname: 'Ada', lastname: 'Lovelace', email: 'ada@example.com' },
    update: { email: 'ada.updated@example.com' }
  },
  {
    name: 'projects',
    createNeedsToken: true,
    sample: { title: 'Inventory API', firstname: 'Jane', lastname: 'Tester', email: 'jane@example.com', completion: '2026-11-01', description: 'REST API for an inventory app' },
    update: { title: 'Inventory API v2' }
  },
  {
    name: 'qualifications',
    createNeedsToken: true,
    sample: { title: 'Database Fundamentals', firstname: 'Jane', lastname: 'Tester', email: 'jane@example.com', completion: '2026-04-30', description: 'Relational design and SQL' },
    update: { description: 'Relational design, SQL and constraints' }
  }
];

let api;
let token;
before(async () => { api = await startTestServer(); });
after(stopTestServer);
beforeEach(async () => {
  await clearDatabase();
  ({ token } = await createUserAndSignIn(api));
});

for (const r of resources) {
  const url = `/api/${r.name}`;
  const tag = r.name.slice(0, 4).toUpperCase();

  describe(`${r.name}  (${url})`, () => {
    it(`TC-${tag}-01 full CRUD cycle: POST 201 -> GET 200 -> PUT 200 -> DELETE 200 -> GET 404`, async () => {
      // CREATE
      const created = await api.post(url).set(r.createNeedsToken ? bearer(token) : {}).send(r.sample);
      assert.equal(created.status, 201);
      assert.ok(created.body._id);
      assert.equal(created.body.email, r.sample.email);
      const id = created.body._id;

      // READ (list)
      const list = await api.get(url);
      assert.equal(list.status, 200);
      assert.equal(list.body.length, 1);

      // READ (one)
      const one = await api.get(`${url}/${id}`);
      assert.equal(one.status, 200);
      assert.equal(one.body._id, id);

      // UPDATE
      const updated = await api.put(`${url}/${id}`).set(bearer(token)).send(r.update);
      assert.equal(updated.status, 200);
      for (const [key, value] of Object.entries(r.update)) assert.equal(updated.body[key], value);

      // DELETE
      const deleted = await api.delete(`${url}/${id}`).set(bearer(token));
      assert.equal(deleted.status, 200);
      assert.equal(deleted.body._id, id);

      // READ again -> gone
      const gone = await api.get(`${url}/${id}`);
      assert.equal(gone.status, 404);
    });

    it(`TC-${tag}-02 PUT and DELETE without a token -> 401`, async () => {
      const created = await api.post(url).set(r.createNeedsToken ? bearer(token) : {}).send(r.sample);
      await api.put(`${url}/${created.body._id}`).send(r.update).expect(401);
      await api.delete(`${url}/${created.body._id}`).expect(401);
    });

    it(`TC-${tag}-03 POST with an empty body -> 400`, async () => {
      const res = await api.post(url).set(r.createNeedsToken ? bearer(token) : {}).send({});
      assert.equal(res.status, 400);
      assert.ok(res.body.error);
    });

    it(`TC-${tag}-04 unknown fields are ignored (no mass assignment)`, async () => {
      const res = await api.post(url).set(r.createNeedsToken ? bearer(token) : {}).send({ ...r.sample, isAdmin: true });
      assert.equal(res.status, 201);
      assert.equal(res.body.isAdmin, undefined);
    });

    if (r.createNeedsToken) {
      it(`TC-${tag}-05 POST without a token -> 401`, async () => {
        await api.post(url).send(r.sample).expect(401);
      });

      it(`TC-${tag}-06 invalid date in "completion" -> 400`, async () => {
        const res = await api.post(url).set(bearer(token)).send({ ...r.sample, completion: 'not-a-date' });
        assert.equal(res.status, 400);
      });
    }
  });
}
