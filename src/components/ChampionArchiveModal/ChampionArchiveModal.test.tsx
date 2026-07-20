import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ChampionArchiveModal } from '.';

describe('ChampionArchiveModal', () => {
  it('sorts milestones and switches between archive sections', async () => {
    const onSelectTab = vi.fn();
    const user = userEvent.setup();
    render(
      <ChampionArchiveModal
        achievementIds={['record']}
        bonuses={[1, 0]}
        initialTab="milestones"
        onClose={vi.fn()}
        onSelectTab={onSelectTab}
      />,
    );

    const milestones = screen.getAllByRole('listitem');
    expect(milestones[0]).toHaveTextContent('MILESTONE #1');
    expect(milestones[0]).toHaveTextContent('1K');
    expect(milestones[1]).toHaveTextContent('MILESTONE #2');
    await user.click(screen.getByRole('tab', { name: 'Achievements' }));
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Record Breaker');
    expect(screen.getByRole('tabpanel')).toHaveTextContent(
      'Secure a High Score milestone',
    );
    expect(screen.getByRole('tabpanel')).toHaveTextContent(
      'Secure the 100K milestone',
    );
    expect(
      screen.getByText('Record Breaker').closest('div')?.parentElement,
    ).toHaveClass('opacity-100');
    expect(
      screen.getByText('First Input').closest('div')?.parentElement,
    ).toHaveClass('opacity-60');
    await user.click(screen.getByRole('tab', { name: 'Milestones' }));
    expect(screen.getByRole('tabpanel')).toHaveTextContent('MILESTONE #1');
    expect(onSelectTab).toHaveBeenCalledTimes(2);
  });

  it('opens directly to achievements and closes', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <ChampionArchiveModal
        achievementIds={[]}
        bonuses={[0]}
        initialTab="achievements"
        onClose={onClose}
      />,
    );

    expect(
      screen.getByRole('tab', { name: 'Achievements', selected: true }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close dialog' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
