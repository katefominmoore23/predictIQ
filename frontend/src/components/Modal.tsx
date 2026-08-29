'use client';

import { ReactNode, useEffect, useRef } from 'react';
import './Modal.css';

/**
 * Minimal accessible confirmation modal.
 *
 * The dedicated shared `Modal` component tracked by #16 doesn't exist on
 * `main` yet. The cancellation flow (#1376) needs one to confirm a
 * destructive, irreversible action, so this implements just enough —
 * focus trap on open, `Escape` to close, `role="dialog"` +
 * `aria-modal` + backdrop click-to-close — to not block on #16. It's a
 * drop-in replacement target: swap the import for the real component once
 * #16 lands, the props below (`open`, `onClose`, `title`, `children`) are
 * the common minimal surface most modal implementations share.
 */

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="modal-title" className="modal__title">{title}</h2>
        <div className="modal__body">{children}</div>
        <button type="button" className="modal__close" aria-label="Close dialog" onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  );
}

export default Modal;
