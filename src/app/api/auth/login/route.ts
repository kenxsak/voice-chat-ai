
// src/app/api/auth/login/route.ts
// Next.js App Router uses 'route.ts' (or .js) for API endpoints.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getCollections } from '@/lib/mongodb';
import { signSession, setAuthCookie } from '@/lib/auth';
import { assertAllowedOrigin, rateLimit } from '@/lib/security';

/**
 * Handles POST requests to /api/auth/login.
 * This function simulates user login. In a real application,
 * it would involve:
 * 1. Validating input data (email, password).
 * 2. Finding the user by email in the database.
 * 3. Comparing the provided password with the stored hashed password (e.g., using bcrypt.compare).
 * 4. If successful, generating a session token (e.g., JWT) and returning user details.
 * 5. Returning appropriate error responses for invalid credentials or other issues.
 */
const LoginSchema = z.object({
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
    const limited = rateLimit(request, 'auth_login', 40, 60_000);
    if (limited) return limited;
    const data = await request.json();
    const { email, password } = LoginSchema.parse(data);

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

    console.log('[API /api/auth/login] Received login attempt for email:', email);

    // --- 1. Validate Input Data (Conceptual) ---
    // Basic validation is enforced by schema above

    // --- 2. Find User by Email & 3. Compare Password (MongoDB) ---
    const { users, tenants } = await getCollections();
    let userFromDb = await users.findOne<{ _id: any; email: string; passwordHash: string; role: string; tenantId?: string | null }>(
      { email: email.toLowerCase() }
    );
    if (!userFromDb) {
      return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, userFromDb.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
    }

    // Optional: ensure tenant exists if user has tenantId
    let tenantId: string | null | undefined = userFromDb.tenantId ?? null;
    if (tenantId) {
      const tenant = await tenants.findOne({ id: tenantId });
      if (!tenant) tenantId = null;
    }

    const token = signSession({
      userId: String(userFromDb._id),
      email: userFromDb.email,
      role: (userFromDb.role as any) || 'admin',
      tenantId: tenantId ?? null,
    });
    await setAuthCookie(token);

    return NextResponse.json(
      {
        message: 'Login successful!',
        user: { email: userFromDb.email, role: userFromDb.role, tenantId: tenantId ?? null },
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('[API /api/auth/login] Error during login:', error);
    if (error instanceof SyntaxError) { // Example: Malformed JSON from client
        return NextResponse.json({ message: 'Invalid request format.' }, { status: 400 });
    }
    return NextResponse.json(
      { message: 'An unexpected error occurred on the server.' },
      { status: 500 } // Internal Server Error
    );
  }
}
