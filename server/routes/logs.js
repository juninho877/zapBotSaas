const express = require('express');
const router = express.Router();
const Log = require('../models/Log');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.use(authenticateToken);

// Get user's logs
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        // User can only view their own logs, admin can view all
        if (req.user.role !== 'admin' && parseInt(userId) !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;

        const logs = await Log.findByUserId(userId, limit, offset);

        res.json({
            success: true,
            logs,
            pagination: { page, limit }
        });

    } catch (error) {
        console.error('Get user logs error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get group logs
router.get('/group/:groupId', async (req, res) => {
    try {
        const { groupId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;

        const logs = await Log.findByGroupId(groupId, limit, offset);

        res.json({
            success: true,
            logs,
            pagination: { page, limit }
        });

    } catch (error) {
        console.error('Get group logs error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all logs (admin only)
router.get('/', requireAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;

        const logs = await Log.findAll(limit, offset);

        res.json({
            success: true,
            logs,
            pagination: { page, limit }
        });

    } catch (error) {
        console.error('Get all logs error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get statistics
router.get('/stats/:userId?', async (req, res) => {
    try {
        const { userId } = req.params;
        const days = parseInt(req.query.days) || 7;

        // User can only view their own stats, admin can view all
        if (userId && req.user.role !== 'admin' && parseInt(userId) !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const stats = await Log.getStatistics(userId, days);

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('Get log stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;