import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Reactor } from '.';

describe('Reactor', () => {
  it('warms its palette as the reactor advances toward the cosmic stage', async () => {
    const onActivate = vi.fn();
    const { container, rerender } = render(
      <Reactor
        active={false}
        guided={false}
        label="Activate reactor"
        onActivate={onActivate}
        overdriveLevel={0}
        stage={0}
      />,
    );

    const gradientColors = (): string[] =>
      [...container.querySelectorAll('stop')].map(
        (stop) => stop.getAttribute('stop-color') ?? '',
      );

    expect(screen.getByRole('button')).toHaveTextContent('Workstation');
    expect(gradientColors()).toEqual(['#fff', '#67e8f9', '#0891b2']);

    rerender(
      <Reactor
        active
        guided
        label="Activate reactor"
        onActivate={onActivate}
        overdriveLevel={0}
        stage={3}
      />,
    );
    expect(screen.getByRole('button')).toHaveTextContent('Datacenter');
    expect(gradientColors()).toEqual(['#fff', '#c084fc', '#a21caf']);

    rerender(
      <Reactor
        active={false}
        guided={false}
        label="Activate reactor"
        onActivate={onActivate}
        overdriveLevel={0}
        stage={5}
      />,
    );
    expect(screen.getByRole('button')).toHaveTextContent(
      'Cosmic Token Reactor',
    );
    expect(gradientColors()).toEqual(['#fff', '#fb923c', '#dc2626']);

    rerender(
      <Reactor
        active={false}
        guided={false}
        label="Activate reactor"
        onActivate={onActivate}
        overdriveLevel={1}
        stage={5}
      />,
    );
    expect(screen.getByRole('button')).toHaveTextContent('OVERDRIVE I');
    expect(gradientColors()).toEqual(['#fff', '#fb7185', '#ef4444']);

    rerender(
      <Reactor
        active={false}
        guided={false}
        label="Activate reactor"
        onActivate={onActivate}
        overdriveLevel={2}
        stage={5}
      />,
    );
    expect(screen.getByRole('button')).toHaveTextContent('OVERDRIVE II');
    expect(gradientColors()).toEqual(['#fff', '#fff7ed', '#be123c']);

    rerender(
      <Reactor
        active={false}
        guided={false}
        label="Activate reactor"
        onActivate={onActivate}
        overdriveLevel={3}
        stage={5}
      />,
    );
    expect(screen.getByRole('button')).toHaveTextContent('OVERDRIVE III');
    expect(gradientColors()).toEqual(['#fff', '#fef3c7', '#ef4444']);

    await userEvent.click(screen.getByRole('button'));
    expect(onActivate).toHaveBeenCalledOnce();
  });
});
