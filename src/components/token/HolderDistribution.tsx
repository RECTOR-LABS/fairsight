'use client';

import type { HolderData } from '@/types';
import { TIER_COLORS } from '@/types';

interface Props {
  holders: HolderData;
}

export default function HolderDistribution({ holders }: Props) {
  const { distribution } = holders;
  const total = distribution.platinum + distribution.gold + distribution.silver + distribution.bronze + distribution.unrated;

  const segments = [
    { label: 'Platinum', count: distribution.platinum, color: TIER_COLORS[4] },
    { label: 'Gold', count: distribution.gold, color: TIER_COLORS[3] },
    { label: 'Silver', count: distribution.silver, color: TIER_COLORS[2] },
    { label: 'Bronze', count: distribution.bronze, color: TIER_COLORS[1] },
    { label: 'Unrated', count: distribution.unrated, color: TIER_COLORS[0] },
  ];

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Holder FairScore Distribution</h3>
        <span className="text-xs text-zinc-500">
          {holders.qualityPercent.toFixed(0)}% quality (Gold+)
        </span>
      </div>

      {total > 0 ? (
        <>
          <div className="flex h-4 overflow-hidden rounded-full mb-4">
            {segments.map((seg) => (
              seg.count > 0 && (
                <div
                  key={seg.label}
                  className="transition-all duration-500"
                  style={{
                    width: `${(seg.count / total) * 100}%`,
                    backgroundColor: seg.color,
                  }}
                />
              )
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {segments.map((seg) => (
              <div key={seg.label} className="flex items-center gap-2 text-sm">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: seg.color }} />
                <span className="text-zinc-400">{seg.label}</span>
                <span className="font-medium text-white">{seg.count}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-zinc-500">No holder FairScore data available</p>
      )}
    </div>
  );
}
