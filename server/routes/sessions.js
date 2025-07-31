const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

router.post('/', sessionController.createSession);
router.get('/', sessionController.getSessions);
router.get('/:id', sessionController.getSession);
router.post('/:id/disconnect', sessionController.disconnectSession);
router.delete('/:id', sessionController.deleteSession);
router.get('/:id/status', sessionController.getSessionStatus);

module.exports = router;