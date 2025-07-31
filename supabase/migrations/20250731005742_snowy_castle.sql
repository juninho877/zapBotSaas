-- WhatsApp Bot SaaS Database Schema
CREATE DATABASE IF NOT EXISTS whatsapp_bot_saas;
USE whatsapp_bot_saas;

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    group_limit INT DEFAULT 10,
    global_prefix VARCHAR(10) DEFAULT '!',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    status ENUM('disconnected', 'connecting', 'connected', 'error') DEFAULT 'disconnected',
    qr_code TEXT,
    phone_number VARCHAR(50),
    profile_name VARCHAR(255),
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Groups table
CREATE TABLE groups (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_id INT NOT NULL,
    group_jid VARCHAR(255) NOT NULL,
    group_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_session_group (session_id, group_jid)
);

-- Group configurations table
CREATE TABLE group_configs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    group_id INT NOT NULL,
    prefix VARCHAR(10) DEFAULT '!',
    welcome_message TEXT,
    welcome_image VARCHAR(500),
    rules_message TEXT,
    anti_link_active BOOLEAN DEFAULT FALSE,
    anti_link_action ENUM('delete', 'warn', 'mute', 'ban') DEFAULT 'delete',
    anti_profanity_active BOOLEAN DEFAULT FALSE,
    anti_profanity_action ENUM('delete', 'warn', 'mute', 'ban') DEFAULT 'delete',
    anti_flood_active BOOLEAN DEFAULT FALSE,
    anti_flood_limit INT DEFAULT 5,
    anti_flood_timeframe INT DEFAULT 60,
    anti_flood_action ENUM('delete', 'warn', 'mute', 'ban') DEFAULT 'warn',
    admin_only_mode BOOLEAN DEFAULT FALSE,
    prohibited_words JSON,
    whitelist_links JSON,
    auto_responses JSON,
    active_commands JSON,
    periodic_messages JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

-- Logs table
CREATE TABLE logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    session_id INT,
    group_id INT,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    user_jid VARCHAR(255),
    message_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_session_id (session_id),
    INDEX idx_group_id (group_id),
    INDEX idx_created_at (created_at)
);

-- User warnings table
CREATE TABLE user_warnings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    group_id INT NOT NULL,
    user_jid VARCHAR(255) NOT NULL,
    warning_count INT DEFAULT 0,
    last_warning_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    UNIQUE KEY unique_group_user (group_id, user_jid)
);

-- Muted users table
CREATE TABLE muted_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    group_id INT NOT NULL,
    user_jid VARCHAR(255) NOT NULL,
    muted_until TIMESTAMP NULL,
    muted_by VARCHAR(255),
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    UNIQUE KEY unique_group_user (group_id, user_jid)
);

-- Create default admin user (password: admin123)
INSERT INTO users (name, email, password_hash, role, group_limit) VALUES 
('Administrator', 'admin@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 999);

-- Create indexes for better performance
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_groups_session_id ON groups(session_id);
CREATE INDEX idx_group_configs_group_id ON group_configs(group_id);