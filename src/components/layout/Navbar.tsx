'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Eye, Search, Wallet, TrendingUp, Info, LogOut, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { TIER_LABELS, TIER_COLORS } from '@/types';

export default function Navbar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { publicKey, signMessage, disconnect, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { user, loading: authLoading, login, logout } = useAuth();
  const [authInProgress, setAuthInProgress] = useState(false);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const mint = query.trim();
    if (mint.length >= 32) {
      router.push(`/token/${mint}`);
      setQuery('');
    }
  };

  const handleAuth = useCallback(async () => {
    if (!publicKey || !signMessage || authInProgress) return;
    setAuthInProgress(true);
    try {
      await login(publicKey.toBase58(), signMessage);
    } catch {
      // Auth failed — user can retry
    } finally {
      setAuthInProgress(false);
    }
  }, [publicKey, signMessage, authInProgress, login]);

  // Auto-authenticate when wallet connects
  useEffect(() => {
    if (connected && publicKey && signMessage && !user && !authLoading && !authInProgress) {
      handleAuth();
    }
  }, [connected, publicKey, signMessage, user, authLoading, authInProgress, handleAuth]);

  const handleDisconnect = useCallback(async () => {
    await disconnect();
    logout();
  }, [disconnect, logout]);

  const handleConnect = useCallback(() => {
    setVisible(true);
  }, [setVisible]);

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-white shrink-0">
          <Eye className="h-6 w-6 text-emerald-400" />
          <span>Fair<span className="text-emerald-400">Sight</span></span>
        </Link>

        <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Paste token mint address..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 py-2 pl-10 pr-4 text-sm text-white placeholder-zinc-500 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </form>

        <div className="flex items-center gap-4 shrink-0">
          <Link
            href="/trending"
            className="flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-white"
          >
            <TrendingUp className="h-4 w-4" />
            Trending
          </Link>
          {user && (
            <Link
              href="/watchlist"
              className="flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-white"
            >
              <Eye className="h-4 w-4" />
              Watchlist
            </Link>
          )}
          <Link
            href="/about"
            className="flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-white"
          >
            <Info className="h-4 w-4" />
            About
          </Link>

          {connected && user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5">
                <User className="h-4 w-4 text-zinc-400" />
                <span className="font-mono text-xs text-zinc-300">
                  {user.wallet.slice(0, 4)}...{user.wallet.slice(-4)}
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{
                    backgroundColor: `${TIER_COLORS[user.fairScoreTier]}20`,
                    color: TIER_COLORS[user.fairScoreTier],
                  }}
                >
                  {TIER_LABELS[user.fairScoreTier]}
                </span>
              </div>
              <button
                onClick={handleDisconnect}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-400 transition-colors hover:border-red-800 hover:text-red-400"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={authInProgress}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
            >
              <Wallet className="h-4 w-4" />
              {authInProgress ? 'Signing...' : 'Connect'}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
