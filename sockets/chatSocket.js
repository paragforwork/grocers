const ChatRoom = require('../models/ChatRoom');
const ChatMessage = require('../models/ChatMessage');

const activeConnections = new Map();

const chatSocket = (io) => {
  io.on('connection', (socket) => {
    // console.log('Socket connected:', socket.id, 'Auth:', socket.isAuthenticated, 'Type:', socket.userType);

    // Verify authentication for protected actions
    const requireAuth = () => {
      if (!socket.isAuthenticated) {
        socket.emit('chat:error', { message: 'Authentication required' });
        return false;
      }
      return true;
    };

    socket.on('chat:join', async ({ userId, userName, userType, chatRoomId, productName }) => {
      if (!requireAuth()) return;

      try {
        // Use verified userType from socket middleware (not from client)
        const verifiedUserType = socket.userType;
        const verifiedUserId = socket.user.userId;

        activeConnections.set(socket.id, { 
          userId: verifiedUserId, 
          userName, 
          userType: verifiedUserType, 
          chatRoomId 
        });

        if (verifiedUserType === 'admin') {
          socket.join('admin-room');
          const chatRooms = await ChatRoom.find({ isActive: true }).sort({ lastMessageAt: -1 });
          socket.emit('chat:rooms-list', chatRooms);
        } else {
          socket.join(`room-${chatRoomId}`);
          const room = await ChatRoom.findById(chatRoomId);
          io.to('admin-room').emit('chat:user-online', {
            userId: verifiedUserId, 
            userName, 
            chatRoomId,
            productId: room?.productId,
            productName: room?.productName || productName
          });
        }
        // console.log(`${userName} (${verifiedUserType}) joined chat${productName ? ` - discussing ${productName}` : ''}`);
      } catch (error) {
        console.error('Error joining chat:', error);
        socket.emit('chat:error', { message: 'Failed to join chat' });
      }
    });

    socket.on('chat:admin-join-room', ({ chatRoomId }) => {
      if (!requireAuth()) return;
      if (socket.userType !== 'admin') {
        socket.emit('chat:error', { message: 'Admin access required' });
        return;
      }
      socket.join(`room-${chatRoomId}`);
    });

    socket.on('chat:admin-leave-room', ({ chatRoomId }) => {
      if (!requireAuth()) return;
      socket.leave(`room-${chatRoomId}`);
    });

    socket.on('chat:send-message', async ({ chatRoomId, senderId, senderName, senderType, message }) => {
      if (!requireAuth()) return;

      try {
        // Use verified user data from socket middleware
        const verifiedSenderType = socket.userType;
        const verifiedSenderId = socket.user.userId;

        const chatMessage = await ChatMessage.create({
          chatRoomId, 
          senderId: verifiedSenderId, 
          senderName, 
          senderType: verifiedSenderType, 
          message
        });

        await ChatRoom.findByIdAndUpdate(chatRoomId, {
          lastMessageAt: new Date(),
          $inc: { unreadCount: verifiedSenderType === 'user' ? 1 : 0 }
        });

        io.to(`room-${chatRoomId}`).emit('chat:new-message', chatMessage);

        if (verifiedSenderType === 'user') {
          const room = await ChatRoom.findById(chatRoomId);
          io.to('admin-room').emit('chat:new-user-message', {
            chatRoomId, message: chatMessage, productName: room?.productName
          });
        }

        socket.emit('chat:message-sent', { success: true, message: chatMessage });
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('chat:error', { message: 'Failed to send message' });
      }
    });

    socket.on('chat:typing', ({ chatRoomId, userName, userType }) => {
      if (!requireAuth()) return;
      socket.to(`room-${chatRoomId}`).emit('chat:user-typing', { userName, userType: socket.userType });
    });

    socket.on('chat:stop-typing', ({ chatRoomId }) => {
      socket.to(`room-${chatRoomId}`).emit('chat:user-stop-typing');
    });

    socket.on('chat:mark-read', async ({ chatRoomId, userType }) => {
      if (!requireAuth()) return;

      try {
        // Use verified userType from socket middleware
        if (socket.userType === 'admin') {
          await ChatMessage.updateMany(
            { chatRoomId, isRead: false, senderType: 'user' },
            { isRead: true, readAt: new Date() }
          );
          await ChatRoom.findByIdAndUpdate(chatRoomId, { unreadCount: 0 });
          io.to(`room-${chatRoomId}`).emit('chat:messages-read', { chatRoomId });
        } else {
          socket.emit('chat:error', { message: 'Only admin can mark messages as read' });
        }
      } catch (error) {
        console.error('Error marking as read:', error);
      }
    });

    socket.on('disconnect', () => {
      const connection = activeConnections.get(socket.id);
      if (connection) {
        const { userId, userName, userType, chatRoomId } = connection;
        if (userType === 'user') {
          io.to('admin-room').emit('chat:user-offline', { userId, userName, chatRoomId });
        }
        activeConnections.delete(socket.id);
        // console.log(`${userName} disconnected`);
      }
    });
  });
};

module.exports = chatSocket;
