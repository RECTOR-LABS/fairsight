# FairSight — Project CLAUDE.md

## Mission
Token trust intelligence platform for Solana, powered by FairScale reputation data. Fairathon bounty submission ($5K USDC, deadline March 1, 2026).

## Tech Stack
- **Framework:** Next.js 15 (App Router, Turbopack) + TypeScript 5.9
- **Styling:** TailwindCSS 4 (dark theme, zinc palette, emerald accent)
- **DB:** PostgreSQL 16 (Prisma 7 ORM)
- **Cache:** Redis 7 (ioredis)
- **Auth:** Wallet signature (tweetnacl) + JWT (jsonwebtoken)
- **Package manager:** pnpm
- **Deploy:** Docker Compose → VPS (fairsight.rectorspace.com)
- **Node:** v24

## Architecture
- Multi-layer caching: Redis (hot, 4h-7d TTL) → Postgres (persistent, 24h-30d TTL) → API (budget-gated)
- FairScale API: 1000 req/mo free tier, budget manager tracks daily (33) / monthly usage
- Stale-while-revalidate: serve cached data immediately, return stale if budget exhausted
- Lazy Prisma initialization via Proxy pattern (required for Next.js build without DB)
- All API routes use `export const dynamic = 'force-dynamic'`

## External APIs
| Provider | Purpose | Rate Limit | Key Required |
|---|---|---|---|
| FairScale | Wallet reputation scores | 1000/mo free | Yes (FAIRSCALE_API_KEY) |
| Helius | On-chain data, DAS API | 100k credits/mo free | Yes (HELIUS_API_KEY) |
| Jupiter | Price, organic score | Unlimited | No |
| RugCheck | Risk scoring, insider detection | Unlimited | No |
| GoPlus | Honeypot, taxes, security flags | Unlimited | No |

## Ports
- App: 3000 (dev) / 8000 (Docker maps to 3000)
- PostgreSQL: 5435
- Redis: 6382

## Dev Commands
```bash
docker compose -f docker-compose.dev.yml up -d  # Start DB + Redis
pnpm dev                                         # Start dev server (port 3000)
pnpm prisma migrate dev                          # Run migrations (needs .env file)
pnpm prisma generate                             # Generate Prisma client
pnpm build                                       # Production build
```

## Prisma 7 Notes
- Config lives in `prisma.config.ts`, uses `datasource.url` via `env('DATABASE_URL')`
- Requires `import 'dotenv/config'` + `.env` file (NOT .env.local)
- `.env.local` is for Next.js runtime, `.env` is for Prisma CLI
- `earlyAccess`, `datasourceUrl`, `migrate.url()` are all invalid in v7

## Project Structure
```
src/
├── app/                    # Pages + API routes
│   ├── api/
│   │   ├── token/[mint]/report/  # Core report endpoint
│   │   ├── deployer/[address]/   # Deployer profile
│   │   ├── auth/                 # Wallet auth (challenge/verify)
│   │   ├── reviews/              # CRUD reviews
│   │   ├── watchlist/            # CRUD watchlist
│   │   ├── trending/             # Most-searched tokens
│   │   ├── search/               # Token search/validate
│   │   ├── embed/[mint]/         # SVG trust badge
│   │   └── cron/                 # Cache refresh (TODO)
│   ├── token/[mint]/             # Token report page
│   ├── deployer/[address]/       # Deployer profile page
│   ├── trending/                 # Trending page
│   ├── watchlist/                # Watchlist page (auth required)
│   └── about/                    # Methodology page
├── components/
│   ├── token/    # FairSightScoreCard, DeployerCard, SecurityFlags, MarketDataCard, HolderDistribution
│   └── layout/   # Navbar, Footer
├── lib/
│   ├── apis/     # fairscale.ts, helius.ts, jupiter.ts, rugcheck.ts, goplus.ts
│   ├── cache.ts  # Redis wrapper + cache keys/TTLs
│   ├── budget.ts # FairScale API budget manager
│   ├── scoring.ts # Composite FairSight Score algorithm
│   ├── auth.ts   # JWT + wallet signature verification
│   └── prisma.ts # Lazy Prisma singleton (Proxy pattern)
├── hooks/        # useTokenReport, useAuth
└── types/        # All TypeScript interfaces + constants
```

## Database Tables (8)
- `cached_fairscores` — wallet FairScore cache (30-day TTL)
- `cached_token_reports` — assembled report cache (24h TTL)
- `deployer_history` — cross-launch token records per deployer
- `users` — wallet-based auth, cached FairScore tier
- `reviews` — reputation-weighted community reviews (1 per user per token)
- `watchlist_items` — user token watchlists
- `search_log` — analytics for trending page
- `api_usage_log` — external API budget tracking

## FairSight Score Algorithm
```
FairSightScore = Reputation(35%) + Security(30%) + Market(20%) + Community(15%)

Reputation = deployerFairScore(50%) + crossLaunchHistory(30%) + holderQuality(20%)
Security   = goPlusFlags(60%) + rugcheckScore(40%)
Market     = jupiterOrganicScore(40%) + liquidity(30%) + holderConcentration(30%)
Community  = weightedReviewAvg(70%) + reviewVolume(30%)
```
Grades: A+ (90-100) → A (80-89) → B (70-79) → C (60-69) → D (50-59) → F (0-49)

## FairScore Integration (8 touchpoints — 30% of judging)
1. Deployer FairScore + tier badge (token report hero)
2. Deployer cross-launch history (deployer profile)
3. Holder FairScore distribution (chart component)
4. Composite score (35% reputation weight in algorithm)
5. Review gating (Silver+ tier required)
6. Review weighting (Bronze=1x, Silver=1.5x, Gold=2.5x, Platinum=4x)
7. User profile FairScore (on wallet connect)
8. Embeddable badge (/api/embed/[mint])

## Current Status (Day 2 In Progress — Feb 8)
- All foundation code written (55+ files)
- Build passes (`pnpm build` clean)
- 41 unit tests passing (`pnpm test` — scoring algorithm 100% coverage)
- Solana wallet-adapter wired up (connect/disconnect + auto-auth + tier badge)
- Review submission UI live (tier-gated, weighted, integrated)
- Watchlist bookmark button on token report page
- Vitest test framework configured
- Database migrated, Docker dev stack running
- Pushed to RECTOR-LABS/fairsight (GitHub + GitLab dual-push)
- Branch: `dev` (active development)
- **Blocking:** Need FairScale + Helius API keys for live data testing (Issue #5)
- **Remaining Day 2:** E2E testing with real tokens once API keys provided
