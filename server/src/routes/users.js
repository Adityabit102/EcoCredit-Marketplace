const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/users');
const validate = require('../middleware/validate');
const { z } = require('zod');

const walletSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
});

const profileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
  notificationPrefs: z.object({
    email: z.boolean().optional(),
    sales: z.boolean().optional(),
    priceAlerts: z.boolean().optional(),
  }).optional(),
});

router.get('/dashboard', auth, ctrl.dashboard);
router.patch('/wallet', auth, validate(walletSchema), ctrl.updateWallet);
router.patch('/profile', auth, validate(profileSchema), ctrl.updateProfile);
router.get('/:id/profile', ctrl.publicProfile);

module.exports = router;
