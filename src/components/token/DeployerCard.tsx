import Link from 'next/link';
import type { FairScore } from '@/types';
import { TIER_COLORS } from '@/types';
import { User, ExternalLink, Award } from 'lucide-react';

interface Props {
  address: string;
  fairScore: FairScore | null;
  crossLaunchRate?: number;
}

function TierBadge({ tier, label }: { tier: number; label: string }) {
  const color = TIER_COLORS[tier] || TIER_COLORS[0];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: `${color}20`, color }}
    >
      <Award className="h-3 w-3" />
      {label}
    </span>
  );
}

export default function DeployerCard({ address, fairScore, crossLaunchRate }: Props) {
  const shortAddr = `${address.slice(0, 4)}...${address.slice(-4)}`;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800">
          <User className="h-5 w-5 text-zinc-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Deployer</h3>
          <Link
            href={`/deployer/${address}`}
            className="flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300"
          >
            {shortAddr}
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {fairScore ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">FairScore</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white">{fairScore.score}</span>
              <TierBadge tier={fairScore.tier} label={fairScore.tierLabel} />
            </div>
          </div>

          {crossLaunchRate !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Launch Success Rate</span>
              <span className="text-sm font-medium text-white">{crossLaunchRate}%</span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-zinc-500">FairScore unavailable</p>
      )}
    </div>
  );
}
