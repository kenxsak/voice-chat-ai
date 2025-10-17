import { NextResponse } from 'next/server';
import { getCollections } from '@/lib/mongodb';
import { getSessionFromCookies } from '@/lib/auth';

const DEFAULT_PLANS = [
  {
    id: 'free',
    name: 'Free',
    pricePerMonth: 0,
    description: 'For individuals or small teams just getting started. Uses default platform branding.',
    allowsCustomBranding: false,
    conversationLimit: 50,
    leadLimit: 5,
    agentLimit: 1,
    languageLimit: 1,
    contextLimit: 1,
    tokenLimit: 50000,
    isPremiumTrial: false
  },
  {
    id: 'trial',
    name: '14-Day Trial',
    pricePerMonth: 0,
    description: 'Free 14-day trial with full premium features. Automatically converts to free plan after expiration.',
    allowsCustomBranding: true,
    conversationLimit: 500,
    leadLimit: 50,
    agentLimit: 5,
    languageLimit: 10,
    contextLimit: 10,
    tokenLimit: 500000,
    isPremiumTrial: true
  },
  {
    id: 'starter',
    name: 'Starter',
    pricePerMonth: 29,
    description: 'For growing businesses needing more agents, languages, and custom branding.',
    allowsCustomBranding: true,
    conversationLimit: 500,
    leadLimit: 50,
    agentLimit: 5,
    languageLimit: 10,
    contextLimit: 10,
    tokenLimit: 500000,
    isPremiumTrial: false
  },
  {
    id: 'pro',
    name: 'Pro',
    pricePerMonth: 99,
    description: 'For large businesses requiring advanced capabilities, high limits, and priority support.',
    allowsCustomBranding: true,
    conversationLimit: 2000,
    leadLimit: 999999,
    agentLimit: 50,
    languageLimit: 50,
    contextLimit: 50,
    tokenLimit: 2000000,
    isPremiumTrial: false
  },
];

export async function GET() {
  try {
    const { plans } = await getCollections();
    const count = await plans.countDocuments({});
    if (count === 0) {
      await plans.insertMany(DEFAULT_PLANS);
    }
    const all = await plans.find({}).toArray();
    return NextResponse.json({ plans: all });
  } catch (e) {
    console.error('[API /api/plans] Error', e);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, updates } = body as { id: string; updates: Record<string, unknown> };
    if (!id || !updates) return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
    const session = await getSessionFromCookies();
    if (!session || session.role !== 'superadmin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    const sanitizedUpdates: Record<string, unknown> = { ...updates };
    if ('_id' in sanitizedUpdates) delete (sanitizedUpdates as any)._id;
    if ('id' in sanitizedUpdates) delete (sanitizedUpdates as any).id;
    const { plans } = await getCollections();
    await plans.updateOne({ id }, { $set: sanitizedUpdates }, { upsert: true });
    const updated = await plans.findOne({ id });
    return NextResponse.json({ plan: updated });
  } catch (e) {
    console.error('[API /api/plans PUT] Error', e);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id } = body as { id: string };
    if (!id) return NextResponse.json({ message: 'Plan ID is required' }, { status: 400 });
    
    const session = await getSessionFromCookies();
    if (!session || session.role !== 'superadmin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { plans, tenants } = await getCollections();
    
    // Check if any tenants are using this plan
    const tenantsUsingPlan = await tenants.countDocuments({ assignedPlanId: id });
    if (tenantsUsingPlan > 0) {
      return NextResponse.json({ 
        message: `Cannot delete plan. ${tenantsUsingPlan} tenant(s) are currently using this plan.` 
      }, { status: 400 });
    }

    // Delete the plan
    const result = await plans.deleteOne({ id });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ message: 'Plan not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Plan deleted successfully' });
  } catch (e) {
    console.error('[API /api/plans DELETE] Error', e);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}


