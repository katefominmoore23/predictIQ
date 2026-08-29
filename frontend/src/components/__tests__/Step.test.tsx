import React from 'react';
import { render, screen } from '@testing-library/react';
import { Step } from '../landing/Step';

describe('Step', () => {
  it('renders title and description (populated state)', () => {
    render(<Step title="Connect your wallet" description="Link a Stellar wallet to get started." />);

    expect(screen.getByRole('heading', { level: 3, name: 'Connect your wallet' })).toBeInTheDocument();
    expect(screen.getByText('Link a Stellar wallet to get started.')).toBeInTheDocument();
  });

  it('renders as a list item so a sequence of Steps forms a valid <ol>/<ul>', () => {
    render(
      <ul>
        <Step title="Step one" description="Do this first." />
      </ul>
    );
    expect(screen.getByRole('listitem')).toBeInTheDocument();
  });
});
