import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LandingPage } from '../LandingPage';

// Mock the Statistics component. Controlled by `mockShouldThrow` so tests can
// simulate recovery after a retry (jest hoists jest.mock factories, so the
// controlling variable must be prefixed with "mock" to be referenced here).
let mockShouldThrow = true;
jest.mock('../Statistics', () => {
  return {
    Statistics: () => {
      if (mockShouldThrow) {
        throw new Error('Failed to load statistics');
      }
      return <div>Statistics loaded</div>;
    },
  };
});

// Mock the i18n hook
jest.mock('../../lib/hooks/useI18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: 'en',
    setLocale: jest.fn(),
    availableLocales: ['en', 'es'],
  }),
}));

// Mock the dark mode hook
jest.mock('../../lib/hooks/useDarkMode', () => ({
  useDarkMode: () => ({
    isDarkMode: false,
    toggleDarkMode: jest.fn(),
  }),
}));

describe('LandingPage with ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockShouldThrow = true;
  });

  it('should render error fallback when Statistics throws', () => {
    render(<LandingPage />);

    expect(screen.getByText('Unable to load statistics at this time. Please try again later.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry loading statistics/i })).toBeInTheDocument();
  });

  it('should display error message with role alert', () => {
    render(<LandingPage />);

    const errorMessage = screen.getByRole('alert');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveTextContent('Unable to load statistics at this time');
  });

  it('should still render other sections when Statistics fails', () => {
    render(<LandingPage />);

    expect(screen.getByText('hero.title')).toBeInTheDocument();
    expect(screen.getByText('features.heading')).toBeInTheDocument();
  });

  it('should have accessible statistics section heading', () => {
    render(<LandingPage />);

    const heading = screen.getByText('Platform Statistics');
    expect(heading).toBeInTheDocument();
    expect(heading.tagName).toBe('H2');
  });

  it('retries via a soft reset instead of reloading the page', () => {
    render(<LandingPage />);

    // Once Statistics recovers, the next render succeeds. A real
    // window.location.reload() would be a no-op in jsdom and could never
    // produce this text, so seeing it proves the boundary was reset in
    // place rather than the page being reloaded.
    mockShouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: /retry loading statistics/i }));

    expect(screen.getByText('Statistics loaded')).toBeInTheDocument();
  });
});

describe('Global ErrorBoundary', () => {
  const ThrowingComponent = ({ message = 'Crash test' }: { message?: string }) => {
    throw new Error(message);
  };

  // Suppress console.error in tests for intentional throw
  const originalError = console.error;
  beforeEach(() => {
    console.error = jest.fn();
  });
  afterEach(() => {
    console.error = originalError;
  });

  it('catches render errors in wrapped children and renders fallback UI', () => {
    const { ErrorBoundary } = require('../ErrorBoundary');
    render(
      <ErrorBoundary>
        <ThrowingComponent message="Simulated render crash" />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Simulated render crash')).toBeInTheDocument();
  });

  it('renders reload action and report issue action in fallback UI', () => {
    const { ErrorBoundary } = require('../ErrorBoundary');
    render(
      <ErrorBoundary section="markets">
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByRole('button', { name: /reload the page/i })).toBeInTheDocument();
    const reportLink = screen.getByRole('link', { name: /report this issue/i });
    expect(reportLink).toBeInTheDocument();
    expect(reportLink).toHaveAttribute('href', expect.stringContaining('issues'));
  });

  it('calls onError callback when error is caught', () => {
    const { ErrorBoundary } = require('../ErrorBoundary');
    const onErrorMock = jest.fn();

    render(
      <ErrorBoundary onError={onErrorMock}>
        <ThrowingComponent message="Callback test" />
      </ErrorBoundary>
    );

    expect(onErrorMock).toHaveBeenCalledTimes(1);
    expect(onErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Callback test' }),
      expect.any(Object)
    );
  });
});

