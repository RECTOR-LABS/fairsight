# FairSight — Roadmap

## Phase 1: Foundation + Core Report (Week 1: Feb 6-12)
- [x] Scaffold Next.js 15 + Prisma 7 + Docker
- [x] Database schema (8 tables) + initial migration
- [x] All 5 API clients (FairScale, Helius, Jupiter, RugCheck, GoPlus)
- [x] Redis cache layer + multi-layer caching strategy
- [x] FairScale API budget manager (33/day, 1000/month)
- [x] Core report pipeline (/api/token/[mint]/report)
- [x] FairSight Score algorithm (4 pillars, 10 sub-metrics)
- [x] Landing page with search
- [x] Token report page (ScoreCard, DeployerCard, SecurityFlags, MarketData, HolderDistribution)
- [x] Deployer profile page + API route
- [x] Trending page + API route
- [x] Watchlist page + API route
- [x] About/methodology page
- [x] Wallet auth API (challenge/verify + JWT)
- [x] Review system API (submit + weighted display)
- [x] Embeddable SVG trust badge (/api/embed/[mint])
- [x] GitHub repo (RECTOR-LABS/fairsight) + GitLab mirror + dual-push
- [x] **API keys**: Helius configured (Jupiter now requires auth — using Helius price fallback)
- [x] Test with real Solana tokens (BONK: Score 64/C, $559M mcap, 50 holders)
- [x] Fix API response parsing issues (RugCheck string fields, Helius DAS params, NaN guards)
- [x] Write tests for scoring algorithm (41 tests, 100% coverage on scoring module)

## Phase 2: Depth + Differentiation (Week 2: Feb 13-19)
- [x] Wire up real wallet connect (Solana wallet-adapter provider)
- [x] Cross-launch intelligence scanner (Helius tx history for deployer tokens)
- [x] Populate deployer_history table from real data
- [x] Holder FairScore batch fetching optimization
- [x] Review submission UI on token report page
- [x] Watchlist add/remove buttons on token report page
- [x] Responsive design pass (mobile breakpoints)
- [x] Error boundaries + loading skeletons
- [x] Cron job for cache refresh (/api/cron/)
- [x] Integration testing with multiple tokens

## Phase 3: Polish + Ship (Week 3: Feb 20-27)
- [ ] VPS deployment (Docker + nginx + certbot + GitHub Actions CI/CD)
- [ ] OG images (dynamic per token)
- [ ] SEO (meta tags, structured data, sitemap)
- [ ] Performance optimization (bundle size, lazy loading)
- [ ] Demo video + pitch deck
- [ ] X/Twitter account + content
- [ ] Final QA + submit to Fairathon (deadline: March 1)

## Post-Bounty (Scope Cuts)
- Email/push alerts for watchlist changes
- Real-time WebSocket updates
- Public API for developers
- Birdeye integration
- Historical score tracking charts
- Mobile app
