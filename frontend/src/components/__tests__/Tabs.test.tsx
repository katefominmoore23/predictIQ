import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Tabs } from '../Tabs';

describe('Tabs', () => {
  const tabs = [
    { id: 'tab1', label: 'Tab 1', icon: '📋' },
    { id: 'tab2', label: 'Tab 2', icon: '🎯' },
    { id: 'tab3', label: 'Tab 3' },
  ];

  const children = [
    <div key="1">Content 1</div>,
    <div key="2">Content 2</div>,
    <div key="3">Content 3</div>,
  ];

  it('renders tabs with correct labels', () => {
    render(<Tabs tabs={tabs}>{children}</Tabs>);

    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
    expect(screen.getByText('Tab 3')).toBeInTheDocument();
  });

  it('displays first tab content by default', () => {
    render(<Tabs tabs={tabs}>{children}</Tabs>);

    const content1 = screen.getByText('Content 1').parentElement;
    const content2 = screen.getByText('Content 2').parentElement;
    const content3 = screen.getByText('Content 3').parentElement;

    expect(content1).not.toHaveAttribute('hidden');
    expect(content2).toHaveAttribute('hidden');
    expect(content3).toHaveAttribute('hidden');
  });

  it('switches content when tab is clicked', () => {
    render(<Tabs tabs={tabs}>{children}</Tabs>);

    fireEvent.click(screen.getByText('Tab 2'));

    const content1 = screen.getByText('Content 1').parentElement;
    const content2 = screen.getByText('Content 2').parentElement;
    const content3 = screen.getByText('Content 3').parentElement;

    expect(content1).toHaveAttribute('hidden');
    expect(content2).not.toHaveAttribute('hidden');
    expect(content3).toHaveAttribute('hidden');
  });

  it('sets aria-selected correctly on active tab', () => {
    render(<Tabs tabs={tabs}>{children}</Tabs>);

    const tab1 = screen.getByRole('tab', { name: /Tab 1/i });
    const tab2 = screen.getByRole('tab', { name: /Tab 2/i });

    expect(tab1).toHaveAttribute('aria-selected', 'true');
    expect(tab2).toHaveAttribute('aria-selected', 'false');

    fireEvent.click(tab2);

    expect(tab1).toHaveAttribute('aria-selected', 'false');
    expect(tab2).toHaveAttribute('aria-selected', 'true');
  });

  it('calls onTabChange callback when tab is clicked', () => {
    const onTabChange = jest.fn();
    render(<Tabs tabs={tabs} onTabChange={onTabChange}>{children}</Tabs>);

    fireEvent.click(screen.getByText('Tab 2'));

    expect(onTabChange).toHaveBeenCalledWith('tab2');
  });

  it('uses defaultTab if provided', () => {
    render(<Tabs tabs={tabs} defaultTab="tab2">{children}</Tabs>);

    const content1 = screen.getByText('Content 1').parentElement;
    const content2 = screen.getByText('Content 2').parentElement;

    expect(content1).toHaveAttribute('hidden');
    expect(content2).not.toHaveAttribute('hidden');
  });

  it('renders icons when provided', () => {
    render(<Tabs tabs={tabs}>{children}</Tabs>);

    const iconElements = screen.getAllByText('📋');
    expect(iconElements.length).toBeGreaterThan(0);
  });

  it('applies active class to active tab button', () => {
    render(<Tabs tabs={tabs}>{children}</Tabs>);

    const tab1Button = screen.getByRole('tab', { name: /Tab 1/i });
    const tab2Button = screen.getByRole('tab', { name: /Tab 2/i });

    expect(tab1Button).toHaveClass('active');
    expect(tab2Button).not.toHaveClass('active');

    fireEvent.click(tab2Button);

    expect(tab1Button).not.toHaveClass('active');
    expect(tab2Button).toHaveClass('active');
  });

  it('applies custom className', () => {
    const { container } = render(
      <Tabs tabs={tabs} className="custom-tabs">{children}</Tabs>
    );

    const tabsDiv = container.querySelector('.tabs');
    expect(tabsDiv).toHaveClass('custom-tabs');
  });

  it('handles tab switching without onTabChange callback', () => {
    render(<Tabs tabs={tabs}>{children}</Tabs>);

    const tab2Button = screen.getByRole('tab', { name: /Tab 2/i });
    fireEvent.click(tab2Button);

    const content2 = screen.getByText('Content 2').parentElement;
    expect(content2).not.toHaveAttribute('hidden');
  });
});
