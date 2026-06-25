const mongoose = require('mongoose');
const Listing = require('../models/Listing');
const User = require('../models/User');

exports.list = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const filter = { active: true };
    if (req.query.type) filter.type = req.query.type;
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
    }
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { location: { $regex: req.query.search, $options: 'i' } },
        { type: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    let sort = { createdAt: -1 };
    switch (req.query.sort) {
      case 'price-low': sort = { price: 1 }; break;
      case 'price-high': sort = { price: -1 }; break;
      case 'co2': sort = { co2Offset: -1 }; break;
      case 'rating': sort = { 'sellerRating.avg': -1 }; break;
    }

    const [listings, total] = await Promise.all([
      Listing.find(filter).populate('seller', 'name accountType avatarUrl').sort(sort).skip(skip).limit(limit),
      Listing.countDocuments(filter),
    ]);
    res.json({ listings, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id).populate('seller', 'name accountType avatarUrl bio');
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    res.json(listing);
  } catch (err) {
    next(err);
  }
};

// Creating a listing escrows the credits: they leave the seller's spendable balance
// atomically (guarded so you can't list more than you hold), and live on the listing.
exports.create = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const userId = req.user.userId;
    const credits = req.body.credits;
    let listing;

    await session.withTransaction(async () => {
      const dec = await User.updateOne(
        { _id: userId, creditBalance: { $gte: credits } },
        { $inc: { creditBalance: -credits } },
        { session }
      );
      if (dec.modifiedCount === 0) {
        const err = new Error('Insufficient available credits to list');
        err.statusCode = 400;
        throw err;
      }

      const data = { ...req.body, seller: userId, originalCredits: credits };
      if (req.body.actionId) { data.action = req.body.actionId; delete data.actionId; }
      listing = (await Listing.create([data], { session }))[0];
    });

    if (req.planUser) {
      req.planUser.usage.listingsThisMonth += 1;
      await req.planUser.save();
    }
    res.status(201).json(listing);
  } catch (err) {
    next(err);
  } finally {
    session.endSession();
  }
};

// Removing a listing returns the un-sold escrowed credits to the seller.
exports.remove = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    let removed = null;
    await session.withTransaction(async () => {
      const listing = await Listing.findOne({ _id: req.params.id, seller: req.user.userId, active: true }).session(session);
      if (!listing) {
        const err = new Error('Listing not found or not yours');
        err.statusCode = 404;
        throw err;
      }
      listing.active = false;
      await listing.save({ session });
      await User.updateOne({ _id: req.user.userId }, { $inc: { creditBalance: listing.credits } }, { session });
      removed = listing;
    });
    res.json({ message: 'Listing removed, credits returned', credits: removed.credits });
  } catch (err) {
    next(err);
  } finally {
    session.endSession();
  }
};
