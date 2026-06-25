const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const env = require('../config/env');

function signAccess(user) {
  return jwt.sign(
    { userId: user._id, role: user.role, plan: user.plan },
    env.jwtSecret,
    { expiresIn: env.accessTokenTtl }
  );
}

// Refresh token = signed JWT carrying a unique jti. We persist only a bcrypt
// hash of the raw token under that jti, so verification is a direct lookup
// (no scanning the whole users collection) and the secret is never stored.
function signRefresh(user) {
  const jti = crypto.randomUUID();
  const token = jwt.sign(
    { sub: user._id.toString(), jti },
    env.jwtRefreshSecret,
    { expiresIn: `${env.refreshTokenTtlDays}d` }
  );
  return { token, jti };
}

function verifyAccess(token) {
  return jwt.verify(token, env.jwtSecret);
}

function verifyRefresh(token) {
  return jwt.verify(token, env.jwtRefreshSecret); // throws if expired/invalid
}

function hashToken(token) {
  return bcrypt.hash(token, 10);
}

function compareToken(token, hash) {
  return bcrypt.compare(token, hash);
}

function refreshExpiry() {
  return new Date(Date.now() + env.refreshTokenTtlDays * 24 * 60 * 60 * 1000);
}

// httpOnly cookie options — Secure + SameSite=strict in prod, lax in dev (cross-port)
function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProd,
    // cross-site (frontend and API on different domains) requires SameSite=None + Secure
    sameSite: env.isProd ? 'none' : 'lax',
    domain: env.cookieDomain,
    path: '/api/auth',
    maxAge: env.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
  };
}

module.exports = {
  signAccess, signRefresh, verifyAccess, verifyRefresh,
  hashToken, compareToken, refreshExpiry, refreshCookieOptions,
};
