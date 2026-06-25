const Notification = require('../models/Notification');

exports.list = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 30, 100);
    const filter = { user: req.user.userId };
    if (req.query.unread === 'true') filter.read = false;

    const [notifications, unread] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).limit(limit),
      Notification.countDocuments({ user: req.user.userId, read: false }),
    ]);
    res.json({ notifications, unread });
  } catch (err) {
    next(err);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    await Notification.updateOne({ _id: req.params.id, user: req.user.userId }, { read: true });
    res.json({ message: 'Marked read' });
  } catch (err) {
    next(err);
  }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user.userId, read: false }, { read: true });
    res.json({ message: 'All marked read' });
  } catch (err) {
    next(err);
  }
};
