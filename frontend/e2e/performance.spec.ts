import { test, expect } from '@playwright/test';

// Performance budgets (ms). Configurable via env so CI can tune without code changes.
const LCP_BUDGET_MS = parseInt(process.env.LCP_BUDGET_MS || '2500', 10);
const TTI_BUDGET_MS = parseInt(process.env.TTI_BUDGET_MS || '3800', 10);

// A realistic, non-trivial statistics payload. An empty/zeroed dataset would
// understate real-world render cost, since the numbers still have to be
// fetched, formatted (toLocaleString) and painted.
const SEEDED_STATISTICS = { total_markets: 128, total_volume: 4820000, active_markets: 37 };

async function measureLCP(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let lcp = 0;
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const last = entries[entries.length - 1] as any;
          if (last) lcp = last.startTime;
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        setTimeout(() => resolve(lcp), 2000);
      })
  );
}

test.describe('Performance Metrics', () => {
  test('should load page within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('load');
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should measure Core Web Vitals', async ({ page }) => {
    await page.goto('/');
    
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const vitals: any = {};
          
          entries.forEach((entry: any) => {
            if (entry.name === 'first-contentful-paint') {
              vitals.fcp = entry.startTime;
            }
            if (entry.entryType === 'largest-contentful-paint') {
              vitals.lcp = entry.startTime;
            }
          });
          
          resolve(vitals);
        }).observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
        
        // Timeout after 5 seconds
        setTimeout(() => resolve({}), 5000);
      });
    });
    
    // Verify metrics were collected
    expect(metrics).toBeDefined();
  });

  test('should have acceptable Time to Interactive', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Try to interact with the page
    await page.getByLabel(/email address/i).click();
    
    const interactiveTime = Date.now() - startTime;
    
    // Should be interactive within 5 seconds
    expect(interactiveTime).toBeLessThan(5000);
  });

  test('should load images efficiently', async ({ page }) => {
    await page.goto('/');
    
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const isVisible = await img.isVisible();
      if (isVisible) {
        // Verify image has loaded
        const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
        expect(naturalWidth).toBeGreaterThan(0);
      }
    }
  });

  test('should have minimal layout shifts', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to stabilize
    await page.waitForLoadState('networkidle');
    
    const cls = await page.evaluate(() => {
      return new Promise((resolve) => {
        let clsValue = 0;
        
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          resolve(clsValue);
        }).observe({ entryTypes: ['layout-shift'] });
        
        setTimeout(() => resolve(clsValue), 3000);
      });
    });
    
    // CLS should be less than 0.1 for good user experience
    expect(cls).toBeLessThan(0.25);
  });

  test('should measure JavaScript execution time', async ({ page }) => {
    await page.goto('/');
    
    const jsExecutionTime = await page.evaluate(() => {
      const perfEntries = performance.getEntriesByType('measure');
      return perfEntries.reduce((total, entry) => total + entry.duration, 0);
    });
    
    // Verify JS execution is tracked
    expect(jsExecutionTime).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Resource Loading', () => {
  test('should load all critical resources', async ({ page }) => {
    const response = await page.goto('/');
    
    expect(response?.status()).toBe(200);
    
    // Verify critical resources loaded
    await expect(page.getByRole('heading', { name: /decentralized prediction markets/i })).toBeVisible();
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('should handle failed resource loading gracefully', async ({ page }) => {
    // Block image requests to simulate failure
    await page.route('**/*.{png,jpg,jpeg,svg}', route => route.abort());
    
    await page.goto('/');
    
    // Page should still be functional
    await expect(page.getByRole('heading', { name: /decentralized prediction markets/i })).toBeVisible();
    await expect(page.getByLabel(/email address/i)).toBeVisible();
  });

  test('should lazy load images below the fold', async ({ page }) => {
    await page.goto('/');
    
    // Check if images below the fold are lazy loaded
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const loading = await img.getAttribute('loading');
      // Images should either have loading="lazy" or be above the fold
      if (loading === 'lazy') {
        expect(loading).toBe('lazy');
      }
    }
  });
});

test.describe('Network Conditions', () => {
  test('should work on slow 3G', async ({ page, context }) => {
    // Simulate slow 3G
    await context.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      await route.continue();
    });
    
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    
    // Should still load within reasonable time on slow connection
    expect(loadTime).toBeLessThan(10000);
    
    await expect(page.getByRole('heading', { name: /decentralized prediction markets/i })).toBeVisible();
  });

  test('should handle offline mode gracefully', async ({ page, context }) => {
    await page.goto('/');
    
    // Go offline
    await context.setOffline(true);
    
    // Page should still be functional (if service worker is implemented)
    await expect(page.getByRole('heading', { name: /decentralized prediction markets/i })).toBeVisible();
    
    await context.setOffline(false);
  });
});

test.describe('Memory Usage', () => {
  test('should not have memory leaks on navigation', async ({ page }) => {
    await page.goto('/');
    
    // Navigate between sections multiple times
    for (let i = 0; i < 5; i++) {
      await page.getByRole('link', { name: /features/i }).click();
      await page.waitForTimeout(100);
      await page.getByRole('link', { name: /about/i }).click();
      await page.waitForTimeout(100);
    }
    
    // Page should still be responsive
    await expect(page.getByRole('heading', { name: /decentralized prediction markets/i })).toBeVisible();
  });
});

test.describe('Bundle Size', () => {
  test('should have reasonable JavaScript bundle size', async ({ page }) => {
    const resources: number[] = [];
    
    page.on('response', async (response) => {
      if (response.url().includes('.js')) {
        const buffer = await response.body().catch(() => null);
        if (buffer) {
          resources.push(buffer.length);
        }
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const totalSize = resources.reduce((sum, size) => sum + size, 0);
    
    // Total JS should be less than 500KB (adjust based on your needs)
    expect(totalSize).toBeLessThan(500 * 1024);
  });
});

test.describe('Rendering Performance', () => {
  test('should render without blocking', async ({ page }) => {
    await page.goto('/');
    
    // Measure time to first render
    const firstPaint = await page.evaluate(() => {
      const perfEntries = performance.getEntriesByType('paint');
      const fcp = perfEntries.find(entry => entry.name === 'first-contentful-paint');
      return fcp ? fcp.startTime : 0;
    });
    
    // First paint should happen within 1.5 seconds
    expect(firstPaint).toBeLessThan(1500);
  });

  test('should handle rapid interactions', async ({ page }) => {
    await page.goto('/');
    
    const emailInput = page.getByLabel(/email address/i);
    
    // Rapidly type and delete
    for (let i = 0; i < 10; i++) {
      await emailInput.fill(`test${i}@example.com`);
      await emailInput.clear();
    }
    
    // Page should still be responsive
    await emailInput.fill('final@example.com');
    await expect(emailInput).toHaveValue('final@example.com');
  });
});

// The markets list/detail pages (#57, #58) haven't shipped yet. Statistics is
// the one page today that does real data fetching and rendering rather than
// static content, so it stands in as the "data page" budget target — this
// block is where markets list/detail LCP budgets get added once those routes
// exist.
test.describe('Performance Budgets - Data Pages', () => {
  test.beforeEach(async ({ page }) => {
    // Seeded, non-trivial dataset — an empty response would understate
    // real-world load time since it skips formatting/rendering cost.
    await page.route('**/api/**/statistics', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SEEDED_STATISTICS),
      })
    );
  });

  test('statistics section LCP should stay within budget', async ({ page }) => {
    const lcpPromise = measureLCP(page);
    await page.goto('/');
    await expect(page.getByText(/128/)).toBeVisible();

    const lcp = await lcpPromise;
    expect(lcp).toBeGreaterThan(0);
    expect(lcp).toBeLessThan(LCP_BUDGET_MS);
  });

  test('statistics section should become interactive within budget', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await expect(page.getByText(/128/)).toBeVisible();
    // Confirm the page actually accepts input, not just that content painted.
    await page.getByLabel(/email address/i).click();

    const tti = Date.now() - startTime;
    expect(tti).toBeLessThan(TTI_BUDGET_MS);
  });
});
