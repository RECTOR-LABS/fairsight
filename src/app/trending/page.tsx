'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, Loader2, Search } from 'lucide-react';

interface TrendingToken {
  mint: string;
  searchCount: number;
  name?: string;
  symbol?: string;
  fairsightScore?: number;
  grade?: string;
}

const gradeColors: Record<string, string> = {
  'A+': 'text-emerald-400',
  'A': 'text-emerald-400',
  'B': 'text-lime-400',
  'C': 'text-yellow-400',
  'D': 'text-orange-400',
  'F': 'text-red-400',
};

export default function TrendingPage() {
  const [tokens, setTokens] = useState<TrendingToken[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/trending')
      .then((res) => res.json())
      .then(setTokens)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <TrendingUp className="h-6 w-6 text-emerald-400" />
        <h1 className="text-2xl font-bold text-white">Trending Tokens</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
        </div>
      ) : tokens.length > 0 ? (
        <div className="space-y-2">
          {tokens.map((token, i) => (
            <Link
              key={token.mint}
              href={`/token/${token.mint}`}
              className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition-colors hover:border-zinc-700"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold text-zinc-400">
                {i + 1}
              </span>
              <div className="flex-1">
                <p className="font-medium text-white">
                  {token.name || 'Unknown'}{' '}
                  <span className="text-zinc-500">({token.symbol || '???'})</span>
                </p>
                <p className="font-mono text-xs text-zinc-600">
                  {token.mint.slice(0, 8)}...{token.mint.slice(-8)}
                </p>
              </div>
              {token.fairsightScore !== undefined && (
                <div className="text-right">
                  <p className={`text-lg font-bold ${gradeColors[token.grade || 'F']}`}>
                    {token.grade}
                  </p>
                  <p className="text-xs text-zinc-500">{token.fairsightScore}/100</p>
                </div>
              )}
              <div className="flex items-center gap-1 text-xs text-zinc-500">
                <Search className="h-3 w-3" />
                {token.searchCount}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="text-zinc-500">No trending tokens yet. Be the first to search!</p>
        </div>
      )}
    </div>
  );
}
