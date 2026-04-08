# FairSight

Token trust intelligence platform for Solana. Analyzes the **people behind tokens** — deployer reputation, holder quality, and reputation-weighted community reviews.

> The Carfax for Solana tokens.

## What Makes FairSight Different

Every existing tool (RugCheck, SolSniffer, GoPlus) analyzes the **token contract**. FairSight analyzes the **people behind it**:

- **Deployer FairScore** — Reputation score via FairScale
- **Cross-launch history** — "Launched 47 tokens, 44 died within a week"
- **Holder quality** — FairScore distribution of current holders
- **Reputation-weighted reviews** — Gold-tier reviewer opinions carry more weight

## FairSight Score (0-100)

Composite trust score combining four pillars:

| Pillar | Weight | Sources |
|---|---|---|
| Reputation | 35% | Deployer FairScore, cross-launch history, holder quality |
| Security | 30% | GoPlus flags, RugCheck analysis |
| Market | 20% | Jupiter organic score, liquidity, holder concentration |
| Community | 15% | Weighted review average, review volume |

Grades: A+ (90-100) → A (80-89) → B (70-79) → C (60-69) → D (50-59) → F (0-49)

## Tech Stack

- Next.js 15 (App Router) + TypeScript
- TailwindCSS
- PostgreSQL 16 + Prisma ORM
- Redis 7
- Solana wallet-adapter + JWT auth

## Development

```bash
# Install dependencies
pnpm install

# Start database + cache
docker compose -f docker-compose.dev.yml up -d

# Run migrations
pnpm prisma migrate dev

# Start dev server
pnpm dev
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in API keys:

- `FAIRSCALE_API_KEY` — Get from [FairScale](https://sales.fairscale.xyz)
- `FAIRSIGHT_HELIUS_API_KEY` — Get from [Helius](https://helius.dev)

## Deployment

```bash
docker compose up -d --build
```

## Data Sources

- [FairScale](https://fairscale.xyz) — Wallet reputation scores
- [Helius](https://helius.dev) — On-chain data via DAS API
- [Jupiter](https://jup.ag) — Price and market data
- [RugCheck](https://rugcheck.xyz) — Risk analysis
- [GoPlus](https://gopluslabs.io) — Security flags

## License

MIT
