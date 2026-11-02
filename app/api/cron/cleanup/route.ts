import { NextRequest, NextResponse } from 'next/server';
import { runCleanup } from '@/lib/cleanup';

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const summary = await runCleanup();
  console.log('Cleanup finished:', summary);
  return NextResponse.json(summary);
}