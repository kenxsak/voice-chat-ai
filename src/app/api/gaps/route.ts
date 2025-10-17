import { NextResponse } from 'next/server';
import { getCollections } from '@/lib/mongodb';
import { z } from 'zod';
import { assertAllowedOrigin, rateLimit } from '@/lib/security';
import { requireAuth, getTenantFilter } from '@/lib/auth-middleware';

export async function GET(request: Request) {
  try {
    const blocked = assertAllowedOrigin(request);
    if (blocked) return blocked;
    const limited = rateLimit(request, 'gaps_get', 60, 60_000);
    if (limited) return limited;

    // Require authentication and get tenant filter
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    const url = new URL(request.url);
    const requestedTenantId = url.searchParams.get('tenantId') || undefined;
    const query = getTenantFilter(session, requestedTenantId);

    const { gaps } = await getCollections();
    
    const all = await gaps
      .find(query)
      .sort({ date: -1 })
      .limit(1000)
      .project({ _id: 0 }) // Exclude MongoDB _id for smaller payload
      .toArray();
    return NextResponse.json({ gaps: all });
  } catch (e) {
    console.error('[API /api/gaps GET] Error', e);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const blocked = assertAllowedOrigin(request);
    if (blocked) return blocked;
    const limited = rateLimit(request, 'gaps_post', 20, 60_000);
    if (limited) return limited;
    const body = await request.json();
    const GapSchema = z.object({
      id: z.string(),
      tenantId: z.string(),
      query: z.string(),
      date: z.string(),
      category: z.enum(['missing_knowledge', 'out_of_scope', 'unclear_question']).optional(),
    });
    const payload = GapSchema.parse(body) as any;
    const { gaps } = await getCollections();
    const gap = { ...payload, createdAt: new Date() };
    await gaps.insertOne(gap);
    return NextResponse.json({ gap }, { status: 201 });
  } catch (e) {
    console.error('[API /api/gaps POST] Error', e);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}


