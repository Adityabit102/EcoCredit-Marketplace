const User = require('../models/User');
const { BADGES } = require('../services/gamification');

const METRICS = {
  co2: 'lifetimeCO2',
  credits: 'lifetimeCredits',
  xp: 'xp',
};

exports.top = async (req, res, next) => {
  try {
    const field = METRICS[req.query.metric] || 'lifetimeCO2';
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    const users = await User.find({ [field]: { $gt: 0 } })
      .select('name avatarUrl level xp lifetimeCO2 lifetimeCredits badges accountType')
      .sort({ [field]: -1 })
      .limit(limit);

    const leaders = users.map((u, i) => ({
      rank: i + 1,
      _id: u._id, name: u.name, avatarUrl: u.avatarUrl, accountType: u.accountType,
      level: u.level, xp: u.xp, lifetimeCO2: u.lifetimeCO2, lifetimeCredits: u.lifetimeCredits,
      badges: u.badges,
      value: u[field],
    }));
    res.json({ metric: req.query.metric || 'co2', leaders });
  } catch (err) {
    next(err);
  }
};

// the requesting user's own rank for a metric
exports.myRank = async (req, res, next) => {
  try {
    const field = METRICS[req.query.metric] || 'lifetimeCO2';
    const me = await User.findById(req.user.userId).select(field);
    if (!me) return res.status(404).json({ error: 'User not found' });
    const ahead = await User.countDocuments({ [field]: { $gt: me[field] } });
    res.json({ rank: ahead + 1, value: me[field] });
  } catch (err) {
    next(err);
  }
};

exports.badgeCatalog = (req, res) => {
  res.json({ badges: BADGES.map((b) => ({ id: b.id, label: b.label })) });
};
