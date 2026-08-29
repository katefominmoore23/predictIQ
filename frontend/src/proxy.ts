import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { CSRF_COOKIE_NAME } from './lib/api/csrf';

// Note on #1415 (API-proxy request/response sanitization): this proxy only
// attaches CSP/nonce headers to the app's own page responses — it does not
// forward or rewrite requests to services/api or services/tts. All backend
// calls (src/lib/api/*-client.ts) are made directly from the browser to
// NEXT_PUBLIC_API_URL, which is public by design (the `NEXT_PUBLIC_` prefix
// ships it to the client bundle). There is no server-side hop here that
// could echo an internal upstream URL or leak a server-only env var back to
// the client, so there is no proxied response to sanitize.

// Allow the app to reach its configured backend API (e.g. a local http origin
// during development) without loosening connect-src to all origins.
function apiOrigin(): string {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL ?? '').origin;
  } catch {
    return '';
  }
}

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  // Explicit allow-list only: 'self' plus the configured API origin. A bare
  // https: scheme-source would let an injected script fetch()/load images
  // from *any* HTTPS host, defeating the point of computing apiOrigin() at all.
  const connectSrc = ["'self'", apiOrigin()].filter(Boolean).join(' ');
  const imgSrc = ["'self'", 'data:', apiOrigin()].filter(Boolean).join(' ');

  const cspHeader = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self'",
    `img-src ${imgSrc}`,
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join('; ');

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set('Content-Security-Policy', cspHeader);

  // Issue a double-submit CSRF cookie for cookie-authenticated mutations
  // (#1417). Deliberately NOT httpOnly: client.ts reads this value and
  // echoes it back as an X-CSRF-Token header, so the backend can confirm
  // the request came from JS running on this origin, not a forged
  // cross-site form/image submission. Only set once per session — a fresh
  // value on every request would break in-flight requests.
  if (!request.cookies.get(CSRF_COOKIE_NAME)) {
    response.cookies.set(CSRF_COOKIE_NAME, crypto.randomUUID(), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }

  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
