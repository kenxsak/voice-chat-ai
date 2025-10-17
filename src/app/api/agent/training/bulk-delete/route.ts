import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth';
import { getCollections } from '@/lib/mongodb';

// DELETE - Bulk delete training data
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tenantId, agentId, trainingIds } = body;

    if (!tenantId || !agentId || !trainingIds || !Array.isArray(trainingIds) || trainingIds.length === 0) {
      return NextResponse.json({ 
        message: 'Missing or invalid parameters. Expected: tenantId, agentId, and array of trainingIds' 
      }, { status: 400 });
    }

    const { tenants } = await getCollections();
    
    // First, fetch the tenant to check which training contexts actually exist
    const tenant = await tenants.findOne(
      { id: tenantId },
      { projection: { agents: 1 } }
    );

    if (!tenant) {
      return NextResponse.json({ 
        message: 'Tenant or agent not found' 
      }, { status: 404 });
    }

    const agent = tenant.agents?.find((a: any) => a.id === agentId);
    if (!agent) {
      return NextResponse.json({ 
        message: 'Tenant or agent not found' 
      }, { status: 404 });
    }

    // Count how many of the requested IDs actually exist
    const existingTrainingContexts = agent.trainingContexts || [];
    const existingIds = existingTrainingContexts
      .map((ctx: any) => ctx.id)
      .filter((id: any) => id && trainingIds.includes(id));
    
    const actualDeleteCount = existingIds.length;

    if (actualDeleteCount === 0) {
      return NextResponse.json({ 
        message: 'No training contexts were found to delete' 
      }, { status: 400 });
    }

    // Remove multiple training contexts from agent using $pull with $in operator
    const result = await tenants.updateOne(
      { id: tenantId },
      { 
        $pull: { 
          [`agents.$[agent].trainingContexts`]: { id: { $in: trainingIds } }
        } as any
      },
      { 
        arrayFilters: [{ 'agent.id': agentId }] 
      }
    );

    // Double-check that the update succeeded
    if (result.modifiedCount === 0) {
      return NextResponse.json({ 
        message: 'No training contexts were found to delete' 
      }, { status: 400 });
    }

    console.log(`[Training API BULK DELETE] Removed ${actualDeleteCount} training contexts for agent ${agentId}`);

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${actualDeleteCount} training context${actualDeleteCount > 1 ? 's' : ''}`,
      deletedCount: actualDeleteCount
    });

  } catch (error: any) {
    console.error('[Training API BULK DELETE] Error:', error);
    return NextResponse.json({ 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}
