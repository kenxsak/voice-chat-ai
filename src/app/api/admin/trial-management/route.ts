import { NextResponse } from 'next/server';
import { getCollections } from '@/lib/mongodb';
import { getSessionFromCookies } from '@/lib/auth';
import { 
  checkTrialStatus, 
  resetTenantFeaturesToPlan, 
  SuperAdminTrialActions,
  type TenantData,
  type PlanData
} from '@/lib/trial-management';

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session || session.role !== 'superadmin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { action, tenantId, ...params } = body;

    if (!action || !tenantId) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const { tenants, plans } = await getCollections();
    
    // Get tenant data
    const tenant = await tenants.findOne({ id: tenantId }) as unknown as TenantData;
    if (!tenant) {
      return NextResponse.json({ message: 'Tenant not found' }, { status: 404 });
    }

    // Get plans data
    const allPlans = await plans.find({}).toArray();
    const freePlan = allPlans.find(p => p.id === 'free');
    const currentPlan = allPlans.find(p => p.id === tenant.assignedPlanId);

    if (!freePlan || !currentPlan) {
      return NextResponse.json({ message: 'Plan configuration error' }, { status: 500 });
    }

    let updates: Partial<TenantData> = {};

    switch (action) {
      case 'extend_trial':
        const { days } = params;
        if (!days || days < 1) {
          return NextResponse.json({ message: 'Invalid days parameter' }, { status: 400 });
        }
        updates = SuperAdminTrialActions.extendTrial(tenant as TenantData, days);
        break;

      case 'set_trial_override':
        const { override } = params;
        updates = SuperAdminTrialActions.setTrialOverride(tenant as TenantData, Boolean(override));
        break;

      case 'expire_trial':
        updates = SuperAdminTrialActions.expireTrial(tenant as TenantData);
        // Also reset features to free plan
        const featureResets = resetTenantFeaturesToPlan(tenant as TenantData, freePlan as unknown as PlanData);
        updates = { ...updates, ...featureResets };
        break;

      case 'reset_trial':
        const { trialDays = 14 } = params;
        updates = SuperAdminTrialActions.resetTrial(tenant as TenantData, trialDays);
        break;

      case 'reset_features':
        const { targetPlanId = 'free' } = params;
        const targetPlan = allPlans.find(p => p.id === targetPlanId) || freePlan;
        updates = resetTenantFeaturesToPlan(tenant as TenantData, targetPlan as unknown as PlanData);
        break;

      case 'force_plan_change':
        const { newPlanId } = params;
        const newPlan = allPlans.find(p => p.id === newPlanId);
        if (!newPlan) {
          return NextResponse.json({ message: 'Invalid plan ID' }, { status: 400 });
        }
        updates = {
          assignedPlanId: newPlanId,
          subscriptionStartDate: new Date(),
          conversationCount: 0,
          leadCount: 0,
          usageLastReset: new Date().toISOString(),
          status: 'Active',
          ...resetTenantFeaturesToPlan(tenant as TenantData, newPlan as unknown as PlanData)
        };
        break;

      case 'check_trial_status':
        const trialStatus = checkTrialStatus(tenant as TenantData, currentPlan as unknown as PlanData);
        return NextResponse.json({ 
          tenantId,
          trialStatus,
          currentPlan: currentPlan.id,
          tenant: {
            id: tenant.id,
            name: tenant.name,
            assignedPlanId: tenant.assignedPlanId,
            subscriptionStartDate: tenant.subscriptionStartDate,
            trialOverride: tenant.trialOverride,
            trialExtendedUntil: tenant.trialExtendedUntil
          }
        });

      default:
        return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }

    // Apply updates to database
    if (Object.keys(updates).length > 0) {
      await tenants.updateOne(
        { id: tenantId },
        { $set: updates }
      );
    }

    // Get updated tenant data for response
    const updatedTenant = await tenants.findOne({ id: tenantId }) as unknown as TenantData;
    const updatedPlan = allPlans.find(p => p.id === updatedTenant.assignedPlanId);
    const newTrialStatus = checkTrialStatus(updatedTenant as TenantData, updatedPlan as unknown as PlanData);

    return NextResponse.json({
      success: true,
      action,
      tenantId,
      updates,
      trialStatus: newTrialStatus,
      tenant: {
        id: updatedTenant.id,
        name: updatedTenant.name,
        assignedPlanId: updatedTenant.assignedPlanId,
        subscriptionStartDate: updatedTenant.subscriptionStartDate,
        trialOverride: updatedTenant.trialOverride,
        trialExtendedUntil: updatedTenant.trialExtendedUntil,
        supportedLanguages: updatedTenant.supportedLanguages,
        agents: updatedTenant.agents
      }
    });

  } catch (error) {
    console.error('[API /api/admin/trial-management] Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session || session.role !== 'superadmin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const url = new URL(request.url);
    const tenantId = url.searchParams.get('tenantId');

    const { tenants, plans } = await getCollections();
    
    if (tenantId) {
      // Get specific tenant trial status
      const tenant = await tenants.findOne({ id: tenantId }) as unknown as TenantData;
      if (!tenant) {
        return NextResponse.json({ message: 'Tenant not found' }, { status: 404 });
      }

      const allPlans = await plans.find({}).toArray();
      const currentPlan = allPlans.find(p => p.id === tenant.assignedPlanId);
      const trialStatus = checkTrialStatus(tenant as TenantData, currentPlan as unknown as PlanData);

      return NextResponse.json({
        tenantId,
        trialStatus,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          assignedPlanId: tenant.assignedPlanId,
          subscriptionStartDate: tenant.subscriptionStartDate,
          trialOverride: tenant.trialOverride,
          trialExtendedUntil: tenant.trialExtendedUntil
        }
      });
    } else {
      // Get all tenants with trial status
      const allTenants = await tenants.find({}).toArray();
      const allPlans = await plans.find({}).toArray();

      const tenantsWithTrialStatus = allTenants.map(tenant => {
        const currentPlan = allPlans.find(p => p.id === tenant.assignedPlanId);
        const trialStatus = checkTrialStatus(tenant as unknown as TenantData, currentPlan as unknown as PlanData);

        return {
          tenantId: tenant.id,
          name: tenant.name,
          assignedPlanId: tenant.assignedPlanId,
          trialStatus,
          trialOverride: tenant.trialOverride,
          trialExtendedUntil: tenant.trialExtendedUntil
        };
      });

      return NextResponse.json({ tenants: tenantsWithTrialStatus });
    }

  } catch (error) {
    console.error('[API /api/admin/trial-management GET] Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
