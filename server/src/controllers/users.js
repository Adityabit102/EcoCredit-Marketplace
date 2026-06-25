const User = require('../models/User');
const Action = require('../models/Action');
const Transaction = require('../models/Transaction');
const Listing = require('../models/Listing');

exports.dashboard = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const [user, actions, transactions, activeListings] = await Promise.all([
      User.findById(userId),
      Action.find({ user: userId }).sort({ createdAt: -1 }).limit(10),
      Transaction.find({ $or: [{ buyer: userId }, { seller: userId }] }).sort({ createdAt: -1 }).limit(10),
      Listing.find({ seller: userId, active: true }).select('credits'),
    ]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const escrowed = activeListings.reduce((s, l) => s + l.credits, 0);

    res.json({
      user,
      stats: {
        creditBalance: user.creditBalance,        // spendable, from the ledger
        escrowedCredits: escrowed,                 // currently listed
        lifetimeCredits: user.lifetimeCredits,
        totalCO2: user.lifetimeCO2,
        revenue: user.lifetimeRevenue,
        actionsCount: await Action.countDocuments({ user: userId }),
        level: user.level,
        xp: user.xp,
        badges: user.badges,
        streak: user.streak,
      },
      actions,
      transactions,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateWallet = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.user.userId, { walletAddress: req.body.walletAddress }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = (({ name, bio, avatarUrl, notificationPrefs }) => ({ name, bio, avatarUrl, notificationPrefs }))(req.body);
    Object.keys(allowed).forEach((k) => allowed[k] === undefined && delete allowed[k]);
    const user = await User.findByIdAndUpdate(req.user.userId, allowed, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// Public profile + that seller's active listings
exports.publicProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('name avatarUrl bio accountType lifetimeCO2 level badges createdAt');
    if (!user) return res.status(404).json({ error: 'User not found' });
    const listings = await Listing.find({ seller: user._id, active: true }).limit(20);
    res.json({ user, listings });
  } catch (err) {
    next(err);
  }
};
