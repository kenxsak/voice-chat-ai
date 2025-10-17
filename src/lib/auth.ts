import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set in environment variables');
}

export type SessionPayload = {
  userId: string;
  email: string;
  role: 'superadmin' | 'admin' | 'user';
  tenantId?: string | null;
};

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.set('auth_token', '', { path: '/', maxAge: 0 });
}

export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  return verifySession(token);
}


