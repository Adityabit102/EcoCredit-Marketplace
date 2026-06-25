const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/leaderboard');

router.get('/', ctrl.top);
router.get('/badges', ctrl.badgeCatalog);
router.get('/me', auth, ctrl.myRank);

module.exports = router;
