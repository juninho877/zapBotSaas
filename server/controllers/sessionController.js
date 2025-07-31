const Session = require('../models/Session');
const Group = require('../models/Group');
const Log = require('../models/Log');
const WhatsAppService = require('../services/WhatsAppService');
const { v4: uuidv4 } = require('crypto');

const sessionController = {
    async createSession(req, res) {
        try {
            const sessionId = `session_${req.user.id}_${uuidv4()}`;
            
            // Check if user already has active sessions
            const existingSessions = await Session.findByUserId(req.user.id);
            const activeSessions = existingSessions.filter(s => s.status === 'connected' || s.status === 'connecting');
            
            if (activeSessions.length >= 1 && req.user.role !== 'admin') {
                return res.status(409).json({ error: 'You already have an active session. Please disconnect it first.' });
            }

            const sessionDbId = await Session.create({
                user_id: req.user.id,
                session_id: sessionId,
                status: 'connecting'
            });

            // Start WhatsApp session
            const success = await WhatsAppService.createSession(req.user.id, sessionId);
            
            if (!success) {
                await Session.update(sessionDbId, { status: 'error' });
                return res.status(500).json({ error: 'Failed to create WhatsApp session' });
            }

            await Log.create({
                user_id: req.user.id,
                session_id: sessionDbId,
                action: 'session_created',
                details: `WhatsApp session created: ${sessionId}`
            });

            res.status(201).json({
                success: true,
                message: 'Session created successfully',
                session: {
                    id: sessionDbId,
                    session_id: sessionId,
                    status: 'connecting'
                }
            });

        } catch (error) {
            console.error('Create session error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async getSessions(req, res) {
        try {
            let sessions;
            
            if (req.user.role === 'admin') {
                sessions = await Session.findAll();
            } else {
                sessions = await Session.findByUserId(req.user.id);
            }

            res.json({
                success: true,
                sessions
            });

        } catch (error) {
            console.error('Get sessions error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async getSession(req, res) {
        try {
            const { id } = req.params;
            const session = await Session.findById(id);

            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }

            // Check if user owns this session or is admin
            if (session.user_id !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Access denied' });
            }

            // Get groups for this session
            const groups = await Group.findBySessionId(id);

            res.json({
                success: true,
                session: {
                    ...session,
                    groups
                }
            });

        } catch (error) {
            console.error('Get session error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async disconnectSession(req, res) {
        try {
            const { id } = req.params;
            const session = await Session.findById(id);

            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }

            // Check if user owns this session or is admin
            if (session.user_id !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Access denied' });
            }

            const success = await WhatsAppService.disconnectSession(session.session_id);
            
            if (!success) {
                return res.status(500).json({ error: 'Failed to disconnect session' });
            }

            await Log.create({
                user_id: req.user.id,
                session_id: id,
                action: 'session_disconnected',
                details: `WhatsApp session disconnected: ${session.session_id}`
            });

            res.json({
                success: true,
                message: 'Session disconnected successfully'
            });

        } catch (error) {
            console.error('Disconnect session error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async deleteSession(req, res) {
        try {
            const { id } = req.params;
            const session = await Session.findById(id);

            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }

            // Check if user owns this session or is admin
            if (session.user_id !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Access denied' });
            }

            // Disconnect if still active
            if (session.status === 'connected' || session.status === 'connecting') {
                await WhatsAppService.disconnectSession(session.session_id);
            }

            const deleted = await Session.delete(id);
            
            if (!deleted) {
                return res.status(500).json({ error: 'Failed to delete session' });
            }

            await Log.create({
                user_id: req.user.id,
                action: 'session_deleted',
                details: `WhatsApp session deleted: ${session.session_id}`
            });

            res.json({
                success: true,
                message: 'Session deleted successfully'
            });

        } catch (error) {
            console.error('Delete session error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async getSessionStatus(req, res) {
        try {
            const { id } = req.params;
            const session = await Session.findById(id);

            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }

            // Check if user owns this session or is admin
            if (session.user_id !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Access denied' });
            }

            res.json({
                success: true,
                status: {
                    id: session.id,
                    session_id: session.session_id,
                    status: session.status,
                    phone_number: session.phone_number,
                    profile_name: session.profile_name,
                    qr_code: session.qr_code,
                    last_activity: session.last_activity
                }
            });

        } catch (error) {
            console.error('Get session status error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

module.exports = sessionController;