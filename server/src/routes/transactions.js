const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/transactions');
const validate = require('../middleware/validate');
const { z } = require('zod');

const purchaseSchema = z.object({
  listingId: z.string().min(1),
  credits: z.number().int().positive(),
});
const retireSchema = z.object({ credits: z.number().int().positive() });

router.get('/', auth, ctrl.list);
router.post('/purchase', auth, validate(purchaseSchema), ctrl.purchase);
router.post('/retire', auth, validate(retireSchema), ctrl.retire);
router.get('/proof/:proofId', ctrl.proof); // public verification

module.exports = router;
