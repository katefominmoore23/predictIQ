'use client';

import React, { useState } from 'react';
import { api, ApiError } from '../lib/api/public-client';
import { LoadingSpinner } from './LoadingSpinner';

export interface NewsletterSignupProps {
  className?: string;
  source?: string;
  heading?: string;
  description?: string;
  placeholder?: string;
  buttonText?: string;
  onSuccess?: (message: string) => void;
}

export type SignupStatus = 'idle' | 'loading' | 'success' | 'already-subscribed' | 'error';

/**
 * NewsletterSignup Component
 *
 * Implements double opt-in newsletter subscription with distinct UI states for:
 * 1. Double opt-in pending: "Please check your inbox to confirm"
 * 2. Already subscribed: displays server's specific message
 * 3. Error state: displays validation or network failure
 */
export const NewsletterSignup: React.FC<NewsletterSignupProps> = ({
  className = '',
  source = 'footer',
  heading = 'Subscribe to our Newsletter',
  description = 'Get the latest prediction market insights and updates delivered straight to your inbox.',
  placeholder = 'Enter your email address',
  buttonText = 'Subscribe',
  onSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<SignupStatus>('idle');
  const [serverMessage, setServerMessage] = useState('');
  const [emailError, setEmailError] = useState('');

  const validateEmail = (val: string): boolean => {
    const trimmed = val.trim();
    if (!trimmed) {
      setEmailError('Email address is required.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError('Please enter a valid email address.');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) setEmailError('');
    if (status === 'error' || status === 'already-subscribed') {
      setStatus('idle');
      setServerMessage('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (status === 'loading') return;

    if (!validateEmail(email)) {
      return;
    }

    setStatus('loading');
    setServerMessage('');
    setEmailError('');

    try {
      const response = await api.newsletterSubscribe({
        email: email.trim(),
        source,
      });

      const messageText = response.message || '';
      const isAlreadySubscribed = /already\s*(subscribed|registered)/i.test(messageText);

      if (response.success) {
        if (isAlreadySubscribed) {
          setStatus('already-subscribed');
          setServerMessage(messageText || 'You are already subscribed to this newsletter.');
        } else {
          setStatus('success');
          setServerMessage(
            messageText || 'Please check your inbox to confirm your subscription.'
          );
          onSuccess?.(messageText);
        }
      } else {
        if (isAlreadySubscribed) {
          setStatus('already-subscribed');
          setServerMessage(messageText || 'You are already subscribed to this newsletter.');
        } else {
          setStatus('error');
          setServerMessage(messageText || 'Unable to subscribe. Please try again.');
        }
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const isDuplicate =
          err.status === 409 ||
          err.code === 'ALREADY_SUBSCRIBED' ||
          /already\s*(subscribed|registered)/i.test(err.message);

        if (isDuplicate) {
          setStatus('already-subscribed');
          setServerMessage(err.message || 'You are already subscribed to this newsletter.');
        } else {
          setStatus('error');
          setServerMessage(err.message || 'Failed to subscribe. Please check your connection.');
        }
      } else {
        const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
        if (/already\s*(subscribed|registered)/i.test(msg)) {
          setStatus('already-subscribed');
          setServerMessage(msg);
        } else {
          setStatus('error');
          setServerMessage(msg);
        }
      }
    }
  };

  const handleReset = () => {
    setEmail('');
    setStatus('idle');
    setServerMessage('');
    setEmailError('');
  };

  return (
    <section
      className={`newsletter-signup-container ${className}`}
      aria-labelledby="newsletter-signup-heading"
    >
      <div className="newsletter-header">
        {heading && (
          <h3 id="newsletter-signup-heading" className="newsletter-title">
            {heading}
          </h3>
        )}
        {description && <p className="newsletter-description">{description}</p>}
      </div>

      {status === 'success' ? (
        <div
          className="newsletter-success-box"
          role="status"
          aria-live="polite"
          tabIndex={0}
        >
          <div className="newsletter-success-icon" aria-hidden="true">
            ✉️
          </div>
          <div className="newsletter-success-content">
            <h4 className="newsletter-state-title">Check your inbox to confirm</h4>
            <p className="newsletter-state-message">
              {serverMessage ||
                'We sent a confirmation link to your email address. Please click it to complete your subscription.'}
            </p>
          </div>
          <button
            type="button"
            className="newsletter-reset-button"
            onClick={handleReset}
          >
            Subscribe another email
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          noValidate
          aria-busy={status === 'loading'}
          className="newsletter-form"
        >
          {status === 'already-subscribed' && (
            <div
              className="newsletter-already-subscribed-box"
              role="status"
              aria-live="polite"
            >
              <div className="newsletter-info-icon" aria-hidden="true">
                ℹ️
              </div>
              <div className="newsletter-info-content">
                <span className="newsletter-state-title">Already Subscribed</span>
                <p className="newsletter-state-message">{serverMessage}</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div
              className="newsletter-error-box"
              role="alert"
              aria-live="assertive"
            >
              <div className="newsletter-error-icon" aria-hidden="true">
                ⚠️
              </div>
              <p className="newsletter-error-message">{serverMessage}</p>
            </div>
          )}

          <div className="newsletter-input-group">
            <label htmlFor="newsletter-email-input" className="visually-hidden">
              {placeholder}
            </label>
            <input
              id="newsletter-email-input"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={handleInputChange}
              placeholder={placeholder}
              disabled={status === 'loading'}
              aria-required="true"
              aria-invalid={!!emailError || status === 'error'}
              aria-describedby={
                emailError
                  ? 'newsletter-validation-error'
                  : serverMessage
                  ? 'newsletter-status-message'
                  : undefined
              }
              className={`newsletter-email-input ${
                emailError || status === 'error' ? 'input-error' : ''
              }`}
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="newsletter-submit-button"
              aria-label={status === 'loading' ? 'Submitting subscription...' : buttonText}
            >
              {status === 'loading' ? (
                <LoadingSpinner size="small" aria-label="Submitting subscription..." />
              ) : (
                buttonText
              )}
            </button>
          </div>

          {emailError && (
            <span
              id="newsletter-validation-error"
              role="alert"
              className="newsletter-field-error"
            >
              {emailError}
            </span>
          )}
        </form>
      )}
    </section>
  );
};

export default NewsletterSignup;
