import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SessionResetModal } from '.';

describe('SessionResetModal', () => {
  it('explains the reset, previews the multiplier, and confirms', async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(
      <SessionResetModal
        onClose={vi.fn()}
        onConfirm={onConfirm}
        pendingPrestigeLevels={3}
        prestigeLevel={2}
      />,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('2 → 5');
    expect(dialog).toHaveTextContent('Token Multiplier: 1.2× → 1.5×');
    expect(dialog).toHaveTextContent('RESETS');
    expect(dialog).toHaveTextContent('REMAINS');
    await user.click(screen.getByRole('button', { name: 'Start New Session' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('disables confirmation without pending levels', () => {
    render(
      <SessionResetModal
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        pendingPrestigeLevels={0}
        prestigeLevel={1}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Start New Session' }),
    ).toBeDisabled();
  });
});
