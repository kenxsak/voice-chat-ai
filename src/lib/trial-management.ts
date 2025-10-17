import { differenceInDays, addDays } from 'date-fns';

export interface TrialStatus {
  isOnTrial: boolean;
  isExpired: boolean;
  daysRemaining: number;
  trialEndDate: Date | null;
  shouldDowngrade: boolean;
}

export interface TenantData {
  id: string;
  assignedPlanId: string;
  subscriptionStartDate: Date | string;
  supportedLanguages?: Array<{ code: string; name: string }>;
  agents?: Array<any>;
  status: string;
  trialOverride?: boolean; // Super admin override flag
  trialExtendedUntil?: Date | string; // Super admin extended trial date
  conversationCount?: number;
  leadCount?: number;
  tokenUsage?: number;
  usageLastReset?: string;
  name?: string;
}

export interface PlanData {
  id: string;
  isPremiumTrial?: boolean;
  languageLimit: number;
  agentLimit: number;
  conversationLimit: number;
  leadLimit: number;
  allowsCustomBranding: boolean;
}

/**
 * Check if a tenant's trial has expired and should be downgraded
 */
export function checkTrialStatus(
  tenant: TenantData, 
  plan: PlanData, 
  defaultTrialDays: number = 14
): TrialStatus {
  const result: TrialStatus = {
    isOnTrial: false,
    isExpired: false,
    daysRemaining: 0,
    trialEndDate: null,
    shouldDowngrade: false
  };

  // Check if tenant has super admin trial override
  if (tenant.trialOverride) {
    result.isOnTrial = true;
    result.isExpired = false;
    result.daysRemaining = 999; // Unlimited
    return result;
  }

  // Check if tenant has extended trial date
  if (tenant.trialExtendedUntil) {
    const extendedDate = new Date(tenant.trialExtendedUntil);
    const now = new Date();
    
    if (extendedDate > now) {
      result.isOnTrial = true;
      result.isExpired = false;
      result.daysRemaining = differenceInDays(extendedDate, now);
      result.trialEndDate = extendedDate;
      return result;
    }
  }

  // Check if plan is a trial plan
  if (!plan?.isPremiumTrial) {
    return result; // Not on trial
  }

  const startDate = new Date(tenant.subscriptionStartDate);
  if (isNaN(startDate.getTime())) {
    return result; // Invalid start date
  }

  const trialEndDate = addDays(startDate, defaultTrialDays);
  const now = new Date();
  const daysRemaining = differenceInDays(trialEndDate, now);

  result.isOnTrial = true;
  result.trialEndDate = trialEndDate;
  result.daysRemaining = Math.max(0, daysRemaining);
  result.isExpired = daysRemaining < 0;
  result.shouldDowngrade = result.isExpired && tenant.assignedPlanId !== 'free';

  return result;
}

/**
 * Get the appropriate plan limits based on trial status
 */
export function getEffectivePlanLimits(
  tenant: TenantData,
  currentPlan: PlanData,
  freePlan: PlanData,
  trialStatus: TrialStatus
): PlanData {
  if (trialStatus.shouldDowngrade || (trialStatus.isExpired && !trialStatus.isOnTrial)) {
    return freePlan;
  }
  return currentPlan;
}

/**
 * Reset tenant features to match plan limits
 */
export function resetTenantFeaturesToPlan(
  tenant: TenantData,
  targetPlan: PlanData
): Partial<TenantData> {
  const updates: Partial<TenantData> = {};

  // Reset language selection if exceeds limit
  if (tenant.supportedLanguages && tenant.supportedLanguages.length > targetPlan.languageLimit) {
    // Keep English (US) and trim others to fit limit
    const englishLang = tenant.supportedLanguages.find(lang => lang.code === 'en-US');
    const otherLangs = tenant.supportedLanguages.filter(lang => lang.code !== 'en-US');
    
    const allowedOtherLangs = Math.max(0, targetPlan.languageLimit - 1);
    const newLanguages = englishLang ? [englishLang] : [];
    
    if (allowedOtherLangs > 0) {
      newLanguages.push(...otherLangs.slice(0, allowedOtherLangs));
    }
    
    updates.supportedLanguages = newLanguages;
  }

  // Reset agents if exceeds limit
  if (tenant.agents && tenant.agents.length > targetPlan.agentLimit) {
    updates.agents = tenant.agents.slice(0, targetPlan.agentLimit);
  }

  return updates;
}

/**
 * Generate trial expiration warning message
 */
export function getTrialWarningMessage(trialStatus: TrialStatus): string | null {
  if (!trialStatus.isOnTrial || trialStatus.isExpired) {
    return null;
  }

  if (trialStatus.daysRemaining <= 1) {
    return `Your trial expires today! Please upgrade to continue using premium features.`;
  } else if (trialStatus.daysRemaining <= 3) {
    return `Your trial expires in ${trialStatus.daysRemaining} days. Please upgrade to continue using premium features.`;
  } else if (trialStatus.daysRemaining <= 7) {
    return `Your trial expires in ${trialStatus.daysRemaining} days.`;
  }

  return null;
}

/**
 * Super admin functions for trial management
 */
export const SuperAdminTrialActions = {
  /**
   * Extend trial for a specific number of days
   */
  extendTrial(tenant: TenantData, additionalDays: number): Partial<TenantData> {
    const currentEnd = tenant.trialExtendedUntil 
      ? new Date(tenant.trialExtendedUntil)
      : addDays(new Date(tenant.subscriptionStartDate), 14); // Default trial length
    
    const newEndDate = addDays(currentEnd, additionalDays);
    
    return {
      trialExtendedUntil: newEndDate,
      status: 'Active'
    };
  },

  /**
   * Set permanent trial override (unlimited trial)
   */
  setTrialOverride(tenant: TenantData, override: boolean): Partial<TenantData> {
    return {
      trialOverride: override,
      status: override ? 'Active' : tenant.status
    };
  },

  /**
   * Force expire trial immediately
   */
  expireTrial(tenant: TenantData): Partial<TenantData> {
    return {
      trialExtendedUntil: new Date(Date.now() - 86400000), // Yesterday
      trialOverride: false,
      assignedPlanId: 'free',
      status: 'Active'
    };
  },

  /**
   * Reset all trial settings
   */
  resetTrial(tenant: TenantData, newTrialDays: number = 14): Partial<TenantData> {
    return {
      subscriptionStartDate: new Date(),
      trialExtendedUntil: undefined,
      trialOverride: false,
      assignedPlanId: 'trial', // Use the correct trial plan ID
      status: 'Active'
    };
  }
};
