const { makeWASocket, DisconnectReason, useMultiFileAuthState, makeInMemoryStore } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const Session = require('../models/Session');
const Group = require('../models/Group');
const Log = require('../models/Log');
const CommandHandler = require('./CommandHandler');

class WhatsAppService {
    constructor() {
        this.activeSessions = new Map();
        this.stores = new Map();
        this.commandHandler = new CommandHandler();
        this.userMessageCount = new Map(); // For anti-flood
    }

    async createSession(userId, sessionId) {
        try {
            console.log(`Creating session for user ${userId} with session ID: ${sessionId}`);

            const authDir = path.join(__dirname, '../auth', sessionId);
            if (!fs.existsSync(authDir)) {
                fs.mkdirSync(authDir, { recursive: true });
            }

            const { state, saveCreds } = await useMultiFileAuthState(authDir);
            
            // Create in-memory store
            const store = makeInMemoryStore({});
            this.stores.set(sessionId, store);

            const sock = makeWASocket({
                auth: state,
                printQRInTerminal: false,
                browser: ['WhatsApp Bot SaaS', 'Chrome', '1.0.0']
            });

            // Store socket reference
            this.activeSessions.set(sessionId, sock);

            // Handle QR code
            sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;

                if (qr) {
                    try {
                        const qrCode = await QRCode.toDataURL(qr);
                        await Session.updateBySessionId(sessionId, {
                            status: 'connecting',
                            qr_code: qrCode
                        });
                        
                        this.broadcastSessionUpdate(sessionId, {
                            status: 'connecting',
                            qr_code: qrCode
                        });
                    } catch (error) {
                        console.error('Error generating QR code:', error);
                    }
                }

                if (connection === 'close') {
                    const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                    
                    await Session.updateBySessionId(sessionId, {
                        status: 'disconnected',
                        qr_code: null
                    });

                    this.broadcastSessionUpdate(sessionId, {
                        status: 'disconnected'
                    });

                    this.activeSessions.delete(sessionId);
                    this.stores.delete(sessionId);

                    if (shouldReconnect) {
                        console.log('Reconnecting session:', sessionId);
                        setTimeout(() => {
                            this.createSession(userId, sessionId);
                        }, 5000);
                    }
                } else if (connection === 'open') {
                    console.log('Session connected:', sessionId);
                    
                    const userInfo = sock.user;
                    await Session.updateBySessionId(sessionId, {
                        status: 'connected',
                        qr_code: null,
                        phone_number: userInfo.id.split(':')[0],
                        profile_name: userInfo.name
                    });

                    this.broadcastSessionUpdate(sessionId, {
                        status: 'connected',
                        phone_number: userInfo.id.split(':')[0],
                        profile_name: userInfo.name
                    });

                    // Load existing groups
                    await this.loadExistingGroups(sessionId, sock);
                }
            });

            // Handle credentials update
            sock.ev.on('creds.update', saveCreds);

            // Handle messages
            sock.ev.on('messages.upsert', async (m) => {
                try {
                    await this.handleMessage(sessionId, sock, m);
                } catch (error) {
                    console.error('Error handling message:', error);
                }
            });

            // Handle group updates
            sock.ev.on('groups.update', async (updates) => {
                try {
                    await this.handleGroupUpdates(sessionId, updates);
                } catch (error) {
                    console.error('Error handling group updates:', error);
                }
            });

            return true;
        } catch (error) {
            console.error('Error creating session:', error);
            await Session.updateBySessionId(sessionId, {
                status: 'error'
            });
            return false;
        }
    }

    async handleMessage(sessionId, sock, messageUpdate) {
        for (const message of messageUpdate.messages) {
            if (!message.message || message.key.fromMe) continue;

            const sessionData = await Session.findBySessionId(sessionId);
            if (!sessionData) continue;

            const groupJid = message.key.remoteJid;
            if (!groupJid.endsWith('@g.us')) continue; // Only handle group messages

            const groupData = await Group.findBySessionAndJid(sessionData.id, groupJid);
            if (!groupData || !groupData.is_active) continue;

            const senderJid = message.key.participant || message.key.remoteJid;
            const messageText = this.getMessageText(message);

            // Update last activity
            await Session.updateLastActivity(sessionId);

            // Log message
            await Log.create({
                user_id: sessionData.user_id,
                session_id: sessionData.id,
                group_id: groupData.id,
                action: 'message_received',
                details: `Message from ${senderJid}: ${messageText}`,
                user_jid: senderJid,
                message_id: message.key.id
            });

            // Check for commands
            if (messageText.startsWith(groupData.prefix || '!')) {
                await this.commandHandler.handleCommand(sock, message, groupData, sessionData);
                continue;
            }

            // Apply group rules
            await this.applyGroupRules(sock, message, groupData, sessionData, messageText, senderJid);
        }
    }

    async applyGroupRules(sock, message, groupData, sessionData, messageText, senderJid) {
        try {
            const groupJid = message.key.remoteJid;
            const messageId = message.key.id;

            // Check admin-only mode
            if (groupData.admin_only_mode) {
                const groupInfo = await sock.groupMetadata(groupJid);
                const isAdmin = groupInfo.participants.find(p => p.id === senderJid)?.admin;
                
                if (!isAdmin) {
                    await sock.sendMessage(groupJid, { delete: message.key });
                    await Log.create({
                        user_id: sessionData.user_id,
                        session_id: sessionData.id,
                        group_id: groupData.id,
                        action: 'message_deleted',
                        details: 'Message deleted due to admin-only mode',
                        user_jid: senderJid,
                        message_id: messageId
                    });
                    return;
                }
            }

            // Anti-link protection
            if (groupData.anti_link_active && this.containsLink(messageText)) {
                const whitelistLinks = groupData.whitelist_links ? JSON.parse(groupData.whitelist_links) : [];
                const isWhitelisted = this.isLinkWhitelisted(messageText, whitelistLinks);

                if (!isWhitelisted) {
                    await this.executeAction(sock, groupJid, senderJid, message.key, groupData.anti_link_action, groupData, sessionData, 'anti-link violation');
                    return;
                }
            }

            // Anti-profanity
            if (groupData.anti_profanity_active) {
                const prohibitedWords = groupData.prohibited_words ? JSON.parse(groupData.prohibited_words) : [];
                const containsProfanity = prohibitedWords.some(word => 
                    messageText.toLowerCase().includes(word.toLowerCase())
                );

                if (containsProfanity) {
                    await this.executeAction(sock, groupJid, senderJid, message.key, groupData.anti_profanity_action, groupData, sessionData, 'profanity detected');
                    return;
                }
            }

            // Anti-flood
            if (groupData.anti_flood_active) {
                const userKey = `${groupJid}_${senderJid}`;
                const now = Date.now();
                const timeframe = (groupData.anti_flood_timeframe || 60) * 1000;
                
                if (!this.userMessageCount.has(userKey)) {
                    this.userMessageCount.set(userKey, []);
                }
                
                const userMessages = this.userMessageCount.get(userKey);
                userMessages.push(now);
                
                // Remove old messages outside timeframe
                const validMessages = userMessages.filter(time => now - time < timeframe);
                this.userMessageCount.set(userKey, validMessages);
                
                if (validMessages.length > (groupData.anti_flood_limit || 5)) {
                    await this.executeAction(sock, groupJid, senderJid, message.key, groupData.anti_flood_action, groupData, sessionData, 'flood detected');
                    return;
                }
            }

            // Auto-responses
            if (groupData.auto_responses) {
                const autoResponses = JSON.parse(groupData.auto_responses);
                for (const response of autoResponses) {
                    if (messageText.toLowerCase().includes(response.keyword.toLowerCase())) {
                        await sock.sendMessage(groupJid, { text: response.response });
                        break;
                    }
                }
            }

        } catch (error) {
            console.error('Error applying group rules:', error);
        }
    }

    async executeAction(sock, groupJid, userJid, messageKey, action, groupData, sessionData, reason) {
        try {
            switch (action) {
                case 'delete':
                    await sock.sendMessage(groupJid, { delete: messageKey });
                    break;

                case 'warn':
                    await sock.sendMessage(groupJid, { delete: messageKey });
                    // Add warning logic here
                    await sock.sendMessage(groupJid, { 
                        text: `⚠️ Warning: ${userJid.split('@')[0]} - ${reason}` 
                    });
                    break;

                case 'mute':
                    await sock.sendMessage(groupJid, { delete: messageKey });
                    // Add mute logic here
                    break;

                case 'ban':
                    await sock.sendMessage(groupJid, { delete: messageKey });
                    await sock.groupParticipantsUpdate(groupJid, [userJid], 'remove');
                    break;
            }

            await Log.create({
                user_id: sessionData.user_id,
                session_id: sessionData.id,
                group_id: groupData.id,
                action: `action_${action}`,
                details: `${action} executed for ${userJid} - ${reason}`,
                user_jid: userJid
            });

        } catch (error) {
            console.error('Error executing action:', error);
        }
    }

    containsLink(text) {
        const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|\b[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
        return linkRegex.test(text);
    }

    isLinkWhitelisted(text, whitelist) {
        return whitelist.some(whitelistItem => {
            switch (whitelistItem.type) {
                case 'exact':
                    return text.includes(whitelistItem.url);
                case 'contains':
                    return text.toLowerCase().includes(whitelistItem.url.toLowerCase());
                case 'similar':
                    // Simple similarity check
                    return text.toLowerCase().includes(whitelistItem.url.toLowerCase().split('.')[0]);
                default:
                    return false;
            }
        });
    }

    getMessageText(message) {
        return message.message?.conversation || 
               message.message?.extendedTextMessage?.text || 
               message.message?.imageMessage?.caption || 
               message.message?.videoMessage?.caption || '';
    }

    async loadExistingGroups(sessionId, sock) {
        try {
            const sessionData = await Session.findBySessionId(sessionId);
            if (!sessionData) return;

            const groups = await sock.groupFetchAllParticipating();
            
            for (const [groupJid, groupInfo] of Object.entries(groups)) {
                await Group.create({
                    session_id: sessionData.id,
                    group_jid: groupJid,
                    group_name: groupInfo.subject
                });
            }
        } catch (error) {
            console.error('Error loading existing groups:', error);
        }
    }

    async handleGroupUpdates(sessionId, updates) {
        try {
            const sessionData = await Session.findBySessionId(sessionId);
            if (!sessionData) return;

            for (const update of updates) {
                if (update.subject) {
                    const groupData = await Group.findBySessionAndJid(sessionData.id, update.id);
                    if (groupData) {
                        await Group.update(groupData.id, { group_name: update.subject });
                    }
                }
            }
        } catch (error) {
            console.error('Error handling group updates:', error);
        }
    }

    async disconnectSession(sessionId) {
        try {
            const sock = this.activeSessions.get(sessionId);
            if (sock) {
                await sock.logout();
                this.activeSessions.delete(sessionId);
            }

            const store = this.stores.get(sessionId);
            if (store) {
                this.stores.delete(sessionId);
            }

            await Session.updateBySessionId(sessionId, {
                status: 'disconnected',
                qr_code: null
            });

            return true;
        } catch (error) {
            console.error('Error disconnecting session:', error);
            return false;
        }
    }

    getSessionSocket(sessionId) {
        return this.activeSessions.get(sessionId);
    }

    broadcastSessionUpdate(sessionId, data) {
        // This will be implemented when WebSocket is set up
        console.log(`Broadcasting session update for ${sessionId}:`, data);
    }

    async getAllActiveSessions() {
        return Array.from(this.activeSessions.keys());
    }
}

module.exports = new WhatsAppService();