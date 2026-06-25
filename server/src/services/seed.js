const Plan = require('../models/Plan');
const logger = require('../config/logger');
const { PLAN_LIMITS } = require('../middleware/planLimits');

const PLAN_DEFS = [
  {
    name: 'free',
    limits: PLAN_LIMITS.free,
    price: 0,
    features: ['5 actions/mo', '3 listings/mo', 'AI verification', 'Marketplace access'],
  },
  {
    name: 'pro',
    limits: PLAN_LIMITS.pro,
    price: 19,
    features: ['50 actions/mo', '30 listings/mo', 'Priority AI', 'Analytics', 'Offset certificates'],
  },
  {
    name: 'enterprise',
    limits: PLAN_LIMITS.enterprise,
    price: 99,
    features: ['Unlimited actions', 'Unlimited listings', 'API access', 'Dedicated support', 'Bulk certificates'],
  },
];

// Idempotent: upsert the canonical plan definitions on boot.
async function seedPlans() {
  try {
    await Promise.all(
      PLAN_DEFS.map((p) =>
        Plan.updateOne({ name: p.name }, { $set: p }, { upsert: true })
      )
    );
    logger.debug('Plans seeded');
  } catch (err) {
    logger.warn({ err: err.message }, 'Plan seeding skipped');
  }
}

module.exports = { seedPlans, PLAN_DEFS };
