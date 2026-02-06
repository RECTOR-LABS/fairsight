-- CreateTable
CREATE TABLE "cached_fairscores" (
    "id" TEXT NOT NULL,
    "wallet" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "tier" INTEGER NOT NULL,
    "tierLabel" TEXT NOT NULL,
    "details" JSONB,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cached_fairscores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cached_token_reports" (
    "id" TEXT NOT NULL,
    "mint" TEXT NOT NULL,
    "report" JSONB NOT NULL,
    "fairsightScore" DOUBLE PRECISION NOT NULL,
    "grade" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cached_token_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployer_history" (
    "id" TEXT NOT NULL,
    "deployerWallet" TEXT NOT NULL,
    "tokenMint" TEXT NOT NULL,
    "tokenName" TEXT,
    "tokenSymbol" TEXT,
    "launchDate" TIMESTAMP(3),
    "currentStatus" TEXT,
    "peakMcap" DOUBLE PRECISION,
    "currentMcap" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deployer_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "wallet" TEXT NOT NULL,
    "fairScore" DOUBLE PRECISION,
    "fairScoreTier" INTEGER NOT NULL DEFAULT 0,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenMint" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watchlist_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenMint" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watchlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_log" (
    "id" TEXT NOT NULL,
    "tokenMint" TEXT NOT NULL,
    "query" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_usage_log" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "latencyMs" INTEGER,
    "date" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_usage_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cached_fairscores_wallet_key" ON "cached_fairscores"("wallet");

-- CreateIndex
CREATE INDEX "cached_fairscores_wallet_idx" ON "cached_fairscores"("wallet");

-- CreateIndex
CREATE INDEX "cached_fairscores_expiresAt_idx" ON "cached_fairscores"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "cached_token_reports_mint_key" ON "cached_token_reports"("mint");

-- CreateIndex
CREATE INDEX "cached_token_reports_mint_idx" ON "cached_token_reports"("mint");

-- CreateIndex
CREATE INDEX "cached_token_reports_expiresAt_idx" ON "cached_token_reports"("expiresAt");

-- CreateIndex
CREATE INDEX "deployer_history_deployerWallet_idx" ON "deployer_history"("deployerWallet");

-- CreateIndex
CREATE UNIQUE INDEX "deployer_history_deployerWallet_tokenMint_key" ON "deployer_history"("deployerWallet", "tokenMint");

-- CreateIndex
CREATE UNIQUE INDEX "users_wallet_key" ON "users"("wallet");

-- CreateIndex
CREATE INDEX "users_wallet_idx" ON "users"("wallet");

-- CreateIndex
CREATE INDEX "reviews_tokenMint_idx" ON "reviews"("tokenMint");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_userId_tokenMint_key" ON "reviews"("userId", "tokenMint");

-- CreateIndex
CREATE INDEX "watchlist_items_userId_idx" ON "watchlist_items"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "watchlist_items_userId_tokenMint_key" ON "watchlist_items"("userId", "tokenMint");

-- CreateIndex
CREATE INDEX "search_log_tokenMint_idx" ON "search_log"("tokenMint");

-- CreateIndex
CREATE INDEX "search_log_createdAt_idx" ON "search_log"("createdAt");

-- CreateIndex
CREATE INDEX "api_usage_log_provider_date_idx" ON "api_usage_log"("provider", "date");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
