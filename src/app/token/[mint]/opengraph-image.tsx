import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';
import { OG_THEME, GRADE_COLORS, getInterFont } from '@/lib/og-utils';
import type { Grade, ScoreBreakdown } from '@/types';

export const runtime = 'nodejs';
export const alt = 'FairSight Token Trust Report';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

interface ReportData {
  name?: string;
  symbol?: string;
  breakdown?: ScoreBreakdown;
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
      <div style={{ width: '130px', fontSize: '16px', color: OG_THEME.muted }}>{label}</div>
      <div
        style={{
          display: 'flex',
          flex: 1,
          height: '16px',
          backgroundColor: OG_THEME.border,
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: '100%',
            backgroundColor: color,
            borderRadius: '8px',
          }}
        />
      </div>
      <div style={{ width: '45px', textAlign: 'right', fontSize: '16px', color: OG_THEME.text, fontWeight: 700 }}>
        {value}
      </div>
    </div>
  );
}

export default async function Image({
  params,
}: {
  params: Promise<{ mint: string }>;
}) {
  const { mint } = await params;
  const font = await getInterFont();

  const cached = await prisma.cachedTokenReport.findUnique({
    where: { mint },
    select: { fairsightScore: true, grade: true, report: true },
  });

  const report = cached?.report as unknown as ReportData | null;
  const score = cached?.fairsightScore ?? 0;
  const grade = (cached?.grade ?? 'F') as Grade;
  const name = report?.name || 'Unknown Token';
  const symbol = report?.symbol || '???';
  const breakdown = report?.breakdown;
  const gradeHex = GRADE_COLORS[grade];

  // Fallback: no cached report
  if (!cached) {
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
            Analyze this token on FairSight
          </div>
          <div style={{ fontSize: '16px', color: OG_THEME.dimmed }}>
            {mint.slice(0, 16)}...{mint.slice(-8)}
          </div>
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
            FairSight — Token Trust Report
          </span>
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', flex: 1 }}>
          {/* Left: Score circle */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '56px',
            }}
          >
            {/* Score ring */}
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
                position: 'relative',
              }}
            >
              <div style={{ fontSize: '64px', fontWeight: 700, color: OG_THEME.text }}>{score}</div>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: gradeHex,
                  marginTop: '-4px',
                }}
              >
                {grade}
              </div>
            </div>

            {/* Grade badge */}
            <div
              style={{
                marginTop: '16px',
                padding: '6px 20px',
                borderRadius: '8px',
                backgroundColor: `${gradeHex}22`,
                border: `1px solid ${gradeHex}44`,
                fontSize: '16px',
                fontWeight: 700,
                color: gradeHex,
              }}
            >
              Grade {grade}
            </div>
          </div>

          {/* Right: Token info + bars */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
            {/* Token name */}
            <div style={{ fontSize: '36px', fontWeight: 700, color: OG_THEME.text, marginBottom: '4px' }}>
              {name.length > 24 ? name.slice(0, 24) + '...' : name}
            </div>
            <div style={{ fontSize: '20px', color: OG_THEME.muted, marginBottom: '8px' }}>${symbol}</div>
            <div style={{ fontSize: '14px', color: OG_THEME.dimmed, marginBottom: '28px' }}>
              {mint.slice(0, 16)}...{mint.slice(-8)}
            </div>

            {/* Score breakdown bars */}
            {breakdown && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <ScoreBar label="Reputation" value={breakdown.reputation} color="#10b981" />
                <ScoreBar label="Security" value={breakdown.security} color="#3b82f6" />
                <ScoreBar label="Market" value={breakdown.market} color="#8b5cf6" />
                <ScoreBar label="Community" value={breakdown.community} color="#f59e0b" />
              </div>
            )}
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
