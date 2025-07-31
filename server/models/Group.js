const { pool } = require('../config/database');

class Group {
    static async create(groupData) {
        try {
            const [result] = await pool.execute(
                'INSERT INTO groups (session_id, group_jid, group_name) VALUES (?, ?, ?)',
                [groupData.session_id, groupData.group_jid, groupData.group_name]
            );
            
            // Create default configuration for the group
            await pool.execute(
                'INSERT INTO group_configs (group_id) VALUES (?)',
                [result.insertId]
            );
            
            return result.insertId;
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                // Group already exists, just return the existing one
                const [rows] = await pool.execute(
                    'SELECT id FROM groups WHERE session_id = ? AND group_jid = ?',
                    [groupData.session_id, groupData.group_jid]
                );
                return rows[0]?.id;
            }
            throw error;
        }
    }

    static async findById(id) {
        try {
            const [rows] = await pool.execute(
                `SELECT g.*, s.user_id, s.session_id as session_identifier, u.name as user_name,
                        gc.prefix, gc.welcome_message, gc.rules_message, gc.anti_link_active,
                        gc.anti_profanity_active, gc.anti_flood_active, gc.admin_only_mode,
                        gc.active_commands, gc.prohibited_words, gc.whitelist_links, gc.auto_responses
                 FROM groups g 
                 JOIN sessions s ON g.session_id = s.id
                 JOIN users u ON s.user_id = u.id
                 LEFT JOIN group_configs gc ON g.id = gc.group_id
                 WHERE g.id = ?`,
                [id]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async findBySessionAndJid(sessionId, groupJid) {
        try {
            const [rows] = await pool.execute(
                `SELECT g.*, gc.prefix, gc.welcome_message, gc.rules_message, gc.anti_link_active,
                        gc.anti_profanity_active, gc.anti_flood_active, gc.admin_only_mode,
                        gc.active_commands, gc.prohibited_words, gc.whitelist_links, gc.auto_responses,
                        gc.anti_link_action, gc.anti_profanity_action, gc.anti_flood_action,
                        gc.anti_flood_limit, gc.anti_flood_timeframe
                 FROM groups g 
                 LEFT JOIN group_configs gc ON g.id = gc.group_id
                 WHERE g.session_id = ? AND g.group_jid = ?`,
                [sessionId, groupJid]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async findBySessionId(sessionId) {
        try {
            const [rows] = await pool.execute(
                `SELECT g.*, gc.prefix, gc.active_commands, gc.admin_only_mode
                 FROM groups g 
                 LEFT JOIN group_configs gc ON g.id = gc.group_id
                 WHERE g.session_id = ? AND g.is_active = 1
                 ORDER BY g.group_name`,
                [sessionId]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    static async findByUserId(userId) {
        try {
            const [rows] = await pool.execute(
                `SELECT g.*, s.session_id as session_identifier, s.status as session_status
                 FROM groups g 
                 JOIN sessions s ON g.session_id = s.id
                 WHERE s.user_id = ? AND g.is_active = 1
                 ORDER BY g.group_name`,
                [userId]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    static async update(id, groupData) {
        try {
            const updateFields = [];
            const values = [];

            Object.keys(groupData).forEach(key => {
                if (groupData[key] !== undefined && key !== 'id') {
                    updateFields.push(`${key} = ?`);
                    values.push(groupData[key]);
                }
            });

            if (updateFields.length === 0) return false;

            values.push(id);
            const [result] = await pool.execute(
                `UPDATE groups SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
                values
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    static async delete(id) {
        try {
            const [result] = await pool.execute(
                'DELETE FROM groups WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    static async countBySessionId(sessionId) {
        try {
            const [rows] = await pool.execute(
                'SELECT COUNT(*) as total FROM groups WHERE session_id = ? AND is_active = 1',
                [sessionId]
            );
            return rows[0].total;
        } catch (error) {
            throw error;
        }
    }

    static async updateConfig(groupId, configData) {
        try {
            const updateFields = [];
            const values = [];

            Object.keys(configData).forEach(key => {
                if (configData[key] !== undefined) {
                    updateFields.push(`${key} = ?`);
                    if (typeof configData[key] === 'object') {
                        values.push(JSON.stringify(configData[key]));
                    } else {
                        values.push(configData[key]);
                    }
                }
            });

            if (updateFields.length === 0) return false;

            values.push(groupId);
            const [result] = await pool.execute(
                `UPDATE group_configs SET ${updateFields.join(', ')}, updated_at = NOW() WHERE group_id = ?`,
                values
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    static async getConfig(groupId) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM group_configs WHERE group_id = ?',
                [groupId]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Group;