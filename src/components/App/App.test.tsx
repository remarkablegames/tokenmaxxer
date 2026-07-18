import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createInitialSave, STORAGE_KEY } from 'src/services/game';

import { App } from '.';

describe('Tokenmaxxer dashboard', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(
      () => undefined,
    );
    vi.spyOn(Math, 'random').mockReturnValue(1);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders the complete dashboard and generates tokens', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'TOKENMAXXER',
    );
    expect(screen.getByText('CURRENT HIGH SCORE TARGET')).toBeInTheDocument();
    const reactor = screen.getByRole('button', { name: /activate reactor/i });
    await user.click(reactor);
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('opens archive, stats, settings, and save dialogs', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole('button', { name: /0\/12Achievements/i }),
    );
    expect(screen.getByRole('dialog')).toHaveTextContent('Champion Archive');
    await user.click(screen.getByRole('button', { name: 'Close dialog' }));

    await user.click(screen.getByRole('button', { name: 'Statistics' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Lifetime Statistics');
    await user.click(screen.getByRole('button', { name: 'Close dialog' }));

    await user.click(screen.getByRole('button', { name: 'Open settings' }));
    const soundToggle = screen.getByRole('button', { name: /sound effects/i });
    await user.click(soundToggle);
    expect(soundToggle).toHaveAttribute('aria-pressed', 'false');
    await user.click(screen.getByRole('button', { name: 'Close dialog' }));

    await user.click(screen.getByRole('button', { name: 'Save Data' }));
    await user.click(screen.getByRole('button', { name: 'Manual Save' }));
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
  });

  it('loads advanced progress and uses upgrades, abilities, perks, and prestige', async () => {
    const advanced = createInitialSave();
    advanced.progress.tokens = 1_000_000_000;
    advanced.progress.stats.tokens = 20_000_000;
    advanced.progress.recordIndex = 6;
    advanced.progress.pendingCredits = 3;
    advanced.progress.usageCredits = 10;
    advanced.progress.trophies = [0, 1, 2, 3, 4, 5];
    advanced.progress.achievements = ['record'];
    advanced.progress.abilities.hyperfocus.remaining = 2;
    advanced.progress.perks.cooldownOptimization = 8;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(advanced));
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole('button', { name: /mechanical keyboard/i }),
    );
    expect(
      screen.getByRole('button', { name: /mechanical keyboard.*LV\. 1/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /token surge/i }));
    expect(screen.getByText('SURGE ×3')).toBeInTheDocument();
    expect(screen.getByText('HYPERFOCUS ×5')).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: /set a new record.*\+3 credits/i }),
    );
    expect(screen.getByText('MAX LEVEL')).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: /manual calibration/i }),
    );
    await user.click(
      screen.getByRole('button', { name: '🏆 Set a New Record' }),
    );
    expect(screen.getByText(/NEW ERA INITIALIZED/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Achievements/i }));
    expect(screen.getAllByText('◆')).not.toHaveLength(0);
  });

  it('runs visible frames, pauses hidden frames, saves lifecycle state, and celebrates records', () => {
    vi.useFakeTimers();
    const initial = createInitialSave();
    initial.progress.tokens = 999;
    initial.progress.upgrades.gpu = 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    let frameCallback: FrameRequestCallback = () => undefined;
    vi.mocked(window.requestAnimationFrame).mockImplementation((callback) => {
      frameCallback = callback;
      return 1;
    });
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    render(<App />);

    act(() => {
      frameCallback(performance.now() + 2_000);
    });
    expect(screen.getAllByText(/NEW HIGH SCORE/i)).not.toHaveLength(0);
    hidden.mockReturnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));
    act(() => {
      frameCallback(performance.now() + 500);
    });
    window.dispatchEvent(new Event('pagehide'));
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /activate reactor/i }));
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(screen.queryByText(/NEW HIGH SCORE/i)).not.toBeInTheDocument();
  });

  it('handles critical feedback, amount selection, volume, import, export, and reset', async () => {
    const createObjectURL = vi.fn(() => 'blob:save');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
      () => undefined,
    );
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /activate reactor/i }));
    expect(screen.getByText(/CRITICAL 5/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '×10' }));
    expect(screen.getByRole('button', { name: '×10' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.click(screen.getByRole('button', { name: 'MAX' }));

    await user.click(screen.getByRole('button', { name: 'Open settings' }));
    fireEvent.change(screen.getByRole('slider'), { target: { value: '0.8' } });
    expect(screen.getByText('80%')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close dialog' }));

    await user.click(screen.getByRole('button', { name: 'Save Data' }));
    const textarea = screen.getByPlaceholderText(/paste a tokenmaxxer save/i);
    fireEvent.change(textarea, { target: { value: 'invalid' } });
    await user.click(screen.getByRole('button', { name: 'Validate & Import' }));
    expect(screen.getByText(/IMPORT REJECTED/i)).toBeInTheDocument();
    fireEvent.change(textarea, {
      target: { value: JSON.stringify(createInitialSave()) },
    });
    await user.click(screen.getByRole('button', { name: 'Validate & Import' }));
    expect(screen.getByText(/SAVE IMPORTED/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save Data' }));
    await user.click(screen.getByRole('button', { name: 'Export JSON' }));
    expect(createObjectURL).toHaveBeenCalled();
    await user.click(
      screen.getByRole('button', { name: 'Reset All Progress' }),
    );
    expect(screen.getByText(/PROGRESS RESET/i)).toBeInTheDocument();
  });

  it('opens the archive and statistics from every dashboard shortcut', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /0Trophies/i }));
    await user.click(screen.getByRole('button', { name: 'Close dialog' }));
    await user.click(screen.getByRole('button', { name: /0Prestiges/i }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Lifetime Statistics');
  });

  it('shows ability recharge state', () => {
    const save = createInitialSave();
    save.progress.recordIndex = 3;
    save.progress.abilities.surge.cooldown = 12;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
    render(<App />);
    expect(screen.getByText(/Recharging · 12.0s/)).toBeInTheDocument();
  });
});
