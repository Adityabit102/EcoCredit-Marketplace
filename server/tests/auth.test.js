const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');

describe('Auth', () => {
  it('registers a user, hashes the password, and returns an access token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'a@test.com', password: 'password123', name: 'Alice', role: 'buyer',
    });
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.user.referralCode).toHaveLength(8);

    const stored = await User.findOne({ email: 'a@test.com' }).select('+password');
    expect(stored.password).not.toBe('password123');
  });

  it('rejects weak passwords', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'b@test.com', password: 'short', name: 'Bob', role: 'buyer',
    });
    expect(res.status).toBe(400);
  });

  it('logs in and sets an httpOnly refresh cookie (not the access token)', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'c@test.com', password: 'password123', name: 'Carol', role: 'buyer',
    });
    const res = await request(app).post('/api/auth/login').send({ email: 'c@test.com', password: 'password123' });
    expect(res.status).toBe(200);
    const cookie = res.headers['set-cookie'].find((c) => c.startsWith('refreshToken='));
    expect(cookie).toMatch(/HttpOnly/i);
  });

  it('refreshes using the cookie and rotates the token', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'd@test.com', password: 'password123', name: 'Dan', role: 'buyer',
    });
    const login = await request(app).post('/api/auth/login').send({ email: 'd@test.com', password: 'password123' });
    const cookie = login.headers['set-cookie'];
    const res = await request(app).post('/api/auth/refresh').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
  });

  it('credits a referrer when their code is used', async () => {
    const ref = await request(app).post('/api/auth/register').send({
      email: 'ref@test.com', password: 'password123', name: 'Ref', role: 'seller',
    });
    const code = ref.body.user.referralCode;
    await request(app).post('/api/auth/register').send({
      email: 'new@test.com', password: 'password123', name: 'New', role: 'buyer', referralCode: code,
    });
    const referrer = await User.findOne({ email: 'ref@test.com' });
    expect(referrer.referralCount).toBe(1);
    expect(referrer.creditBalance).toBe(50);
  });
});
