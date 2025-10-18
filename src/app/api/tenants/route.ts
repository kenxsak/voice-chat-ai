import { NextResponse } from 'next/server';
import { getCollections } from '@/lib/mongodb';
import { getSessionFromCookies } from '@/lib/auth';

async function scrapeWebsiteText(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const resp = await fetch(url, { headers: { 'User-Agent': process.env.PUBLIC_USER_AGENT || 'VoiceChatAI-Bot/1.0' }, signal: controller.signal });
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
    const MAX = 20000;
    if (text.length > MAX) text = text.slice(0, MAX) + '... [truncated]';
    return text;
  } catch {
    return '';
  }
}

export async function GET() {
  try {
    // Require authentication; scope results by role
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { tenants, plans } = await getCollections();

    // Seed default data if empty to preserve previous demo behavior
    const tenantsCount = await tenants.countDocuments({});
    if (tenantsCount === 0) {
      const free = await plans.findOne({ id: 'free' });
      if (!free) {
        await plans.insertOne({ id: 'free', name: 'Free', pricePerMonth: 0, description: 'Default', allowsCustomBranding: false, conversationLimit: 50, leadLimit: 5 });
      }
      await tenants.insertOne({
        id: 'default_tenant',
        name: 'Default Assistant',
        companyLogoUrl: '',
        brandColor: '#2795f2',
        companyDetails: 'Welcome to the demo assistant.',
        country: 'US',
        contactEmail: 'support@example.com',
        contactPhone: '',
        contactWhatsapp: '',
        billingAddress: '',
        leadWebhookUrl: '',
        launcherButtonText: 'Help?',
        assignedPlanId: 'free',
        supportedLanguages: [{ code: 'en-US', name: 'English' }],
        agents: [
          { id: 'agent_default', name: 'Support Bot', description: 'Helpful assistant', avatarUrl: '', avatarHint: 'bot avatar', greeting: "Hello! How can I help you today?", websiteUrl: '', voice: 'female-us' },
        ],
        trainingContexts: [],
        status: 'Active',
        subscriptionStartDate: new Date(),
        conversationCount: 0,
        leadCount: 0,
        tokenUsage: 0,
        usageLastReset: new Date().toISOString(),
      });
    }

    // Superadmin: return all tenants; Regular user: only their tenant
    let result: any[] = [];
    if (session.role === 'superadmin') {
      result = await tenants.find({}).toArray();
    } else if (session.tenantId) {
      const one = await tenants.findOne({ id: session.tenantId });
      result = one ? [one] : [];
    } else {
      // Authenticated but no tenant associated
      result = [];
    }

    console.log('[API /api/tenants] Returning tenants:', result.map(t => ({
      id: t.id,
      name: t.name,
      hasTrainingContexts: !!t.trainingContexts,
      trainingContextsLength: t.trainingContexts?.length || 0
    })));
    return NextResponse.json({ tenants: result });
  } catch (e) {
    console.error('[API /api/tenants] Error', e);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const { tenants } = await getCollections();
    const body = await request.json();
    const { id, updates } = body as { id: string; updates: any };
    if (!id || !updates) return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
    if (session.role !== 'superadmin' && session.tenantId !== id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // If updates include trainingContexts (agent-level or tenant-level), fetch website text
    if (Array.isArray(updates?.trainingContexts)) {
      updates.trainingContexts = await Promise.all(updates.trainingContexts.map(async (ctx: any) => {
        const url = (ctx?.websiteUrl || '').trim();
        let uploadedDocContent = (ctx?.uploadedDocContent || '').trim();
        if (url && !uploadedDocContent) {
          const text = await scrapeWebsiteText(url);
          if (text) uploadedDocContent = text;
        }
        return { ...ctx, uploadedDocContent };
      }));
    }

    // If agent array is being updated and contains trainingContexts inside agents
    if (Array.isArray(updates?.agents)) {
      updates.agents = await Promise.all(updates.agents.map(async (agent: any) => {
        if (Array.isArray(agent?.trainingContexts)) {
          const processed = await Promise.all(agent.trainingContexts.map(async (ctx: any) => {
            const url = (ctx?.websiteUrl || '').trim();
            let uploadedDocContent = (ctx?.uploadedDocContent || '').trim();
            if (url && !uploadedDocContent) {
              const text = await scrapeWebsiteText(url);
              if (text) uploadedDocContent = text;
            }
            return { ...ctx, uploadedDocContent };
          }));
          return { ...agent, trainingContexts: processed };
        }
        return agent;
      }));
    }

    await tenants.updateOne({ id }, { $set: updates });
    const updated = await tenants.findOne({ id });
    return NextResponse.json({ tenant: updated });
  } catch (e) {
    console.error('[API /api/tenants PUT] Error', e);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
