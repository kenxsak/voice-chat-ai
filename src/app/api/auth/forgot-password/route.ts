import { NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { getCollections } from '@/lib/mongodb';
import { assertAllowedOrigin, rateLimit } from '@/lib/security';

/**
 * Handles POST requests to /api/auth/forgot-password.
 * Generates a password reset token and stores it in the database.
 * In a real application, this would also send an email with the reset link.
 */
const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

// Simple in-memory rate limiter per IP
const ipAttempts = new Map<string, { count: number; ts: number }>();
const WINDOW_MS = 60_000; // 1 minute
const MAX_ATTEMPTS = 5; // Stricter limit for password reset

export async function POST(request: Request) {
  try {
    const blocked = assertAllowedOrigin(request);
    if (blocked) return blocked;
    const limited = rateLimit(request, 'auth_forgot', 5, 60_000);
    if (limited) return limited;

    const data = await request.json();
    const { email } = ForgotPasswordSchema.parse(data);

    const ip = (request.headers.get('x-forwarded-for') || 'local').split(',')[0].trim();
    const now = Date.now();
    const prev = ipAttempts.get(ip);
    if (!prev || now - prev.ts > WINDOW_MS) {
      ipAttempts.set(ip, { count: 1, ts: now });
    } else {
      if (prev.count >= MAX_ATTEMPTS) {
        return NextResponse.json({ 
          message: 'Too many password reset attempts. Please wait a minute.' 
        }, { status: 429 });
      }
      prev.count += 1;
    }

    console.log('[API /api/auth/forgot-password] Password reset requested for email:', email);

    const { users } = await getCollections();
    const normalizedEmail = email.toLowerCase();
    
    // Find user by email
    const user = await users.findOne({ email: normalizedEmail });
    
    // Always return success response to prevent email enumeration
    // but only generate token if user exists
    if (user) {
      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Store reset token in user document
      await users.updateOne(
        { email: normalizedEmail },
        {
          $set: {
            resetToken,
            resetTokenExpiry,
          }
        }
      );

      // In a real application, you would send an email here
      // For now, we'll log the reset link to the console for testing
      const resetUrl = `${request.headers.get('origin') || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
      console.log('[FORGOT PASSWORD] Reset link for', email, ':', resetUrl);
      
      // TODO: Send email with reset link
      // await sendPasswordResetEmail(email, resetUrl);
    }

    // Always return the same response regardless of whether user exists
    return NextResponse.json({
      message: 'If an account with that email exists, we have sent you a password reset link.',
    }, { status: 200 });

  } catch (error: any) {
    console.error('[API /api/auth/forgot-password] Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        message: 'Invalid email format.' 
      }, { status: 400 });
    }
    
    if (error instanceof SyntaxError) {
      return NextResponse.json({ 
        message: 'Invalid request format.' 
      }, { status: 400 });
    }
    
    return NextResponse.json({
      message: 'An unexpected error occurred. Please try again.',
    }, { status: 500 });
  }
}
