'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bookmark } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface WatchlistButtonProps {
  tokenMint: string;
}

export default function WatchlistButton({ tokenMint }: WatchlistButtonProps) {
  const { user, token } = useAuth();
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkWatchlist = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/watchlist', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const items = await res.json();
      setIsWatchlisted(items.some((item: { tokenMint: string }) => item.tokenMint === tokenMint));
    } catch {
      // Silently fail — non-critical
    }
  }, [token, tokenMint]);

  useEffect(() => {
    checkWatchlist();
  }, [checkWatchlist]);

  const toggle = async () => {
    if (!token || loading) return;
    setLoading(true);

    try {
      const method = isWatchlisted ? 'DELETE' : 'POST';
      const res = await fetch('/api/watchlist', {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tokenMint }),
      });

      if (res.ok) {
        setIsWatchlisted(!isWatchlisted);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={isWatchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:opacity-50 ${
        isWatchlisted
          ? 'border-emerald-700 bg-emerald-950/50 text-emerald-400 hover:border-emerald-600'
          : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
      }`}
    >
      <Bookmark
        className={`h-4 w-4 ${isWatchlisted ? 'fill-emerald-400' : ''}`}
      />
      {isWatchlisted ? 'Watchlisted' : 'Watchlist'}
    </button>
  );
}
