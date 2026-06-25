const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// one persisted refresh-token session — looked up by jti, secret never stored in plaintext
const sessionSchema = new mongoose.Schema({
  jti: { type: String, required: true },
  tokenHash: { type: String, required: true },
  userAgent: String,
  ip: String,
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false,
  },
  name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 100 },
  avatarUrl: String,
  bio: { type: String, maxlength: 500 },
  accountType: { type: String, enum: ['individual', 'business'], default: 'individual' },
  role: { type: String, enum: ['buyer', 'seller', 'admin'], default: 'buyer' },
  walletAddress: { type: String, sparse: true },
  plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },

  // ── Credit ledger (source of truth — kept consistent via atomic $inc) ──
  creditBalance: { type: Number, default: 0, min: 0 },
  lifetimeCredits: { type: Number, default: 0 }, // total ever earned
  lifetimeCO2: { type: Number, default: 0 },       // tons offset
  lifetimeRevenue: { type: Number, default: 0 },   // USD from sales
  retiredCredits: { type: Number, default: 0 },    // permanently retired (offset)

  // ── Password reset ──
  resetTokenHash: { type: String, select: false },
  resetTokenExpires: { type: Date, select: false },

  // ── Gamification ──
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  badges: [{ type: String }],
  streak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastActionDate: Date,
  },

  // ── Referrals ──
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  referralCount: { type: Number, default: 0 },

  notificationPrefs: {
    email: { type: Boolean, default: true },
    sales: { type: Boolean, default: true },
    priceAlerts: { type: Boolean, default: true },
  },

  usage: {
    actionsThisMonth: { type: Number, default: 0 },
    listingsThisMonth: { type: Number, default: 0 },
    lastResetAt: { type: Date, default: Date.now },
  },

  sessions: { type: [sessionSchema], select: false },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.sessions;
  delete obj.__v;
  return obj;
};

userSchema.index({ lifetimeCO2: -1 }); // leaderboard
userSchema.index({ xp: -1 });

module.exports = mongoose.model('User', userSchema);
