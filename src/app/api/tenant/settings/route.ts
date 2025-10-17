
import { NextResponse } from 'next/server';
import { getCollections } from '@/lib/mongodb';
import { getSessionFromCookies } from '@/lib/auth';

// Minimal HTML -> text scraper used during training save to persist context text
async function scrapeWebsiteText(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const resp = await fetch(url, {
      headers: { 'User-Agent': process.env.PUBLIC_USER_AGENT || 'VoiceChatAI-Bot/1.0' },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!resp.ok) return '';
    const type = resp.headers.get('content-type') || '';
    if (!type.includes('text/html')) return '';
    const html = await resp.text();
    let text = html
      .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, '')
      .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const MAX = 20000; // cap to avoid oversized DB docs
    if (text.length > MAX) text = text.slice(0, MAX) + '... [truncated]';
    return text;
  } catch (e) {
    console.warn('[API /api/tenant/settings] scrapeWebsiteText failed for', url, e);
    return '';
  }
}

/**
 * Handles POST requests to /api/tenant/settings.
 * Saves tenant settings and, if trainingContexts are provided, scrapes website URLs
 * and stores cleaned text into uploadedDocContent so chat can use it immediately.
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { tenantId, companyName, companyLogoUrl, companyDetails, country, contactEmail, contactPhone, contactWhatsapp, billingAddress, leadWebhookUrl, launcherButtonText, launcherButtonIcon, launcherButtonSize, launcherButtonStyle, launcherButtonAnimation, launcherButtonPosition, launcherAutoOpenDelay, brandColor, trainingContexts } = data;

    // --- Authentication/Authorization ---
    const { requireTenantModifyAccess } = await import('@/lib/auth-middleware');
    const session = await requireTenantModifyAccess(tenantId);
    if (session instanceof NextResponse) return session;
    console.log(`[API /api/tenant/settings] Received request to update tenant: ${tenantId}`);
    console.log(`[API /api/tenant/settings] Training contexts received:`, trainingContexts);

    // --- Validation (Conceptual) ---
    if (!tenantId) {
      console.log('[API /api/tenant/settings] Missing tenantId.');
      return NextResponse.json({ message: 'Tenant ID is required.' }, { status: 400 });
    }

    // --- Database Interaction (MongoDB) ---
    const { tenants } = await getCollections();
    const $set: Record<string, unknown> = {};
    if (typeof companyName === 'string') $set.name = companyName;
    if (typeof companyLogoUrl === 'string') $set.companyLogoUrl = companyLogoUrl;
    if (typeof companyDetails === 'string') $set.companyDetails = companyDetails;
    if (typeof country === 'string') $set.country = country;
    if (typeof contactEmail === 'string') $set.contactEmail = contactEmail;
    if (typeof contactPhone === 'string') $set.contactPhone = contactPhone;
    if (typeof contactWhatsapp === 'string') $set.contactWhatsapp = contactWhatsapp;
    if (typeof billingAddress === 'string') $set.billingAddress = billingAddress;
    if (typeof leadWebhookUrl === 'string') $set.leadWebhookUrl = leadWebhookUrl;
    if (launcherButtonText !== undefined) $set.launcherButtonText = launcherButtonText; // allow empty string
    if (typeof launcherButtonIcon === 'string') $set.launcherButtonIcon = launcherButtonIcon;
    if (typeof launcherButtonSize === 'string') $set.launcherButtonSize = launcherButtonSize;
    if (typeof launcherButtonStyle === 'string') $set.launcherButtonStyle = launcherButtonStyle;
    if (typeof launcherButtonAnimation === 'string') $set.launcherButtonAnimation = launcherButtonAnimation;
    if (typeof launcherButtonPosition === 'string') $set.launcherButtonPosition = launcherButtonPosition;
    if (typeof launcherAutoOpenDelay === 'string') $set.launcherAutoOpenDelay = launcherAutoOpenDelay;
    if (typeof brandColor === 'string' && brandColor.trim()) {
      $set.brandColor = brandColor.trim();
    }

    if (Array.isArray(trainingContexts)) {
      // Scrape and persist clean text for each websiteUrl if not already present
      const processed = await Promise.all(trainingContexts.map(async (ctx: any) => {
        const url = (ctx?.websiteUrl || '').trim();
        let uploadedDocContent = (ctx?.uploadedDocContent || '').trim();
        if (url && !uploadedDocContent) {
          const text = await scrapeWebsiteText(url);
          if (text) uploadedDocContent = text;
        }
        return { ...ctx, uploadedDocContent };
      }));
      $set.trainingContexts = processed;
      console.log(`[API /api/tenant/settings] Persisting ${processed.length} training context(s) with website text where available.`);
    }

    console.log(`[API /api/tenant/settings] Final $set object:`, Object.keys($set));
    await tenants.updateOne({ id: tenantId }, { $set });

    // Return sanitized updated tenant for immediate client rehydration
    const updated = await tenants.findOne({ id: tenantId });
    const sanitizeCtx = (ctx: any) => ({
      websiteUrl: (ctx?.websiteUrl || '').trim(),
      docInfo: (ctx?.docInfo || '').trim(),
    });
    const sanitized = updated ? {
      id: updated.id,
      name: updated.name,
      companyLogoUrl: updated.companyLogoUrl || '',
      brandColor: updated.brandColor || '#2795f2',
      companyDetails: updated.companyDetails || '',
      trainingWebsiteUrl: updated.trainingWebsiteUrl || '',
      trainingDocInfo: updated.trainingDocInfo || '',
      logoHint: updated.logoHint || '',
      companyWebsiteUrl: updated.companyWebsiteUrl || '',
      assignedPlanId: updated.assignedPlanId || 'free',
      status: updated.status || 'Active',
      supportedLanguages: Array.isArray(updated.supportedLanguages) ? updated.supportedLanguages : [{ code: 'en-US', name: 'English' }],
      launcherButtonText: updated.launcherButtonText !== undefined ? updated.launcherButtonText : 'Help?',
      launcherButtonIcon: updated.launcherButtonIcon || 'mic',
      launcherButtonSize: updated.launcherButtonSize || 'medium',
      launcherButtonStyle: updated.launcherButtonStyle || 'normal',
      launcherButtonAnimation: updated.launcherButtonAnimation || 'pulse',
      launcherButtonPosition: updated.launcherButtonPosition || 'bottom-right',
      trainingContexts: Array.isArray(updated.trainingContexts) ? updated.trainingContexts.map(sanitizeCtx) : [],
      agents: Array.isArray(updated.agents) ? updated.agents.map((a: any) => ({
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
    } : null;

    return NextResponse.json({ message: 'Tenant settings updated successfully.', tenant: sanitized }, { status: 200 });

  } catch (error: any) {
    console.error('[API /api/tenant/settings] Error updating settings:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ message: 'Invalid request format.' }, { status: 400 });
    }
    return NextResponse.json(
      { message: 'An unexpected error occurred on the server.' },
      { status: 500 }
    );
  }
}
