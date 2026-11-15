// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { DetectiveBadge } from './DetectiveBadge';

describe('the detective badge', () => {
  it('shows the name and handle as typed', () => {
    render(<DetectiveBadge name="Ada Obi" handle="ada" />);
    const badge = screen.getByRole('region', { name: 'Your detective badge' });
    expect(badge).toHaveTextContent('Ada Obi');
    expect(badge).toHaveTextContent('@ada');
    expect(badge).toHaveTextContent('Starter');
  });

  it('nothing typed yet is a detective, never a blank', () => {
    render(<DetectiveBadge name="  " handle="" />);
    const badge = screen.getByRole('region', { name: 'Your detective badge' });
    expect(badge).toHaveTextContent('Detective');
    expect(badge).toHaveTextContent('@detective');
  });
});
