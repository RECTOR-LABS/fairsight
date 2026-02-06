# FairSight — Project CLAUDE.md

## Mission
Token trust intelligence platform for Solana, powered by FairScale reputation data. Fairathon bounty submission ($5K USDC, deadline March 1, 2026).

## Tech Stack
- **Framework:** Next.js 15 (App Router) + TypeScript
- **Styling:** TailwindCSS (dark theme)
- **DB:** PostgreSQL 16 (Prisma ORM)
- **Cache:** Redis 7
- **Auth:** Wallet signature (Solana wallet-adapter) + JWT
- **Package manager:** pnpm
- **Deploy:** Docker Compose → VPS (fairsight.rectorspace.com)

## Architecture
- Multi-layer caching: Redis (hot) → Postgres (persistent) → API (budget-gated)
- FairScale API: 1000 req/mo free tier, budget manager tracks daily/monthly usage
- Composite FairSight Score: Reputation(35%) + Security(30%) + Market(20%) + Community(15%)

## External APIs
| Provider | Purpose | Rate Limit |
|---|---|---|
| FairScale | Wallet reputation scores | 1000/mo free |
| Helius | On-chain data, DAS API | 100k credits/mo free |
| Jupiter | Price, organic score | No key needed |
| RugCheck | Risk scoring | No key needed |
| GoPlus | Security flags | No key needed |

## Docker Ports
- App: 8000 (maps to 3000 internal)
- PostgreSQL: 5435
- Redis: 6382

## Dev Commands
```bash
docker compose -f docker-compose.dev.yml up -d  # Start DB + Redis
pnpm dev                                         # Start dev server
pnpm prisma migrate dev                          # Run migrations
pnpm prisma generate                             # Generate Prisma client
pnpm build                                       # Production build
```

## Key Files
- `src/lib/scoring.ts` — Composite FairSight Score algorithm
- `src/lib/budget.ts` — FairScale API budget manager
- `src/lib/apis/` — All 5 external API clients
- `src/app/api/token/[mint]/report/route.ts` — Core report endpoint
- `prisma/schema.prisma` — Database schema (8 tables)

## FairScore Integration (8 touchpoints)
1. Deployer FairScore + tier badge (token report hero)
2. Deployer cross-launch history (deployer profile)
3. Holder FairScore distribution (chart)
4. Composite score (35% reputation weight)
5. Review gating (Silver+ only)
6. Review weighting (tier-based multipliers)
7. User profile FairScore (on connect)
8. Embeddable badge (/api/embed/[mint])
