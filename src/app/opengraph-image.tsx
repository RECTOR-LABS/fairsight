import { ImageResponse } from 'next/og';
import { OG_THEME, getInterFont } from '@/lib/og-utils';

export const runtime = 'edge';
export const alt = 'FairSight — Token Trust Intelligence for Solana';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const font = await getInterFont();

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
        {/* Card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '60px 80px',
            borderRadius: '24px',
            border: `2px solid ${OG_THEME.border}`,
            backgroundColor: OG_THEME.card,
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: OG_THEME.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '16px',
                fontSize: '24px',
                color: 'white',
                fontWeight: 700,
              }}
            >
              FS
            </div>
            <span
              style={{
                fontSize: '48px',
                fontWeight: 700,
                color: OG_THEME.text,
              }}
            >
              FairSight
            </span>
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: '24px',
              color: OG_THEME.muted,
              textAlign: 'center',
              marginBottom: '16px',
            }}
          >
            Token Trust Intelligence for Solana
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: '18px',
              color: OG_THEME.dimmed,
              textAlign: 'center',
            }}
          >
            The Carfax for Solana tokens. Know who you're trusting.
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: '32px',
            fontSize: '16px',
            color: OG_THEME.dimmed,
          }}
        >
          Powered by{' '}
          <span
            style={{
              color: OG_THEME.accentLight,
              marginLeft: '6px',
              fontWeight: 700,
            }}
          >
            FairScale
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: 'Inter', data: font, style: 'normal', weight: 700 }],
    },
  );
}
