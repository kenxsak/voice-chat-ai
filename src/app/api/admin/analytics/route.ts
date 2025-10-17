import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth-middleware';
import { getCollections } from '@/lib/mongodb';
import { calculateTokenCost, formatCurrency, calculateProfitMargin } from '@/lib/pricing';

export async function GET(request: Request) {
  try {
    const authResult = await requireSuperAdmin();
    if (authResult instanceof NextResponse) return authResult;

    const { leads, tenants, plans } = await getCollections();

    // Get all tenants with their assigned plans
    const allTenants = await tenants.find({}).toArray();
    const allPlans = await plans.find({}).toArray();

    // Create a map of plan IDs to plan data for quick lookup
    const plansMap = new Map(allPlans.map(p => [p.id, p]));

    // Calculate current month date range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Aggregate token usage and conversation counts by tenant
    const tenantAnalytics = await Promise.all(
      allTenants.map(async (tenant) => {
        // Get current month conversations (leads) for this tenant
        const tenantLeads = await leads.find({ 
          tenantId: tenant.id,
          createdAt: { 
            $gte: startOfMonth.toISOString(), 
            $lte: endOfMonth.toISOString() 
          }
        }).toArray();

        // Calculate total tokens (input + output) for this tenant (current month only)
        const totalInputTokens = tenantLeads.reduce((sum, lead) => sum + (lead.inputTokens || 0), 0);
        const totalOutputTokens = tenantLeads.reduce((sum, lead) => sum + (lead.outputTokens || 0), 0);
        const totalTokens = tenantLeads.reduce((sum, lead) => sum + (lead.totalTokens || 0), 0);

        // Calculate AI cost using Gemini 2.0 Flash rates (default model)
        const aiCost = calculateTokenCost(totalInputTokens, totalOutputTokens, 'gemini-2.0-flash');

        // Get plan information and calculate revenue
        const assignedPlan = plansMap.get(tenant.assignedPlanId || 'free');
        const monthlyRevenue = assignedPlan?.pricePerMonth || 0;
        const tokenLimit = assignedPlan?.tokenLimit || 50000;

        // Calculate profit
        const profit = monthlyRevenue - aiCost;
        const profitMargin = calculateProfitMargin(monthlyRevenue, aiCost);

        // Calculate token usage percentage
        const tokenUsagePercentage = tokenLimit > 0 ? (totalTokens / tokenLimit) * 100 : 0;

        // Determine if tenant needs attention (usage > 80% or profit margin < 20%)
        const needsAttention = tokenUsagePercentage > 80 || (monthlyRevenue > 0 && profitMargin < 20);

        // Count leads with contact info vs anonymous
        const leadsWithContact = tenantLeads.filter(lead => 
          !lead.isAnonymous && (lead.customerEmail || lead.customerPhone || lead.customerName)
        ).length;

        const anonymousConversations = tenantLeads.filter(lead => lead.isAnonymous).length;

        return {
          tenantId: tenant.id,
          tenantName: tenant.name,
          planId: tenant.assignedPlanId || 'free',
          planName: assignedPlan?.name || 'Free',
          revenue: monthlyRevenue,
          aiCost: aiCost,
          profit: profit,
          profitMargin: profitMargin,
          totalTokens: totalTokens,
          tokenLimit: tokenLimit,
          tokenUsagePercentage: tokenUsagePercentage,
          needsAttention: needsAttention,
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
          totalConversations: tenantLeads.length,
          leadsWithContact: leadsWithContact,
          anonymousConversations: anonymousConversations,
        };
      })
    );

    // Calculate platform totals
    const totals = tenantAnalytics.reduce(
      (acc, tenant) => ({
        totalRevenue: acc.totalRevenue + tenant.revenue,
        totalAICost: acc.totalAICost + tenant.aiCost,
        totalProfit: acc.totalProfit + tenant.profit,
        totalTokens: acc.totalTokens + tenant.totalTokens,
        totalInputTokens: acc.totalInputTokens + tenant.inputTokens,
        totalOutputTokens: acc.totalOutputTokens + tenant.outputTokens,
        totalConversations: acc.totalConversations + tenant.totalConversations,
        totalLeads: acc.totalLeads + tenant.leadsWithContact,
      }),
      {
        totalRevenue: 0,
        totalAICost: 0,
        totalProfit: 0,
        totalTokens: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalConversations: 0,
        totalLeads: 0,
      }
    );

    // Calculate platform profit margin
    const platformProfitMargin = calculateProfitMargin(totals.totalRevenue, totals.totalAICost);

    // Calculate average profit margin (for tenants with revenue > 0)
    const tenantsWithRevenue = tenantAnalytics.filter(t => t.revenue > 0);
    const averageProfitMargin = tenantsWithRevenue.length > 0
      ? tenantsWithRevenue.reduce((sum, t) => sum + t.profitMargin, 0) / tenantsWithRevenue.length
      : 0;

    // Count tenants needing attention
    const tenantsNeedingAttention = tenantAnalytics.filter(t => t.needsAttention).length;

    return NextResponse.json({
      tenants: tenantAnalytics,
      totals: {
        ...totals,
        platformProfitMargin,
        averageProfitMargin,
        tenantsNeedingAttention,
      },
    });

  } catch (error: any) {
    console.error('[API /api/admin/analytics GET] Error:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
