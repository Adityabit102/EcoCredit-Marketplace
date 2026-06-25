const router = require('express').Router();
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const ctrl = require('../controllers/admin');

// all admin routes require auth + admin role
router.use(auth, rbac('admin'));

router.get('/users', ctrl.listUsers);
router.get('/stats', ctrl.stats);
router.get('/analytics', ctrl.analytics);
router.get('/actions/pending', ctrl.pendingActions);
router.patch('/users/:id/plan', ctrl.updatePlan);
router.patch('/actions/:id/status', ctrl.updateActionStatus);

module.exports = router;
