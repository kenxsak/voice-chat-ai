import { NextResponse } from 'next/server';
import { getCollections } from '@/lib/mongodb';

/**
 * GET /api/cron/auto-cleanup
 * Automatic cleanup cron job - runs daily to delete old leads and conversations
 * Can be triggered by external cron services (e.g., Vercel Cron, GitHub Actions, Render Cron)
 * 
 * Security: Should be protected by a cron secret in production
 */
export async function GET(request: Request) {
  try {
    // MANDATORY: Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Always require CRON_SECRET - fail if not configured
    if (!cronSecret) {
      console.error('[Auto-Cleanup Cron] CRON_SECRET not configured - refusing to execute');
      return NextResponse.json(
        { message: 'Server configuration error: CRON_SECRET not set' },
        { status: 500 }
      );
    }
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('[Auto-Cleanup Cron] Unauthorized access attempt');
      return NextResponse.json(
        { message: 'Unauthorized - invalid or missing authorization' },
        { status: 401 }
      );
    }

    const { leads, conversations, messages } = await getCollections();

    // Default retention period: 90 days
    const retentionDays = 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    console.log('[Auto-Cleanup Cron] Starting automatic cleanup', {
      retentionDays,
      cutoffDate: cutoffDate.toISOString(),
    });

    // Build deletion filters (no tenant filter - clean up ALL tenants' old data)
    const leadsFilter = {
      createdAt: { $lt: cutoffDate },
    };

    const conversationsFilter = {
      createdAt: { $lt: cutoffDate },
    };

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

    console.log('[Auto-Cleanup Cron] Cleanup completed', {
      ...deletionResults,
      retentionDays,
      cutoffDate: cutoffDate.toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Auto-cleanup completed successfully',
      stats: deletionResults,
      cutoffDate: cutoffDate.toISOString(),
      retentionDays,
    });

  } catch (e: any) {
    console.error('[Auto-Cleanup Cron] Error:', e);
    
    return NextResponse.json(
      { message: 'Server error during auto-cleanup', error: e.message },
      { status: 500 }
    );
  }
}
