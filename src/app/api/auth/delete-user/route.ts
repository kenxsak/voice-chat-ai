import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { getCollections } from '@/lib/mongodb';
import { getSessionFromCookies } from '@/lib/auth';
import { assertAllowedOrigin, rateLimit } from '@/lib/security';

/**
 * Endpoint for deleting users by super admin
 * Only accessible by existing super admins
 * Note: Super admins cannot delete themselves
 */
const DeleteUserSchema = z.object({
  userId: z.string().min(1),
});

export async function DELETE(request: Request) {
  try {
    const blocked = assertAllowedOrigin(request);
    if (blocked) return blocked;
    const limited = rateLimit(request, 'delete_user', 10, 60_000);
    if (limited) return limited;

    // Check if user is authenticated and is a super admin
    const session = await getSessionFromCookies();
    if (!session || session.role !== 'superadmin') {
      return NextResponse.json({ 
        message: 'Unauthorized. Only super admins can delete users.' 
      }, { status: 403 });
    }

    const data = await request.json();
    const { userId } = DeleteUserSchema.parse(data);

    const { users, tenants } = await getCollections();
    
    // Find the user to be deleted
    const userToDelete = await users.findOne({ _id: new ObjectId(userId) });
    if (!userToDelete) {
      return NextResponse.json({ 
        message: 'User not found.' 
      }, { status: 404 });
    }

    // Prevent super admin from deleting themselves
    if (userToDelete._id.toString() === session.userId) {
      return NextResponse.json({ 
        message: 'You cannot delete your own account.' 
      }, { status: 400 });
    }

    // If the user is an admin with a tenant, delete or reassign the tenant
    let tenantAction = 'none';
    if (userToDelete.role === 'admin' && userToDelete.tenantId) {
      const tenant = await tenants.findOne({ id: userToDelete.tenantId });
      if (tenant) {
        // For now, we'll delete the tenant. In the future, you might want to reassign it
        await tenants.deleteOne({ id: userToDelete.tenantId });
        tenantAction = 'deleted';
      }
    }

    // Delete the user
    const deleteResult = await users.deleteOne({ _id: userToDelete._id });
    
    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ 
        message: 'Failed to delete user.' 
      }, { status: 500 });
    }

    console.log('[API /api/auth/delete-user] User deleted:', {
      deletedUserId: userId,
      deletedUserEmail: userToDelete.email,
      deletedUserRole: userToDelete.role,
      tenantAction,
      deletedBy: session.email
    });

    return NextResponse.json({
      message: 'User deleted successfully.',
      deletedUser: {
        id: userId,
        email: userToDelete.email,
        role: userToDelete.role,
        tenantId: userToDelete.tenantId
      },
      tenantAction
    }, { status: 200 });

  } catch (error: any) {
    console.error('[API /api/auth/delete-user] Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        message: 'Invalid input. User ID is required.' 
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

/**
 * GET endpoint to retrieve all users (for super admin management)
 */
export async function GET(request: Request) {
  try {
    const blocked = assertAllowedOrigin(request);
    if (blocked) return blocked;
    const limited = rateLimit(request, 'get_users', 20, 60_000);
    if (limited) return limited;

    // Check if user is authenticated and is a super admin
    const session = await getSessionFromCookies();
    if (!session || session.role !== 'superadmin') {
      return NextResponse.json({ 
        message: 'Unauthorized. Only super admins can view users.' 
      }, { status: 403 });
    }

    const { users, tenants } = await getCollections();
    
    // Get all users and their associated tenant information
    const allUsers = await users.find({}).toArray();
    
    const usersWithTenantInfo = await Promise.all(
      allUsers.map(async (user) => {
        let tenantInfo = null;
        if (user.tenantId) {
          const tenant = await tenants.findOne({ id: user.tenantId });
          if (tenant) {
            tenantInfo = {
              id: tenant.id,
              name: tenant.name,
              status: tenant.status
            };
          }
        }
        
        return {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
          tenant: tenantInfo,
          createdAt: user.createdAt
        };
      })
    );

    return NextResponse.json({
      users: usersWithTenantInfo
    }, { status: 200 });

  } catch (error: any) {
    console.error('[API /api/auth/delete-user GET] Error:', error);
    return NextResponse.json({
      message: 'An unexpected error occurred.',
    }, { status: 500 });
  }
}