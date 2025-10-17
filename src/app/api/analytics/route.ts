import { NextResponse } from 'next/server';
import { getCollections } from '@/lib/mongodb';
import { requireTenantAccess } from '@/lib/auth-middleware';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedTenantId = searchParams.get('tenantId') || undefined;
    const days = parseInt(searchParams.get('days') || '7');

    // Require authentication and tenant access
    const authResult = await requireTenantAccess(requestedTenantId);
    if (authResult instanceof NextResponse) return authResult;

    const { tenantId } = authResult;

    const { leads, conversations } = await getCollections();
    
    // Calculate date range
    const endDate = new Date();
    const startDate = subDays(endDate, days - 1);
    
    console.log(`[API /api/analytics] Fetching analytics for tenant ${tenantId} from ${startDate} to ${endDate}`);

    // Get daily conversation counts from leads collection (single source of truth)
    const dailyStats = [];
    for (let i = 0; i < days; i++) {
      const currentDate = subDays(endDate, days - 1 - i);
      const dayStart = startOfDay(currentDate);
      const dayEnd = endOfDay(currentDate);
      
      // Count leads (conversations) for this day
      const conversationCount = await leads.countDocuments({
        tenantId,
        date: {
          $gte: dayStart.toISOString(),
          $lte: dayEnd.toISOString()
        }
      });

      dailyStats.push({
        date: format(currentDate, 'MMM d'),
        conversations: conversationCount
      });
    }

    // Get total stats for current month
    const currentMonth = new Date();
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);

    // Simplified: Total conversations = ALL leads (including anonymous ones)
    const [totalConversations, totalLeadsWithContact, totalAnonymousLeads] = await Promise.all([
      // Count ALL leads (including anonymous) - this is total conversations
      leads.countDocuments({
        tenantId,
        date: {
          $gte: monthStart.toISOString(),
          $lte: monthEnd.toISOString()
        }
      }),
      // Count leads with any contact info (name OR email OR phone)
      leads.countDocuments({
        tenantId,
        date: {
          $gte: monthStart.toISOString(),
          $lte: monthEnd.toISOString()
        },
        $or: [
          { customerName: { $exists: true, $ne: null, $nin: ['', null, 'Anonymous Person'] } },
          { customerEmail: { $exists: true, $ne: null, $nin: ['', null] } },
          { customerPhone: { $exists: true, $ne: null, $nin: ['', null] } }
        ]
      }),
      // Count anonymous conversations (no contact info)
      leads.countDocuments({
        tenantId,
        date: {
          $gte: monthStart.toISOString(),
          $lte: monthEnd.toISOString()
        },
        isAnonymous: true
      })
    ]);

    // Calculate total tokens used this month
    const tokenAggregation = await leads.aggregate([
      {
        $match: {
          tenantId,
          date: {
            $gte: monthStart.toISOString(),
            $lte: monthEnd.toISOString()
          }
        }
      },
      {
        $group: {
          _id: null,
          totalTokens: { $sum: { $ifNull: ['$totalTokens', 0] } }
        }
      }
    ]).toArray();
    
    const totalTokensUsed = tokenAggregation.length > 0 ? tokenAggregation[0].totalTokens : 0;

    console.log(`[API /api/analytics] Found ${totalConversations} total conversations (${totalLeadsWithContact} with contact, ${totalAnonymousLeads} anonymous) for tenant ${tenantId} this month`);
    console.log(`[API /api/analytics] Total tokens used: ${totalTokensUsed}`);

    return NextResponse.json({
      dailyStats,
      totalConversations, // Total = all leads (with contact + anonymous)
      totalLeads: totalLeadsWithContact, // Only leads with contact info
      totalAnonymousConversations: totalAnonymousLeads,
      totalTokensUsed, // Total tokens used in conversations this month
      period: {
        start: monthStart.toISOString(),
        end: monthEnd.toISOString()
      }
    });

  } catch (error: any) {
    console.error('[API /api/analytics] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 });
  }
}
