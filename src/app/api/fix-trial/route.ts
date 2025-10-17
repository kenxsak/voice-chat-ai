import { NextResponse } from 'next/server';
import { getCollections } from '@/lib/mongodb';
import { getSessionFromCookies } from '@/lib/auth';

/**
 * Temporary endpoint to fix existing users who got assigned to 'free' plan
 * instead of the trial plan during registration
 */
export async function POST(request: Request) {
  try {
    // Get current user session
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const { tenants, plans } = await getCollections();
    
    // Find the user's tenant
    const tenant = await tenants.findOne({ 
      $or: [
        { contactEmail: session.email },
        { id: session.tenantId }
      ]
    });

    if (!tenant) {
      return NextResponse.json({ message: 'Tenant not found' }, { status: 404 });
    }

    // Check if user is currently on free plan and recently registered
    if (tenant.assignedPlanId !== 'free') {
      return NextResponse.json({ 
        message: 'User is not on free plan',
        currentPlan: tenant.assignedPlanId 
      }, { status: 400 });
    }

    // Check if registration was recent (within last 24 hours)
    const registrationDate = new Date(tenant.subscriptionStartDate);
    const now = new Date();
    const hoursSinceRegistration = (now.getTime() - registrationDate.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceRegistration > 24) {
      return NextResponse.json({ 
        message: 'Registration was more than 24 hours ago. Trial fix not available.',
        hoursSinceRegistration 
      }, { status: 400 });
    }

    // Ensure trial plan exists
    let trialPlan = await plans.findOne({ id: 'trial' });
    if (!trialPlan) {
      console.log('[Fix Trial] Creating trial plan...');
      await plans.insertOne({
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
        isPremiumTrial: true
      });
      trialPlan = await plans.findOne({ id: 'trial' });
    }

    // Update tenant to trial plan
    await tenants.updateOne(
      { id: tenant.id },
      { 
        $set: { 
          assignedPlanId: 'trial',
          subscriptionStartDate: new Date() // Reset trial start date
        }
      }
    );

    console.log(`[Fix Trial] Updated tenant ${tenant.id} from free to trial plan`);

    return NextResponse.json({
      success: true,
      message: 'Successfully upgraded to 14-day trial plan',
      tenantId: tenant.id,
      previousPlan: 'free',
      newPlan: 'trial',
      trialStartDate: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Fix Trial] Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const { tenants, plans } = await getCollections();
    
    // Get user's current tenant info
    const tenant = await tenants.findOne({ 
      $or: [
        { contactEmail: session.email },
        { id: session.tenantId }
      ]
    });

    if (!tenant) {
      return NextResponse.json({ message: 'Tenant not found' }, { status: 404 });
    }

    const currentPlan = await plans.findOne({ id: tenant.assignedPlanId });
    const trialPlan = await plans.findOne({ id: 'trial' });

    const registrationDate = new Date(tenant.subscriptionStartDate);
    const hoursSinceRegistration = (new Date().getTime() - registrationDate.getTime()) / (1000 * 60 * 60);

    return NextResponse.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        currentPlan: tenant.assignedPlanId,
        registrationDate: registrationDate.toISOString(),
        hoursSinceRegistration: Math.round(hoursSinceRegistration * 100) / 100
      },
      plans: {
        current: currentPlan,
        trial: trialPlan
      },
      canFixTrial: tenant.assignedPlanId === 'free' && hoursSinceRegistration <= 24 && trialPlan
    });

  } catch (error) {
    console.error('[Fix Trial GET] Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}