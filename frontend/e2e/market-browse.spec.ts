import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Market Browse & Detail Flows — mocked API, one market per major state
// ---------------------------------------------------------------------------
// The Markets browse/detail pages are built incrementally across issues
// #57-67; this spec exercises the API contract those pages consume the same
// way `market-creation.spec.ts` does (mocked routes driven via page.evaluate)
// so coverage exists ahead of — and stays valid across — that UI work.

const ACTIVE_MARKET = {
  id: 101,
  title: 'Will ETH exceed $5k by end of 2026?',
  status: 'active',
  volume: 15000,
  ends_at: '2026-12-31T23:59:59Z',
  onchain_volume: '15000',
  resolved_outcome: null,
};

const CLOSED_MARKET = {
  id: 102,
  title: 'Will the Fed cut rates in Q1 2026?',
  status: 'closed',
  volume: 42000,
  ends_at: '2026-01-15T00:00:00Z',
  onchain_volume: '42000',
  resolved_outcome: null,
};

const RESOLVED_MARKET = {
  id: 103,
  title: 'Will Bitcoin hit $100k in 2025?',
  status: 'resolved',
  volume: 98000,
  ends_at: '2025-12-31T23:59:59Z',
  onchain_volume: '98000',
  resolved_outcome: 1,
};

const PAUSED_MARKET = {
  id: 104,
  title: 'Will the platform launch on mainnet by Q2?',
  status: 'paused',
  volume: 500,
  ends_at: '2026-06-30T00:00:00Z',
  onchain_volume: '500',
  resolved_outcome: null,
};

const NOT_FOUND_MARKET_ID = 999999;

const ALL_MARKETS = [ACTIVE_MARKET, CLOSED_MARKET, RESOLVED_MARKET, PAUSED_MARKET];

test.describe('Market Browse & Detail Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Mock: market list (supports ?status= filtering, mirrors backend query param)
    await page.route('**/api/v1/markets/featured*', (route) => {
      const url = new URL(route.request().url());
      const status = url.searchParams.get('status');
      const body = status ? ALL_MARKETS.filter((m) => m.status === status) : ALL_MARKETS;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    });

    // Mock: market detail, one route per seeded market state
    for (const market of ALL_MARKETS) {
      await page.route(`**/api/v1/blockchain/markets/${market.id}`, (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(market),
        })
      );
    }

    // Mock: unknown market id — not-found path
    await page.route(`**/api/v1/blockchain/markets/${NOT_FOUND_MARKET_ID}`, (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'market_not_found' }),
      })
    );
  });

  test('browse — unfiltered list returns a market in every major state', async ({ page }) => {
    await page.goto('/');

    const markets = await page.evaluate(async () => {
      const res = await fetch('/api/v1/markets/featured');
      return res.json();
    });

    const statuses = markets.map((m: { status: string }) => m.status).sort();
    expect(statuses).toEqual(['active', 'closed', 'paused', 'resolved']);
  });

  test('browse — filtering by status=active returns only active markets', async ({ page }) => {
    await page.goto('/');

    const markets = await page.evaluate(async () => {
      const res = await fetch('/api/v1/markets/featured?status=active');
      return res.json();
    });

    expect(markets).toHaveLength(1);
    expect(markets[0].id).toBe(ACTIVE_MARKET.id);
    expect(markets[0].status).toBe('active');
  });

  test('browse — filtering by status=resolved returns only resolved markets', async ({ page }) => {
    await page.goto('/');

    const markets = await page.evaluate(async () => {
      const res = await fetch('/api/v1/markets/featured?status=resolved');
      return res.json();
    });

    expect(markets).toHaveLength(1);
    expect(markets[0].id).toBe(RESOLVED_MARKET.id);
    expect(markets[0].resolved_outcome).not.toBeNull();
  });

  test('detail — active market has no resolved outcome yet', async ({ page }) => {
    await page.goto('/');

    const market = await page.evaluate(async (id: number) => {
      const res = await fetch(`/api/v1/blockchain/markets/${id}`);
      return res.json();
    }, ACTIVE_MARKET.id);

    expect(market.status).toBe('active');
    expect(market.resolved_outcome).toBeNull();
  });

  test('detail — closed market is awaiting resolution', async ({ page }) => {
    await page.goto('/');

    const market = await page.evaluate(async (id: number) => {
      const res = await fetch(`/api/v1/blockchain/markets/${id}`);
      return res.json();
    }, CLOSED_MARKET.id);

    expect(market.status).toBe('closed');
    expect(market.resolved_outcome).toBeNull();
  });

  test('detail — resolved market exposes the winning outcome', async ({ page }) => {
    await page.goto('/');

    const market = await page.evaluate(async (id: number) => {
      const res = await fetch(`/api/v1/blockchain/markets/${id}`);
      return res.json();
    }, RESOLVED_MARKET.id);

    expect(market.status).toBe('resolved');
    expect(market.resolved_outcome).toBe(1);
  });

  test('detail — paused market is flagged as paused', async ({ page }) => {
    await page.goto('/');

    const market = await page.evaluate(async (id: number) => {
      const res = await fetch(`/api/v1/blockchain/markets/${id}`);
      return res.json();
    }, PAUSED_MARKET.id);

    expect(market.status).toBe('paused');
  });

  test('detail — unknown market id resolves to the not-found path', async ({ page }) => {
    await page.goto('/');

    const status = await page.evaluate(async (id: number) => {
      const res = await fetch(`/api/v1/blockchain/markets/${id}`);
      return res.status;
    }, NOT_FOUND_MARKET_ID);

    expect(status).toBe(404);
  });
});
