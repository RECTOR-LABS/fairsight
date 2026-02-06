export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getAsset } from '@/lib/apis/helius';
import { getTokenInfo } from '@/lib/apis/jupiter';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();

  if (!q || q.length < 32) {
    return NextResponse.json({ error: 'Enter a valid Solana token mint address' }, { status: 400 });
  }

  // Try to resolve the mint
  const [helius, jupiter] = await Promise.all([
    getAsset(q).catch(() => null),
    getTokenInfo(q).catch(() => null),
  ]);

  if (!helius && !jupiter) {
    return NextResponse.json({ error: 'Token not found' }, { status: 404 });
  }

  return NextResponse.json({
    mint: q,
    name: helius?.content?.metadata?.name || jupiter?.name || 'Unknown',
    symbol: helius?.content?.metadata?.symbol || jupiter?.symbol || '???',
    image: helius?.content?.links?.image || jupiter?.logoURI,
  });
}
