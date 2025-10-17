import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getCollections } from '@/lib/mongodb';
import { assertAllowedOrigin, rateLimit } from '@/lib/security';

/**
 * Handles password reset with a valid token
 */
const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(256),
});

export async function POST(request: Request) {
  try {
    const blocked = assertAllowedOrigin(request);
    if (blocked) return blocked;
    const limited = rateLimit(request, 'reset_password', 5, 60_000);
    if (limited) return limited;

    const data = await request.json();
    const { token, newPassword } = ResetPasswordSchema.parse(data);

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

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user password and clear reset token
    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          passwordHash,
        },
        $unset: {
          resetToken: "",
          resetTokenExpiry: ""
        }
      }
    );

    console.log('[API /api/auth/reset-password] Password reset successful for user:', user.email);

    return NextResponse.json({
      message: 'Password has been reset successfully.'
    }, { status: 200 });

  } catch (error: any) {
    console.error('[API /api/auth/reset-password] Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        message: 'Invalid input. Password must be at least 8 characters long.' 
      }, { status: 400 });
    }
    
    return NextResponse.json({
      message: 'An unexpected error occurred.',
    }, { status: 500 });
  }
}
