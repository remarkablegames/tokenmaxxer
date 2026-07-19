import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DashboardHeader } from '.';

describe('DashboardHeader', () => {
  it('shows preview status, formatted metrics, and unread comms actions', async () => {
    const onOpenComms = vi.fn();
    const onOpenSettings = vi.fn();
    const user = userEvent.setup();
    render(
      <DashboardHeader
        hasComms
        notice="NEW HIGH SCORE"
        onOpenComms={onOpenComms}
        onOpenSettings={onOpenSettings}
        previewEnabled
        tokens={1_500}
        tokensPerClick={3}
        tokensPerSecond={12}
        unreadCount={2}
      />,
    );

    expect(screen.getByText('PREVIEW MODE')).toBeInTheDocument();
    expect(screen.getByText('1.50K')).toBeInTheDocument();
    expect(screen.getByText(/NEW HIGH SCORE/)).toHaveClass('text-cyan-300');
    await user.click(
      screen.getByRole('button', { name: 'Open Ops Comms, 2 unread' }),
    );
    await user.click(screen.getByRole('button', { name: 'Open settings' }));
    expect(onOpenComms).toHaveBeenCalledOnce();
    expect(onOpenSettings).toHaveBeenCalledOnce();
  });

  it('shows online status without optional preview or comms controls', () => {
    render(
      <DashboardHeader
        hasComms={false}
        notice="SYSTEM ONLINE"
        onOpenComms={vi.fn()}
        onOpenSettings={vi.fn()}
        previewEnabled={false}
        tokens={0}
        tokensPerClick={1}
        tokensPerSecond={0}
        unreadCount={0}
      />,
    );

    expect(screen.getByText(/SYSTEM ONLINE/)).toHaveClass('text-emerald-300');
    expect(screen.queryByText('PREVIEW MODE')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Open Ops Comms' }),
    ).not.toBeInTheDocument();
  });

  it('shows comms without an unread badge', () => {
    render(
      <DashboardHeader
        hasComms
        notice="SYSTEM ONLINE"
        onOpenComms={vi.fn()}
        onOpenSettings={vi.fn()}
        previewEnabled={false}
        tokens={0}
        tokensPerClick={1}
        tokensPerSecond={0}
        unreadCount={0}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Open Ops Comms' }),
    ).toBeInTheDocument();
  });
});
