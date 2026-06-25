const Favorite = require('../models/Favorite');

exports.list = async (req, res, next) => {
  try {
    const favorites = await Favorite.find({ user: req.user.userId })
      .populate({ path: 'listing', populate: { path: 'seller', select: 'name avatarUrl' } })
      .sort({ createdAt: -1 });
    res.json({ favorites });
  } catch (err) {
    next(err);
  }
};

// idempotent add (with optional price alert)
exports.add = async (req, res, next) => {
  try {
    const { listingId, priceAlertBelow } = req.body;
    const fav = await Favorite.findOneAndUpdate(
      { user: req.user.userId, listing: listingId },
      { $set: { priceAlertBelow } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json(fav);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await Favorite.deleteOne({ user: req.user.userId, listing: req.params.listingId });
    res.json({ message: 'Removed from favorites' });
  } catch (err) {
    next(err);
  }
};
