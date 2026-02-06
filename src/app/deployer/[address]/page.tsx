'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { User, ArrowLeft, Loader2, AlertCircle, ExternalLink, Award } from 'lucide-react';
import type { DeployerProfile } from '@/types';
import { TIER_COLORS } from '@/types';

export default function DeployerProfilePage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = use(params);
  const [profile, setProfile] = useState<DeployerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/deployer/${address}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load');
        return res.json();
      })
      .then(setProfile)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [address]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="h-8 w-8 text-red-400" />
          <p className="text-white">{error || 'Profile not found'}</p>
          <Link href="/" className="flex items-center gap-2 text-sm text-emerald-400">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/" className="mb-6 flex items-center gap-2 text-sm text-zinc-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800">
          <User className="h-7 w-7 text-zinc-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Deployer Profile</h1>
          <p className="font-mono text-sm text-zinc-500">{address}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        {profile.fairScore && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="text-xs text-zinc-500">FairScore</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">{profile.fairScore.score}</span>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                style={{
                  backgroundColor: `${TIER_COLORS[profile.fairScore.tier]}20`,
                  color: TIER_COLORS[profile.fairScore.tier],
                }}
              >
                <Award className="h-3 w-3" />
                {profile.fairScore.tierLabel}
              </span>
            </div>
          </div>
        )}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500">Tokens Launched</p>
          <p className="text-2xl font-bold text-white">{profile.totalTokensLaunched}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500">Success Rate</p>
          <p className="text-2xl font-bold text-white">{profile.successRate}%</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500">Dead / Rugged</p>
          <p className="text-2xl font-bold text-white">
            {profile.deadTokens} / {profile.ruggedTokens}
          </p>
        </div>
      </div>

      {/* Token history */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h2 className="mb-4 font-semibold text-white">Cross-Launch History</h2>
        {profile.tokens.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500">
                  <th className="pb-2 pr-4">Token</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Peak MCap</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {profile.tokens.map((token) => (
                  <tr key={token.mint} className="text-zinc-300">
                    <td className="py-2.5 pr-4">
                      <p className="font-medium text-white">{token.name || token.symbol || 'Unknown'}</p>
                      <p className="font-mono text-xs text-zinc-500">
                        {token.mint.slice(0, 6)}...{token.mint.slice(-4)}
                      </p>
                    </td>
                    <td className="py-2.5 pr-4">
                      <StatusBadge status={token.status} />
                    </td>
                    <td className="py-2.5 pr-4 text-zinc-400">
                      {token.peakMcap ? `$${(token.peakMcap / 1000).toFixed(0)}K` : '—'}
                    </td>
                    <td className="py-2.5">
                      <Link
                        href={`/token/${token.mint}`}
                        className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No token launch history found</p>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; bg: string }> = {
    active: { color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    dead: { color: 'text-zinc-400', bg: 'bg-zinc-400/10' },
    rugged: { color: 'text-red-400', bg: 'bg-red-400/10' },
    unknown: { color: 'text-zinc-500', bg: 'bg-zinc-500/10' },
  };
  const c = config[status] || config.unknown;
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.color} ${c.bg}`}>
      {status}
    </span>
  );
}
