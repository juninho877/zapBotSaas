const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    static async findById(id) {
        try {
            const [rows] = await pool.execute(
                'SELECT id, name, email, role, group_limit, global_prefix, is_active, created_at FROM users WHERE id = ?',
                [id]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async findByEmail(email) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async create(userData) {
        try {
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            const [result] = await pool.execute(
                'INSERT INTO users (name, email, password_hash, role, group_limit, global_prefix) VALUES (?, ?, ?, ?, ?, ?)',
                [userData.name, userData.email, hashedPassword, userData.role || 'user', userData.group_limit || 10, userData.global_prefix || '!']
            );
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    static async update(id, userData) {
        try {
            const updateFields = [];
            const values = [];

            Object.keys(userData).forEach(key => {
                if (userData[key] !== undefined && key !== 'id') {
                    if (key === 'password') {
                        updateFields.push('password_hash = ?');
                        values.push(bcrypt.hashSync(userData[key], 10));
                    } else {
                        updateFields.push(`${key} = ?`);
                        values.push(userData[key]);
                    }
                }
            });

            if (updateFields.length === 0) return false;

            values.push(id);
            const [result] = await pool.execute(
                `UPDATE users SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
                values
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    static async findAll(limit = 50, offset = 0) {
        try {
            const [rows] = await pool.execute(
                'SELECT id, name, email, role, group_limit, global_prefix, is_active, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
                [limit, offset]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    static async delete(id) {
        try {
            const [result] = await pool.execute(
                'DELETE FROM users WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    static async count() {
        try {
            const [rows] = await pool.execute('SELECT COUNT(*) as total FROM users');
            return rows[0].total;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = User;