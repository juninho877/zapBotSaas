const Group = require('../models/Group');
const Log = require('../models/Log');
const User = require('../models/User');
const Session = require('../models/Session');

class CommandHandler {
    constructor() {
        this.defaultCommands = {
            // Public commands
            'menu': { level: 'public', description: 'Show available commands' },
            'rules': { level: 'public', description: 'Display group rules' },
            'info': { level: 'public', description: 'Bot information' },
            'group': { level: 'public', description: 'Group information' },
            
            // Admin commands
            'ban': { level: 'admin', description: 'Ban a user from group' },
            'add': { level: 'admin', description: 'Add user to group' },
            'promote': { level: 'admin', description: 'Promote user to admin' },
            'demote': { level: 'admin', description: 'Demote user from admin' },
            'mute': { level: 'admin', description: 'Enable admin-only mode' },
            'unmute': { level: 'admin', description: 'Disable admin-only mode' },
            'clear': { level: 'admin', description: 'Delete messages' },
            'setwelcome': { level: 'admin', description: 'Set welcome message' },
            'antilink': { level: 'admin', description: 'Toggle anti-link protection' },
            'kick': { level: 'admin', description: 'Remove user from group' },
            'warn': { level: 'admin', description: 'Warn a user' },
            
            // Owner commands
            'groups': { level: 'owner', description: 'List all groups' },
            'users': { level: 'owner', description: 'List all users' },
            'maintenance': { level: 'owner', description: 'Toggle maintenance mode' },
            'shutdown': { level: 'owner', description: 'Shutdown bot' }
        };
    }

    async handleCommand(sock, message, groupData, sessionData) {
        try {
            const messageText = this.getMessageText(message);
            const prefix = groupData.prefix || '!';
            
            if (!messageText.startsWith(prefix)) return;

            const args = messageText.slice(prefix.length).trim().split(/ +/);
            const command = args.shift().toLowerCase();
            const senderJid = message.key.participant || message.key.remoteJid;
            const groupJid = message.key.remoteJid;

            // Check if command is enabled
            const activeCommands = groupData.active_commands ? JSON.parse(groupData.active_commands) : this.defaultCommands;
            if (!activeCommands[command]) return;

            // Check permissions
            const hasPermission = await this.checkPermissions(sock, command, senderJid, groupJid, sessionData.user_id);
            if (!hasPermission) {
                await sock.sendMessage(groupJid, { 
                    text: '❌ You don\'t have permission to use this command.' 
                });
                return;
            }

            // Log command usage
            await Log.create({
                user_id: sessionData.user_id,
                session_id: sessionData.id,
                group_id: groupData.id,
                action: 'command_executed',
                details: `Command: ${command}, Args: ${args.join(' ')}`,
                user_jid: senderJid,
                message_id: message.key.id
            });

            // Execute command
            await this.executeCommand(sock, command, args, message, groupData, sessionData);

        } catch (error) {
            console.error('Error handling command:', error);
        }
    }

    async executeCommand(sock, command, args, message, groupData, sessionData) {
        const groupJid = message.key.remoteJid;
        const senderJid = message.key.participant || message.key.remoteJid;

        switch (command) {
            case 'menu':
                await this.handleMenuCommand(sock, groupJid, groupData);
                break;

            case 'rules':
                await this.handleRulesCommand(sock, groupJid, groupData);
                break;

            case 'info':
                await this.handleInfoCommand(sock, groupJid, sessionData);
                break;

            case 'group':
                await this.handleGroupCommand(sock, groupJid);
                break;

            case 'ban':
            case 'kick':
                await this.handleBanCommand(sock, groupJid, args, groupData, sessionData);
                break;

            case 'add':
                await this.handleAddCommand(sock, groupJid, args, groupData, sessionData);
                break;

            case 'promote':
                await this.handlePromoteCommand(sock, groupJid, args, groupData, sessionData);
                break;

            case 'demote':
                await this.handleDemoteCommand(sock, groupJid, args, groupData, sessionData);
                break;

            case 'mute':
                await this.handleMuteCommand(sock, groupJid, args, groupData, sessionData);
                break;

            case 'unmute':
                await this.handleUnmuteCommand(sock, groupJid, groupData, sessionData);
                break;

            case 'clear':
                await this.handleClearCommand(sock, groupJid, args, groupData, sessionData);
                break;

            case 'setwelcome':
                await this.handleSetWelcomeCommand(sock, groupJid, args, groupData, sessionData);
                break;

            case 'antilink':
                await this.handleAntilinkCommand(sock, groupJid, args, groupData, sessionData);
                break;

            case 'warn':
                await this.handleWarnCommand(sock, groupJid, args, groupData, sessionData);
                break;

            case 'groups':
                await this.handleGroupsCommand(sock, groupJid, sessionData);
                break;

            case 'users':
                await this.handleUsersCommand(sock, groupJid, sessionData);
                break;

            default:
                await sock.sendMessage(groupJid, { 
                    text: '❌ Unknown command. Use !menu to see available commands.' 
                });
        }
    }

    async handleMenuCommand(sock, groupJid, groupData) {
        const activeCommands = groupData.active_commands ? JSON.parse(groupData.active_commands) : this.defaultCommands;
        const prefix = groupData.prefix || '!';
        
        let menuText = `📋 *Available Commands*\n\n`;
        
        const publicCommands = Object.entries(activeCommands).filter(([_, cmd]) => cmd.level === 'public');
        const adminCommands = Object.entries(activeCommands).filter(([_, cmd]) => cmd.level === 'admin');
        const ownerCommands = Object.entries(activeCommands).filter(([_, cmd]) => cmd.level === 'owner');

        if (publicCommands.length > 0) {
            menuText += `*👥 Public Commands:*\n`;
            publicCommands.forEach(([cmd, info]) => {
                menuText += `${prefix}${cmd} - ${info.description}\n`;
            });
            menuText += '\n';
        }

        if (adminCommands.length > 0) {
            menuText += `*👑 Admin Commands:*\n`;
            adminCommands.forEach(([cmd, info]) => {
                menuText += `${prefix}${cmd} - ${info.description}\n`;
            });
            menuText += '\n';
        }

        if (ownerCommands.length > 0) {
            menuText += `*🔧 Owner Commands:*\n`;
            ownerCommands.forEach(([cmd, info]) => {
                menuText += `${prefix}${cmd} - ${info.description}\n`;
            });
        }

        await sock.sendMessage(groupJid, { text: menuText });
    }

    async handleRulesCommand(sock, groupJid, groupData) {
        const rulesMessage = groupData.rules_message || 'No rules have been set for this group.';
        await sock.sendMessage(groupJid, { text: `📜 *Group Rules*\n\n${rulesMessage}` });
    }

    async handleInfoCommand(sock, groupJid, sessionData) {
        const uptime = process.uptime();
        const uptimeString = this.formatUptime(uptime);
        
        const infoText = `🤖 *Bot Information*\n\n` +
                        `Name: ${process.env.BOT_NAME || 'WhatsApp Bot SaaS'}\n` +
                        `Version: ${process.env.BOT_VERSION || '1.0.0'}\n` +
                        `Uptime: ${uptimeString}\n` +
                        `Status: Online ✅\n` +
                        `Session: ${sessionData.session_id}`;

        await sock.sendMessage(groupJid, { text: infoText });
    }

    async handleGroupCommand(sock, groupJid) {
        try {
            const groupInfo = await sock.groupMetadata(groupJid);
            const adminCount = groupInfo.participants.filter(p => p.admin).length;
            
            const groupText = `👥 *Group Information*\n\n` +
                             `Name: ${groupInfo.subject}\n` +
                             `Members: ${groupInfo.participants.length}\n` +
                             `Admins: ${adminCount}\n` +
                             `Created: ${new Date(groupInfo.creation * 1000).toLocaleDateString()}\n` +
                             `Description: ${groupInfo.desc || 'No description'}`;

            await sock.sendMessage(groupJid, { text: groupText });
        } catch (error) {
            await sock.sendMessage(groupJid, { text: '❌ Failed to get group information.' });
        }
    }

    async handleBanCommand(sock, groupJid, args, groupData, sessionData) {
        if (args.length === 0) {
            await sock.sendMessage(groupJid, { text: '❌ Please mention a user to ban.' });
            return;
        }

        try {
            const userToBan = args[0].replace('@', '') + '@s.whatsapp.net';
            await sock.groupParticipantsUpdate(groupJid, [userToBan], 'remove');
            
            await sock.sendMessage(groupJid, { 
                text: `✅ User ${args[0]} has been removed from the group.` 
            });

            await Log.create({
                user_id: sessionData.user_id,
                session_id: sessionData.id,
                group_id: groupData.id,
                action: 'user_banned',
                details: `User ${userToBan} was banned from the group`,
                user_jid: userToBan
            });

        } catch (error) {
            await sock.sendMessage(groupJid, { text: '❌ Failed to ban user. Make sure the bot is an admin.' });
        }
    }

    async handleAddCommand(sock, groupJid, args, groupData, sessionData) {
        if (args.length === 0) {
            await sock.sendMessage(groupJid, { text: '❌ Please provide a phone number to add.' });
            return;
        }

        try {
            const phoneNumber = args[0].replace(/[^0-9]/g, '');
            const userToAdd = phoneNumber + '@s.whatsapp.net';
            
            await sock.groupParticipantsUpdate(groupJid, [userToAdd], 'add');
            
            await sock.sendMessage(groupJid, { 
                text: `✅ User +${phoneNumber} has been added to the group.` 
            });

        } catch (error) {
            await sock.sendMessage(groupJid, { text: '❌ Failed to add user. They might have privacy settings preventing this.' });
        }
    }

    async handlePromoteCommand(sock, groupJid, args, groupData, sessionData) {
        if (args.length === 0) {
            await sock.sendMessage(groupJid, { text: '❌ Please mention a user to promote.' });
            return;
        }

        try {
            const userToPromote = args[0].replace('@', '') + '@s.whatsapp.net';
            await sock.groupParticipantsUpdate(groupJid, [userToPromote], 'promote');
            
            await sock.sendMessage(groupJid, { 
                text: `✅ User ${args[0]} has been promoted to admin.` 
            });

        } catch (error) {
            await sock.sendMessage(groupJid, { text: '❌ Failed to promote user.' });
        }
    }

    async handleDemoteCommand(sock, groupJid, args, groupData, sessionData) {
        if (args.length === 0) {
            await sock.sendMessage(groupJid, { text: '❌ Please mention a user to demote.' });
            return;
        }

        try {
            const userToDemote = args[0].replace('@', '') + '@s.whatsapp.net';
            await sock.groupParticipantsUpdate(groupJid, [userToDemote], 'demote');
            
            await sock.sendMessage(groupJid, { 
                text: `✅ User ${args[0]} has been demoted from admin.` 
            });

        } catch (error) {
            await sock.sendMessage(groupJid, { text: '❌ Failed to demote user.' });
        }
    }

    async handleMuteCommand(sock, groupJid, args, groupData, sessionData) {
        try {
            await Group.updateConfig(groupData.id, { admin_only_mode: true });
            
            let muteText = '🔇 Group has been muted. Only admins can send messages.';
            
            if (args[0]) {
                const duration = parseInt(args[0]);
                if (duration > 0) {
                    muteText += ` Duration: ${duration} minutes.`;
                    
                    // Set auto-unmute
                    setTimeout(async () => {
                        await Group.updateConfig(groupData.id, { admin_only_mode: false });
                        await sock.sendMessage(groupJid, { 
                            text: '🔊 Group has been automatically unmuted.' 
                        });
                    }, duration * 60 * 1000);
                }
            }
            
            await sock.sendMessage(groupJid, { text: muteText });

        } catch (error) {
            await sock.sendMessage(groupJid, { text: '❌ Failed to mute group.' });
        }
    }

    async handleUnmuteCommand(sock, groupJid, groupData, sessionData) {
        try {
            await Group.updateConfig(groupData.id, { admin_only_mode: false });
            await sock.sendMessage(groupJid, { 
                text: '🔊 Group has been unmuted. All members can send messages.' 
            });

        } catch (error) {
            await sock.sendMessage(groupJid, { text: '❌ Failed to unmute group.' });
        }
    }

    async handleClearCommand(sock, groupJid, args, groupData, sessionData) {
        const count = parseInt(args[0]) || 1;
        
        if (count > 100) {
            await sock.sendMessage(groupJid, { text: '❌ Cannot delete more than 100 messages at once.' });
            return;
        }

        await sock.sendMessage(groupJid, { 
            text: `🗑️ Attempting to clear ${count} message(s). Note: Only recent messages can be deleted.` 
        });
    }

    async handleSetWelcomeCommand(sock, groupJid, args, groupData, sessionData) {
        if (args.length === 0) {
            await sock.sendMessage(groupJid, { text: '❌ Please provide a welcome message.' });
            return;
        }

        try {
            const welcomeMessage = args.join(' ');
            await Group.updateConfig(groupData.id, { welcome_message: welcomeMessage });
            
            await sock.sendMessage(groupJid, { 
                text: `✅ Welcome message has been updated:\n\n${welcomeMessage}` 
            });

        } catch (error) {
            await sock.sendMessage(groupJid, { text: '❌ Failed to set welcome message.' });
        }
    }

    async handleAntilinkCommand(sock, groupJid, args, groupData, sessionData) {
        if (args.length === 0) {
            const status = groupData.anti_link_active ? 'enabled' : 'disabled';
            await sock.sendMessage(groupJid, { 
                text: `🔗 Anti-link protection is currently ${status}.\n\nUsage:\n!antilink on/off\n!antilink whitelist add/remove <link>` 
            });
            return;
        }

        try {
            const action = args[0].toLowerCase();
            
            if (action === 'on' || action === 'enable') {
                await Group.updateConfig(groupData.id, { anti_link_active: true });
                await sock.sendMessage(groupJid, { text: '✅ Anti-link protection enabled.' });
                
            } else if (action === 'off' || action === 'disable') {
                await Group.updateConfig(groupData.id, { anti_link_active: false });
                await sock.sendMessage(groupJid, { text: '❌ Anti-link protection disabled.' });
                
            } else if (action === 'whitelist') {
                await this.handleWhitelistCommand(sock, groupJid, args.slice(1), groupData);
            }

        } catch (error) {
            await sock.sendMessage(groupJid, { text: '❌ Failed to update anti-link settings.' });
        }
    }

    async handleWhitelistCommand(sock, groupJid, args, groupData) {
        if (args.length < 2) {
            await sock.sendMessage(groupJid, { 
                text: '❌ Usage: !antilink whitelist add/remove <link>' 
            });
            return;
        }

        const action = args[0].toLowerCase();
        const link = args[1];
        
        try {
            let whitelist = groupData.whitelist_links ? JSON.parse(groupData.whitelist_links) : [];
            
            if (action === 'add') {
                whitelist.push({ url: link, type: 'contains' });
                await Group.updateConfig(groupData.id, { whitelist_links: JSON.stringify(whitelist) });
                await sock.sendMessage(groupJid, { text: `✅ Added ${link} to whitelist.` });
                
            } else if (action === 'remove') {
                whitelist = whitelist.filter(item => item.url !== link);
                await Group.updateConfig(groupData.id, { whitelist_links: JSON.stringify(whitelist) });
                await sock.sendMessage(groupJid, { text: `✅ Removed ${link} from whitelist.` });
            }

        } catch (error) {
            await sock.sendMessage(groupJid, { text: '❌ Failed to update whitelist.' });
        }
    }

    async handleWarnCommand(sock, groupJid, args, groupData, sessionData) {
        if (args.length === 0) {
            await sock.sendMessage(groupJid, { text: '❌ Please mention a user to warn.' });
            return;
        }

        const userToWarn = args[0].replace('@', '') + '@s.whatsapp.net';
        const reason = args.slice(1).join(' ') || 'No reason provided';
        
        await sock.sendMessage(groupJid, { 
            text: `⚠️ *Warning*\n\nUser: ${args[0]}\nReason: ${reason}\n\nPlease follow the group rules.` 
        });
    }

    async handleGroupsCommand(sock, groupJid, sessionData) {
        try {
            const groups = await Group.findByUserId(sessionData.user_id);
            
            let groupsList = `📋 *All Groups (${groups.length})*\n\n`;
            
            groups.forEach((group, index) => {
                const status = group.session_status === 'connected' ? '🟢' : '🔴';
                groupsList += `${index + 1}. ${status} ${group.group_name}\n`;
                groupsList += `   ID: ${group.group_jid}\n`;
                groupsList += `   Session: ${group.session_identifier}\n\n`;
            });

            await sock.sendMessage(groupJid, { text: groupsList });

        } catch (error) {
            await sock.sendMessage(groupJid, { text: '❌ Failed to get groups list.' });
        }
    }

    async handleUsersCommand(sock, groupJid, sessionData) {
        try {
            const users = await User.findAll(10);
            
            let usersList = `👥 *All Users (${users.length})*\n\n`;
            
            users.forEach((user, index) => {
                const status = user.is_active ? '🟢' : '🔴';
                usersList += `${index + 1}. ${status} ${user.name}\n`;
                usersList += `   Email: ${user.email}\n`;
                usersList += `   Role: ${user.role}\n`;
                usersList += `   Groups: ${user.group_limit}\n\n`;
            });

            await sock.sendMessage(groupJid, { text: usersList });

        } catch (error) {
            await sock.sendMessage(groupJid, { text: '❌ Failed to get users list.' });
        }
    }

    async checkPermissions(sock, command, senderJid, groupJid, userId) {
        const commandInfo = this.defaultCommands[command];
        if (!commandInfo) return false;

        switch (commandInfo.level) {
            case 'public':
                return true;

            case 'admin':
                try {
                    const groupInfo = await sock.groupMetadata(groupJid);
                    const participant = groupInfo.participants.find(p => p.id === senderJid);
                    return participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
                } catch (error) {
                    return false;
                }

            case 'owner':
                // Check if user is the bot owner
                try {
                    const user = await User.findById(userId);
                    return user && user.role === 'admin';
                } catch (error) {
                    return false;
                }

            default:
                return false;
        }
    }

    getMessageText(message) {
        return message.message?.conversation || 
               message.message?.extendedTextMessage?.text || 
               message.message?.imageMessage?.caption || 
               message.message?.videoMessage?.caption || '';
    }

    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        return `${days}d ${hours}h ${minutes}m ${secs}s`;
    }
}

module.exports = CommandHandler;