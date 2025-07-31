const { pool } = require('../config/database');

class Session {
    static async create(sessionData) {
        try {
            const [result] = await pool.execute(
                'INSERT INTO sessions (user_id, session_id, status) VALUES (?, ?, ?)',
                [sessionData.user_id, sessionData.session_id, sessionData.status || 'disconnected']
            );
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    static async findById(id) {
        try {
            const [rows] = await pool.execute(
                'SELECT s.*, u.name as user_name FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = ?',
                [id]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async findBySessionId(sessionId) {
        try {
            const [rows] = await pool.execute(
                'SELECT s.*, u.name as user_name FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.session_id = ?',
                [sessionId]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async findByUserId(userId) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC',
                [userId]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    static async update(id, sessionData) {
        try {
            const updateFields = [];
            const values = [];

            Object.keys(sessionData).forEach(key => {
                if (sessionData[key] !== undefined && key !== 'id') {
                    updateFields.push(`${key} = ?`);
                    values.push(sessionData[key]);
                }
            });

            if (updateFields.length === 0) return false;

            values.push(id);
            const [result] = await pool.execute(
                `UPDATE sessions SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
                values
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    static async updateBySessionId(sessionId, sessionData) {
        try {
            const updateFields = [];
            const values = [];

            Object.keys(sessionData).forEach(key => {
                if (sessionData[key] !== undefined && key !== 'session_id') {
                    updateFields.push(`${key} = ?`);
                    values.push(sessionData[key]);
                }
            });

            if (updateFields.length === 0) return false;

            values.push(sessionId);
            const [result] = await pool.execute(
                `UPDATE sessions SET ${updateFields.join(', ')}, updated_at = NOW() WHERE session_id = ?`,
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
                'DELETE FROM sessions WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    static async findAll() {
        try {
            const [rows] = await pool.execute(
                'SELECT s.*, u.name as user_name FROM sessions s JOIN users u ON s.user_id = u.id ORDER BY s.created_at DESC'
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    static async updateLastActivity(sessionId) {
        try {
            await pool.execute(
                'UPDATE sessions SET last_activity = NOW() WHERE session_id = ?',
                [sessionId]
            );
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Session;