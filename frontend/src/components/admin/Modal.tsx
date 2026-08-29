'use client';

import React, { useEffect, useRef, useCallback } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  disableBackdropDismiss?: boolean;
  disableEscapeKey?: boolean;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  maxWidth?: string;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  disableBackdropDismiss = false,
  disableEscapeKey = false,
  ariaLabelledBy = 'admin-modal-title',
  ariaDescribedBy = 'admin-modal-desc',
  maxWidth = '560px',
  className = '',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!disableEscapeKey && !disableBackdropDismiss) {
          onClose();
        }
      }

      // Trap focus inside modal
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    },
    [disableEscapeKey, disableBackdropDismiss, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      // Focus the first focusable item in modal
      setTimeout(() => {
        if (modalRef.current) {
          const firstFocusable = modalRef.current.querySelector<HTMLElement>(
            'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (firstFocusable) {
            firstFocusable.focus();
          } else {
            modalRef.current.focus();
          }
        }
      }, 50);
    } else {
      document.body.style.overflow = '';
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      if (!disableBackdropDismiss) {
        onClose();
      }
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={handleBackdropClick}
      role="presentation"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 10, 20, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        aria-describedby={description ? ariaDescribedBy : undefined}
        tabIndex={-1}
        className={`modal-container ${className}`}
        style={{
          width: '100%',
          maxWidth,
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow), 0 0 30px rgba(0, 0, 0, 0.6)',
          color: 'var(--fg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          outline: 'none',
        }}
      >
        <div
          className="modal-header"
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div>
            <h2
              id={ariaLabelledBy}
              style={{
                margin: 0,
                fontSize: '1.25rem',
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                color: 'var(--fg)',
              }}
            >
              {title}
            </h2>
            {description && (
              <p
                id={ariaDescribedBy}
                style={{
                  margin: '0.35rem 0 0',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--fg-muted)',
                  lineHeight: 1.4,
                }}
              >
                {description}
              </p>
            )}
          </div>
          {!disableBackdropDismiss && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--fg-muted)',
                cursor: 'pointer',
                padding: '0.25rem',
                fontSize: '1.25rem',
                lineHeight: 1,
                borderRadius: 'var(--radius-sm)',
              }}
            >
              ×
            </button>
          )}
        </div>

        <div
          className="modal-body"
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            maxHeight: 'calc(80vh - 120px)',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
