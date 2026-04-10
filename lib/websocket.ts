import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import { supabase } from './supabase';
import { notifyNewMessage } from './push-notifications';

let io: Server | null = null;

export interface Message {
  id?: string;
  senderId: string;
  recipientId: string;
  projectId: string;
  content: string;
  attachmentUrl?: string;
  createdAt?: string;
  read?: boolean;
}

export interface ConversationRoom {
  projectId: string;
  participants: string[];
}

// Store connected users
const connectedUsers: Map<string, string> = new Map(); // userId -> socketId
const userRooms: Map<string, Set<string>> = new Map(); // userId -> set of room names

/**
 * Initialize WebSocket server
 */
export function initializeWebSocketServer(port: number = 3001) {
  const httpServer = createServer();
  
  io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Handle connection
  io.on('connection', (socket: Socket) => {
    console.log(`New client connected: ${socket.id}`);

    // User joins
    socket.on('user:join', (userId: string) => {
      connectedUsers.set(userId, socket.id);
      userRooms.set(userId, new Set());
      socket.emit('user:joined', { userId, socketId: socket.id });
      console.log(`User ${userId} joined with socket ${socket.id}`);
    });

    // Join project conversation room
    socket.on('room:join', (projectId: string, userId: string) => {
      const roomName = `project:${projectId}`;
      socket.join(roomName);
      
      const rooms = userRooms.get(userId) || new Set();
      rooms.add(roomName);
      userRooms.set(userId, rooms);

      io?.to(roomName).emit('user:in-room', {
        userId,
        message: `${userId} joined the conversation`,
        timestamp: new Date().toISOString(),
      });
    });

    // Leave project conversation room
    socket.on('room:leave', (projectId: string, userId: string) => {
      const roomName = `project:${projectId}`;
      socket.leave(roomName);
      
      const rooms = userRooms.get(userId);
      if (rooms) {
        rooms.delete(roomName);
      }

      io?.to(roomName).emit('user:left-room', {
        userId,
        message: `${userId} left the conversation`,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle new message
    socket.on('message:send', async (message: Message) => {
      try {
        // Save message to database
        const { data, error } = await supabase
          .from('messages')
          .insert([{
            sender_id: message.senderId,
            recipient_id: message.recipientId,
            project_id: message.projectId,
            content: message.content,
            attachment_url: message.attachmentUrl,
            read: false,
            created_at: new Date().toISOString(),
          }])
          .select();

        if (error) {
          console.error('Error saving message:', error);
          socket.emit('message:error', { message: 'Failed to send message' });
          return;
        }

        const savedMessage = data?.[0];

        // Emit to all users in the project room
        const roomName = `project:${message.projectId}`;
        io?.to(roomName).emit('message:new', {
          id: savedMessage?.id,
          senderId: message.senderId,
          recipientId: message.recipientId,
          projectId: message.projectId,
          content: message.content,
          attachmentUrl: message.attachmentUrl,
          createdAt: savedMessage?.created_at,
          timestamp: new Date().toISOString(),
        });

        // Send push notification to recipient if not connected
        const recipientSocketId = connectedUsers.get(message.recipientId);
        if (!recipientSocketId) {
          const { data: recipientData } = await supabase
            .from('users')
            .select('name')
            .eq('id', message.senderId)
            .single();
          
          const senderName = recipientData?.name || 'Unknown';
          await notifyNewMessage(message.recipientId, senderName, message.content);
        }
      } catch (error) {
        console.error('Error handling message:send:', error);
        socket.emit('message:error', { message: 'An error occurred' });
      }
    });

    // Mark message as read
    socket.on('message:read', async (messageId: string) => {
      try {
        await supabase
          .from('messages')
          .update({ read: true, read_at: new Date().toISOString() })
          .eq('id', messageId);

        io?.emit('message:marked-read', { messageId });
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });

    // Typing indicator
    socket.on('user:typing', (projectId: string, userId: string) => {
      const roomName = `project:${projectId}`;
      io?.to(roomName).emit('user:typing', {
        userId,
        timestamp: new Date().toISOString(),
      });
    });

    // Stop typing
    socket.on('user:stop-typing', (projectId: string, userId: string) => {
      const roomName = `project:${projectId}`;
      io?.to(roomName).emit('user:stop-typing', {
        userId,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      // Find and remove the user
      let disconnectedUserId: string | null = null;
      for (const [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          disconnectedUserId = userId;
          connectedUsers.delete(userId);
          userRooms.delete(userId);
          break;
        }
      }

      if (disconnectedUserId) {
        console.log(`User ${disconnectedUserId} disconnected`);
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  httpServer.listen(port, () => {
    console.log(`WebSocket server running on port ${port}`);
  });

  return io;
}

/**
 * Get or create WebSocket server instance
 */
export function getWebSocketServer(): Server | null {
  return io;
}

/**
 * Emit event to a specific user
 */
export function emitToUser(userId: string, event: string, data: any) {
  const socketId = connectedUsers.get(userId);
  if (socketId && io) {
    io.to(socketId).emit(event, data);
  }
}

/**
 * Emit event to all users in a project
 */
export function emitToRoom(projectId: string, event: string, data: any) {
  const roomName = `project:${projectId}`;
  if (io) {
    io.to(roomName).emit(event, data);
  }
}

/**
 * Get list of connected users
 */
export function getConnectedUsers(): Array<{ userId: string; socketId: string }> {
  return Array.from(connectedUsers.entries()).map(([userId, socketId]) => ({
    userId,
    socketId,
  }));
}

/**
 * Get user's socket ID
 */
export function getUserSocketId(userId: string): string | undefined {
  return connectedUsers.get(userId);
}

/**
 * Check if user is connected
 */
export function isUserConnected(userId: string): boolean {
  return connectedUsers.has(userId);
}

/**
 * Fetch message history for a project
 */
export async function getMessageHistory(
  projectId: string,
  limit: number = 50
): Promise<Message[]> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching message history:', error);
      return [];
    }

    return (data || []).reverse();
  } catch (error) {
    console.error('Error fetching message history:', error);
    return [];
  }
}

/**
 * Fetch unread message count for a user
 */
export async function getUnreadMessageCount(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Error fetching unread message count:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Error fetching unread message count:', error);
    return 0;
  }
}

/**
 * Mark all messages as read for a conversation
 */
export async function markConversationAsRead(
  projectId: string,
  recipientId: string
): Promise<void> {
  try {
    await supabase
      .from('messages')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('project_id', projectId)
      .eq('recipient_id', recipientId)
      .eq('read', false);
  } catch (error) {
    console.error('Error marking conversation as read:', error);
  }
}
