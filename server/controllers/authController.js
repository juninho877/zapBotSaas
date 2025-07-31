const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Log = require('../models/Log');

const authController = {
    async login(req, res) {
        try {
            const { email, password } = req.body;

            const user = await User.findByEmail(email);
            if (!user || !user.is_active) {
                return res.status(401).json({ error: 'Invalid credentials or inactive account' });
            }

            const isValidPassword = await User.verifyPassword(password, user.password_hash);
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const token = jwt.sign(
                { userId: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            // Log login
            await Log.create({
                user_id: user.id,
                action: 'user_login',
                details: `User logged in from IP: ${req.ip}`
            });

            res.json({
                success: true,
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    group_limit: user.group_limit,
                    global_prefix: user.global_prefix
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async register(req, res) {
        try {
            const { name, email, password, role, group_limit } = req.body;

            // Check if user already exists
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return res.status(409).json({ error: 'User already exists with this email' });
            }

            // Only admin can create other users
            if (req.user && req.user.role !== 'admin' && role) {
                return res.status(403).json({ error: 'Only admin can set user roles' });
            }

            const userId = await User.create({
                name,
                email,
                password,
                role: role || 'user',
                group_limit: group_limit || 10
            });

            // Log user creation
            await Log.create({
                user_id: req.user ? req.user.id : userId,
                action: 'user_created',
                details: `New user created: ${name} (${email})`
            });

            res.status(201).json({
                success: true,
                message: 'User created successfully',
                userId
            });

        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async getProfile(req, res) {
        try {
            const user = await User.findById(req.user.id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    group_limit: user.group_limit,
                    global_prefix: user.global_prefix,
                    created_at: user.created_at
                }
            });

        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async updateProfile(req, res) {
        try {
            const { name, global_prefix, current_password, new_password } = req.body;
            const updateData = {};

            if (name) updateData.name = name;
            if (global_prefix) updateData.global_prefix = global_prefix;

            if (new_password) {
                if (!current_password) {
                    return res.status(400).json({ error: 'Current password is required to set new password' });
                }

                const user = await User.findById(req.user.id);
                const isValidPassword = await User.verifyPassword(current_password, user.password_hash);
                
                if (!isValidPassword) {
                    return res.status(401).json({ error: 'Current password is incorrect' });
                }

                updateData.password = new_password;
            }

            const updated = await User.update(req.user.id, updateData);
            if (!updated) {
                return res.status(400).json({ error: 'No changes made' });
            }

            await Log.create({
                user_id: req.user.id,
                action: 'profile_updated',
                details: `Profile updated: ${Object.keys(updateData).join(', ')}`
            });

            res.json({
                success: true,
                message: 'Profile updated successfully'
            });

        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async verifyToken(req, res) {
        try {
            res.json({
                success: true,
                user: {
                    id: req.user.id,
                    name: req.user.name,
                    email: req.user.email,
                    role: req.user.role
                }
            });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

module.exports = authController;