import { render, screen } from '@testing-library/react';

import { HighScorePanel } from '.';

describe('HighScorePanel', () => {
  it('shows the current record chase and progress', () => {
    render(
      <HighScorePanel bonusesEarned={2} highScoreLevel={2} tokens={25_500} />,
    );

    expect(
      screen.getByRole('heading', { name: '25.5K / 100K TOKENS' }),
    ).toBeInTheDocument();
    expect(screen.getByText('25.5%')).toBeInTheDocument();
    expect(
      screen.getByText('2 PERFORMANCE BONUSES EARNED'),
    ).toBeInTheDocument();
    expect(screen.getByText('NEXT BONUS: #3')).toBeInTheDocument();
  });

  it('clamps displayed progress to the valid range', () => {
    const { rerender } = render(
      <HighScorePanel bonusesEarned={0} highScoreLevel={0} tokens={-1} />,
    );
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '0',
    );

    rerender(
      <HighScorePanel bonusesEarned={1} highScoreLevel={0} tokens={2_000} />,
    );
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '100',
    );
  });
});
