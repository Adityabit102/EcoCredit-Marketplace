const Action = require('../models/Action');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { verifyAction } = require('../services/ai');
const { awardForAction } = require('../services/gamification');
const { notify } = require('../services/notifications');
const { verifyTransaction } = require('../services/blockchain');
const env = require('../config/env');

exports.list = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const filter = { user: req.user.userId };
    if (req.query.status) filter.status = req.query.status;

    const [actions, total] = await Promise.all([
      Action.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Action.countDocuments(filter),
    ]);
    res.json({ actions, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const action = await Action.findOne({ _id: req.params.id, user: req.user.userId });
    if (!action) return res.status(404).json({ error: 'Action not found' });
    res.json(action);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { type, description, location, date, co2Estimate, imageUrl, hasGeotag } = req.body;

    const aiResult = await verifyAction({
      type, description, date, co2Estimate, hasGeotag: hasGeotag || false, imageUrl,
    });

    const credits = aiResult.verified
      ? Math.floor(co2Estimate * 10 * (aiResult.creditScore / 100))
      : 0;
    const status = aiResult.verified ? 'verified' : 'pending';

    const action = await Action.create({
      user: req.user.userId,
      type, description, location, date: new Date(date), co2Estimate, credits, status, imageUrl,
      verification: {
        aiScore: aiResult.creditScore,
        geoVerified: hasGeotag || false,
        imageAnalysis: aiResult.message,
        verifiedAt: aiResult.verified ? new Date() : undefined,
      },
    });

    let newBadges = [];
    if (aiResult.verified && credits > 0) {
      // credit the user's ledger atomically + record the earning transaction
      await User.updateOne(
        { _id: req.user.userId },
        { $inc: { creditBalance: credits, lifetimeCredits: credits, lifetimeCO2: co2Estimate } }
      );
      await Transaction.create({
        buyer: req.user.userId, type: 'earned', credits, co2Offset: co2Estimate,
        status: 'completed', description: `${type}: ${String(description).slice(0, 100)}`,
      });
      newBadges = await awardForAction(req.user.userId, { xp: credits });
      await notify(req.user.userId, {
        type: 'action_verified', title: 'Action verified ✅',
        message: `You earned ${credits} credits for "${type}".`, link: `/actions/${action._id}`,
      });
      for (const badge of newBadges) {
        await notify(req.user.userId, { type: 'badge', title: 'Badge unlocked 🏅', message: `You earned the "${badge}" badge!` });
      }
    } else {
      await notify(req.user.userId, {
        type: 'action_pending', title: 'Action pending review ⏳',
        message: aiResult.message || 'Your action is queued for verification.', link: `/actions/${action._id}`,
      });
    }

    if (req.planUser) {
      req.planUser.usage.actionsThisMonth += 1;
      await req.planUser.save();
    }

    res.status(201).json({ action, verification: aiResult, newBadges });
  } catch (err) {
    next(err);
  }
};

// Records a blockchain tx hash for an action ONLY after verifying it on-chain.
exports.updateBlockchain = async (req, res, next) => {
  try {
    const { blockchainHash } = req.body;

    const user = await User.findById(req.user.userId).select('walletAddress');
    const result = await verifyTransaction(blockchainHash, {
      from: user?.walletAddress,
      to: env.contractAddress,
    });
    if (!result.ok) {
      return res.status(400).json({ error: 'Blockchain verification failed', reason: result.reason });
    }

    const action = await Action.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      { blockchainHash },
      { new: true }
    );
    if (!action) return res.status(404).json({ error: 'Action not found' });
    res.json({ action, verified: true });
  } catch (err) {
    next(err);
  }
};
