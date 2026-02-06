import { Eye, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-emerald-400" />
            <span className="font-semibold text-white">
              Fair<span className="text-emerald-400">Sight</span>
            </span>
            <span className="text-sm text-zinc-500">— Token Trust Intelligence</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <a
              href="https://fairscale.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 transition-colors hover:text-emerald-400"
            >
              Powered by FairScale
              <ExternalLink className="h-3 w-3" />
            </a>
            <Link href="/about" className="transition-colors hover:text-white">
              Methodology
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-600">
          FairSight provides reputation-based token analysis. This is not financial advice.
          Always do your own research before making investment decisions.
        </p>
      </div>
    </footer>
  );
}
