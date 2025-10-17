import { NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth';

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ user: session });
}


