import { NextResponse } from 'next/server';
import { getCollections } from '@/lib/mongodb';
import { getSessionFromCookies } from '@/lib/auth';

/**
 * Admin endpoint to fix avatar URLs for existing tenants
 * This updates all agents with empty avatarUrl to use /logo.png
 */
export async function POST() {
  try {
    // Require admin authentication
    const session = await getSessionFromCookies();
    if (!session || session.role !== 'superadmin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { tenants } = await getCollections();
    
    // Find all tenants with agents that have empty avatarUrl
    const tenantsToUpdate = await tenants.find({
      'agents.avatarUrl': { $in: ['', null, undefined] }
    }).toArray();

    if (tenantsToUpdate.length === 0) {
      return NextResponse.json({ 
        message: 'No tenants need avatar updates',
        updatedCount: 0 
      });
    }

    let updatedCount = 0;
    
    for (const tenant of tenantsToUpdate) {
      if (tenant.agents && Array.isArray(tenant.agents)) {
        let hasUpdates = false;
        
        // Update agents with empty avatarUrl
        const updatedAgents = tenant.agents.map((agent: any) => {
          if (!agent.avatarUrl || agent.avatarUrl.trim() === '') {
            hasUpdates = true;
            return {
              ...agent,
              avatarUrl: '/logo.png'
            };
          }
          return agent;
        });

        if (hasUpdates) {
          await tenants.updateOne(
            { id: tenant.id },
            { $set: { agents: updatedAgents } }
          );
          updatedCount++;
        }
      }
    }

    return NextResponse.json({
      message: `Successfully updated ${updatedCount} tenants with proper avatar URLs`,
      updatedCount,
      tenantsUpdated: tenantsToUpdate.map(t => ({ id: t.id, name: t.name }))
    });

  } catch (error) {
    console.error('[API /api/admin/fix-avatars] Error:', error);
    return NextResponse.json(
      { message: 'Failed to update avatar URLs' },
      { status: 500 }
    );
  }
}
