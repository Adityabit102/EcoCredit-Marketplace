const User = require('../models/User');
const { customAlphabet } = require('nanoid');
const {
  signAccess, signRefresh, verifyRefresh,
  hashToken, compareToken, refreshExpiry, refreshCookieOptions,
} = require('../services/tokens');
const env = require('../config/env');
const logger = require('../config/logger');

const genReferralCode = customAlphabet('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 8);

// Issues an access token + sets the rotating refresh token as an httpOnly cookie,
// persisting only its hash under a jti. Caps concurrent sessions per user.
async function issueSession(user, req, res) {
  const accessToken = signAccess(user);
  const { token: refreshToken, jti } = signRefresh(user);
  const tokenHash = await hashToken(refreshToken);

  const session = {
    jti,
    tokenHash,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    expiresAt: refreshExpiry(),
  };

  // keep newest N sessions, drop expired ones
  const fresh = (user.sessions || []).filter((s) => s.expiresAt > new Date());
  fresh.push(session);
  const kept = fresh.slice(-env.maxSessionsPerUser);
  await User.updateOne({ _id: user._id }, { $set: { sessions: kept } });

  res.cookie('refreshToken', refreshToken, refreshCookieOptions());
  return accessToken;
}

exports.register = async (req, res, next) => {
  try {
    const { email, password, name, accountType, role, referralCode } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    let referredBy = null;
    if (referralCode) {
      const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
      if (referrer) referredBy = referrer;
    }

    const user = await User.create({
      email, password, name, accountType, role,
      referralCode: genReferralCode(),
      referredBy: referredBy?._id,
    });

    // reward the referrer with bonus credits
    if (referredBy) {
      await User.updateOne(
        { _id: referredBy._id },
        { $inc: { referralCount: 1, creditBalance: 50, xp: 100 } }
      );
    }

    const accessToken = await issueSession(user, req, res);
    res.status(201).json({ user: user.toJSON(), accessToken });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password +sessions');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const accessToken = await issueSession(user, req, res);
    res.json({ user: user.toJSON(), accessToken });
  } catch (err) {
    next(err);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    // cookie first, body as fallback for non-browser clients
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!refreshToken) return res.status(401).json({ error: 'No refresh token' });

    let payload;
    try {
      payload = verifyRefresh(refreshToken);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // direct lookup by user + jti — no collection scan
    const user = await User.findById(payload.sub).select('+sessions');
    if (!user) return res.status(401).json({ error: 'Invalid refresh token' });

    const session = (user.sessions || []).find((s) => s.jti === payload.jti);
    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Session expired' });
    }

    const valid = await compareToken(refreshToken, session.tokenHash);
    if (!valid) {
      // token reuse / tamper — nuke all sessions defensively
      await User.updateOne({ _id: user._id }, { $set: { sessions: [] } });
      logger.warn({ userId: user._id.toString() }, 'Refresh token reuse detected');
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // rotate: replace this session in place
    const { token: newToken, jti: newJti } = signRefresh(user);
    session.jti = newJti;
    session.tokenHash = await hashToken(newToken);
    session.expiresAt = refreshExpiry();
    await User.updateOne(
      { _id: user._id, 'sessions.jti': payload.jti },
      { $set: { 'sessions.$': session } }
    );

    res.cookie('refreshToken', newToken, refreshCookieOptions());
    res.json({ accessToken: signAccess(user) });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      try {
        const payload = verifyRefresh(refreshToken);
        await User.updateOne({ _id: payload.sub }, { $pull: { sessions: { jti: payload.jti } } });
      } catch { /* token already invalid — nothing to revoke */ }
    }
    res.clearCookie('refreshToken', refreshCookieOptions());
    res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

const crypto = require('crypto');
const { sendEmail, wrap } = require('../services/mailer');

// Request a password reset. Always returns 200 (don't leak which emails exist).
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      user.resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
      user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1h
      await user.save();

      const link = `${env.clientUrl}/?reset=${token}&email=${encodeURIComponent(email)}`;
      const result = await sendEmail({
        to: email, subject: 'Reset your EcoCredit password',
        html: wrap('Reset your password', `<p>Click below to choose a new password (valid 1 hour):</p><p><a href="${link}" style="background:#3E5F55;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Reset password</a></p>`),
      });
      // In dev without email configured, return the link so the flow is testable.
      if (!result.sent && !env.isProd) return res.json({ message: 'Reset link (dev)', devLink: link });
    }
    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, email, password } = req.body;
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ email }).select('+resetTokenHash +resetTokenExpires');
    if (!user || user.resetTokenHash !== hash || !user.resetTokenExpires || user.resetTokenExpires < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired reset link' });
    }
    user.password = password;
    user.resetTokenHash = undefined;
    user.resetTokenExpires = undefined;
    user.sessions = []; // revoke all sessions on password change
    await user.save();
    res.json({ message: 'Password updated. Please sign in.' });
  } catch (err) {
    next(err);
  }
};
