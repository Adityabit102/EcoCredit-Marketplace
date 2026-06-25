const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/payments');

router.get('/status', ctrl.status);
router.post('/checkout', auth, ctrl.createCheckout);
router.post('/subscribe', auth, ctrl.createSubscription);
// webhook uses a raw body (signature verification) — see app.js for the raw parser mount
router.post('/webhook', express.raw({ type: 'application/json' }), ctrl.webhook);

module.exports = router;
