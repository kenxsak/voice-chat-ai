import { NextResponse } from 'next/server';
import { getConversationMessages } from '@/lib/conversation-storage';
import { rateLimit } from '@/lib/security';

/**
 * GET /api/conversations/messages?conversationId=xxx
 * Loads messages for a specific conversation
 */
export async function GET(request: Request) {
  try {
    const limited = rateLimit(request, 'conversation_messages_get', 60, 60_000);
    if (limited) return limited;

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ message: 'Conversation ID is required' }, { status: 400 });
    }

    const messages = await getConversationMessages(conversationId);
    
    // Transform messages for frontend
    const transformedMessages = messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
      imageDataUri: msg.imageDataUri
    }));

    return NextResponse.json({ 
      messages: transformedMessages,
      conversationId 
    });

  } catch (error) {
    console.error('[API /api/conversations/messages] Error:', error);
    return NextResponse.json(
      { message: 'Failed to load conversation messages' },
      { status: 500 }
    );
  }
}
