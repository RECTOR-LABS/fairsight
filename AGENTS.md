<!-- Satellite context file — extends the global hub (~/.claude/CLAUDE.md | ~/.pi/agent/AGENTS.md). Host-neutral; project-specific only. Do not duplicate hub standards here. -->

# FairSight

> Token trust intelligence platform for Solana, powered by FairScale reputation data. Fairathon bounty submission ($5K USDC, deadline March 1, 2026).

## Tech Stack

- **Framework:** Next.js 15 (App Router, Turbopack) + TypeScript 5.9
- **Styling:** TailwindCSS 4 (dark theme, zinc palette, emerald accent)
- **DB:** PostgreSQL 16 (Prisma 7 ORM)
- **Cache:** Redis 7 (ioredis)
- **Auth:** Wallet signature (tweetnacl) + JWT (jsonwebtoken)
- **Package manager:** pnpm · **Node:** v24
- **Deploy:** Docker Compose → VPS (fairsight.rectorspace.com)

## Architecture

- Multi-layer caching: Redis (hot, 4h-7d TTL) → Postgres (persistent, 24h-30d TTL) → API (budget-gated)
- FairScale API: 1000 req/mo free tier; budget manager tracks daily (33) / monthly usage
- Stale-while-revalidate: serve cached data immediately, return stale if budget exhausted
- Lazy Prisma initialization via Proxy pattern (required for Next.js build without DB)
- All API routes use `export const dynamic = 'force-dynamic'`

## External APIs

| Provider | Purpose | Rate Limit | Key Required |
|---|---|---|---|
| FairScale | Wallet reputation scores | 1000/mo free | Yes (`FAIRSCALE_API_KEY`) |
| Helius | On-chain data, DAS API | 100k credits/mo free | Yes (`FAIRSIGHT_HELIUS_API_KEY`) |
| Jupiter | Price, organic score | Unlimited | No |
| RugCheck | Risk scoring, insider detection | Unlimited | No |
| GoPlus | Honeypot, taxes, security flags | Unlimited | No |

## Ports

App: 3000 (dev) / 8000 (Docker → 3000) · PostgreSQL: 5435 · Redis: 6382

## Common Commands

```bash
docker compose -f docker-compose.dev.yml up -d  # Start DB + Redis
pnpm dev                                         # Dev server (port 3000)
pnpm prisma migrate dev                          # Run migrations (needs .env)
pnpm prisma generate                             # Generate Prisma client
pnpm build                                       # Production build
```

## Prisma 7 Notes

- Config lives in `prisma.config.ts`, uses `datasource.url` via `env('DATABASE_URL')`
- Requires `import 'dotenv/config'` + `.env` file (NOT `.env.local`)
- `.env.local` is for Next.js runtime, `.env` is for Prisma CLI
- `earlyAccess`, `datasourceUrl`, `migrate.url()` are all invalid in v7

## Project Structure

```
src/
├── app/                    # Pages + API routes
│   ├── api/{token/[mint]/report, deployer/[address], auth, reviews, watchlist,
│   │        trending, search, embed/[mint], cron}/
│   ├── {token/[mint], deployer/[address], trending, watchlist, about}/
├── components/{token, layout}/
├── lib/
│   ├── apis/{fairscale,helius,jupiter,rugcheck,goplus}.ts
│   ├── cache.ts · budget.ts · scoring.ts · auth.ts · prisma.ts
├── hooks/{useTokenReport, useAuth}
└── types/
```

## Database Tables (8)

`cached_fairscores` (wallet FairScore cache, 30d TTL) · `cached_token_reports` (24h TTL) · `deployer_history` (cross-launch records) · `users` (wallet auth, FairScore tier) · `reviews` (reputation-weighted, 1 per user per token) · `watchlist_items` · `search_log` · `api_usage_log`.

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

1. Deployer FairScore + tier badge (token report hero) · 2. Deployer cross-launch history · 3. Holder FairScore distribution (chart) · 4. Composite score (35% reputation weight) · 5. Review gating (Silver+ tier required) · 6. Review weighting (Bronze=1x, Silver=1.5x, Gold=2.5x, Platinum=4x) · 7. User profile FairScore (on wallet connect) · 8. Embeddable badge (`/api/embed/[mint]`).

## Current Status

Phase 3 in progress (Feb 15): Phase 1 25/25, Phase 2 10/10, Phase 3 2/7. Build clean. 109 tests passing (41 scoring + 68 API/integration). OG images (static root + dynamic token + dynamic deployer). SEO (robots, sitemap, title templates, twitter cards). Branch `dev`. **Next:** VPS deployment, perf optimization, demo video, X/Twitter, final QA + submit.