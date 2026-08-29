import React from 'react';
import { render, screen } from '@testing-library/react';
import { FooterColumn } from '../landing/FooterColumn';

describe('FooterColumn', () => {
  it('renders heading and links (populated state)', () => {
    render(
      <FooterColumn
        heading="Product"
        links={[
          { href: '/markets', label: 'Markets' },
          { href: '/pricing', label: 'Pricing' },
        ]}
      />
    );

    expect(screen.getByRole('heading', { level: 3, name: 'Product' })).toBeInTheDocument();
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', '/markets');
    expect(links[1]).toHaveTextContent('Pricing');
  });

  it('renders with no links or tagline (empty state)', () => {
    render(<FooterColumn heading="Legal" />);

    expect(screen.getByRole('heading', { name: 'Legal' })).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders an empty <ul> (no items) for an empty links array, unlike an omitted prop', () => {
    render(<FooterColumn heading="Legal" links={[]} />);
    expect(screen.getByRole('list')).toBeEmptyDOMElement();
  });

  it('renders the tagline when provided', () => {
    render(<FooterColumn heading="About" tagline="Prediction markets for everyone." />);
    expect(screen.getByText('Prediction markets for everyone.')).toBeInTheDocument();
  });

  it('respects an explicit headingLevel override (e.g. the column that opens the footer)', () => {
    render(<FooterColumn heading="PredictIQ" headingLevel="h2" />);
    expect(screen.getByRole('heading', { level: 2, name: 'PredictIQ' })).toBeInTheDocument();
  });

  it('uses each link href as its React key, so duplicate labels with distinct hrefs both render', () => {
    render(
      <FooterColumn
        heading="Docs"
        links={[
          { href: '/docs/en', label: 'Guide' },
          { href: '/docs/es', label: 'Guide' },
        ]}
      />
    );
    expect(screen.getAllByRole('link', { name: 'Guide' })).toHaveLength(2);
  });
});
