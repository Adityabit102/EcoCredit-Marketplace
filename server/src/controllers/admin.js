const mongoose = require('mongoose');
const User = require('../models/User');
const Action = require('../models/Action');
const Transaction = require('../models/Transaction');
const Listing = require('../models/Listing');
const { awardForAction } = require('../services/gamification');
const { notify } = require('../services/notifications');

exports.listUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const skip = (page - 1) * limit;
    const filter = req.query.search ? { $or: [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ] } : {};

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);
    res.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

exports.stats = async (req, res, next) => {
  try {
    const [users, actions, listings, transactions, verifiedActions, pendingActions, co2Agg, revenueAgg] = await Promise.all([
      User.countDocuments(),
      Action.countDocuments(),
      Listing.countDocuments({ active: true }),
      Transaction.countDocuments(),
      Action.countDocuments({ status: 'verified' }),
      Action.countDocuments({ status: 'pending' }),
      Action.aggregate([{ $match: { status: 'verified' } }, { $group: { _id: null, total: { $sum: '$co2Estimate' } } }]),
      Transaction.aggregate([{ $match: { type: 'sold' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);
    res.json({
      users, actions, verifiedActions, pendingActions,
      activeListings: listings, transactions,
      totalCO2Offset: co2Agg[0]?.total || 0,
      gmv: revenueAgg[0]?.total || 0,
    });
  } catch (err) {
    next(err);
  }
};

// Time-series + breakdowns for the admin analytics dashboard.
exports.analytics = async (req, res, next) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 30, 365);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const byDay = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };

    const [signups, actionsVerified, gmv, actionTypes, plans] = await Promise.all([
      User.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: byDay, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      Action.aggregate([{ $match: { status: 'verified', createdAt: { $gte: since } } }, { $group: { _id: byDay, co2: { $sum: '$co2Estimate' }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      Transaction.aggregate([{ $match: { type: 'sold', createdAt: { $gte: since } } }, { $group: { _id: byDay, amount: { $sum: '$amount' } } }, { $sort: { _id: 1 } }]),
      Action.aggregate([{ $match: { status: 'verified' } }, { $group: { _id: '$type', co2: { $sum: '$co2Estimate' }, count: { $sum: 1 } } }, { $sort: { co2: -1 } }]),
      User.aggregate([{ $group: { _id: '$plan', count: { $sum: 1 } } }]),
    ]);
    res.json({ days, signups, actionsVerified, gmv, actionTypes, plans });
  } catch (err) {
    next(err);
  }
};

// Pending actions awaiting manual verification (the admin review queue).
exports.pendingActions = async (req, res, next) => {
  try {
    const actions = await Action.find({ status: 'pending' })
      .populate('user', 'name email')
      .sort({ createdAt: -1 }).limit(50);
    res.json({ actions });
  } catch (err) {
    next(err);
  }
};

exports.updatePlan = async (req, res, next) => {
  try {
    const { plan } = req.body;
    if (!['free', 'pro', 'enterprise'].includes(plan)) return res.status(400).json({ error: 'Invalid plan' });
    const user = await User.findByIdAndUpdate(req.params.id, { plan }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// Manual verification fallback — when an admin verifies a pending action,
// credit the user's ledger atomically (mirrors the AI-verified path).
exports.updateActionStatus = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const { status } = req.body;
    if (!['pending', 'verified', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    let updated;
    await session.withTransaction(async () => {
      const action = await Action.findById(req.params.id).session(session);
      if (!action) { const e = new Error('Action not found'); e.statusCode = 404; throw e; }

      const wasVerified = action.status === 'verified';
      if (status === 'verified' && !wasVerified) {
        const credits = action.credits || Math.floor(action.co2Estimate * 10 * 0.85);
        action.credits = credits;
        action.verification = { ...action.verification, verifiedAt: new Date() };
        await User.updateOne({ _id: action.user },
          { $inc: { creditBalance: credits, lifetimeCredits: credits, lifetimeCO2: action.co2Estimate } },
          { session });
        await Transaction.create([{ buyer: action.user, type: 'earned', credits, co2Offset: action.co2Estimate, status: 'completed', description: `${action.type} (admin-verified)` }], { session });
      }
      action.status = status;
      await action.save({ session });
      updated = action;
    });

    if (updated.status === 'verified') {
      await awardForAction(updated.user, { xp: updated.credits });
      await notify(updated.user, { type: 'action_verified', title: 'Action approved ✅', message: `An admin verified "${updated.type}" — ${updated.credits} credits added.` });
    } else if (updated.status === 'rejected') {
      await notify(updated.user, { type: 'action_rejected', title: 'Action rejected', message: `"${updated.type}" was not approved.` });
    }
    res.json(updated);
  } catch (err) {
    next(err);
  } finally {
    session.endSession();
  }
};
