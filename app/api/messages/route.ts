import { NextRequest, NextResponse } from 'next/server';
import {
  getMessageHistory,
  getUnreadMessageCount,
  markConversationAsRead,
} from '@/lib/websocket';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const projectId = searchParams.get('projectId');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (action === 'history' && projectId) {
      const messages = await getMessageHistory(projectId, limit);
      return NextResponse.json({ data: messages });
    }

    if (action === 'unread' && userId) {
      const count = await getUnreadMessageCount(userId);
      return NextResponse.json({ unreadCount: count });
    }

    if (action === 'conversations' && userId) {
      // Get conversations for a user
      const { data, error } = await supabase
        .from('messages')
        .select('DISTINCT project_id')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);

      if (error) throw error;

      return NextResponse.json({ conversations: data });
    }

    return NextResponse.json(
      { error: 'Missing or invalid parameters' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...payload } = body;

    switch (action) {
      case 'markAsRead':
        return await handleMarkAsRead(payload);

      case 'getConversation':
        return await handleGetConversation(payload);

      case 'searchMessages':
        return await handleSearchMessages(payload);

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Messaging API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleMarkAsRead(payload: any) {
  try {
    const { projectId, recipientId } = payload;

    if (!projectId || !recipientId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await markConversationAsRead(projectId, recipientId);

    return NextResponse.json({
      success: true,
      message: 'Conversation marked as read',
    });
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark as read' },
      { status: 500 }
    );
  }
}

async function handleGetConversation(payload: any) {
  try {
    const { projectId, senderId, recipientId, limit = 50 } = payload;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({
      data: (data || []).reverse(),
      success: true,
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}

async function handleSearchMessages(payload: any) {
  try {
    const { projectId, query, limit = 20 } = payload;

    if (!projectId || !query) {
      return NextResponse.json(
        { error: 'Project ID and query required' },
        { status: 400 }
      );
    }

    // Use supabase full-text search if available
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('project_id', projectId)
      .ilike('content', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({
      data,
      success: true,
    });
  } catch (error) {
    console.error('Error searching messages:', error);
    return NextResponse.json(
      { error: 'Failed to search messages' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId } = body;

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Message deleted',
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}
