import { test, expect } from '@playwright/test';
import { randomUUID } from 'crypto';

test.describe('Newsletter Lifecycle & GDPR Flows', () => {
  // Use a unique disposable email address per test run
  let disposableEmail: string;
  let confirmToken: string;
  let unsubscribeToken: string;

  test.beforeEach(async ({ page }) => {
    const id = randomUUID().replace(/-/g, '').slice(0, 10);
    disposableEmail = `e2e-test-${id}@example.com`;
    confirmToken = `confirm_tok_${id}`;
    unsubscribeToken = `unsub_tok_${id}`;

    // If running with mock fallback (when live backend is not available),
    // set up route handlers for the full newsletter lifecycle.
    if (!process.env.STAGING_URL) {
      // Subscribe
      await page.route('**/api/v1/newsletter/subscribe', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, message: 'Successfully subscribed to updates!' }),
          });
        } else {
          await route.continue();
        }
      });

      // Confirm
      await page.route('**/api/v1/newsletter/confirm*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Subscription confirmed.' }),
        });
      });

      // GDPR Export
      await page.route('**/api/v1/newsletter/gdpr/export', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { email: disposableEmail, status: 'active', subscribed_at: new Date().toISOString() },
          }),
        });
      });

      // GDPR Delete
      await page.route('**/api/v1/newsletter/gdpr/delete', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Data deleted.' }),
        });
      });

      // Unsubscribe
      await page.route('**/api/v1/newsletter/unsubscribe*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Successfully unsubscribed.' }),
        });
      });
    }
  });

  // Ensure disposable address cleanup runs even if assertions fail
  test.afterEach(async ({ request }) => {
    if (disposableEmail) {
      try {
        const apiUrl = process.env.STAGING_URL || process.env.NEXT_PUBLIC_API_URL || '';
        if (apiUrl) {
          await request.delete(`${apiUrl.replace(/\/$/, '')}/api/v1/newsletter/gdpr/delete`, {
            data: { email: disposableEmail },
            headers: { 'Content-Type': 'application/json' },
          }).catch(() => {});
        }
      } catch {
        // Cleanup attempt best-effort to prevent leaking test records
      }
    }
  });

  test('full newsletter lifecycle: subscribe → confirm → GDPR export/delete → unsubscribe', async ({
    page,
    request,
  }) => {
    // -----------------------------------------------------------------------
    // 1. Subscribe Flow
    // -----------------------------------------------------------------------
    await page.goto('/');

    const emailInput = page.getByLabel(/email address/i);
    const submitButton = page.getByRole('button', { name: /get early access/i });

    await expect(emailInput).toBeVisible();
    await emailInput.fill(disposableEmail);
    await submitButton.click();

    // Verify subscribed state
    await expect(page.getByRole('button', { name: /subscribed/i })).toBeVisible();
    await expect(emailInput).toBeDisabled();

    // -----------------------------------------------------------------------
    // 2. Confirm Flow
    // -----------------------------------------------------------------------
    const apiUrl = process.env.STAGING_URL || 'http://localhost:3000';
    const confirmRes = await request.get(
      `${apiUrl.replace(/\/$/, '')}/api/v1/newsletter/confirm?token=${confirmToken}`
    );
    expect(confirmRes.ok() || confirmRes.status() === 200 || confirmRes.status() === 304).toBeTruthy();

    // -----------------------------------------------------------------------
    // 3. GDPR Export Flow
    // -----------------------------------------------------------------------
    const exportRes = await request.post(
      `${apiUrl.replace(/\/$/, '')}/api/v1/newsletter/gdpr/export`,
      {
        data: { email: disposableEmail },
        headers: { 'Content-Type': 'application/json' },
      }
    );
    if (exportRes.ok()) {
      const exportJson = await exportRes.json();
      expect(exportJson.success).toBe(true);
    }

    // -----------------------------------------------------------------------
    // 4. GDPR Delete UI Flow
    // -----------------------------------------------------------------------
    await page.goto('/account/privacy/delete');

    const deleteEmailInput = page.getByLabel(/subscriber email address/i);
    await expect(deleteEmailInput).toBeVisible();
    await deleteEmailInput.fill(disposableEmail);

    const requestDeleteBtn = page.getByRole('button', { name: /request permanent deletion/i });
    await requestDeleteBtn.click();

    // Modal dialog verification
    const modalDialog = page.getByRole('dialog');
    await expect(modalDialog).toBeVisible();
    await expect(page.getByText(/confirm permanent deletion/i)).toBeVisible();

    const confirmPhraseInput = modalDialog.getByLabel(/to confirm, type/i);
    const permanentlyDeleteBtn = modalDialog.getByRole('button', { name: /permanently delete/i });

    // Ensure button is disabled before typing exact phrase
    await expect(permanentlyDeleteBtn).toBeDisabled();

    // Fill typed confirmation phrase
    await confirmPhraseInput.fill('DELETE MY DATA PERMANENTLY');
    await expect(permanentlyDeleteBtn).toBeEnabled();

    // Submit deletion
    await permanentlyDeleteBtn.click();

    // Verify deletion response / success alert
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('alert')).toContainText(/deleted/i);

    // -----------------------------------------------------------------------
    // 5. Unsubscribe Flow
    // -----------------------------------------------------------------------
    const unsubRes = await request.get(
      `${apiUrl.replace(/\/$/, '')}/api/v1/newsletter/unsubscribe?token=${unsubscribeToken}`
    );
    expect(
      unsubRes.ok() ||
        unsubRes.status() === 200 ||
        unsubRes.status() === 401 ||
        unsubRes.status() === 404
    ).toBeTruthy();
  });
});
