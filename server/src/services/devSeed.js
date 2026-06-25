const User = require('../models/User');
const Listing = require('../models/Listing');
const Action = require('../models/Action');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const { levelForXp } = require('./gamification');
const logger = require('../config/logger');

// Demo accounts (password is the same for all so it's easy to try).
const DEMO_PASSWORD = 'password123';
const USERS = [
  { email: 'admin@ecocredit.com', name: 'Platform Admin', role: 'admin', accountType: 'business', plan: 'enterprise' },
  { email: 'maya@ecocredit.com', name: 'Maya Verma', role: 'seller', plan: 'enterprise', lifetimeCO2: 48.2, lifetimeCredits: 482, lifetimeRevenue: 1240, xp: 2400, creditBalance: 180, badges: ['First Steps', 'Tree Hugger', 'Carbon Crusher', 'Week Warrior'] },
  { email: 'arjun@ecocredit.com', name: 'Arjun Nair', role: 'seller', plan: 'pro', lifetimeCO2: 31.5, lifetimeCredits: 315, lifetimeRevenue: 760, xp: 1600, creditBalance: 120, badges: ['First Steps', 'Tree Hugger', 'Merchant'] },
  { email: 'sara@ecocredit.com', name: 'Sara Iyer', role: 'seller', plan: 'pro', lifetimeCO2: 22.0, lifetimeCredits: 220, lifetimeRevenue: 410, xp: 900, creditBalance: 90, badges: ['First Steps', 'Tree Hugger'] },
  { email: 'dev@ecocredit.com', name: 'Dev Patel', role: 'buyer', plan: 'free', lifetimeCO2: 8.5, lifetimeCredits: 0, xp: 300, creditBalance: 40, badges: ['First Steps'] },
  { email: 'neha@ecocredit.com', name: 'Neha Shah', role: 'buyer', plan: 'free', lifetimeCO2: 4.2, xp: 150, creditBalance: 25, badges: ['First Steps'] },
  { email: 'rohan@ecocredit.com', name: 'Rohan Das', role: 'seller', plan: 'free', lifetimeCO2: 14.0, lifetimeCredits: 140, xp: 500, creditBalance: 60, badges: ['First Steps', 'Tree Hugger'] },
];

const LISTINGS = [
  { title: 'Himalayan Reforestation Credits', type: 'Reforestation', price: 12, credits: 60, co2Offset: 30, location: 'Uttarakhand, India' },
  { title: 'Rooftop Solar — Bengaluru', type: 'Solar Energy', price: 9, credits: 45, co2Offset: 22, location: 'Bengaluru, India' },
  { title: 'Coastal Wind Farm Offsets', type: 'Wind Energy', price: 15, credits: 80, co2Offset: 55, location: 'Tamil Nadu, India' },
  { title: 'Urban Composting Program', type: 'Waste Reduction', price: 6, credits: 30, co2Offset: 9, location: 'Pune, India' },
  { title: 'EV Fleet Transition', type: 'Clean Transport', price: 11, credits: 50, co2Offset: 18, location: 'Delhi, India' },
  { title: 'Community Rooftop Gardens', type: 'Urban Agriculture', price: 7, credits: 35, co2Offset: 11, location: 'Mumbai, India' },
  { title: 'Mangrove Restoration', type: 'Reforestation', price: 14, credits: 70, co2Offset: 40, location: 'Sundarbans, India' },
  { title: 'LED Retrofit Initiative', type: 'Energy Efficiency', price: 8, credits: 40, co2Offset: 14, location: 'Hyderabad, India' },
];

// Seed a fresh database (empty only) with believable demo content.
async function devSeed() {
  try {
    if ((await User.countDocuments()) > 0) return; // already populated

    const users = [];
    for (const u of USERS) {
      const doc = await User.create({
        password: DEMO_PASSWORD,
        level: levelForXp(u.xp || 0),
        ...u,
      });
      users.push(doc);
    }
    const sellers = users.filter((u) => u.role === 'seller');

    // spread signups across the last ~25 days so the analytics chart isn't a single point
    const daysAgo = (d) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);
    // native driver bypasses Mongoose's immutable createdAt so demo dates spread out
    await Promise.all(users.map((u, i) => User.collection.updateOne({ _id: u._id }, { $set: { createdAt: daysAgo(1 + i * 4) } })));

    // listings spread across sellers, with ratings
    await Promise.all(LISTINGS.map((l, i) => {
      const seller = sellers[i % sellers.length];
      return Listing.create({
        ...l, seller: seller._id, originalCredits: l.credits, soldCount: Math.floor(l.credits * 0.2),
        sellerRating: { avg: 4.5 + (i % 2) * 0.4, count: 6 + i },
        active: true,
      });
    }));

    // varied verified actions across types + dates (populates the admin charts)
    const ACTIONS = [
      { type: 'Reforestation', co2: 5 }, { type: 'Solar Energy', co2: 4 }, { type: 'Wind Energy', co2: 8 },
      { type: 'Waste Reduction', co2: 2 }, { type: 'Clean Transport', co2: 3 }, { type: 'Energy Efficiency', co2: 3.5 },
      { type: 'Urban Agriculture', co2: 1.5 }, { type: 'Reforestation', co2: 6 }, { type: 'Solar Energy', co2: 5 },
      { type: 'Wind Energy', co2: 10 }, { type: 'Clean Transport', co2: 2.5 }, { type: 'Waste Reduction', co2: 1.8 },
    ];
    await Promise.all(ACTIONS.map(async (a, i) => {
      const s = sellers[i % sellers.length];
      const when = daysAgo(1 + (i % 18));
      const action = await Action.create({
        user: s._id, type: a.type, description: `${a.type} initiative #${i + 1}`,
        location: LISTINGS[i % LISTINGS.length].location, date: when, co2Estimate: a.co2,
        credits: Math.round(a.co2 * 10), status: 'verified',
        verification: { aiScore: 90, geoVerified: true, imageAnalysis: 'Verified', verifiedAt: when },
      });
      await Action.collection.updateOne({ _id: action._id }, { $set: { createdAt: when } });
      const earned = await Transaction.create({ buyer: s._id, type: 'earned', credits: action.credits, co2Offset: a.co2, status: 'completed', description: `${a.type}` });
      await Transaction.collection.updateOne({ _id: earned._id }, { $set: { createdAt: when } });
    }));

    // a couple of pending actions for the admin verification queue
    await Action.create([
      { user: sellers[0]._id, type: 'Solar Energy', description: 'New rooftop array awaiting review', location: 'Jaipur, India', date: new Date(), co2Estimate: 3.5, credits: 0, status: 'pending' },
      { user: sellers[1]._id, type: 'Reforestation', description: 'Sapling drive pending verification', location: 'Kerala, India', date: new Date(), co2Estimate: 4, credits: 0, status: 'pending' },
    ]);

    // sales history → GMV chart
    const buyer = users.find((u) => u.role === 'buyer');
    await Promise.all([2, 7, 12, 18].map(async (d, i) => {
      const seller = sellers[i % sellers.length];
      const sold = await Transaction.create({ buyer: buyer._id, seller: seller._id, type: 'sold', credits: 10 + i * 5, amount: (10 + i * 5) * (9 + i), co2Offset: (10 + i * 5) * 0.1, status: 'completed', description: 'Credit sale' });
      await Transaction.collection.updateOne({ _id: sold._id }, { $set: { createdAt: daysAgo(d) } });
    }));

    // welcome notification for the admin
    const admin = users.find((u) => u.role === 'admin');
    if (admin) await Notification.create({ user: admin._id, type: 'system', title: 'Welcome 🌿', message: 'Demo data loaded. Explore the admin analytics dashboard.' });

    logger.info(`Demo data seeded: ${users.length} users, ${LISTINGS.length} listings`);
  } catch (err) {
    logger.warn({ err: err.message }, 'Demo seed skipped');
  }
}

module.exports = { devSeed };
