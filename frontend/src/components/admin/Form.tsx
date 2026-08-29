'use client';

import React from 'react';

// ---------------------------------------------------------------------------
// Form Container
// ---------------------------------------------------------------------------

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

export const Form: React.FC<FormProps> = ({ children, className = '', ...props }) => {
  return (
    <form noValidate className={`admin-form ${className}`} {...props}>
      {children}
    </form>
  );
};

// ---------------------------------------------------------------------------
// Form Field (Wrapper with label, hint, error)
// ---------------------------------------------------------------------------

export interface FormFieldProps {
  id?: string;
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  required,
  hint,
  error,
  className = '',
  children,
}) => {
  const hintId = id && hint ? `${id}-hint` : undefined;
  const errorId = id && error ? `${id}-error` : undefined;

  return (
    <div className={`form-field ${error ? 'has-error' : ''} ${className}`} style={{ marginBottom: '1.25rem' }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            display: 'block',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            color: 'var(--fg)',
            marginBottom: '0.4rem',
          }}
        >
          {label}
          {required && <span style={{ color: 'var(--destructive)', marginLeft: '0.25rem' }}>*</span>}
        </label>
      )}

      {hint && (
        <p
          id={hintId}
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--fg-muted)',
            marginTop: '-0.2rem',
            marginBottom: '0.4rem',
            lineHeight: 1.4,
          }}
        >
          {hint}
        </p>
      )}

      <div>{children}</div>

      {error && (
        <div
          id={errorId}
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            color: 'var(--destructive)',
            fontSize: 'var(--text-xs)',
            marginTop: '0.4rem',
            fontWeight: 500,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Input Component
// ---------------------------------------------------------------------------

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ error, className = '', id, ...props }, ref) => {
    const errorId = id && error ? `${id}-error` : undefined;

    return (
      <input
        ref={ref}
        id={id}
        aria-invalid={!!error}
        aria-describedby={errorId}
        className={`form-input ${error ? 'input-error' : ''} ${className}`}
        style={{
          width: '100%',
          padding: '0.65rem 0.85rem',
          fontSize: 'var(--text-sm)',
          fontFamily: 'inherit',
          backgroundColor: 'var(--surface-2)',
          color: 'var(--fg)',
          border: `1px solid ${error ? 'var(--destructive)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-sm)',
          outline: 'none',
          transition: 'border-color var(--dur-fast), box-shadow var(--dur-fast)',
          boxSizing: 'border-box',
        }}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

// ---------------------------------------------------------------------------
// Textarea Component
// ---------------------------------------------------------------------------

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className = '', id, rows = 4, ...props }, ref) => {
    const errorId = id && error ? `${id}-error` : undefined;

    return (
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        aria-invalid={!!error}
        aria-describedby={errorId}
        className={`form-textarea ${error ? 'textarea-error' : ''} ${className}`}
        style={{
          width: '100%',
          padding: '0.65rem 0.85rem',
          fontSize: 'var(--text-sm)',
          fontFamily: 'inherit',
          backgroundColor: 'var(--surface-2)',
          color: 'var(--fg)',
          border: `1px solid ${error ? 'var(--destructive)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-sm)',
          outline: 'none',
          resize: 'vertical',
          transition: 'border-color var(--dur-fast), box-shadow var(--dur-fast)',
          boxSizing: 'border-box',
          lineHeight: 1.5,
        }}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

// ---------------------------------------------------------------------------
// Select Component
// ---------------------------------------------------------------------------

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ error, className = '', id, children, ...props }, ref) => {
    const errorId = id && error ? `${id}-error` : undefined;

    return (
      <select
        ref={ref}
        id={id}
        aria-invalid={!!error}
        aria-describedby={errorId}
        className={`form-select ${error ? 'select-error' : ''} ${className}`}
        style={{
          width: '100%',
          padding: '0.65rem 0.85rem',
          fontSize: 'var(--text-sm)',
          fontFamily: 'inherit',
          backgroundColor: 'var(--surface-2)',
          color: 'var(--fg)',
          border: `1px solid ${error ? 'var(--destructive)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-sm)',
          outline: 'none',
          boxSizing: 'border-box',
          cursor: 'pointer',
        }}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';

// ---------------------------------------------------------------------------
// Button Component
// ---------------------------------------------------------------------------

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    const getVariantStyles = (): React.CSSProperties => {
      switch (variant) {
        case 'primary':
          return {
            backgroundColor: 'var(--gold)',
            color: 'var(--on-primary)',
            border: 'none',
            fontWeight: 600,
          };
        case 'danger':
          return {
            backgroundColor: 'var(--destructive)',
            color: '#ffffff',
            border: 'none',
            fontWeight: 600,
          };
        case 'secondary':
          return {
            backgroundColor: 'var(--surface-2)',
            color: 'var(--fg)',
            border: '1px solid var(--border-strong)',
            fontWeight: 500,
          };
        case 'ghost':
          return {
            backgroundColor: 'transparent',
            color: 'var(--fg-muted)',
            border: 'none',
            fontWeight: 500,
          };
        default:
          return {};
      }
    };

    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        className={`form-btn btn-${variant} ${isLoading ? 'btn-loading' : ''} ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          padding: '0.65rem 1.25rem',
          fontSize: 'var(--text-sm)',
          fontFamily: 'inherit',
          borderRadius: 'var(--radius-sm)',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          opacity: isDisabled ? 0.6 : 1,
          transition: 'all var(--dur-fast)',
          textDecoration: 'none',
          ...getVariantStyles(),
          ...style,
        }}
        {...props}
      >
        {isLoading && (
          <span
            style={{
              display: 'inline-block',
              width: '14px',
              height: '14px',
              border: '2px solid currentColor',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
            aria-hidden="true"
          />
        )}
        {!isLoading && leftIcon}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);
Button.displayName = 'Button';

// ---------------------------------------------------------------------------
// Status Alert Component
// ---------------------------------------------------------------------------

export interface StatusAlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message?: string;
  children?: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export const StatusAlert: React.FC<StatusAlertProps> = ({
  type,
  title,
  message,
  children,
  onDismiss,
  className = '',
}) => {
  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'rgba(52, 211, 153, 0.12)',
          border: 'var(--success)',
          text: 'var(--success)',
        };
      case 'error':
        return {
          bg: 'rgba(248, 113, 113, 0.12)',
          border: 'var(--destructive)',
          text: 'var(--destructive)',
        };
      case 'warning':
        return {
          bg: 'rgba(251, 191, 36, 0.12)',
          border: 'var(--gold)',
          text: 'var(--gold-soft)',
        };
      case 'info':
      default:
        return {
          bg: 'rgba(139, 92, 246, 0.12)',
          border: 'var(--purple)',
          text: 'var(--purple-soft)',
        };
    }
  };

  const colors = getColors();

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      aria-live="polite"
      className={`status-alert alert-${type} ${className}`}
      style={{
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 'var(--radius-sm)',
        padding: '0.85rem 1.15rem',
        color: 'var(--fg)',
        marginBottom: '1.25rem',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '0.75rem',
      }}
    >
      <div style={{ flex: 1 }}>
        {title && (
          <h4
            style={{
              margin: '0 0 0.25rem',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              color: colors.text,
            }}
          >
            {title}
          </h4>
        )}
        {message && (
          <p
            style={{
              margin: 0,
              fontSize: 'var(--text-sm)',
              color: 'var(--fg)',
              lineHeight: 1.4,
            }}
          >
            {message}
          </p>
        )}
        {children}
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss alert"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--fg-muted)',
            cursor: 'pointer',
            padding: '0.2rem',
            lineHeight: 1,
            fontSize: '1.1rem',
          }}
        >
          ×
        </button>
      )}
    </div>
  );
};
