const env = require('../config/env');
const User = require('../models/User');
const { notify } = require('../services/notifications');
const logger = require('../config/logger');

let stripe = null;
function getStripe() {
  if (!stripe && env.stripeSecretKey) stripe = require('stripe')(env.stripeSecretKey);
  return stripe;
}
const isConfigured = () => Boolean(env.stripeSecretKey);

const PLAN_PRICES = { pro: 1900, enterprise: 9900 }; // cents/month

// Create a Stripe Checkout session to upgrade the user's plan (test mode).
exports.createCheckout = async (req, res, next) => {
  try {
    const s = getStripe();
    if (!s) return res.status(503).json({ error: 'Payments not configured' });

    const { plan } = req.body;
    if (!PLAN_PRICES[plan]) return res.status(400).json({ error: 'Invalid plan' });

    const session = await s.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `EcoCredit ${plan} plan` },
          unit_amount: PLAN_PRICES[plan],
        },
        quantity: 1,
      }],
      success_url: `${env.clientUrl}/billing?status=success`,
      cancel_url: `${env.clientUrl}/billing?status=cancel`,
      client_reference_id: req.user.userId,
      metadata: { userId: req.user.userId, plan },
    });
    res.json({ url: session.url, id: session.id });
  } catch (err) {
    next(err);
  }
};

// Recurring auto-offset subscription — buys ~tons/month automatically (test mode).
exports.createSubscription = async (req, res, next) => {
  try {
    const s = getStripe();
    if (!s) return res.status(503).json({ error: 'Payments not configured' });
    const tons = Math.max(1, Math.min(50, Number(req.body.tonsPerMonth) || 1));

    const session = await s.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{
        price_data: {
          currency: 'usd', recurring: { interval: 'month' },
          product_data: { name: `Auto-offset ${tons} t CO₂ / month` },
          unit_amount: tons * 1000, // $10 per tonne
        },
        quantity: 1,
      }],
      success_url: `${env.clientUrl}/?sub=success`,
      cancel_url: `${env.clientUrl}/?sub=cancel`,
      client_reference_id: req.user.userId,
      metadata: { userId: req.user.userId, autoOffsetTons: String(tons) },
    });
    res.json({ url: session.url, id: session.id });
  } catch (err) {
    next(err);
  }
};

// Stripe webhook — verifies signature, then fulfils the upgrade. Mounted with a raw body parser.
exports.webhook = async (req, res) => {
  const s = getStripe();
  if (!s) return res.status(503).end();

  let event;
  try {
    event = s.webhooks.constructEvent(req.body, req.headers['stripe-signature'], env.stripeWebhookSecret);
  } catch (err) {
    logger.warn({ err: err.message }, 'Stripe webhook signature verification failed');
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const { userId, plan } = event.data.object.metadata || {};
    if (userId && plan) {
      await User.updateOne({ _id: userId }, { $set: { plan } });
      await notify(userId, { type: 'system', title: 'Plan upgraded 🎉', message: `You're now on the ${plan} plan.` });
    }
  }
  res.json({ received: true });
};

exports.isConfigured = isConfigured;
exports.status = (req, res) => res.json({ enabled: isConfigured() });
