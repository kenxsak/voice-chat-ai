import { NextResponse } from 'next/server';

export function getClientIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  const ip = (request as any)?.ip || 'local';
  return typeof ip === 'string' ? ip : 'local';
}

export function isOriginAllowed(request: Request): boolean {
  const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (allowed.length === 0) return true; // not enforced
  const origin = request.headers.get('origin') || '';
  const referer = request.headers.get('referer') || '';
  return allowed.some(a => origin.startsWith(a) || referer.startsWith(a));
}

export function assertAllowedOrigin(request: Request) {
  if (!isOriginAllowed(request)) {
    return NextResponse.json({ message: 'Origin not allowed' }, { status: 403 });
  }
  return null;
}

type Counter = { count: number; ts: number };
const rlMap = new Map<string, Counter>();

export function rateLimit(request: Request, key: string, max: number, windowMs: number) {
  const ip = getClientIp(request);
  const mapKey = `${ip}:${key}`;
  const now = Date.now();
  const prev = rlMap.get(mapKey);
  if (!prev || now - prev.ts > windowMs) {
    rlMap.set(mapKey, { count: 1, ts: now });
    return null;
  }
  if (prev.count >= max) {
    return NextResponse.json({ message: 'Too many requests. Please try again later.' }, { status: 429 });
  }
  prev.count += 1;
  return null;
}


