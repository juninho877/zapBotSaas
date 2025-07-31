const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class WebSocketServer {
    constructor(server) {
        this.wss = new WebSocket.Server({ 
            server,
            verifyClient: this.verifyClient.bind(this)
        });
        
        this.clients = new Map(); // userId -> WebSocket
        
        this.wss.on('connection', this.handleConnection.bind(this));
        
        console.log('✅ WebSocket server initialized');
    }

    async verifyClient(info) {
        try {
            const url = new URL(info.req.url, 'http://localhost');
            const token = url.searchParams.get('token');
            
            if (!token) return false;
            
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId);
            
            if (!user || !user.is_active) return false;
            
            info.req.user = user;
            return true;
        } catch (error) {
            return false;
        }
    }

    handleConnection(ws, req) {
        const user = req.user;
        console.log(`WebSocket connected: ${user.name} (${user.id})`);
        
        this.clients.set(user.id, ws);
        
        // Send welcome message
        this.sendToUser(user.id, {
            type: 'connected',
            message: 'WebSocket connected successfully'
        });

        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                console.log(`Message from ${user.name}:`, message);
                
                // Handle different message types
                this.handleMessage(user.id, message);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        });

        ws.on('close', () => {
            console.log(`WebSocket disconnected: ${user.name} (${user.id})`);
            this.clients.delete(user.id);
        });

        ws.on('error', (error) => {
            console.error(`WebSocket error for ${user.name}:`, error);
            this.clients.delete(user.id);
        });
    }

    handleMessage(userId, message) {
        switch (message.type) {
            case 'ping':
                this.sendToUser(userId, { type: 'pong', timestamp: Date.now() });
                break;
                
            case 'subscribe':
                // Handle subscription to specific events
                console.log(`User ${userId} subscribed to:`, message.channels);
                break;
                
            default:
                console.log(`Unknown message type: ${message.type}`);
        }
    }

    sendToUser(userId, data) {
        const ws = this.clients.get(userId);
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
            return true;
        }
        return false;
    }

    sendToAll(data) {
        this.clients.forEach((ws, userId) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(data));
            }
        });
    }

    broadcastSessionUpdate(sessionId, sessionData) {
        this.sendToAll({
            type: 'session_update',
            session_id: sessionId,
            data: sessionData
        });
    }

    broadcastGroupUpdate(groupId, groupData) {
        this.sendToAll({
            type: 'group_update',
            group_id: groupId,
            data: groupData
        });
    }

    sendNotification(userId, notification) {
        this.sendToUser(userId, {
            type: 'notification',
            data: notification
        });
    }

    getConnectedUsers() {
        return Array.from(this.clients.keys());
    }

    getConnectionCount() {
        return this.clients.size;
    }
}

module.exports = WebSocketServer;