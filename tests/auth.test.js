// Sign up, sign in and Bearer token (JWT) checks.
import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { startTestServer, stopTestServer, clearDatabase, createUserAndSignIn, bearer, JWT_SECRET } from './helpers/testServer.js';

let api;
before(async () => { api = await startTestServer(); });
after(stopTestServer);
beforeEach(clearDatabase);

const newProject = { title: 'Auth check', description: 'Protected route test' };

describe('Sign up  (POST /api/users)', () => {
  it('TC-AUTH-01 creates a user -> 201 and never returns password fields', async () => {
    const res = await api.post('/api/users')
      .send({ name: 'Jane Tester', email: 'jane@example.com', password: 'secret123' });

    assert.equal(res.status, 201);
    assert.match(res.headers['content-type'], /application\/json/);
    assert.equal(res.body.message, 'Successfully signed up!');
    assert.equal(res.body.user.email, 'jane@example.com');
    assert.ok(res.body.user._id);
    assert.equal(res.body.user.hashed_password, undefined);
    assert.equal(res.body.user.salt, undefined);
    assert.equal(res.body.user.password, undefined);
  });

  it('TC-AUTH-02 rejects a duplicate email -> 409', async () => {
    const user = { name: 'Jane', email: 'dup@example.com', password: 'secret123' };
    await api.post('/api/users').send(user).expect(201);

    const res = await api.post('/api/users').send(user);
    assert.equal(res.status, 409);
    assert.equal(res.body.error, 'Email already exists');
  });

  it('TC-AUTH-03 rejects invalid input -> 400 with a validation message', async () => {
    const shortPassword = await api.post('/api/users').send({ name: 'A', email: 'a@example.com', password: '123' });
    assert.equal(shortPassword.status, 400);
    assert.equal(shortPassword.body.error, 'Password must be at least 6 characters.');

    const badEmail = await api.post('/api/users').send({ name: 'A', email: 'not-an-email', password: 'secret123' });
    assert.equal(badEmail.status, 400);
    assert.equal(badEmail.body.error, 'Please fill a valid email address');
  });
});

describe('Sign in  (POST /auth/signin)', () => {
  it('TC-AUTH-04 valid credentials -> 200 with a JWT token', async () => {
    await api.post('/api/users').send({ name: 'Jane', email: 'jane@example.com', password: 'secret123' });

    const res = await api.post('/auth/signin').send({ email: 'jane@example.com', password: 'secret123' });

    assert.equal(res.status, 200);
    assert.equal(res.body.token.split('.').length, 3, 'a JWT has 3 dot-separated parts');
    assert.equal(res.body.user.email, 'jane@example.com');
    const payload = jwt.verify(res.body.token, JWT_SECRET);
    assert.equal(payload._id, res.body.user._id);
  });

  it('TC-AUTH-05 wrong password -> 401', async () => {
    await api.post('/api/users').send({ name: 'Jane', email: 'jane@example.com', password: 'secret123' });

    const res = await api.post('/auth/signin').send({ email: 'jane@example.com', password: 'wrong-password' });
    assert.equal(res.status, 401);
    assert.equal(res.body.error, "Email and password don't match.");
    assert.equal(res.body.token, undefined);
  });

  it('TC-AUTH-06 missing email or password -> 400', async () => {
    const res = await api.post('/auth/signin').send({ email: 'jane@example.com' });
    assert.equal(res.status, 400);
  });
});

describe('Bearer token on protected routes', () => {
  it('TC-AUTH-07 no Authorization header -> 401', async () => {
    const res = await api.post('/api/projects').send(newProject);
    assert.equal(res.status, 401);
    assert.equal(res.body.error, 'A valid Bearer token is required');
  });

  it('TC-AUTH-08 malformed token -> 401', async () => {
    const res = await api.post('/api/projects').set(bearer('not.a.real.token')).send(newProject);
    assert.equal(res.status, 401);
  });

  it('TC-AUTH-09 expired token -> 401', async () => {
    const { user } = await createUserAndSignIn(api);
    const expired = jwt.sign({ _id: user._id, exp: Math.floor(Date.now() / 1000) - 60 }, JWT_SECRET);

    const res = await api.post('/api/projects').set(bearer(expired)).send(newProject);
    assert.equal(res.status, 401);
  });

  it('TC-AUTH-10 token signed with a different secret -> 401', async () => {
    const { user } = await createUserAndSignIn(api);
    const forged = jwt.sign({ _id: user._id }, 'some-other-secret-that-the-server-does-not-know');

    const res = await api.post('/api/projects').set(bearer(forged)).send(newProject);
    assert.equal(res.status, 401);
  });

  it('TC-AUTH-11 valid token -> request is allowed (201)', async () => {
    const { token } = await createUserAndSignIn(api);
    const res = await api.post('/api/projects').set(bearer(token)).send(newProject);
    assert.equal(res.status, 201);
  });

  it('TC-AUTH-12 sign out -> 200 and clears the cookie', async () => {
    const res = await api.get('/auth/signout');
    assert.equal(res.status, 200);
    assert.equal(res.body.message, 'signed out');
    assert.match(res.headers['set-cookie'].join(';'), /t=;/);
  });
});
