import { NextResponse } from 'next/server';
import { getCollections } from '@/lib/mongodb';
import { requireAuth, getTenantFilter } from '@/lib/auth-middleware';
import { assertAllowedOrigin, rateLimit } from '@/lib/security';
import { z } from 'zod';

const CleanupSchema = z.object({
  retentionDays: z.number().min(1).max(365).optional().default(90),
  tenantId: z.string().optional(),
  dryRun: z.boolean().optional().default(false),
});

/**
 * POST /api/cleanup
 * Auto-delete leads, conversations, and messages older than specified retention period
 * Requires authentication (tenant owners or superadmin)
 */
export async function POST(request: Request) {
  try {
    const blocked = assertAllowedOrigin(request);
    if (blocked) return blocked;
    
    const limited = rateLimit(request, 'cleanup_post', 5, 60_000);
    if (limited) return limited;

    // Require authentication
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    const body = await request.json();
    const { retentionDays, tenantId: requestedTenantId, dryRun } = CleanupSchema.parse(body);

    // Get tenant filter based on user role
    const query = getTenantFilter(session, requestedTenantId);
    
    // For non-superadmin users, validate they own the tenant
    if (session.role !== 'superadmin' && requestedTenantId && requestedTenantId !== session.tenantId) {
      return NextResponse.json(
        { message: 'Access denied to cleanup this tenant data' },
        { status: 403 }
      );
    }

    const { leads, conversations, messages } = await getCollections();

    // Calculate cutoff date (data older than this will be deleted)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    console.log('[Cleanup API] Starting cleanup', {
      retentionDays,
      cutoffDate: cutoffDate.toISOString(),
      tenantFilter: query,
      dryRun,
      requestedBy: session.email || session.userId,
      role: session.role,
    });

    // Build deletion filters
    const leadsFilter = {
      ...query,
      createdAt: { $lt: cutoffDate },
    };

    const conversationsFilter = {
      ...query,
      createdAt: { $lt: cutoffDate },
    };

    if (dryRun) {
      // Dry run - just count what would be deleted
      const [leadsCount, conversationsCount] = await Promise.all([
        leads.countDocuments(leadsFilter),
        conversations.countDocuments(conversationsFilter),
      ]);

      // Find conversation IDs that would be deleted to count messages
      const conversationsToDelete = await conversations
        .find(conversationsFilter, { projection: { id: 1 } })
        .toArray();
      
      const conversationIds = conversationsToDelete.map(c => c.id);
      
      const messagesCount = conversationIds.length > 0 
        ? await messages.countDocuments({ conversationId: { $in: conversationIds } })
        : 0;

      return NextResponse.json({
        dryRun: true,
        message: 'Dry run completed - no data was deleted',
        stats: {
          leadsToDelete: leadsCount,
          conversationsToDelete: conversationsCount,
          messagesToDelete: messagesCount,
        },
        cutoffDate: cutoffDate.toISOString(),
        retentionDays,
      });
    }

    // Step 1: Find conversations to delete (to get their IDs for messages deletion)
    const conversationsToDelete = await conversations
      .find(conversationsFilter, { projection: { id: 1 } })
      .toArray();
    
    const conversationIds = conversationsToDelete.map(c => c.id);

    // Step 2: Delete in order - messages first, then conversations, then leads
    const deletionResults = {
      messagesDeleted: 0,
      conversationsDeleted: 0,
      leadsDeleted: 0,
    };

    // Delete messages associated with old conversations
    if (conversationIds.length > 0) {
      const messagesResult = await messages.deleteMany({
        conversationId: { $in: conversationIds },
      });
      deletionResults.messagesDeleted = messagesResult.deletedCount || 0;
    }

    // Delete old conversations
    const conversationsResult = await conversations.deleteMany(conversationsFilter);
    deletionResults.conversationsDeleted = conversationsResult.deletedCount || 0;

    // Delete old leads
    const leadsResult = await leads.deleteMany(leadsFilter);
    deletionResults.leadsDeleted = leadsResult.deletedCount || 0;

    console.log('[Cleanup API] Cleanup completed', {
      ...deletionResults,
      retentionDays,
      cutoffDate: cutoffDate.toISOString(),
      tenantFilter: query,
    });

    return NextResponse.json({
      success: true,
      message: 'Cleanup completed successfully',
      stats: deletionResults,
      cutoffDate: cutoffDate.toISOString(),
      retentionDays,
    });

  } catch (e: any) {
    console.error('[Cleanup API] Error:', e);
    
    if (e.name === 'ZodError') {
      return NextResponse.json(
        { message: 'Invalid request parameters', errors: e.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Server error during cleanup' },
      { status: 500 }
    );
  }
}
