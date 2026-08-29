'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import '../../styles/admin.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin/email/preview', label: 'Email Preview' },
    { href: '/admin/email/analytics', label: 'Email Analytics' },
    { href: '/admin/blockchain/replay', label: 'Blockchain Replay' },
    { href: '/admin/content', label: 'Content Management' },
  ];

  return (
    <div className="admin-layout">
      {/* Skip navigation for accessibility */}
      <a href="#admin-main-content" className="skip-link">
        Skip to admin content
      </a>

      {/* Admin Top Navigation */}
      <header className="admin-header" role="banner">
        <div className="admin-header-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link href="/" className="admin-brand" aria-label="PredictIQ Home">
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>
                Predict<span style={{ color: 'var(--gold)' }}>IQ</span>
              </span>
            </Link>
            <span className="admin-brand-badge">Admin</span>
          </div>

          <nav className="admin-nav" aria-label="Admin sub-navigation">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`admin-nav-link ${isActive ? 'active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div>
            <Link
              href="/"
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--fg-muted)',
                textDecoration: 'none',
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface-2)',
              }}
            >
              Exit to Site →
            </Link>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main id="admin-main-content" className="admin-main" role="main">
        {children}
      </main>
    </div>
  );
}
