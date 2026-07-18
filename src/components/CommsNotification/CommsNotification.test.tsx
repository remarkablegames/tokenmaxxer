import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommsNotification } from 'src/components/CommsNotification';
import { TRANSMISSIONS } from 'src/services/transmissions';

describe('CommsNotification', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens and dismisses through separate controls', async () => {
    const onDismiss = vi.fn();
    const onOpen = vi.fn();
    const user = userEvent.setup();
    render(
      <CommsNotification
        blocked={false}
        onDismiss={onDismiss}
        onOpen={onOpen}
        onTimeout={vi.fn()}
        transmission={TRANSMISSIONS[0]}
      />,
    );
    expect(screen.getByRole('status')).toHaveClass('h-32');
    expect(screen.getByText(TRANSMISSIONS[0].message)).toHaveClass(
      'line-clamp-2',
    );

    await user.click(
      screen.getByRole('button', { name: /open message from director/i }),
    );
    expect(onOpen).toHaveBeenCalledOnce();
    await user.click(
      screen.getByRole('button', {
        name: /dismiss notification from director/i,
      }),
    );
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('times out after eight active seconds and pauses while blocked or engaged', () => {
    vi.useFakeTimers();
    const onTimeout = vi.fn();
    render(
      <CommsNotification
        blocked={false}
        onDismiss={vi.fn()}
        onOpen={vi.fn()}
        onTimeout={onTimeout}
        transmission={TRANSMISSIONS[0]}
      />,
    );
    const notification = screen.getByRole('status');

    act(() => {
      vi.advanceTimersByTime(2_000);
    });
    fireEvent.mouseEnter(notification);
    act(() => {
      vi.advanceTimersByTime(4_000);
    });
    expect(onTimeout).not.toHaveBeenCalled();
    fireEvent.mouseLeave(notification);
    act(() => {
      vi.advanceTimersByTime(3_000);
    });
    fireEvent.focus(
      screen.getByRole('button', { name: /open message from director/i }),
    );
    act(() => {
      vi.advanceTimersByTime(4_000);
    });
    fireEvent.blur(
      screen.getByRole('button', { name: /open message from director/i }),
    );
    act(() => {
      vi.advanceTimersByTime(2_999);
    });
    expect(onTimeout).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onTimeout).toHaveBeenCalledOnce();
  });

  it('dismisses with Escape unless blocked and resets for a new message', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    const onTimeout = vi.fn();
    const { rerender } = render(
      <CommsNotification
        blocked
        onDismiss={onDismiss}
        onOpen={vi.fn()}
        onTimeout={onTimeout}
        transmission={TRANSMISSIONS[0]}
      />,
    );
    act(() => {
      vi.advanceTimersByTime(8_000);
    });
    expect(onTimeout).not.toHaveBeenCalled();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onDismiss).not.toHaveBeenCalled();

    rerender(
      <CommsNotification
        blocked={false}
        onDismiss={onDismiss}
        onOpen={vi.fn()}
        onTimeout={onTimeout}
        transmission={TRANSMISSIONS[1]}
      />,
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onDismiss).toHaveBeenCalledOnce();
    act(() => {
      vi.advanceTimersByTime(8_000);
    });
    expect(onTimeout).toHaveBeenCalledOnce();
  });
});
