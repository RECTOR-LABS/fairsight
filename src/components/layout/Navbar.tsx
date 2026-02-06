'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, Search, Wallet, TrendingUp, Info } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const mint = query.trim();
    if (mint.length >= 32) {
      router.push(`/token/${mint}`);
      setQuery('');
    }
  };

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
          <Link
            href="/about"
            className="flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-white"
          >
            <Info className="h-4 w-4" />
            About
          </Link>
          <button className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500">
            <Wallet className="h-4 w-4" />
            Connect
          </button>
        </div>
      </div>
    </nav>
  );
}
