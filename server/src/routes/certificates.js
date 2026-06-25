const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/certificates');

router.get('/download', auth, ctrl.generate);

module.exports = router;
