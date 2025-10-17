import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies, SessionPayload } from '@/lib/auth';

/**
 * Authorization middleware to ensure proper tenant data isolation
 */
export async function requireAuth(): Promise<SessionPayload | NextResponse> {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  return session;
}

/**
 * Ensure user can only access their own tenant's data
 */
export async function requireTenantAccess(requestedTenantId?: string): Promise<{ session: SessionPayload; tenantId: string } | NextResponse> {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  let tenantId: string;
  
  if (session.role === 'superadmin') {
    // Superadmins can access any tenant if specified
    if (requestedTenantId) {
      tenantId = requestedTenantId;
    } else {
      return NextResponse.json({ message: 'Tenant ID required for superadmin' }, { status: 400 });
    }
  } else {
    // Regular users can only access their own tenant
    if (!session.tenantId) {
      return NextResponse.json({ message: 'No tenant associated with user' }, { status: 403 });
    }
    
    // If a tenantId is requested, ensure it matches the user's tenant
    if (requestedTenantId && requestedTenantId !== session.tenantId) {
      return NextResponse.json({ message: 'Access denied to requested tenant' }, { status: 403 });
    }
    
    tenantId = session.tenantId;
  }

  return { session, tenantId };
}

/**
 * Validate that a user can modify a specific tenant
 */
export async function requireTenantModifyAccess(tenantId: string): Promise<SessionPayload | NextResponse> {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (session.role === 'superadmin') {
    // Superadmins can modify any tenant
    return session;
  }

  if (session.tenantId !== tenantId) {
    return NextResponse.json({ message: 'Access denied to modify this tenant' }, { status: 403 });
  }

  return session;
}

/**
 * Check if user is superadmin
 */
export async function requireSuperAdmin(): Promise<SessionPayload | NextResponse> {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (session.role !== 'superadmin') {
    return NextResponse.json({ message: 'Superadmin access required' }, { status: 403 });
  }

  return session;
}

/**
 * Get tenant filter query for database operations
 */
export function getTenantFilter(session: SessionPayload, requestedTenantId?: string): { tenantId?: string } {
  if (session.role === 'superadmin') {
    // Superadmins can filter by specific tenant or see all
    return requestedTenantId ? { tenantId: requestedTenantId } : {};
  } else {
    // Regular users can only see their own tenant's data
    return session.tenantId ? { tenantId: session.tenantId } : {};
  }
}
