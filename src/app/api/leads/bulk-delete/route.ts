import { NextResponse } from 'next/server';
import { getCollections } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth-middleware';
import { assertAllowedOrigin, rateLimit } from '@/lib/security';
import { z } from 'zod';

const BulkDeleteSchema = z.object({
  leadIds: z.array(z.string()).min(1).max(100), // Limit to 100 leads per bulk operation
  tenantId: z.string().optional(),
});

/**
 * POST /api/leads/bulk-delete
 * Delete multiple leads by IDs along with their associated conversations and messages
 * Requires authentication and tenant ownership validation
 */
export async function POST(request: Request) {
  try {
    const blocked = assertAllowedOrigin(request);
    if (blocked) return blocked;
    
    const limited = rateLimit(request, 'leads_bulk_delete', 10, 60_000);
    if (limited) return limited;

    // Require authentication
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    const body = await request.json();
    const { leadIds, tenantId: requestedTenantId } = BulkDeleteSchema.parse(body);

    const { leads, conversations, messages } = await getCollections();

    // Build filter for leads to delete
    const leadsFilter: any = { id: { $in: leadIds } };

    // Add tenant filter based on user role
    if (session.role !== 'superadmin') {
      // Regular users can only delete their own tenant's leads
      leadsFilter.tenantId = session.tenantId;
    } else if (requestedTenantId) {
      // Superadmin can specify a tenant
      leadsFilter.tenantId = requestedTenantId;
    }

    // Find all leads to verify access and get associated data
    const leadsToDelete = await leads.find(leadsFilter).toArray();

    if (leadsToDelete.length === 0) {
      return NextResponse.json(
        { message: 'No leads found to delete or access denied' },
        { status: 404 }
      );
    }

    // Verify all leads belong to accessible tenants
    const unauthorizedLeads = leadsToDelete.filter(lead => {
      if (session.role === 'superadmin') {
        return false; // Superadmin can delete any
      }
      return lead.tenantId !== session.tenantId;
    });

    if (unauthorizedLeads.length > 0) {
      return NextResponse.json(
        { 
          message: 'Access denied to delete some leads',
          unauthorizedCount: unauthorizedLeads.length,
        },
        { status: 403 }
      );
    }

    // Collect all sessionIds and customerIds to find associated conversations
    const sessionIds = [...new Set(leadsToDelete.map(l => l.sessionId).filter(Boolean))];
    const customerIds = [...new Set(leadsToDelete.map(l => l.customerId).filter(Boolean))];

    // Find associated conversations
    const conversationFilters = [];
    if (sessionIds.length > 0) {
      conversationFilters.push({ sessionId: { $in: sessionIds } });
    }
    if (customerIds.length > 0) {
      conversationFilters.push({ customerId: { $in: customerIds } });
    }

    let associatedConversations: any[] = [];
    if (conversationFilters.length > 0) {
      associatedConversations = await conversations
        .find({
          $or: conversationFilters,
        })
        .toArray();
    }

    const conversationIds = associatedConversations.map(c => c.id);

    // Delete in order: messages -> conversations -> leads
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

    // Delete the leads
    const leadsResult = await leads.deleteMany(leadsFilter);
    const leadsDeleted = leadsResult.deletedCount || 0;

    console.log('[BULK DELETE Leads] Successfully deleted leads and associated data', {
      leadsDeleted,
      conversationsDeleted,
      messagesDeleted,
      requestedLeadIds: leadIds.length,
      deletedBy: session.email || session.userId,
      role: session.role,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${leadsDeleted} leads and associated data`,
      stats: {
        leadsDeleted,
        conversationsDeleted,
        messagesDeleted,
      },
    });

  } catch (e: any) {
    console.error('[BULK DELETE Leads] Error:', e);
    
    if (e.name === 'ZodError') {
      return NextResponse.json(
        { message: 'Invalid request parameters', errors: e.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Server error during bulk delete' },
      { status: 500 }
    );
  }
}
