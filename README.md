# WhatsApp Bot SaaS Platform

A comprehensive multi-tenant WhatsApp bot management system built with Node.js, React, and Baileys. This platform allows multiple users to manage their own WhatsApp bot sessions with advanced group management, rule systems, and command handling.

## 🚀 Features

### Multi-Session Management
- Individual WhatsApp connections per user via QR Code
- Persistent session storage and recovery
- Configurable group limits per user
- Real-time connection status updates

### Advanced Group Management
- Automatic group detection and management
- Per-group configuration and rules
- Group-specific command settings
- Activity monitoring and logging

### Comprehensive Rule System
- **Anti-Link Protection**: Whitelist system with flexible matching
- **Anti-Profanity**: Customizable word filtering
- **Anti-Flood**: Message rate limiting with configurable actions
- **Admin-Only Mode**: Group silencing functionality
- **Auto-Responses**: Keyword-based automatic replies
- **Welcome Messages**: Customizable new member greetings

### Complete Command System
- Configurable command prefixes per group
- Permission-based command access (Public, Admin, Owner)
- 20+ built-in commands for moderation and management
- Real-time command execution logging

### Modern Web Interface
- React-based responsive dashboard
- Real-time updates via WebSocket
- User and group management
- Comprehensive activity logging
- Mobile-friendly design

### Security & Performance
- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- Comprehensive error handling
- MySQL database with optimized queries

## 🛠 Installation

### Prerequisites
- Node.js 18+ 
- MySQL 5.7+
- npm or yarn

### Setup Instructions

1. **Clone and Install Dependencies**
```bash
git clone <repository-url>
cd whatsapp-bot-saas
npm install
cd client && npm install && cd ..
```

2. **Database Setup**
```bash
# Create MySQL database
mysql -u root -p < database/schema.sql
```

3. **Environment Configuration**
```bash
# Copy and configure environment variables
cp .env.example .env
# Edit .env with your database credentials
```

4. **Start the Application**
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

5. **Access the Platform**
- Web Interface: http://localhost:3000
- Default Admin: admin@example.com / admin123

## 📱 WhatsApp Connection

1. **Create a Session**
   - Login to the web interface
   - Navigate to Sessions → Create New Session
   - Scan the QR code with WhatsApp
   - Session will connect automatically

2. **Group Management**
   - Groups are automatically detected after connection
   - Configure rules and commands per group
   - Monitor activity through logs

## 🔧 Configuration

### Environment Variables
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=whatsapp_bot_saas

# Security
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Bot Settings
BOT_NAME=WhatsApp Bot SaaS
BOT_VERSION=1.0.0
```

### User Management
- **Admin Users**: Full system access, can manage all users and sessions
- **Regular Users**: Can manage their own sessions and groups
- **Group Limits**: Configurable per user

### Command System
Built-in commands include:

**Public Commands:**
- `!menu` - Show available commands
- `!rules` - Display group rules
- `!info` - Bot information
- `!group` - Group details

**Admin Commands:**
- `!ban @user` - Remove user from group
- `!promote @user` - Promote to admin
- `!mute [duration]` - Enable admin-only mode
- `!antilink on/off` - Toggle link protection
- And many more...

**Owner Commands:**
- `!groups` - List all managed groups
- `!users` - System user list
- `!maintenance` - Toggle maintenance mode

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Comprehensive data validation
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Input sanitization
- **Rate Limiting**: API request limiting
- **CORS Configuration**: Secure cross-origin requests

## 📊 Monitoring & Logging

- **Real-time Activity Logs**: All actions logged with details
- **Session Monitoring**: Connection status tracking
- **Group Analytics**: Message and command statistics
- **User Activity**: Comprehensive audit trails
- **WebSocket Notifications**: Live updates for all events

## 🚢 Deployment

### Production Deployment

1. **Build the Client**
```bash
cd client && npm run build
```

2. **Configure Environment**
```env
NODE_ENV=production
DB_HOST=your_production_db_host
# Update all production values
```

3. **Start with Process Manager**
```bash
# Using PM2
pm2 start server/app.js --name whatsapp-bot-saas

# Using systemd (recommended)
sudo systemctl start whatsapp-bot-saas
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

### EasyPanel Deployment
1. Create new MySQL service
2. Create Node.js service
3. Upload code and configure environment
4. Run database migration
5. Start the service

## 📡 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Session Management
- `POST /api/sessions` - Create WhatsApp session
- `GET /api/sessions` - List user sessions
- `GET /api/sessions/:id` - Get session details
- `POST /api/sessions/:id/disconnect` - Disconnect session

### Group Management
- `GET /api/groups` - List user groups
- `GET /api/groups/:id/config` - Get group configuration
- `PUT /api/groups/:id/config` - Update group configuration
- `POST /api/groups/:id/message` - Send message to group

### User Management (Admin Only)
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## 🔧 Troubleshooting

### Common Issues

**QR Code Not Showing**
- Check WebSocket connection
- Verify session status in database
- Restart the session if needed

**Commands Not Working**
- Verify bot has admin privileges in group
- Check command configuration in group settings
- Review activity logs for errors

**Database Connection Issues**
- Verify MySQL credentials
- Check database exists and schema is applied
- Ensure user has proper permissions

**Session Disconnections**
- WhatsApp Web sessions expire periodically
- Monitor session status and reconnect as needed
- Check server resources and connectivity

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Email: support@example.com
- Documentation: [Link to docs]

## 🎯 Roadmap

- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Integration with external APIs
- [ ] Mobile app for management
- [ ] Advanced AI-powered responses
- [ ] Webhook integrations
- [ ] Custom command scripting
- [ ] Advanced user role management

---

**Built with ❤️ using Node.js, React, and Baileys**