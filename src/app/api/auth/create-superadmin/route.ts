import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getCollections } from '@/lib/mongodb';
import { getSessionFromCookies } from '@/lib/auth';
import { assertAllowedOrigin, rateLimit } from '@/lib/security';

/**
 * Endpoint for creating additional super admin users
 * Only accessible by existing super admins
 */
const CreateSuperAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(256),
});

export async function POST(request: Request) {
  try {
    const blocked = assertAllowedOrigin(request);
    if (blocked) return blocked;
    const limited = rateLimit(request, 'create_superadmin', 5, 60_000);
    if (limited) return limited;

    // Check if user is authenticated and is a super admin
    const session = await getSessionFromCookies();
    if (!session || session.role !== 'superadmin') {
      return NextResponse.json({ 
        message: 'Unauthorized. Only super admins can create new super admin users.' 
      }, { status: 403 });
    }

    const data = await request.json();
    const { email, password } = CreateSuperAdminSchema.parse(data);

    const { users } = await getCollections();
    const normalizedEmail = email.toLowerCase();
    
    // Check if email already exists
    const existingUser = await users.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json({ 
        message: 'A user with this email already exists.' 
      }, { status: 409 });
    }

    // Create the new super admin user
    const passwordHash = await bcrypt.hash(password, 10);
    const userResult = await users.insertOne({
      email: normalizedEmail,
      passwordHash,
      role: 'superadmin',
      tenantId: null, // Super admin doesn't belong to a specific tenant
      createdAt: new Date(),
    });

    console.log('[API /api/auth/create-superadmin] New super admin created:', normalizedEmail);

    return NextResponse.json({
      message: 'Super admin user created successfully!',
      user: { 
        email: normalizedEmail, 
        role: 'superadmin', 
        tenantId: null 
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error('[API /api/auth/create-superadmin] Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        message: 'Invalid input. Email must be valid and password must be at least 8 characters.' 
      }, { status: 400 });
    }
    
    if (error instanceof SyntaxError) {
      return NextResponse.json({ 
        message: 'Invalid request format.' 
      }, { status: 400 });
    }
    
    return NextResponse.json({
      message: 'An unexpected error occurred.',
    }, { status: 500 });
  }
}
