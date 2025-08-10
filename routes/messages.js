const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

// Middleware to verify JWT token
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(401).json({ message: 'Token is not valid' });
        }

        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// In-memory storage for messages (in production, use a database)
let conversations = new Map();
let messages = new Map();

// @route   GET /api/messages/conversations
// @desc    Get user's conversations
// @access  Private
router.get('/conversations', auth, async (req, res) => {
    try {
        const userConversations = conversations.get(req.user.id) || [];
        
        // Populate conversation details
        const populatedConversations = await Promise.all(
            userConversations.map(async (conv) => {
                const otherUser = await User.findById(conv.otherUserId)
                    .select('name email phone userType');
                
                return {
                    id: conv.id,
                    otherUser,
                    lastMessage: conv.lastMessage,
                    timestamp: conv.timestamp,
                    unread: conv.unread,
                    messageCount: conv.messageCount
                };
            })
        );

        res.json(populatedConversations);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/messages/:conversationId
// @desc    Get messages for a conversation
// @access  Private
router.get('/:conversationId', auth, async (req, res) => {
    try {
        const conversationId = req.params.conversationId;
        const conversationMessages = messages.get(conversationId) || [];
        
        // Mark messages as read
        const userConversations = conversations.get(req.user.id) || [];
        const conversation = userConversations.find(c => c.id === conversationId);
        if (conversation) {
            conversation.unread = false;
            conversation.messageCount = 0;
        }

        res.json(conversationMessages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/messages
// @desc    Send a message
// @access  Private
router.post('/', [
    auth,
    body('recipientId').notEmpty().withMessage('Recipient ID is required'),
    body('content').notEmpty().withMessage('Message content is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { recipientId, content } = req.body;

        // Check if recipient exists
        const recipient = await User.findById(recipientId);
        if (!recipient) {
            return res.status(404).json({ message: 'Recipient not found' });
        }

        // Create or get conversation
        const conversationId = [req.user.id, recipientId].sort().join('_');
        let conversation = null;

        // Check if conversation exists for sender
        const senderConversations = conversations.get(req.user.id) || [];
        conversation = senderConversations.find(c => c.otherUserId === recipientId);

        if (!conversation) {
            conversation = {
                id: conversationId,
                otherUserId: recipientId,
                lastMessage: content,
                timestamp: new Date(),
                unread: false,
                messageCount: 0
            };
            senderConversations.push(conversation);
            conversations.set(req.user.id, senderConversations);
        } else {
            conversation.lastMessage = content;
            conversation.timestamp = new Date();
        }

        // Check if conversation exists for recipient
        const recipientConversations = conversations.get(recipientId) || [];
        let recipientConversation = recipientConversations.find(c => c.otherUserId === req.user.id);

        if (!recipientConversation) {
            recipientConversation = {
                id: conversationId,
                otherUserId: req.user.id,
                lastMessage: content,
                timestamp: new Date(),
                unread: true,
                messageCount: 1
            };
            recipientConversations.push(recipientConversation);
            conversations.set(recipientId, recipientConversations);
        } else {
            recipientConversation.lastMessage = content;
            recipientConversation.timestamp = new Date();
            recipientConversation.unread = true;
            recipientConversation.messageCount += 1;
        }

        // Create message
        const message = {
            id: Date.now().toString(),
            conversationId,
            sender: req.user.id,
            recipient: recipientId,
            content,
            timestamp: new Date(),
            read: false
        };

        // Store message
        const conversationMessages = messages.get(conversationId) || [];
        conversationMessages.push(message);
        messages.set(conversationId, conversationMessages);

        // Populate sender details
        const populatedMessage = {
            ...message,
            sender: {
                id: req.user.id,
                name: req.user.name,
                userType: req.user.userType
            }
        };

        res.status(201).json(populatedMessage);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/messages/conversations
// @desc    Start a new conversation
// @access  Private
router.post('/conversations', [
    auth,
    body('recipientId').notEmpty().withMessage('Recipient ID is required'),
    body('initialMessage').optional().isLength({ max: 1000 }).withMessage('Message too long')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { recipientId, initialMessage } = req.body;

        // Check if recipient exists
        const recipient = await User.findById(recipientId);
        if (!recipient) {
            return res.status(404).json({ message: 'Recipient not found' });
        }

        // Check if conversation already exists
        const senderConversations = conversations.get(req.user.id) || [];
        const existingConversation = senderConversations.find(c => c.otherUserId === recipientId);

        if (existingConversation) {
            return res.status(400).json({ 
                message: 'Conversation already exists',
                conversationId: existingConversation.id
            });
        }

        // Create conversation
        const conversationId = [req.user.id, recipientId].sort().join('_');
        
        const conversation = {
            id: conversationId,
            otherUserId: recipientId,
            lastMessage: initialMessage || 'Conversation started',
            timestamp: new Date(),
            unread: false,
            messageCount: 0
        };

        senderConversations.push(conversation);
        conversations.set(req.user.id, senderConversations);

        // Create recipient conversation
        const recipientConversations = conversations.get(recipientId) || [];
        const recipientConversation = {
            id: conversationId,
            otherUserId: req.user.id,
            lastMessage: initialMessage || 'Conversation started',
            timestamp: new Date(),
            unread: !!initialMessage,
            messageCount: initialMessage ? 1 : 0
        };

        recipientConversations.push(recipientConversation);
        conversations.set(recipientId, recipientConversations);

        // Send initial message if provided
        if (initialMessage) {
            const message = {
                id: Date.now().toString(),
                conversationId,
                sender: req.user.id,
                recipient: recipientId,
                content: initialMessage,
                timestamp: new Date(),
                read: false
            };

            const conversationMessages = messages.get(conversationId) || [];
            conversationMessages.push(message);
            messages.set(conversationId, conversationMessages);
        }

        res.status(201).json({
            conversationId,
            message: 'Conversation created successfully'
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/messages/:conversationId/read
// @desc    Mark conversation as read
// @access  Private
router.put('/:conversationId/read', auth, async (req, res) => {
    try {
        const conversationId = req.params.conversationId;
        const userConversations = conversations.get(req.user.id) || [];
        const conversation = userConversations.find(c => c.id === conversationId);

        if (conversation) {
            conversation.unread = false;
            conversation.messageCount = 0;
        }

        // Mark messages as read
        const conversationMessages = messages.get(conversationId) || [];
        conversationMessages.forEach(message => {
            if (message.recipient === req.user.id) {
                message.read = true;
            }
        });

        res.json({ message: 'Conversation marked as read' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/messages/:conversationId
// @desc    Delete conversation
// @access  Private
router.delete('/:conversationId', auth, async (req, res) => {
    try {
        const conversationId = req.params.conversationId;
        
        // Remove from user's conversations
        const userConversations = conversations.get(req.user.id) || [];
        const updatedConversations = userConversations.filter(c => c.id !== conversationId);
        conversations.set(req.user.id, updatedConversations);

        // Remove messages
        messages.delete(conversationId);

        res.json({ message: 'Conversation deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/messages/unread/count
// @desc    Get unread message count
// @access  Private
router.get('/unread/count', auth, async (req, res) => {
    try {
        const userConversations = conversations.get(req.user.id) || [];
        const unreadCount = userConversations.reduce((total, conv) => total + conv.messageCount, 0);

        res.json({ unreadCount });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router; 