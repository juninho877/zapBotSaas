const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateUser } = require('../middleware/validation');

// All routes require authentication
router.use(authenticateToken);

router.get('/', requireAdmin, userController.getUsers);
router.get('/:id', userController.getUser);
router.post('/', requireAdmin, validateUser, userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', requireAdmin, userController.deleteUser);
router.get('/:id/stats', userController.getUserStats);

module.exports = router;