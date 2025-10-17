import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCollections } from '@/lib/mongodb';
import { assertAllowedOrigin, rateLimit } from '@/lib/security';

/**
 * Validates a password reset token
 */
const ValidateTokenSchema = z.object({
  token: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const blocked = assertAllowedOrigin(request);
    if (blocked) return blocked;
    const limited = rateLimit(request, 'validate_reset_token', 10, 60_000);
    if (limited) return limited;

    const data = await request.json();
    const { token } = ValidateTokenSchema.parse(data);

    const { users } = await getCollections();
    
    // Find user with this reset token
    const user = await users.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() } // Token must not be expired
    });

    if (!user) {
      return NextResponse.json({
        message: 'Invalid or expired reset token.'
      }, { status: 400 });
    }

    return NextResponse.json({
      message: 'Token is valid.'
    }, { status: 200 });

  } catch (error: any) {
    console.error('[API /api/auth/validate-reset-token] Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        message: 'Invalid token format.' 
      }, { status: 400 });
    }
    
    return NextResponse.json({
      message: 'An unexpected error occurred.',
    }, { status: 500 });
  }
}
