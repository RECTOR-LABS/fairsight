import { ImageResponse } from 'next/og';
import { getCached, CacheKeys } from '@/lib/cache';
import { prisma } from '@/lib/prisma';
import { OG_THEME, getInterFont } from '@/lib/og-utils';
import type { DeployerProfile } from '@/types';
import { TIER_LABELS, TIER_COLORS } from '@/types';

export const runtime = 'nodejs';
export const alt = 'FairSight Deployer Profile';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

function StatBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 24px',
        borderRadius: '12px',
        backgroundColor: OG_THEME.card,
        border: `1px solid ${OG_THEME.border}`,
        minWidth: '120px',
      }}
    >
      <div style={{ fontSize: '32px', fontWeight: 700, color: color || OG_THEME.text }}>{value}</div>
      <div style={{ fontSize: '14px', color: OG_THEME.muted, marginTop: '4px' }}>{label}</div>
    </div>
  );
}

export default async function Image({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  const font = await getInterFont();
  const short = `${address.slice(0, 12)}...${address.slice(-6)}`;

  // Try Redis cache
  const cached = await getCached<DeployerProfile>(CacheKeys.deployerProfile(address));

  let fairScoreValue = 0;
  let tierNum = 0;
  let totalTokens = 0;
  let activeTokens = 0;
  let deadTokens = 0;
  let ruggedTokens = 0;
  let successRate = 0;
  let hasData = false;

  if (cached) {
    hasData = true;
    fairScoreValue = cached.fairScore?.score ?? 0;
    tierNum = cached.fairScore?.tier ?? 0;
    totalTokens = cached.totalTokensLaunched;
    activeTokens = cached.activeTokens;
    deadTokens = cached.deadTokens;
    ruggedTokens = cached.ruggedTokens;
    successRate = cached.successRate;
  } else {
    // Fallback: Prisma
    const fs = await prisma.cachedFairScore.findUnique({
      where: { wallet: address },
      select: { score: true, tier: true },
    });
    const tokenCount = await prisma.deployerHistory.count({ where: { deployerWallet: address } });

    if (fs || tokenCount > 0) {
      hasData = true;
      fairScoreValue = fs?.score ?? 0;
      tierNum = fs?.tier ?? 0;
      totalTokens = tokenCount;
    }
  }

  const tierLabel = TIER_LABELS[tierNum] || 'Unrated';
  const tierColor = TIER_COLORS[tierNum] || '#6B7280';

  // Fallback card
  if (!hasData) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: OG_THEME.bg,
            fontFamily: 'Inter',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: OG_THEME.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '12px',
                fontSize: '20px',
                color: 'white',
                fontWeight: 700,
              }}
            >
              FS
            </div>
            <span style={{ fontSize: '36px', fontWeight: 700, color: OG_THEME.text }}>FairSight</span>
          </div>
          <div style={{ fontSize: '24px', color: OG_THEME.muted, marginBottom: '16px' }}>
            Deployer Profile
          </div>
          <div style={{ fontSize: '16px', color: OG_THEME.dimmed }}>{short}</div>
        </div>
      ),
      { ...size, fonts: [{ name: 'Inter', data: font, style: 'normal', weight: 700 }] },
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: OG_THEME.bg,
          fontFamily: 'Inter',
          padding: '48px 56px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: OG_THEME.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '10px',
              fontSize: '16px',
              color: 'white',
              fontWeight: 700,
            }}
          >
            FS
          </div>
          <span style={{ fontSize: '20px', fontWeight: 700, color: OG_THEME.muted }}>
            FairSight — Deployer Profile
          </span>
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', flex: 1 }}>
          {/* Left: FairScore circle */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '56px',
            }}
          >
            <div
              style={{
                width: '180px',
                height: '180px',
                borderRadius: '90px',
                border: `8px solid ${OG_THEME.border}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ fontSize: '56px', fontWeight: 700, color: OG_THEME.text }}>
                {fairScoreValue}
              </div>
              <div style={{ fontSize: '16px', color: OG_THEME.muted, marginTop: '-2px' }}>
                FairScore
              </div>
            </div>

            {/* Tier badge */}
            <div
              style={{
                marginTop: '16px',
                padding: '6px 20px',
                borderRadius: '8px',
                backgroundColor: `${tierColor}22`,
                border: `1px solid ${tierColor}44`,
                fontSize: '16px',
                fontWeight: 700,
                color: tierColor,
              }}
            >
              {tierLabel}
            </div>
          </div>

          {/* Right: Address + stats */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: OG_THEME.text, marginBottom: '8px' }}>
              Deployer
            </div>
            <div style={{ fontSize: '18px', color: OG_THEME.dimmed, marginBottom: '32px' }}>{short}</div>

            {/* Stats row */}
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              <div style={{ marginRight: '12px', marginBottom: '12px' }}>
                <StatBox label="Launched" value={String(totalTokens)} />
              </div>
              {cached && (
                <>
                  <div style={{ marginRight: '12px', marginBottom: '12px' }}>
                    <StatBox label="Active" value={String(activeTokens)} color="#10b981" />
                  </div>
                  <div style={{ marginRight: '12px', marginBottom: '12px' }}>
                    <StatBox label="Dead" value={String(deadTokens)} color="#a1a1aa" />
                  </div>
                  <div style={{ marginRight: '12px', marginBottom: '12px' }}>
                    <StatBox label="Rugged" value={String(ruggedTokens)} color="#ef4444" />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <StatBox label="Success" value={`${successRate}%`} color={OG_THEME.accentLight} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '14px', color: OG_THEME.dimmed }}>fairsight.rectorspace.com</div>
          <div style={{ fontSize: '14px', color: OG_THEME.dimmed }}>Powered by FairScale</div>
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: 'Inter', data: font, style: 'normal', weight: 700 }] },
  );
}
