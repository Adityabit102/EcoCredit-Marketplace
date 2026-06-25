const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendEmail, wrap } = require('./mailer');
const logger = require('../config/logger');

// Email is only sent for these high-signal events (and only if the user opted in).
const EMAILABLE = new Set(['sale', 'action_verified', 'badge', 'system']);

async function notify(userId, { type, title, message, link, meta } = {}) {
  try {
    const n = await Notification.create({ user: userId, type, title, message, link, meta });

    if (EMAILABLE.has(type)) {
      const user = await User.findById(userId).select('email notificationPrefs');
      if (user?.email && user.notificationPrefs?.email !== false) {
        sendEmail({ to: user.email, subject: title, html: wrap(title, `<p>${message}</p>`) }).catch(() => {});
      }
    }
    return n;
  } catch (err) {
    logger.warn({ err: err.message, userId: String(userId) }, 'Failed to create notification');
    return null;
  }
}

module.exports = { notify };
