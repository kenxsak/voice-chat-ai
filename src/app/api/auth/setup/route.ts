import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getCollections } from '@/lib/mongodb';
import { signSession, setAuthCookie } from '@/lib/auth';
import { assertAllowedOrigin, rateLimit } from '@/lib/security';

/**
 * Initial setup endpoint for creating the first super admin user
 * This endpoint is only available when no users exist in the database
 */
const SetupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(256),
  companyName: z.string().min(1).max(100),
});

export async function POST(request: Request) {
  try {
    const blocked = assertAllowedOrigin(request);
    if (blocked) return blocked;
    const limited = rateLimit(request, 'auth_setup', 5, 60_000); // Very limited for security
    if (limited) return limited;

    const data = await request.json();
    const { email, password, companyName } = SetupSchema.parse(data);

    const { users, tenants, plans } = await getCollections();
    
    // Check if any users already exist
    const existingUserCount = await users.countDocuments({});
    if (existingUserCount > 0) {
      return NextResponse.json({ 
        message: 'Setup has already been completed. Please use the login page.' 
      }, { status: 403 });
    }

    // Ensure default plans exist
    const existingPlans = await plans.find({}).toArray();
    if (existingPlans.length === 0) {
      await plans.insertMany([
        {
          id: 'free',
          name: 'Free Forever',
          pricePerMonth: 0,
          description: 'For individuals or small teams just getting started. Uses default platform branding.',
          allowsCustomBranding: false,
          conversationLimit: 50,
          leadLimit: 5,
          agentLimit: 1,
          languageLimit: 1,
          contextLimit: 1,
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
          isPremiumTrial: true
        },
        {
          id: 'premium',
          name: 'Premium',
          pricePerMonth: 99,
          description: 'For growing businesses needing more features and capabilities.',
          allowsCustomBranding: true,
          conversationLimit: 2000,
          leadLimit: 99999,
          agentLimit: 999,
          languageLimit: 999,
          contextLimit: 999,
          isPremiumTrial: false
        }
      ]);
    }

    // Create the super admin tenant
    const tenantId = `tenant_${Date.now()}`;
    await tenants.insertOne({
      id: tenantId,
      name: companyName,
      companyLogoUrl: '',
      brandColor: '#2795f2',
      companyDetails: '',
      country: '',
      contactEmail: email.toLowerCase(),
      contactPhone: '',
      contactWhatsapp: '',
      billingAddress: '',
      leadWebhookUrl: '',
      launcherButtonText: 'Help?',
      assignedPlanId: 'trial', // Start with 14-day trial
      supportedLanguages: [{ code: 'en-US', name: 'English' }],
      agents: [
        { 
          id: 'agent_default', 
          name: 'Support Bot', 
          description: 'Helpful assistant', 
          avatarUrl: '/logo.png', 
          avatarHint: 'bot avatar', 
          greeting: "Hello! How can I help you today?", 
          websiteUrl: '', 
          voice: 'female-us' 
        },
      ],
      trainingContexts: [],
      status: 'Active',
      subscriptionStartDate: new Date(),
      conversationCount: 0,
      leadCount: 0,
      tokenUsage: 0,
      usageLastReset: new Date().toISOString(),
    });

    // Create the super admin user
    const passwordHash = await bcrypt.hash(password, 10);
    const userResult = await users.insertOne({
      email: email.toLowerCase(),
      passwordHash,
      role: 'superadmin',
      tenantId: null, // Super admin doesn't belong to a specific tenant
      createdAt: new Date(),
    });

    // Sign in the new super admin
    const token = signSession({
      userId: String(userResult.insertedId),
      email: email.toLowerCase(),
      role: 'superadmin',
      tenantId: null,
    });
    await setAuthCookie(token);

    return NextResponse.json({
      message: 'Setup completed successfully! You are now logged in as super admin.',
      user: { 
        email: email.toLowerCase(), 
        role: 'superadmin', 
        tenantId: null 
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error('[API /api/auth/setup] Error during setup:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ message: 'Invalid request format.' }, { status: 400 });
    }
    return NextResponse.json(
      { message: 'An unexpected error occurred during setup.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { users } = await getCollections();
    const existingUserCount = await users.countDocuments({});

    // Allow bypassing setup in development with environment variable
    const bypassSetup = process.env.BYPASS_SETUP === 'true';

    return NextResponse.json({
      setupRequired: existingUserCount === 0 && !bypassSetup
    });
  } catch (error) {
    console.error('[API /api/auth/setup GET] Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
