import { getCollections } from './mongodb';

export interface TokenLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  message?: string;
  percentUsed?: number;
  planName?: string;
  resetOccurred?: boolean;
}

export async function checkTokenLimit(tenantId: string): Promise<TokenLimitResult> {
  try {
    const { tenants, plans } = await getCollections();
    
    const tenant = await tenants.findOne({ id: tenantId });
    if (!tenant) {
      return {
        allowed: false,
        remaining: 0,
        limit: 0,
        message: 'Tenant not found'
      };
    }

    const plan = await plans.findOne({ id: tenant.assignedPlanId || 'free' });
    if (!plan) {
      return {
        allowed: false,
        remaining: 0,
        limit: 0,
        message: 'Plan not found'
      };
    }

    const tokenLimit = plan.tokenLimit || 50000;
    let tokenUsage = tenant.tokenUsage || 0;
    let resetOccurred = false;

    const lastReset = tenant.usageLastReset ? new Date(tenant.usageLastReset) : new Date();
    const now = new Date();
    const daysSinceReset = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceReset >= 30) {
      tokenUsage = 0;
      resetOccurred = true;
      await tenants.updateOne(
        { id: tenantId },
        { 
          $set: { 
            tokenUsage: 0,
            usageLastReset: now.toISOString()
          } 
        }
      );
    }

    const remaining = Math.max(0, tokenLimit - tokenUsage);
    const percentUsed = tokenLimit > 0 ? (tokenUsage / tokenLimit) * 100 : 0;

    if (percentUsed >= 100) {
      const upgradePlans = await plans.find({
        tokenLimit: { $gt: tokenLimit },
        isPremiumTrial: { $ne: true }
      }).sort({ tokenLimit: 1 }).limit(2).toArray();

      const upgradeOptions = upgradePlans.map(p => 
        `${p.name} plan (${(p.tokenLimit / 1000).toLocaleString()}K tokens/month - $${p.pricePerMonth}/month)`
      ).join(' or ');

      return {
        allowed: false,
        remaining: 0,
        limit: tokenLimit,
        percentUsed: Math.round(percentUsed),
        planName: plan.name,
        message: `You've reached your monthly token limit of ${(tokenLimit / 1000).toLocaleString()}K tokens on the ${plan.name} plan. To continue chatting, please upgrade to ${upgradeOptions || 'a higher plan'}. Your limit will reset in ${30 - daysSinceReset} days.`
      };
    }

    if (percentUsed >= 80) {
      const remainingDays = 30 - daysSinceReset;
      return {
        allowed: true,
        remaining,
        limit: tokenLimit,
        percentUsed: Math.round(percentUsed),
        planName: plan.name,
        resetOccurred,
        message: `Warning: You've used ${Math.round(percentUsed)}% of your monthly token limit (${(tokenUsage / 1000).toFixed(1)}K / ${(tokenLimit / 1000).toLocaleString()}K tokens). Your limit will reset in ${remainingDays} days. Consider upgrading your plan to avoid interruptions.`
      };
    }

    return {
      allowed: true,
      remaining,
      limit: tokenLimit,
      percentUsed: Math.round(percentUsed),
      planName: plan.name,
      resetOccurred
    };

  } catch (error) {
    console.error('[Token Enforcement] Error checking token limit:', error);
    return {
      allowed: true,
      remaining: 0,
      limit: 0,
      message: 'Error checking token limit, allowing request'
    };
  }
}

export async function incrementTokenUsage(tenantId: string, tokensUsed: number): Promise<void> {
  try {
    const { tenants } = await getCollections();
    await tenants.updateOne(
      { id: tenantId },
      { $inc: { tokenUsage: tokensUsed } }
    );
  } catch (error) {
    console.error('[Token Enforcement] Error incrementing token usage:', error);
  }
}
