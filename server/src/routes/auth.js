const router = require('express').Router();
const ctrl = require('../controllers/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const { z } = require('zod');

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1).max(100),
  accountType: z.enum(['individual', 'business']).optional(),
  role: z.enum(['buyer', 'seller']),
  referralCode: z.string().trim().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

const forgotSchema = z.object({ email: z.string().email() });
const resetSchema = z.object({
  token: z.string().min(1), email: z.string().email(), password: z.string().min(8),
});

router.post('/register', authLimiter, validate(registerSchema), ctrl.register);
router.post('/login', authLimiter, validate(loginSchema), ctrl.login);
router.post('/refresh', ctrl.refresh); // token comes from httpOnly cookie
router.post('/logout', ctrl.logout);
router.get('/me', auth, ctrl.me);
router.post('/forgot-password', authLimiter, validate(forgotSchema), ctrl.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetSchema), ctrl.resetPassword);

module.exports = router;
