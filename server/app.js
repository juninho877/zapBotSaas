require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const http = require('http');

// Import configurations and services
const { testConnection } = require('./config/database');
const WhatsAppService = require('./services/WhatsAppService');
const WebSocketServer = require('./utils/websocket');

// Import routes
const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/sessions');
const groupRoutes = require('./routes/groups');
const userRoutes = require('./routes/users');
const logRoutes = require('./routes/logs');

const app = express();
const server = http.createServer(app);

// Initialize WebSocket server
const wsServer = new WebSocketServer(server);

// Make WebSocket server available to other modules
app.set('wsServer', wsServer);

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['http://localhost:3000'] 
        : ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true
}));

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../client/build')));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.BOT_VERSION || '1.0.0',
        connected_sessions: WhatsAppService.getAllActiveSessions().length,
        websocket_connections: wsServer.getConnectionCount()
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/users', userRoutes);
app.use('/api/logs', logRoutes);

// Dashboard stats endpoint
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const User = require('./models/User');
        const Session = require('./models/Session');
        const Group = require('./models/Group');
        const Log = require('./models/Log');

        const [
            totalUsers,
            totalSessions,
            activeSessions,
            totalGroups
        ] = await Promise.all([
            User.count(),
            Session.findAll().then(s => s.length),
            Session.findAll().then(s => s.filter(session => session.status === 'connected').length),
            Group.findAll ? Group.findAll().then(g => g.length) : 0
        ]);

        res.json({
            success: true,
            stats: {
                total_users: totalUsers,
                total_sessions: totalSessions,
                active_sessions: activeSessions,
                total_groups: totalGroups,
                websocket_connections: wsServer.getConnectionCount(),
                uptime: process.uptime()
            }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    
    res.status(error.status || 500).json({
        error: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : error.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
    });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    
    // Disconnect all WhatsApp sessions
    const activeSessions = await WhatsAppService.getAllActiveSessions();
    for (const sessionId of activeSessions) {
        await WhatsAppService.disconnectSession(sessionId);
    }
    
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

// Start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // Test database connection
        await testConnection();
        
        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📊 Dashboard: http://localhost:${PORT}`);
            console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
            console.log(`💾 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
        
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app;