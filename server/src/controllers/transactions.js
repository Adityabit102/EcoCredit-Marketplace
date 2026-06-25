const mongoose = require('mongoose');
const { customAlphabet } = require('nanoid');
const Transaction = require('../models/Transaction');
const Listing = require('../models/Listing');
const User = require('../models/User');
const { notify } = require('../services/notifications');
const { awardForAction } = require('../services/gamification');

const genProofId = customAlphabet('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 10);

exports.list = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const userId = req.user.userId;

    const filter = { $or: [{ buyer: userId }, { seller: userId }] };
    if (req.query.type) filter.type = req.query.type;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate('buyer', 'name email').populate('seller', 'name email')
        .sort({ createdAt: -1 }).skip(skip).limit(limit),
      Transaction.countDocuments(filter),
    ]);
    res.json({ transactions, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

exports.purchase = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const { listingId, credits } = req.body;
    const buyerId = req.user.userId;
    let result;

    await session.withTransaction(async () => {
      const listing = await Listing.findById(listingId).session(session);
      if (!listing || !listing.active) {
        const e = new Error('Listing not found or inactive'); e.statusCode = 404; throw e;
      }
      if (listing.seller.toString() === buyerId) {
        const e = new Error("Can't buy your own listing"); e.statusCode = 400; throw e;
      }

      const amount = listing.price * credits;
      const base = listing.originalCredits || listing.credits || credits;
      const co2Portion = listing.co2Offset * (credits / base);

      // ATOMIC oversell guard: only succeeds if enough credits remain on the listing
      const dec = await Listing.updateOne(
        { _id: listing._id, active: true, credits: { $gte: credits } },
        { $inc: { credits: -credits, soldCount: credits } },
        { session }
      );
      if (dec.modifiedCount === 0) {
        const e = new Error('Not enough credits available'); e.statusCode = 400; throw e;
      }
      // deactivate fully-sold listings
      await Listing.updateOne({ _id: listing._id, credits: { $lte: 0 } }, { $set: { active: false } }, { session });

      // move escrowed credits to buyer; pay the seller revenue
      await User.updateOne({ _id: buyerId }, { $inc: { creditBalance: credits, lifetimeCO2: co2Portion } }, { session });
      await User.updateOne({ _id: listing.seller }, { $inc: { lifetimeRevenue: amount } }, { session });

      const [buyTx] = await Transaction.create([
        { buyer: buyerId, seller: listing.seller, listing: listing._id, type: 'bought',
          credits, amount, co2Offset: co2Portion, status: 'completed', description: listing.title },
        { buyer: buyerId, seller: listing.seller, listing: listing._id, type: 'sold',
          credits, amount, co2Offset: co2Portion, status: 'completed', description: listing.title },
      ], { session, ordered: true });

      result = {
        transaction: buyTx, sellerId: listing.seller, amount, credits, title: listing.title,
        remaining: listing.credits - credits, // credits left on the listing after this purchase
      };
    });

    // side effects outside the transaction
    await notify(result.sellerId, {
      type: 'sale', title: 'Credits sold 💚',
      message: `${result.credits} credits from "${result.title}" sold for $${result.amount}.`,
    });
    await awardForAction(buyerId, { xp: result.credits, bumpStreak: false });

    res.status(201).json({ transaction: result.transaction, remaining: result.remaining });
  } catch (err) {
    next(err);
  } finally {
    session.endSession();
  }
};

// Permanently retire credits (offset them) — produces a public, verifiable proof.
exports.retire = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const { credits } = req.body;
    const userId = req.user.userId;
    const proofId = genProofId();
    let tx;

    await session.withTransaction(async () => {
      const dec = await User.updateOne(
        { _id: userId, creditBalance: { $gte: credits } },
        { $inc: { creditBalance: -credits, retiredCredits: credits, lifetimeCO2: credits * 0.1 } },
        { session }
      );
      if (dec.modifiedCount === 0) {
        const e = new Error('Insufficient credits to retire'); e.statusCode = 400; throw e;
      }
      [tx] = await Transaction.create([{
        buyer: userId, type: 'retired', credits, co2Offset: credits * 0.1,
        status: 'completed', proofId, description: `Retired ${credits} credits`,
      }], { session, ordered: true });
    });

    await notify(userId, { type: 'system', title: 'Credits retired 🌍', message: `You permanently offset ${credits} credits. Proof: ${proofId}` });
    res.status(201).json({ transaction: tx, proofId });
  } catch (err) {
    next(err);
  } finally {
    session.endSession();
  }
};

// Public, no-auth verifiable proof of a retirement.
exports.proof = async (req, res, next) => {
  try {
    const tx = await Transaction.findOne({ proofId: req.params.proofId, type: 'retired' })
      .populate('buyer', 'name accountType');
    if (!tx) return res.status(404).json({ error: 'Proof not found' });
    res.json({
      proofId: tx.proofId,
      retiredBy: tx.buyer?.name || 'Anonymous',
      accountType: tx.buyer?.accountType,
      credits: tx.credits,
      co2Offset: tx.co2Offset,
      date: tx.createdAt,
      verified: true,
    });
  } catch (err) {
    next(err);
  }
};
