const router = require('express').Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/favorites');
const { z } = require('zod');

const addSchema = z.object({
  listingId: z.string().min(1),
  priceAlertBelow: z.number().positive().optional(),
});

router.get('/', auth, ctrl.list);
router.post('/', auth, validate(addSchema), ctrl.add);
router.delete('/:listingId', auth, ctrl.remove);

module.exports = router;
