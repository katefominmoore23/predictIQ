'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useI18n } from '../lib/hooks/useI18n';
import { api, ApiError } from '../lib/api/public-client';
import { LoadingSpinner } from './LoadingSpinner';

const CLIENT_SUBMIT_COOLDOWN_SECS = 3;
const DEFAULT_RATE_LIMIT_COOLDOWN_SECS = 30;

export interface NewsletterSignupProps {
  className?: string;
  source?: string;
  onSuccess?: () => void;
}

export const NewsletterSignup: React.FC<NewsletterSignupProps> = ({
  className,
  source,
  onSuccess,
}) => {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [apiError, setApiError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Rate limiting / Cooldown state
  const [cooldown, setCooldown] = useState(0);
  const [isServerRateLimited, setIsServerRateLimited] = useState(false);
  const lastSubmittedEmailRef = useRef<string>('');

  // Countdown timer effect
  useEffect(() => {
    if (cooldown <= 0) {
      if (isServerRateLimited) {
        setIsServerRateLimited(false);
      }
      return;
    }

    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown, isServerRateLimited]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    setEmailError('');
    setApiError('');

    // If user edited/corrected the email, allow immediate submit unless under a global 429 server lockout
    if (!isServerRateLimited && newEmail !== lastSubmittedEmailRef.current) {
      setCooldown(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoading || isSubmitted) {
      return;
    }

    // Client-side rate-limit / rapid resubmit check
    if (cooldown > 0 && email === lastSubmittedEmailRef.current) {
      setApiError(`Please wait ${cooldown} second${cooldown > 1 ? 's' : ''} before resubmitting.`);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError(t('hero.emailRequired'));
      return;
    }
    if (!emailRegex.test(email)) {
      setEmailError(t('hero.emailInvalid'));
      return;
    }

    setEmailError('');
    setApiError('');
    setIsLoading(true);
    lastSubmittedEmailRef.current = email;

    try {
      const result = await api.newsletterSubscribe({ email, source });
      if (result.success) {
        setIsSubmitted(true);
        onSuccess?.();
      } else {
        setApiError(result.message || 'Subscription failed');
        // Set short client-side cooldown on same email to prevent spamming
        setCooldown(CLIENT_SUBMIT_COOLDOWN_SECS);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setIsServerRateLimited(true);
        const retrySeconds = (err.details?.retry_after as number) || DEFAULT_RATE_LIMIT_COOLDOWN_SECS;
        setCooldown(retrySeconds);
        setApiError(`Too many requests. Please wait ${retrySeconds}s before trying again.`);
      } else {
        setApiError(err instanceof Error ? err.message : 'Network error occurred');
        // Short cooldown on failure for same email
        setCooldown(CLIENT_SUBMIT_COOLDOWN_SECS);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonDisabled =
    isLoading ||
    isSubmitted ||
    (cooldown > 0 && email === lastSubmittedEmailRef.current) ||
    isServerRateLimited;

  return (
    <form
      onSubmit={handleSubmit}
      aria-labelledby="signup-heading"
      aria-busy={isLoading}
      noValidate
      className={className}
    >
      <h2 id="signup-heading" className="visually-hidden">
        {t('hero.signupHeading')}
      </h2>

      <div className="form-group">
        <label htmlFor="email-input">
          {t('hero.emailLabel')}
          <span aria-label="required" className="required">
            *
          </span>
        </label>
        <input
          id="email-input"
          type="email"
          required
          value={email}
          onChange={handleEmailChange}
          aria-required="true"
          aria-invalid={!!emailError || !!apiError}
          aria-describedby={emailError ? 'email-error' : apiError ? 'api-error' : undefined}
          placeholder={t('hero.emailPlaceholder')}
          disabled={isSubmitted || isLoading}
        />
        {emailError && (
          <span id="email-error" role="alert" className="error-message">
            {emailError}
          </span>
        )}
        {apiError && (
          <span id="api-error" role="alert" className="error-message">
            {apiError}
          </span>
        )}
      </div>

      <button
        type="submit"
        disabled={isButtonDisabled}
        aria-disabled={isButtonDisabled}
        aria-label={
          isLoading
            ? 'Submitting...'
            : isSubmitted
            ? t('hero.subscribedButton')
            : cooldown > 0 && email === lastSubmittedEmailRef.current
            ? `Please wait ${cooldown}s`
            : t('hero.submitButton')
        }
      >
        {isLoading ? (
          <LoadingSpinner size="small" aria-label="Submitting" />
        ) : isSubmitted ? (
          t('hero.subscribedButton')
        ) : cooldown > 0 && email === lastSubmittedEmailRef.current ? (
          `Wait (${cooldown}s)`
        ) : (
          t('hero.submitButton')
        )}
      </button>

      {/* Screen reader announcement */}
      <div
        id="form-status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="visually-hidden"
      >
        {isSubmitted && t('hero.successMessage')}
      </div>
    </form>
  );
};

export default NewsletterSignup;
