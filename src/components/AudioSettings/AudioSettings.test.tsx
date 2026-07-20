import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AudioSettings } from './AudioSettings';

describe('AudioSettings', () => {
  it('shows persisted levels and delegates audio changes', async () => {
    const onEffectsVolumeChange = vi.fn();
    const onMusicVolumeChange = vi.fn();
    const onToggleEffects = vi.fn();
    const onToggleMusic = vi.fn();
    const user = userEvent.setup();
    render(
      <AudioSettings
        onEffectsVolumeChange={onEffectsVolumeChange}
        onMusicVolumeChange={onMusicVolumeChange}
        onToggleEffects={onToggleEffects}
        onToggleMusic={onToggleMusic}
        preferences={{
          musicMuted: true,
          musicVolume: 0.3,
          soundMuted: false,
          soundVolume: 0.45,
        }}
      />,
    );

    expect(screen.getByText('30%')).toBeInTheDocument();
    expect(screen.getByText('45%')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Toggle music' }),
    ).toHaveTextContent('MUTED');
    expect(
      screen.getByRole('button', { name: 'Toggle sound effects' }),
    ).toHaveTextContent('ON');

    await user.click(screen.getByRole('button', { name: 'Toggle music' }));
    await user.click(
      screen.getByRole('button', { name: 'Toggle sound effects' }),
    );
    fireEvent.change(screen.getByRole('slider', { name: 'Music volume' }), {
      target: { value: '0.2' },
    });
    fireEvent.change(screen.getByRole('slider', { name: 'Effects volume' }), {
      target: { value: '0.8' },
    });

    expect(onToggleMusic).toHaveBeenCalledOnce();
    expect(onToggleEffects).toHaveBeenCalledOnce();
    expect(onMusicVolumeChange).toHaveBeenCalledOnce();
    expect(onEffectsVolumeChange).toHaveBeenCalledOnce();
  });
});
