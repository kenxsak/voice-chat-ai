
// src/app/api/auth/register/route.ts
// Next.js App Router uses 'route.ts' (or .js) for API endpoints.
// Functions like GET, POST, PUT, DELETE in this file handle respective HTTP methods.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getCollections } from '@/lib/mongodb';
import { assertAllowedOrigin, rateLimit } from '@/lib/security';

/**
 * Handles POST requests to /api/auth/register.
 * This function simulates user registration. In a real application,
 * it would involve:
 * 1. Validating input data (companyName, email, password format & strength).
 * 2. Checking if the email already exists in the database.
 * 3. Securely hashing the password (e.g., using bcrypt).
 * 4. Creating a new tenant record in the 'Tenants' database table.
 * 5. Creating a new user record in the 'Users' database table, linking to the tenant.
 * 6. Returning a success or error response.
 */
const RegisterSchema = z.object({
  companyName: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(256),
});

// Simple in-memory rate limiter per IP
const ipAttempts = new Map<string, { count: number; ts: number }>();
const WINDOW_MS = 60_000; // 1 minute
const MAX_ATTEMPTS = 20;

export async function POST(request: Request) {
  try {
    const blocked = assertAllowedOrigin(request);
    if (blocked) return blocked;
    const limited = rateLimit(request, 'auth_register', 20, 60_000);
    if (limited) return limited;
    const data = await request.json();
    const {companyName, email, password} = RegisterSchema.parse(data);

    const ip = (request.headers.get('x-forwarded-for') || 'local').split(',')[0].trim();
    const now = Date.now();
    const prev = ipAttempts.get(ip);
    if (!prev || now - prev.ts > WINDOW_MS) {
      ipAttempts.set(ip, { count: 1, ts: now });
    } else {
      if (prev.count >= MAX_ATTEMPTS) {
        return NextResponse.json({ message: 'Too many attempts. Please wait a minute.' }, { status: 429 });
      }
      prev.count += 1;
    }

    // Log received data to the SERVER console (not browser console)
    // IMPORTANT: In a real app, NEVER log plain passwords. Log its presence or length.
    console.log('[API /api/auth/register] Received data:', {
      companyName,
      email,
      passwordLength: password?.length,
    });

    // --- 1. Validate Input Data (Conceptual) ---
    // Validation enforced by schema above
    // Add more validation: email format, password complexity, companyName length, etc.

    // --- 2. Check if Email Exists (MongoDB) ---
    const { users, tenants, plans } = await getCollections();
    
    // Ensure trial plan exists (always check for trial plan specifically)
    const existingTrialPlan = await plans.findOne({ id: 'trial' });
    if (!existingTrialPlan) {
      console.log('[Registration] Trial plan not found, creating it...');
      // Create trial plan if it doesn't exist
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
      console.log('[Registration] Trial plan created successfully');
    }
    
    // Ensure free plan exists as fallback
    const existingFreePlan = await plans.findOne({ id: 'free' });
    if (!existingFreePlan) {
      console.log('[Registration] Free plan not found, creating it...');
      await plans.insertOne({
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
      });
      console.log('[Registration] Free plan created successfully');
    }
    
    const normalizedEmail = email.toLowerCase();
    const existingUser = await users.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json({ message: 'Email already in use.' }, { status: 409 });
    }

    // --- 3. Hash Password ---
    const passwordHash = await bcrypt.hash(password, 10);

    // --- 4. Create Tenant ---
    const trialPlan = await plans.findOne({ id: 'trial' }); // Use trial plan for new registrations
    const freePlan = await plans.findOne({ id: 'free' }); // Fallback to free if trial doesn't exist
    const selectedPlan = trialPlan || freePlan;
    
    console.log('[Registration] Selected plan for new user:', {
      selectedPlanId: selectedPlan?.id,
      selectedPlanName: selectedPlan?.name,
      isPremiumTrial: selectedPlan?.isPremiumTrial
    });
    
    const tenantId = `tenant_${Date.now()}`;
    await tenants.insertOne({
      id: tenantId,
      name: companyName,
      companyLogoUrl: '',
      brandColor: '#2795f2',
      companyDetails: '',
      country: '',
      contactEmail: normalizedEmail,
      contactPhone: '',
      contactWhatsapp: '',
      billingAddress: '',
      leadWebhookUrl: '',
      launcherButtonText: 'Help?',
      assignedPlanId: selectedPlan?.id || 'free',
      supportedLanguages: [{ code: 'en-US', name: 'English' }],
      agents: [],
      trainingContexts: [],
      status: 'Active',
      subscriptionStartDate: new Date(),
      conversationCount: 0,
      leadCount: 0,
      tokenUsage: 0,
      usageLastReset: new Date().toISOString(),
    });
    
    console.log('[Registration] Created tenant with plan:', selectedPlan?.id);

    // --- 5. Create User ---
    await users.insertOne({
      email: normalizedEmail,
      passwordHash,
      role: 'admin',
      tenantId,
      createdAt: new Date(),
    });

    return NextResponse.json(
      {message: 'User registered successfully'},
      {status: 201}
    );

  } catch (error: any) {
    console.error('[API /api/auth/register] Error during registration:', error);
    // Determine if it's a client error (e.g., bad JSON) or server error
    if (error instanceof SyntaxError) { // Example: Malformed JSON from client
        return NextResponse.json({ message: 'Invalid request format.' }, { status: 400 });
    }
    return NextResponse.json(
      {message: 'An unexpected error occurred on the server.'},
      {status: 500} // Internal Server Error
    );
  }
}
