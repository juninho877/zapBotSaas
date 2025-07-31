const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { validateLogin, validateUser } = require('../middleware/validation');

// Public routes
router.post('/login', validateLogin, authController.login);
router.post('/register', validateUser, authController.register);

// Protected routes
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, authController.updateProfile);
router.get('/verify', authenticateToken, authController.verifyToken);

module.exports = router;