const Group = require('../models/Group');
const Session = require('../models/Session');
const Log = require('../models/Log');
const WhatsAppService = require('../services/WhatsAppService');

const groupController = {
    async getGroups(req, res) {
        try {
            let groups;
            
            if (req.user.role === 'admin') {
                // Admin can see all groups
                const sessions = await Session.findAll();
                groups = [];
                for (const session of sessions) {
                    const sessionGroups = await Group.findBySessionId(session.id);
                    groups.push(...sessionGroups.map(g => ({ ...g, user_name: session.user_name })));
                }
            } else {
                groups = await Group.findByUserId(req.user.id);
            }

            res.json({
                success: true,
                groups
            });

        } catch (error) {
            console.error('Get groups error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async getGroup(req, res) {
        try {
            const { id } = req.params;
            const group = await Group.findById(id);

            if (!group) {
                return res.status(404).json({ error: 'Group not found' });
            }

            // Check if user owns this group or is admin
            if (group.user_id !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Access denied' });
            }

            res.json({
                success: true,
                group
            });

        } catch (error) {
            console.error('Get group error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async updateGroup(req, res) {
        try {
            const { id } = req.params;
            const { is_active } = req.body;

            const group = await Group.findById(id);
            if (!group) {
                return res.status(404).json({ error: 'Group not found' });
            }

            // Check if user owns this group or is admin
            if (group.user_id !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Access denied' });
            }

            const updated = await Group.update(id, { is_active });
            
            if (!updated) {
                return res.status(400).json({ error: 'No changes made' });
            }

            await Log.create({
                user_id: req.user.id,
                group_id: id,
                action: 'group_updated',
                details: `Group ${is_active ? 'activated' : 'deactivated'}: ${group.group_name}`
            });

            res.json({
                success: true,
                message: 'Group updated successfully'
            });

        } catch (error) {
            console.error('Update group error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async deleteGroup(req, res) {
        try {
            const { id } = req.params;
            const group = await Group.findById(id);

            if (!group) {
                return res.status(404).json({ error: 'Group not found' });
            }

            // Check if user owns this group or is admin
            if (group.user_id !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Access denied' });
            }

            const deleted = await Group.delete(id);
            
            if (!deleted) {
                return res.status(500).json({ error: 'Failed to delete group' });
            }

            await Log.create({
                user_id: req.user.id,
                action: 'group_deleted',
                details: `Group deleted: ${group.group_name}`
            });

            res.json({
                success: true,
                message: 'Group deleted successfully'
            });

        } catch (error) {
            console.error('Delete group error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async getGroupConfig(req, res) {
        try {
            const { id } = req.params;
            const group = await Group.findById(id);

            if (!group) {
                return res.status(404).json({ error: 'Group not found' });
            }

            // Check if user owns this group or is admin
            if (group.user_id !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Access denied' });
            }

            const config = await Group.getConfig(id);

            res.json({
                success: true,
                config
            });

        } catch (error) {
            console.error('Get group config error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async updateGroupConfig(req, res) {
        try {
            const { id } = req.params;
            const configData = req.body;

            const group = await Group.findById(id);
            if (!group) {
                return res.status(404).json({ error: 'Group not found' });
            }

            // Check if user owns this group or is admin
            if (group.user_id !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Access denied' });
            }

            const updated = await Group.updateConfig(id, configData);
            
            if (!updated) {
                return res.status(400).json({ error: 'No changes made' });
            }

            await Log.create({
                user_id: req.user.id,
                group_id: id,
                action: 'group_config_updated',
                details: `Configuration updated for group: ${group.group_name}`
            });

            res.json({
                success: true,
                message: 'Group configuration updated successfully'
            });

        } catch (error) {
            console.error('Update group config error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async sendMessage(req, res) {
        try {
            const { id } = req.params;
            const { message, type = 'text' } = req.body;

            const group = await Group.findById(id);
            if (!group) {
                return res.status(404).json({ error: 'Group not found' });
            }

            // Check if user owns this group or is admin
            if (group.user_id !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Access denied' });
            }

            const sock = WhatsAppService.getSessionSocket(group.session_identifier);
            if (!sock) {
                return res.status(400).json({ error: 'WhatsApp session not connected' });
            }

            let messageOptions = {};
            
            switch (type) {
                case 'text':
                    messageOptions = { text: message };
                    break;
                case 'image':
                    if (req.file) {
                        messageOptions = { 
                            image: { url: req.file.path },
                            caption: message || ''
                        };
                    } else {
                        return res.status(400).json({ error: 'Image file required' });
                    }
                    break;
                default:
                    messageOptions = { text: message };
            }

            await sock.sendMessage(group.group_jid, messageOptions);

            await Log.create({
                user_id: req.user.id,
                group_id: id,
                action: 'message_sent',
                details: `Message sent to group: ${group.group_name}`
            });

            res.json({
                success: true,
                message: 'Message sent successfully'
            });

        } catch (error) {
            console.error('Send message error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async getGroupStats(req, res) {
        try {
            const { id } = req.params;
            const group = await Group.findById(id);

            if (!group) {
                return res.status(404).json({ error: 'Group not found' });
            }

            // Check if user owns this group or is admin
            if (group.user_id !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Access denied' });
            }

            // Get logs for the last 7 days
            const logs = await Log.findByGroupId(id, 100);
            
            const stats = {
                total_messages: logs.filter(l => l.action === 'message_received').length,
                commands_executed: logs.filter(l => l.action === 'command_executed').length,
                actions_taken: logs.filter(l => l.action.startsWith('action_')).length,
                last_activity: logs[0]?.created_at || null
            };

            res.json({
                success: true,
                stats
            });

        } catch (error) {
            console.error('Get group stats error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

module.exports = groupController;