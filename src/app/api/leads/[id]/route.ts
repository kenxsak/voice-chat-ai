import { NextResponse } from 'next/server';
import { getCollections } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth-middleware';
import { assertAllowedOrigin, rateLimit } from '@/lib/security';

/**
 * DELETE /api/leads/[id]
 * Delete a single lead by ID along with its associated conversation and messages
 * Requires authentication and tenant ownership validation
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const blocked = assertAllowedOrigin(request);
    if (blocked) return blocked;
    
    const limited = rateLimit(request, 'leads_delete', 20, 60_000);
    if (limited) return limited;

    // Require authentication
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    const leadId = params.id;

    if (!leadId) {
      return NextResponse.json(
        { message: 'Lead ID is required' },
        { status: 400 }
      );
    }

    const { leads, conversations, messages } = await getCollections();

    // Find the lead and verify tenant ownership
    const lead = await leads.findOne({ id: leadId });

    if (!lead) {
      return NextResponse.json(
        { message: 'Lead not found' },
        { status: 404 }
      );
    }

    // Verify tenant access (only owner or superadmin can delete)
    if (session.role !== 'superadmin' && lead.tenantId !== session.tenantId) {
      return NextResponse.json(
        { message: 'Access denied to delete this lead' },
        { status: 403 }
      );
    }

    // Find associated conversation by sessionId or customerId
    const associatedConversations = await conversations
      .find({
        tenantId: lead.tenantId,
        $or: [
          { sessionId: lead.sessionId },
          { customerId: lead.customerId },
        ].filter(condition => condition.sessionId || condition.customerId), // Filter out null/undefined
      })
      .toArray();

    const conversationIds = associatedConversations.map(c => c.id);

    // Delete in order: messages -> conversations -> lead
    let messagesDeleted = 0;
    let conversationsDeleted = 0;

    if (conversationIds.length > 0) {
      // Delete associated messages
      const messagesResult = await messages.deleteMany({
        conversationId: { $in: conversationIds },
      });
      messagesDeleted = messagesResult.deletedCount || 0;

      // Delete associated conversations
      const conversationsResult = await conversations.deleteMany({
        id: { $in: conversationIds },
      });
      conversationsDeleted = conversationsResult.deletedCount || 0;
    }

    // Delete the lead
    await leads.deleteOne({ id: leadId });

    console.log('[DELETE Lead] Successfully deleted lead and associated data', {
      leadId,
      tenantId: lead.tenantId,
      messagesDeleted,
      conversationsDeleted,
      deletedBy: session.email || session.userId,
    });

    return NextResponse.json({
      success: true,
      message: 'Lead and associated data deleted successfully',
      stats: {
        leadDeleted: 1,
        conversationsDeleted,
        messagesDeleted,
      },
    });

  } catch (e) {
    console.error('[DELETE Lead] Error:', e);
    return NextResponse.json(
      { message: 'Server error deleting lead' },
      { status: 500 }
    );
  }
}
