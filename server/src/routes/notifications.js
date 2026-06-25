const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/notifications');

router.get('/', auth, ctrl.list);
router.post('/read-all', auth, ctrl.markAllRead);
router.patch('/:id/read', auth, ctrl.markRead);

module.exports = router;
