import { NextResponse } from 'next/server';
import { translateText } from '@/ai/flows/translate-text';
import { assertAllowedOrigin, rateLimit } from '@/lib/security';

export async function POST(request: Request) {
  try {
    const blocked = assertAllowedOrigin(request);
    if (blocked) return blocked;
    const limited = rateLimit(request, 'translate_text_post', 60, 60_000);
    if (limited) return limited;

    const body = await request.json().catch(() => ({}));
    const { text, languageCode } = body || {};
    if (typeof text !== 'string' || typeof languageCode !== 'string') {
      return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
    }

    const { translatedText } = await translateText({ text, languageCode });
    return NextResponse.json({ translatedText }, { status: 200 });
  } catch (e) {
    console.error('[API /api/translate-text POST] Error', e);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}


