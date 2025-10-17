import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth';
import { getCollections } from '@/lib/mongodb';

// GET - Fetch agent training data
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const agentId = searchParams.get('agentId');

    if (!tenantId || !agentId) {
      return NextResponse.json({ 
        message: 'Missing required parameters: tenantId, agentId' 
      }, { status: 400 });
    }

    const { tenants } = await getCollections();
    
    // Find tenant and get agent training data
    const tenant = await tenants.findOne({ id: tenantId });
    if (!tenant) {
      return NextResponse.json({ message: 'Tenant not found' }, { status: 404 });
    }

    const agent = tenant.agents?.find((a: any) => a.id === agentId);
    if (!agent) {
      return NextResponse.json({ message: 'Agent not found' }, { status: 404 });
    }

    const trainingContexts = agent.trainingContexts || [];

    return NextResponse.json({
      success: true,
      trainingContexts: trainingContexts.map((ctx: any) => ({
        id: ctx.id,
        sourceInfo: ctx.sourceInfo,
        extractedText: ctx.extractedText || ctx.uploadedDocContent || '', // Include for preview
        uploadedDocContent: ctx.uploadedDocContent || ctx.extractedText || '', // For AI consumption
        wordCount: ctx.wordCount,
        characterCount: ctx.characterCount,
        createdAt: ctx.createdAt,
      }))
    });

  } catch (error: any) {
    console.error('[Training API GET] Error:', error);
    return NextResponse.json({ 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}

// DELETE - Remove training data
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const agentId = searchParams.get('agentId');
    const trainingId = searchParams.get('trainingId');

    if (!tenantId || !agentId || !trainingId) {
      return NextResponse.json({ 
        message: 'Missing required parameters: tenantId, agentId, trainingId' 
      }, { status: 400 });
    }

    const { tenants } = await getCollections();
    
    // Remove training context from agent
    const result = await tenants.updateOne(
      { id: tenantId },
      { 
        $pull: { 
          [`agents.$[agent].trainingContexts`]: { id: trainingId }
        } as any
      },
      { 
        arrayFilters: [{ 'agent.id': agentId }] 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        message: 'Tenant or agent not found' 
      }, { status: 404 });
    }

    if (result.modifiedCount === 0) {
      return NextResponse.json({ 
        message: 'Training data not found or already deleted' 
      }, { status: 404 });
    }

    console.log(`[Training API DELETE] Removed training ${trainingId} for agent ${agentId}`);

    return NextResponse.json({
      success: true,
      message: 'Training data deleted successfully'
    });

  } catch (error: any) {
    console.error('[Training API DELETE] Error:', error);
    return NextResponse.json({ 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}

// PUT - Update training data (for editing)
export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tenantId, agentId, trainingId, sourceInfo, extractedText } = body;

    if (!tenantId || !agentId || !trainingId) {
      return NextResponse.json({ 
        message: 'Missing required fields: tenantId, agentId, trainingId' 
      }, { status: 400 });
    }

    const { tenants } = await getCollections();
    
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (sourceInfo) updateData[`agents.$[agent].trainingContexts.$[training].sourceInfo`] = sourceInfo;
    if (extractedText) {
      updateData[`agents.$[agent].trainingContexts.$[training].extractedText`] = extractedText;
      updateData[`agents.$[agent].trainingContexts.$[training].uploadedDocContent`] = extractedText;
      updateData[`agents.$[agent].trainingContexts.$[training].wordCount`] = extractedText.split(/\s+/).length;
      updateData[`agents.$[agent].trainingContexts.$[training].characterCount`] = extractedText.length;
    }

    const result = await tenants.updateOne(
      { id: tenantId },
      { $set: updateData },
      { 
        arrayFilters: [
          { 'agent.id': agentId },
          { 'training.id': trainingId }
        ] 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        message: 'Tenant, agent, or training data not found' 
      }, { status: 404 });
    }

    console.log(`[Training API PUT] Updated training ${trainingId} for agent ${agentId}`);

    return NextResponse.json({
      success: true,
      message: 'Training data updated successfully'
    });

  } catch (error: any) {
    console.error('[Training API PUT] Error:', error);
    return NextResponse.json({ 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}
