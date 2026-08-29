'use client';

/**
 * Toast — shared design-system notification primitive (#1319).
 *
 * Mount <ToastContainer /> once near the app root (e.g. in the root
 * layout); call `toast.success(...)` / `toast.error(...)` / etc. from
 * useToast.ts anywhere — API mutation handlers included — to enqueue one.
 * Color tokens match the existing StatusAlert component's convention
 * (components/admin/Form.tsx) so success/error/warning/info read
 * consistently across both surfaces.
 */

import { toast, useToast, type ToastItem, type ToastVariant } from '../../lib/hooks/useToast';

const COLORS: Record<ToastVariant, { bg: string; border: string; text: string }> = {
  success: { bg: 'rgba(52, 211, 153, 0.12)', border: 'var(--success)', text: 'var(--success)' },
  error: { bg: 'rgba(248, 113, 113, 0.12)', border: 'var(--destructive)', text: 'var(--destructive)' },
  warning: { bg: 'rgba(251, 191, 36, 0.12)', border: 'var(--gold)', text: 'var(--gold-soft)' },
  info: { bg: 'rgba(139, 92, 246, 0.12)', border: 'var(--purple)', text: 'var(--purple-soft)' },
};

function ToastRow({ item }: { item: ToastItem }) {
  const colors = COLORS[item.variant];

  return (
    <div
      role={item.variant === 'error' ? 'alert' : 'status'}
      style={{
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 'var(--radius-sm)',
        padding: '0.85rem 1.15rem',
        color: 'var(--fg)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        minWidth: '280px',
        maxWidth: '420px',
      }}
    >
      <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: colors.text, lineHeight: 1.4 }}>
        {item.message}
      </p>
      <button
        type="button"
        onClick={() => toast.dismiss(item.id)}
        aria-label="Dismiss notification"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--fg-muted)',
          cursor: 'pointer',
          padding: '0.2rem',
          lineHeight: 1,
          fontSize: '1.1rem',
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useToast();

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        pointerEvents: toasts.length > 0 ? 'auto' : 'none',
      }}
    >
      {toasts.map((item) => (
        <ToastRow key={item.id} item={item} />
      ))}
    </div>
  );
}

export default ToastContainer;
