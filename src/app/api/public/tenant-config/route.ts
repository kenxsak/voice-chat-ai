import { NextResponse } from 'next/server';
import { getCollections } from '@/lib/mongodb';
import { rateLimit } from '@/lib/security';

// Public endpoint to return a sanitized tenant config for embedded widget use.
// Only exposes fields required for rendering and chatting, without sensitive data.
const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: Request) {
  try {
    // Public endpoint for widget: do not enforce origin checks (CORS headers are set below)

    const limited = rateLimit(request, 'public_tenant_config_get', 120, 60_000);
    if (limited) return limited;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const agentId = searchParams.get('agentId') || undefined;
    if (!id) {
      return NextResponse.json({ message: 'Missing id' }, { status: 400, headers: corsHeaders });
    }

    const { tenants } = await getCollections();
    const t: any = await tenants.findOne({ id });
    if (!t) {
      return NextResponse.json({ message: 'Not found' }, { status: 404, headers: corsHeaders });
    }

    // Include full training contexts with extracted text for AI to use
    const sanitizeCtx = (ctx: any) => ({
      // Legacy format support
      websiteUrl: (ctx?.websiteUrl || '').trim(),
      docInfo: (ctx?.docInfo || '').trim(),
      uploadedDocContent: ctx?.uploadedDocContent || '',
      // New format support (agent-specific training)
      id: ctx?.id,
      sourceInfo: ctx?.sourceInfo,
      extractedText: ctx?.extractedText || '',
      wordCount: ctx?.wordCount,
      characterCount: ctx?.characterCount,
      createdAt: ctx?.createdAt,
    });

    const sanitized = {
      id: t.id,
      name: t.name,
      companyLogoUrl: t.companyLogoUrl || '',
      brandColor: t.brandColor || '#2795f2',
      companyDetails: t.companyDetails || '',
      trainingWebsiteUrl: t.trainingWebsiteUrl || '',
      trainingDocInfo: t.trainingDocInfo || '',
      logoHint: t.logoHint || '',
      companyWebsiteUrl: t.companyWebsiteUrl || '',
      assignedPlanId: t.assignedPlanId || 'free',
      status: t.status || 'Active',
      supportedLanguages: Array.isArray(t.supportedLanguages) ? t.supportedLanguages : [{ code: 'en-US', name: 'English' }],
      // Respect explicit empty string (means: show circle icon with no text)
      launcherButtonText: t.launcherButtonText !== undefined ? t.launcherButtonText : 'Help?',
      launcherButtonIcon: t.launcherButtonIcon || 'mic',
      launcherButtonSize: t.launcherButtonSize || 'medium',
      launcherButtonStyle: t.launcherButtonStyle || 'normal',
      launcherButtonAnimation: t.launcherButtonAnimation || 'pulse',
      launcherButtonPosition: t.launcherButtonPosition || 'bottom-right',
      launcherAutoOpenDelay: t.launcherAutoOpenDelay || 'none',
      // Tenant-level contexts, sanitized
      trainingContexts: Array.isArray(t.trainingContexts) ? t.trainingContexts.map(sanitizeCtx) : [],
      // Agents with only safe fields
      agents: Array.isArray(t.agents) ? t.agents.map((a: any) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        avatarUrl: a.avatarUrl,
        avatarHint: a.avatarHint,
        greeting: a.greeting,
        websiteUrl: a.websiteUrl,
        voice: a.voice,
        tone: a.tone,
        responseStyle: a.responseStyle,
        expertiseLevel: a.expertiseLevel,
        customInstructions: a.customInstructions,
        trainingContexts: Array.isArray(a.trainingContexts) ? a.trainingContexts.map(sanitizeCtx) : [],
      })) : [],
    };

    // Optionally include the selected agent if agentId provided
    const selectedAgent = agentId && Array.isArray(t.agents)
      ? t.agents.find((a: any) => a.id === agentId)
      : undefined;

    // Effective launcher configuration (future-proof for agent overrides)
    const effective = {
      text: sanitized.launcherButtonText,
      icon: sanitized.launcherButtonIcon,
      size: sanitized.launcherButtonSize,
      style: sanitized.launcherButtonStyle,
      animation: sanitized.launcherButtonAnimation,
      position: sanitized.launcherButtonPosition,
      autoOpenDelay: sanitized.launcherAutoOpenDelay,
      brandColor: sanitized.brandColor,
    };

    // Return full agent data with all safe fields (including avatarUrl, avatarHint, greeting, etc.)
    const agentData = selectedAgent ? {
      id: selectedAgent.id,
      name: selectedAgent.name,
      description: selectedAgent.description,
      avatarUrl: selectedAgent.avatarUrl,
      avatarHint: selectedAgent.avatarHint,
      greeting: selectedAgent.greeting,
      websiteUrl: selectedAgent.websiteUrl,
      voice: selectedAgent.voice,
      tone: selectedAgent.tone,
      responseStyle: selectedAgent.responseStyle,
      expertiseLevel: selectedAgent.expertiseLevel,
      customInstructions: selectedAgent.customInstructions,
    } : undefined;

    return NextResponse.json({ tenant: sanitized, agent: agentData, effective }, { headers: corsHeaders });
  } catch (e) {
    console.error('[API /api/public/tenant-config GET] Error', e);
    return NextResponse.json({ message: 'Server error' }, { status: 500, headers: corsHeaders });
  }
}

