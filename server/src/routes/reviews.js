const router = require('express').Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/reviews');
const { z } = require('zod');

const createSchema = z.object({
  transactionId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

router.post('/', auth, validate(createSchema), ctrl.create);
router.get('/seller/:sellerId', ctrl.listForSeller);

module.exports = router;
