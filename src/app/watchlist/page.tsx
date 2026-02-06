'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bookmark, Loader2, Trash2, LogIn } from 'lucide-react';
import type { WatchlistEntry } from '@/types';

const gradeColors: Record<string, string> = {
  'A+': 'text-emerald-400',
  'A': 'text-emerald-400',
  'B': 'text-lime-400',
  'C': 'text-yellow-400',
  'D': 'text-orange-400',
  'F': 'text-red-400',
};

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('fairsight_token');
    if (!token) {
      setLoading(false);
      return;
    }
    setAuthed(true);

    fetch('/api/watchlist', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const removeItem = async (tokenMint: string) => {
    const token = localStorage.getItem('fairsight_token');
    if (!token) return;

    await fetch('/api/watchlist', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ tokenMint }),
    });

    setItems((prev) => prev.filter((i) => i.tokenMint !== tokenMint));
  };

  if (!authed) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <LogIn className="h-8 w-8 text-zinc-500" />
          <p className="text-white">Connect your wallet to view your watchlist</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <Bookmark className="h-6 w-6 text-emerald-400" />
        <h1 className="text-2xl font-bold text-white">Watchlist</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
        </div>
      ) : items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
            >
              <Link href={`/token/${item.tokenMint}`} className="flex-1">
                <p className="font-medium text-white hover:text-emerald-400">
                  {item.tokenName || 'Unknown'}{' '}
                  <span className="text-zinc-500">({item.tokenSymbol || '???'})</span>
                </p>
                <p className="font-mono text-xs text-zinc-600">
                  {item.tokenMint.slice(0, 8)}...{item.tokenMint.slice(-8)}
                </p>
              </Link>
              {item.fairsightScore !== undefined && (
                <div className="text-right">
                  <p className={`text-lg font-bold ${gradeColors[item.grade || 'F']}`}>
                    {item.grade}
                  </p>
                  <p className="text-xs text-zinc-500">{item.fairsightScore}/100</p>
                </div>
              )}
              <button
                onClick={() => removeItem(item.tokenMint)}
                className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="text-zinc-500">Your watchlist is empty. Add tokens from their report page.</p>
        </div>
      )}
    </div>
  );
}
