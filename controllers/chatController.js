const ChatRoom = require('../models/ChatRoom');
const ChatMessage = require('../models/ChatMessage');

// Get or create chat room for user (with optional product)
exports.getChatRoom = async (req, res) => {
  try {
    const { productId, productName } = req.body;
    
    // Use authenticated user from middleware
    const userId = req.chatUser.userId;
    const userName = req.body.userName || req.chatUser.email;

    // Build query - filter by both userId and productId
    const query = { 
      userId,
      productId: productId || null 
    };

    let chatRoom = await ChatRoom.findOne(query);

    if (!chatRoom) {
      chatRoom = await ChatRoom.create({
        userId,
        userName,
        productId: productId || null,
        productName: productName || null,
        isActive: true
      });
    }

    res.status(200).json({
      success: true,
      chatRoom
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting chat room',
      error: error.message
    });
  }
};

// Get all active chat rooms (for admin)
exports.getAllChatRooms = async (req, res) => {
  try {
    const chatRooms = await ChatRoom.find({ isActive: true })
      .sort({ lastMessageAt: -1 });

    res.status(200).json({
      success: true,
      chatRooms
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching chat rooms',
      error: error.message
    });
  }
};

// Get all chat rooms for a specific user
exports.getUserChatRooms = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Security: Ensure user can only access their own chat rooms
    if (userId !== req.chatUser.userId.toString() && req.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Cannot view other user chat rooms.'
      });
    }

    const chatRooms = await ChatRoom.find({ userId, isActive: true })
      .sort({ lastMessageAt: -1 });

    res.status(200).json({
      success: true,
      chatRooms
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user chat rooms',
      error: error.message
    });
  }
};

// Get chat history for a room
exports.getChatHistory = async (req, res) => {
  try {
    const { chatRoomId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    const messages = await ChatMessage.find({ chatRoomId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const totalMessages = await ChatMessage.countDocuments({ chatRoomId });

    res.status(200).json({
      success: true,
      messages: messages.reverse(),
      totalMessages,
      hasMore: totalMessages > parseInt(skip) + parseInt(limit)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching chat history',
      error: error.message
    });
  }
};

// Send message via REST (fallback)
exports.sendMessage = async (req, res) => {
  try {
    const { chatRoomId, senderId, senderName, senderType, message } = req.body;

    const chatMessage = await ChatMessage.create({
      chatRoomId,
      senderId,
      senderName,
      senderType,
      message
    });

    // Only increment unread count if user is sending to admin
    await ChatRoom.findByIdAndUpdate(chatRoomId, {
      lastMessageAt: new Date(),
      $inc: { unreadCount: senderType === 'user' ? 1 : 0 }
    });

    res.status(201).json({
      success: true,
      message: chatMessage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message
    });
  }
};

// Mark messages as read - only admin should clear the badge
exports.markAsRead = async (req, res) => {
  try {
    const { chatRoomId } = req.params;
    
    // Use verified userType from middleware (not from request body)
    const userType = req.userType;

    // Only admin can mark messages as read and clear unread count
    if (userType === 'admin') {
      await ChatMessage.updateMany(
        { chatRoomId, isRead: false, senderType: 'user' },
        { isRead: true, readAt: new Date() }
      );

      await ChatRoom.findByIdAndUpdate(chatRoomId, { unreadCount: 0 });
    }

    res.status(200).json({
      success: true,
      message: userType === 'admin' ? 'Messages marked as read' : 'Not authorized to mark as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking messages as read',
      error: error.message
    });
  }
};

// Close chat room
exports.closeChatRoom = async (req, res) => {
  try {
    const { chatRoomId } = req.params;

    await ChatRoom.findByIdAndUpdate(chatRoomId, {
      status: 'closed',
      isActive: false
    });

    res.status(200).json({
      success: true,
      message: 'Chat room closed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error closing chat room',
      error: error.message
    });
  }
};
