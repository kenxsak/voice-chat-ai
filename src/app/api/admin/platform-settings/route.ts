import { NextResponse } from 'next/server';
import { getCollections } from '@/lib/mongodb';
import { getSessionFromCookies } from '@/lib/auth';
import { z } from 'zod';

const DEFAULT_PLATFORM_SETTINGS = {
  id: 'platform_settings',
  defaultTrialPlanId: 'trial',
  trialLengthDays: 14,
  postTrialBehavior: 'auto_downgrade',
  gracePeriodDays: 3,
  updatedAt: new Date(),
};

const PlatformSettingsSchema = z.object({
  defaultTrialPlanId: z.string().optional(),
  trialLengthDays: z.number().int().min(1).max(365).optional(),
  postTrialBehavior: z.enum(['auto_downgrade', 'require_selection']).optional(),
  gracePeriodDays: z.number().int().min(0).max(30).optional(),
});

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session || session.role !== 'superadmin') {
      return NextResponse.json({ message: 'Forbidden - Super admin access required' }, { status: 403 });
    }

    const { platformSettings } = await getCollections();
    
    let settings = await platformSettings.findOne({ id: 'platform_settings' });
    
    if (!settings) {
      await platformSettings.insertOne(DEFAULT_PLATFORM_SETTINGS);
      settings = DEFAULT_PLATFORM_SETTINGS;
    }

    return NextResponse.json({ settings });
  } catch (e) {
    console.error('[API /api/admin/platform-settings GET] Error', e);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session || session.role !== 'superadmin') {
      return NextResponse.json({ message: 'Forbidden - Super admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const updates = PlatformSettingsSchema.parse(body);

    const { platformSettings } = await getCollections();
    
    let existing = await platformSettings.findOne({ id: 'platform_settings' });
    
    if (!existing) {
      existing = { ...DEFAULT_PLATFORM_SETTINGS };
    }
    
    const mergedSettings = {
      id: 'platform_settings',
      defaultTrialPlanId: updates.defaultTrialPlanId ?? existing.defaultTrialPlanId ?? DEFAULT_PLATFORM_SETTINGS.defaultTrialPlanId,
      trialLengthDays: updates.trialLengthDays ?? existing.trialLengthDays ?? DEFAULT_PLATFORM_SETTINGS.trialLengthDays,
      postTrialBehavior: updates.postTrialBehavior ?? existing.postTrialBehavior ?? DEFAULT_PLATFORM_SETTINGS.postTrialBehavior,
      gracePeriodDays: updates.gracePeriodDays ?? existing.gracePeriodDays ?? DEFAULT_PLATFORM_SETTINGS.gracePeriodDays,
      updatedAt: new Date(),
    };

    await platformSettings.updateOne(
      { id: 'platform_settings' },
      { $set: mergedSettings },
      { upsert: true }
    );

    console.log('[API /api/admin/platform-settings] Settings updated:', mergedSettings);

    return NextResponse.json({ settings: mergedSettings });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid settings data', errors: e.errors }, { status: 400 });
    }
    console.error('[API /api/admin/platform-settings PUT] Error', e);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
