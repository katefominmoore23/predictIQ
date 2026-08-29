import { test, expect } from '@playwright/test';

/**
 * Admin-Only E2E Test Suite
 *
 * Covers:
 * - API key rotation and verification of new keys
 * - Audit log querying and filtering
 * - Email queue statistics, dead-letter listing, and requeue
 * - Unauthorized access rejection (401)
 *
 * Requirement:
 * Requires a valid admin API key configured in the environment (ADMIN_API_KEY or ADMIN_KEY).
 * The suite MUST fail loudly (not silently skip) if run without an admin key configured.
 */

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || process.env.ADMIN_KEY;

// Fail loudly if no admin API key is provided
if (!ADMIN_API_KEY || !ADMIN_API_KEY.trim()) {
  throw new Error(
    'ADMIN_API_KEY environment variable is required for admin E2E tests, but is missing or empty. ' +
    'The admin test suite fails loudly by design to prevent missing CI secrets from masking regressions.'
  );
}

test.describe('Admin Dashboard: API Key Rotation Flow', () => {
  const testKeyLabel = `e2e-admin-rotation-${Date.now()}`;
  let generatedKey = '';

  test('POST /api/v1/admin/api-keys/rotate — rotates key and returns new raw secret', async ({ request }) => {
    const response = await request.post('/api/v1/admin/api-keys/rotate', {
      headers: {
        'x-api-key': ADMIN_API_KEY!,
        'Content-Type': 'application/json',
      },
      data: {
        key_label: testKeyLabel,
        overlap_days: 7,
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.new_key).toBeTruthy();
    expect(typeof body.new_key).toBe('string');
    expect(body.new_key_label).toBe(testKeyLabel);

    generatedKey = body.new_key;
  });

  test('GET /api/v1/admin/api-keys — lists active keys including newly rotated key', async ({ request }) => {
    const response = await request.get('/api/v1/admin/api-keys', {
      headers: {
        'x-api-key': ADMIN_API_KEY!,
      },
    });

    expect(response.status()).toBe(200);
    const keys = await response.json();
    expect(Array.isArray(keys)).toBe(true);

    const matchingKey = keys.find((k: { label: string }) => k.label === testKeyLabel);
    expect(matchingKey).toBeDefined();
    expect(matchingKey.label).toBe(testKeyLabel);
  });

  test('Rotated API key can authenticate administrative requests', async ({ request }) => {
    // If a new key was generated in the previous test step, verify it works
    if (generatedKey) {
      const response = await request.get('/api/v1/admin/api-keys', {
        headers: {
          'x-api-key': generatedKey,
        },
      });

      expect(response.status()).toBe(200);
      const keys = await response.json();
      expect(Array.isArray(keys)).toBe(true);
    }
  });
});

test.describe('Admin Dashboard: Audit Log Filtering Flow', () => {
  test('GET /api/v1/audit/logs — supports pagination and filtering', async ({ request }) => {
    const response = await request.get('/api/v1/audit/logs', {
      headers: {
        'x-api-key': ADMIN_API_KEY!,
      },
      params: {
        limit: 10,
        offset: 0,
      },
    });

    expect(response.status()).toBe(200);
    const logs = await response.json();
    expect(Array.isArray(logs)).toBe(true);
    expect(logs.length).toBeLessThanOrEqual(10);
  });

  test('GET /api/v1/audit/logs — filters by action and resource type', async ({ request }) => {
    const response = await request.get('/api/v1/audit/logs', {
      headers: {
        'x-api-key': ADMIN_API_KEY!,
      },
      params: {
        action: 'api_key_rotate',
        resource_type: 'api_key',
        limit: 5,
      },
    });

    expect(response.status()).toBe(200);
    const logs = await response.json();
    expect(Array.isArray(logs)).toBe(true);
    if (logs.length > 0) {
      for (const entry of logs) {
        if (entry.action) {
          expect(entry.action).toBe('api_key_rotate');
        }
      }
    }
  });

  test('GET /api/v1/audit/statistics — returns aggregated audit statistics', async ({ request }) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const response = await request.get('/api/v1/audit/statistics', {
      headers: {
        'x-api-key': ADMIN_API_KEY!,
      },
      params: {
        from: thirtyDaysAgo.toISOString(),
        to: now.toISOString(),
      },
    });

    expect(response.status()).toBe(200);
    const stats = await response.json();
    expect(stats).toBeDefined();
    expect(typeof stats).toBe('object');
  });
});

test.describe('Admin Dashboard: Email Queue Management Flow', () => {
  test('GET /api/v1/email/queue/stats — returns email queue depth and status metrics', async ({ request }) => {
    const response = await request.get('/api/v1/email/queue/stats', {
      headers: {
        'x-api-key': ADMIN_API_KEY!,
      },
    });

    expect(response.status()).toBe(200);
    const stats = await response.json();
    expect(stats).toBeDefined();
  });

  test('GET /api/v1/email/queue/dead-letter — lists dead letter items', async ({ request }) => {
    const response = await request.get('/api/v1/email/queue/dead-letter', {
      headers: {
        'x-api-key': ADMIN_API_KEY!,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toBeDefined();
    expect(Array.isArray(body.jobs)).toBe(true);
    expect(typeof body.count).toBe('number');
  });

  test('POST /api/v1/email/queue/dead-letter/{job_id}/requeue — requeues job or returns 404 for nonexistent job', async ({ request }) => {
    // List dead letter jobs to check if there is an active dead letter job to requeue
    const listRes = await request.get('/api/v1/email/queue/dead-letter', {
      headers: {
        'x-api-key': ADMIN_API_KEY!,
      },
    });

    expect(listRes.status()).toBe(200);
    const listBody = await listRes.json();

    if (listBody.jobs && listBody.jobs.length > 0) {
      const jobId = listBody.jobs[0];
      const requeueRes = await request.post(`/api/v1/email/queue/dead-letter/${jobId}/requeue`, {
        headers: {
          'x-api-key': ADMIN_API_KEY!,
        },
      });

      expect(requeueRes.status()).toBe(200);
      const requeueBody = await requeueRes.json();
      expect(requeueBody.requeued).toBe(true);
      expect(requeueBody.job_id).toBe(jobId);
    } else {
      // If dead-letter queue is empty, attempt requeuing a dummy UUID to verify endpoint auth & 404 handling
      const dummyId = '00000000-0000-0000-0000-000000000000';
      const notFoundRes = await request.post(`/api/v1/email/queue/dead-letter/${dummyId}/requeue`, {
        headers: {
          'x-api-key': ADMIN_API_KEY!,
        },
      });

      expect(notFoundRes.status()).toBe(404);
      const notFoundBody = await notFoundRes.json();
      expect(notFoundBody.message).toMatch(/not found/i);
    }
  });
});

test.describe('Admin Dashboard: Authentication & Authorization Guards', () => {
  test('rejects unauthenticated requests with 401', async ({ request }) => {
    const response = await request.get('/api/v1/audit/logs');
    expect(response.status()).toBe(401);
  });

  test('rejects invalid API key with 401', async ({ request }) => {
    const response = await request.get('/api/v1/audit/logs', {
      headers: {
        'x-api-key': 'invalid-unauthorized-key',
      },
    });
    expect(response.status()).toBe(401);
  });
});
