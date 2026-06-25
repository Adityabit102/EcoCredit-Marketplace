const Review = require('../models/Review');
const Transaction = require('../models/Transaction');
const Listing = require('../models/Listing');
const { notify } = require('../services/notifications');

// Recompute a seller's aggregate rating and denormalize onto their active listings
// (so the marketplace can sort/filter by rating cheaply).
async function syncSellerRating(sellerId) {
  const [agg] = await Review.aggregate([
    { $match: { seller: sellerId } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const sellerRating = { avg: Math.round((agg?.avg || 0) * 10) / 10, count: agg?.count || 0 };
  await Listing.updateMany({ seller: sellerId }, { $set: { sellerRating } });
  return sellerRating;
}

exports.create = async (req, res, next) => {
  try {
    const { transactionId, rating, comment } = req.body;
    const reviewerId = req.user.userId;

    // reviewer must be the buyer on a completed purchase
    const tx = await Transaction.findOne({ _id: transactionId, buyer: reviewerId, type: 'bought', status: 'completed' });
    if (!tx) return res.status(403).json({ error: 'You can only review sellers you bought from' });
    if (tx.seller.toString() === reviewerId) return res.status(400).json({ error: "Can't review yourself" });

    const review = await Review.create({
      seller: tx.seller, reviewer: reviewerId, transaction: tx._id, rating, comment,
    });
    const sellerRating = await syncSellerRating(tx.seller);

    await notify(tx.seller, { type: 'system', title: 'New review ⭐', message: `You received a ${rating}-star review.` });
    res.status(201).json({ review, sellerRating });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'You already reviewed this transaction' });
    next(err);
  }
};

exports.listForSeller = async (req, res, next) => {
  try {
    const reviews = await Review.find({ seller: req.params.sellerId })
      .populate('reviewer', 'name avatarUrl').sort({ createdAt: -1 }).limit(50);
    res.json({ reviews });
  } catch (err) {
    next(err);
  }
};
