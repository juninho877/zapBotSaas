const { pool } = require('../config/database');

class Log {
    static async create(logData) {
        try {
            const [result] = await pool.execute(
                'INSERT INTO logs (user_id, session_id, group_id, action, details, user_jid, message_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [
                    logData.user_id || null,
                    logData.session_id || null,
                    logData.group_id || null,
                    logData.action,
                    logData.details || null,
                    logData.user_jid || null,
                    logData.message_id || null
                ]
            );
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    static async findByUserId(userId, limit = 100, offset = 0) {
        try {
            const [rows] = await pool.execute(
                `SELECT l.*, g.group_name, s.session_id as session_identifier
                 FROM logs l
                 LEFT JOIN groups g ON l.group_id = g.id
                 LEFT JOIN sessions s ON l.session_id = s.id
                 WHERE l.user_id = ?
                 ORDER BY l.created_at DESC
                 LIMIT ? OFFSET ?`,
                [userId, limit, offset]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    static async findByGroupId(groupId, limit = 100, offset = 0) {
        try {
            const [rows] = await pool.execute(
                `SELECT l.*, g.group_name, s.session_id as session_identifier, u.name as user_name
                 FROM logs l
                 LEFT JOIN groups g ON l.group_id = g.id
                 LEFT JOIN sessions s ON l.session_id = s.id
                 LEFT JOIN users u ON l.user_id = u.id
                 WHERE l.group_id = ?
                 ORDER BY l.created_at DESC
                 LIMIT ? OFFSET ?`,
                [groupId, limit, offset]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    static async findAll(limit = 100, offset = 0) {
        try {
            const [rows] = await pool.execute(
                `SELECT l.*, g.group_name, s.session_id as session_identifier, u.name as user_name
                 FROM logs l
                 LEFT JOIN groups g ON l.group_id = g.id
                 LEFT JOIN sessions s ON l.session_id = s.id
                 LEFT JOIN users u ON l.user_id = u.id
                 ORDER BY l.created_at DESC
                 LIMIT ? OFFSET ?`,
                [limit, offset]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    static async deleteOldLogs(daysOld = 30) {
        try {
            const [result] = await pool.execute(
                'DELETE FROM logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
                [daysOld]
            );
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }

    static async getStatistics(userId = null, days = 7) {
        try {
            let query = `
                SELECT 
                    action,
                    COUNT(*) as count,
                    DATE(created_at) as date
                FROM logs 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            `;
            let params = [days];

            if (userId) {
                query += ' AND user_id = ?';
                params.push(userId);
            }

            query += ' GROUP BY action, DATE(created_at) ORDER BY created_at DESC';

            const [rows] = await pool.execute(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Log;