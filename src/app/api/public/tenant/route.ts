import { NextResponse } from 'next/server';
import { getCollections } from '@/lib/mongodb';
import { assertAllowedOrigin, rateLimit } from '@/lib/security';

// Public read-only endpoint to fetch minimal tenant display data by id.
// This is used by the embedded widget to retrieve launcher text/brand color
// without exposing other tenant data and without requiring authentication.
export async function GET(request: Request) {
  try {
    const blocked = assertAllowedOrigin(request);
    if (blocked) return blocked;

    const limited = rateLimit(request, 'public_tenant_get', 120, 60_000);
    if (limited) return limited;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ message: 'Missing id' }, { status: 400 });
    }

    const { tenants } = await getCollections();
    // Return only minimal fields needed by the widget
    const tenant = await tenants.findOne(
      { id },
      { projection: { _id: 0, id: 1, launcherButtonText: 1, brandColor: 1 } }
    );

    if (!tenant) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ tenant });
  } catch (e) {
    console.error('[API /api/public/tenant GET] Error', e);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

