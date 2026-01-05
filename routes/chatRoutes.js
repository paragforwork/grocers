const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { verifyChatUser, requireChatAuth, requireAdmin } = require('../middlewares/chatAuthMiddleware');

// Apply chat user verification to all routes
router.use(verifyChatUser);

// Get or create chat room (requires authentication)
router.post('/room', requireChatAuth, chatController.getChatRoom);

// Get all chat rooms (admin only)
router.get('/rooms', requireAdmin, chatController.getAllChatRooms);

// Get user's chat rooms (requires authentication)
router.get('/user/:userId/rooms', requireChatAuth, chatController.getUserChatRooms);

// Get chat history (requires authentication)
router.get('/room/:chatRoomId/messages', requireChatAuth, chatController.getChatHistory);

// Send message (requires authentication)
router.post('/message', requireChatAuth, chatController.sendMessage);

// Mark messages as read (requires authentication)
router.put('/room/:chatRoomId/read', requireChatAuth, chatController.markAsRead);

// Close chat room (admin only)
router.put('/room/:chatRoomId/close', requireAdmin, chatController.closeChatRoom);

module.exports = router;
