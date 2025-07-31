const User = require('../models/User');
const Session = require('../models/Session');
const Log = require('../models/Log');

const userController = {
    async getUsers(req, res) {
        try {
            // Only admin can view all users
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Access denied' });
            }

            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;

            const users = await User.findAll(limit, offset);
            const total = await User.count();

            res.json({
                success: true,
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            });

        } catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async getUser(req, res) {
        try {
            const { id } = req.params;
            
            // User can only view their own profile, admin can view all
            if (req.user.role !== 'admin' && parseInt(id) !== req.user.id) {
                return res.status(403).json({ error: 'Access denied' });
            }

            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Get user's sessions
            const sessions = await Session.findByUserId(id);

            res.json({
                success: true,
                user: {
                    ...user,
                    sessions
                }
            });

        } catch (error) {
            console.error('Get user error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async createUser(req, res) {
        try {
            // Only admin can create users
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Access denied' });
            }

            const { name, email, password, role, group_limit } = req.body;

            // Check if user already exists
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return res.status(409).json({ error: 'User already exists with this email' });
            }

            const userId = await User.create({
                name,
                email,
                password,
                role: role || 'user',
                group_limit: group_limit || 10
            });

            await Log.create({
                user_id: req.user.id,
                action: 'user_created',
                details: `Admin created new user: ${name} (${email})`
            });

            res.status(201).json({
                success: true,
                message: 'User created successfully',
                userId
            });

        } catch (error) {
            console.error('Create user error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async updateUser(req, res) {
        try {
            const { id } = req.params;
            const { name, role, group_limit, is_active } = req.body;

            // Only admin can update other users
            if (req.user.role !== 'admin' && parseInt(id) !== req.user.id) {
                return res.status(403).json({ error: 'Access denied' });
            }

            // Only admin can change role and group_limit
            const updateData = { name };
            if (req.user.role === 'admin') {
                if (role !== undefined) updateData.role = role;
                if (group_limit !== undefined) updateData.group_limit = group_limit;
                if (is_active !== undefined) updateData.is_active = is_active;
            }

            const updated = await User.update(id, updateData);
            
            if (!updated) {
                return res.status(400).json({ error: 'No changes made or user not found' });
            }

            await Log.create({
                user_id: req.user.id,
                action: 'user_updated',
                details: `User updated: ${id} - ${Object.keys(updateData).join(', ')}`
            });

            res.json({
                success: true,
                message: 'User updated successfully'
            });

        } catch (error) {
            console.error('Update user error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async deleteUser(req, res) {
        try {
            const { id } = req.params;

            // Only admin can delete users
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Access denied' });
            }

            // Don't allow deleting self
            if (parseInt(id) === req.user.id) {
                return res.status(400).json({ error: 'Cannot delete your own account' });
            }

            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            const deleted = await User.delete(id);
            
            if (!deleted) {
                return res.status(500).json({ error: 'Failed to delete user' });
            }

            await Log.create({
                user_id: req.user.id,
                action: 'user_deleted',
                details: `Admin deleted user: ${user.name} (${user.email})`
            });

            res.json({
                success: true,
                message: 'User deleted successfully'
            });

        } catch (error) {
            console.error('Delete user error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async getUserStats(req, res) {
        try {
            const { id } = req.params;
            
            // User can only view their own stats, admin can view all
            if (req.user.role !== 'admin' && parseInt(id) !== req.user.id) {
                return res.status(403).json({ error: 'Access denied' });
            }

            // Get user's activity logs
            const logs = await Log.findByUserId(id, 100);
            
            const stats = {
                total_sessions: await Session.findByUserId(id).then(s => s.length),
                active_sessions: await Session.findByUserId(id).then(s => s.filter(session => session.status === 'connected').length),
                total_actions: logs.length,
                recent_activity: logs.slice(0, 10)
            };

            res.json({
                success: true,
                stats
            });

        } catch (error) {
            console.error('Get user stats error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

module.exports = userController;