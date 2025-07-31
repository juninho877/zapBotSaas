const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { authenticateToken } = require('../middleware/auth');
const { validateGroupConfig } = require('../middleware/validation');
const upload = require('../middleware/upload');

// All routes require authentication
router.use(authenticateToken);

router.get('/', groupController.getGroups);
router.get('/:id', groupController.getGroup);
router.put('/:id', groupController.updateGroup);
router.delete('/:id', groupController.deleteGroup);

// Group configuration
router.get('/:id/config', groupController.getGroupConfig);
router.put('/:id/config', validateGroupConfig, groupController.updateGroupConfig);

// Group actions
router.post('/:id/message', upload.single('image'), groupController.sendMessage);
router.get('/:id/stats', groupController.getGroupStats);

module.exports = router;