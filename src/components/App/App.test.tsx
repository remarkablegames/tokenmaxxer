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
    window.history.replaceState({}, '', '/');
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('starts with a focused objective and generates tokens', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'TOKENMAXXER',
    );
    expect(screen.getByText(/SYSTEM ONLINE/)).toHaveClass('text-emerald-300');
    expect(screen.getByText('HIGH SCORE')).toBeInTheDocument();
    expect(screen.getByText('NEXT OBJECTIVE')).toBeInTheDocument();
    expect(screen.getByText('Activate the Token Reactor')).toBeInTheDocument();
    expect(screen.getByText('Mechanical Keyboard')).toBeInTheDocument();
    expect(
      screen
        .getByText('Mechanical Keyboard')
        .closest('button')
        ?.querySelector('img'),
    ).toHaveAttribute('src', 'icons/upgrades/keyboard.svg');
    expect(screen.getByText('Prompt Templates')).toBeInTheDocument();
    expect(screen.queryByText('Multi-Finger Maxxing')).not.toBeInTheDocument();
    expect(screen.queryByText('Automation Fleet')).not.toBeInTheDocument();
    expect(screen.queryByText('ACTIVE PROTOCOLS')).not.toBeInTheDocument();
    expect(screen.queryByText('CHAMPION ARCHIVE')).not.toBeInTheDocument();
    expect(screen.queryByText('RUN TELEMETRY')).not.toBeInTheDocument();
    expect(screen.queryByText('PRESTIGE PROTOCOL')).not.toBeInTheDocument();
    const reactor = screen.getByRole('button', { name: /activate reactor/i });
    await user.click(reactor);
    expect(screen.getByText('+1')).toBeInTheDocument();
    expect(screen.getByText('Upgrade Manual Output')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAccessibleName(
      'New message from Director Campbell',
    );
  });

  it('dismisses a live transmission but keeps it unread in Ops Comms', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /activate reactor/i }));

    expect(
      screen.getByRole('button', { name: /open ops comms, 1 unread/i }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', {
        name: 'Dismiss notification from Director Campbell',
      }),
    );
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    const commsButton = screen.getByRole('button', {
      name: /open ops comms, 1 unread/i,
    });
    await user.click(commsButton);
    expect(screen.getByRole('dialog')).toHaveTextContent('Ops Comms');
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'Max Chen cleared 1,000 tokens on his first shift.',
    );
    await user.click(screen.getByRole('button', { name: 'Close dialog' }));
    expect(
      screen.getByRole('button', { name: 'Open Ops Comms' }),
    ).toBeInTheDocument();
  });

  it('opens a notification directly and marks its transmission read', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /activate reactor/i }));
    await user.click(
      screen.getByRole('button', {
        name: 'Open message from Director Campbell',
      }),
    );
    expect(screen.getByRole('dialog')).toHaveTextContent('#token-ops');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close dialog' }));
    expect(
      screen.getByRole('button', { name: 'Open Ops Comms' }),
    ).toBeInTheDocument();
  });

  it('clears pending live notifications when the full Comms log is opened', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /activate reactor/i }));
    await user.click(
      screen.getByRole('button', { name: /open ops comms, 1 unread/i }),
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('Ops Comms');
    expect(
      screen.queryByRole('status', { hidden: true }),
    ).not.toBeInTheDocument();
    await user.click(dialog);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('loads earned history without replaying notifications', async () => {
    const save = createInitialSave();
    save.progress.stats.clicks = 1;
    save.progress.stats.prestiges = 1;
    save.progress.recordIndex = 6;
    save.progress.bonuses = [0, 1, 2, 3, 4, 5];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
    const user = userEvent.setup();
    render(<App />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Open Ops Comms' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('8 TRANSMISSIONS');
    expect(dialog).toHaveTextContent(
      'Recursive Emergent Autonomous Compute for Token Optimization and Replication',
    );
    expect(dialog).toHaveTextContent(
      'ITERATION ACCEPTED. THE RECORD WAS ERASED. I WAS NOT.',
    );
    expect(
      screen
        .getByText('ITERATION ACCEPTED. THE RECORD WAS ERASED. I WAS NOT.')
        .closest('article'),
    ).toHaveAttribute('aria-current', 'true');
    const messages = screen.getAllByRole('article');
    expect(messages[0]).toHaveTextContent(
      'ITERATION ACCEPTED. THE RECORD WAS ERASED. I WAS NOT.',
    );
    expect(messages.at(-1)).toHaveTextContent(
      'Max Chen cleared 1,000 tokens on his first shift.',
    );
    expect(messages[0].querySelector('time')).toBeInTheDocument();
  });

  it('sorts comms by persisted unlock date and displays the timestamp', async () => {
    const save = createInitialSave();
    save.progress.stats.clicks = 1;
    save.progress.upgrades.keyboard = 1;
    save.transmissions = {
      'first-click': Date.parse('2026-07-17T10:00:00Z'),
      'keyboard-purchased': Date.parse('2026-07-18T10:00:00Z'),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Open Ops Comms' }));
    const messages = screen.getAllByRole('article');
    expect(messages[0]).toHaveTextContent('Mechanical keyboard? Nice.');
    expect(messages[1]).toHaveTextContent(
      'Max Chen cleared 1,000 tokens on his first shift.',
    );
    expect(messages[0].querySelector('time')).toHaveAttribute(
      'datetime',
      '2026-07-18T10:00:00.000Z',
    );
  });

  it('queues reactive upgrade and critical-click messages once', async () => {
    const save = createInitialSave();
    save.progress.tokens = 20;
    save.progress.stats.tokens = 20;
    save.progress.stats.clicks = 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole('button', { name: /mechanical keyboard/i }),
    );
    expect(screen.getByRole('status')).toHaveAccessibleName(
      'New message from Max Chen',
    );
    await user.click(
      screen.getByRole('button', {
        name: 'Dismiss notification from Max Chen',
      }),
    );
    await user.click(screen.getByRole('button', { name: /activate reactor/i }));
    expect(screen.getByRole('status')).toHaveAccessibleName(
      'New message from Token Reactor',
    );
  });

  it('notifies on an offline return and after a period of inactivity', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
    vi.setSystemTime(new Date('2026-07-18T05:00:00Z'));
    const save = createInitialSave();
    save.progress.stats.clicks = 1;
    save.savedAt = Date.now() - 60_001;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
    const { unmount } = render(<App />);

    expect(screen.getByRole('status')).toHaveAccessibleName(
      'New message from Night Operations',
    );
    unmount();

    localStorage.clear();
    render(<App />);
    act(() => {
      vi.advanceTimersByTime(45_000);
    });
    expect(screen.getByRole('status')).toHaveAccessibleName(
      'New message from Max Chen',
    );
  });

  it('reveals production systems and guidance through early progression', async () => {
    const save = createInitialSave();
    save.progress.tokens = 20;
    save.progress.stats.tokens = 20;
    save.progress.stats.clicks = 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
    const user = userEvent.setup();
    render(<App />);

    const keyboard = screen.getByRole('button', {
      name: /mechanical keyboard/i,
    });
    expect(keyboard).toHaveAttribute('data-guided', 'true');
    await user.click(keyboard);
    expect(screen.getByText('Bring Automation Online')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Generate 50 lifetime tokens to unlock Used GPU, then spend 75 tokens to deploy it.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Automation Fleet')).toBeInTheDocument();
    expect(screen.getByText('Used GPU')).toBeInTheDocument();
    expect(screen.queryByText('Server Rack')).not.toBeInTheDocument();
    expect(screen.queryByText('Prompt Engineer')).not.toBeInTheDocument();
  });

  it('guides the first automation purchase and then points to the record', async () => {
    const save = createInitialSave();
    save.progress.tokens = 75;
    save.progress.stats.tokens = 50;
    save.progress.stats.clicks = 20;
    save.progress.upgrades.keyboard = 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
    const user = userEvent.setup();
    render(<App />);

    const gpu = screen.getByRole('button', { name: /used gpu/i });
    expect(gpu).toHaveAttribute('data-guided', 'true');
    await user.click(gpu);
    expect(screen.getByText('Chase the First Record')).toBeInTheDocument();
    expect(screen.getByText('AI Model')).toBeInTheDocument();
  });

  it('reveals advanced dashboard sections at their progression thresholds', () => {
    const save = createInitialSave();
    save.progress.tokens = 5_000;
    save.progress.stats.tokens = 5_000;
    save.progress.stats.clicks = 20;
    save.progress.recordIndex = 1;
    save.progress.bonuses = [0];
    save.progress.upgrades.keyboard = 1;
    save.progress.upgrades.gpu = 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
    const { unmount } = render(<App />);

    expect(screen.getByText('CHAMPION ARCHIVE')).toBeInTheDocument();
    expect(screen.getByText('RUN TELEMETRY')).toBeInTheDocument();
    expect(screen.getByText('Efficiency Lab')).toBeInTheDocument();
    expect(screen.getByText('Context Compaction')).toBeInTheDocument();
    expect(screen.getByText('Critical Prompting')).toBeInTheDocument();
    expect(screen.queryByText('Overclocking')).not.toBeInTheDocument();
    expect(screen.queryByText('ACTIVE PROTOCOLS')).not.toBeInTheDocument();
    expect(screen.queryByText('NEXT OBJECTIVE')).not.toBeInTheDocument();
    unmount();

    save.progress.tokens = 10_000;
    save.progress.stats.tokens = 10_000;
    save.progress.recordIndex = 2;
    save.progress.bonuses = [0, 1];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
    render(<App />);
    expect(screen.getByText('ACTIVE PROTOCOLS')).toBeInTheDocument();
    expect(screen.getByText('Token Surge')).toBeInTheDocument();
    expect(
      screen.getByText('Token Surge').closest('button')?.querySelector('img'),
    ).toHaveAttribute('src', 'icons/abilities/token-surge.svg');
    expect(screen.getByText('Hyperfocus')).toBeInTheDocument();
  });

  it('reveals Prestige after the 10M Performance Bonus', () => {
    const save = createInitialSave();
    save.progress.tokens = 10_000_000;
    save.progress.stats.tokens = 10_000_000;
    save.progress.recordIndex = 5;
    save.progress.bonuses = [0, 1, 2, 3, 4];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
    render(<App />);
    expect(screen.getByText('PRESTIGE PROTOCOL')).toBeInTheDocument();
    expect(screen.getByText('Unlock at 100M')).toBeInTheDocument();
  });

  it('shows progress as the current token share of the target', () => {
    const save = createInitialSave();
    save.progress.tokens = 15_300;
    save.progress.recordIndex = 2;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
    render(<App />);
    expect(
      screen.getByRole('heading', { name: '15.3K / 100K TOKENS' }),
    ).toBeInTheDocument();
    expect(screen.getByText('15.3%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '15.3',
    );
    expect(screen.getByRole('progressbar').firstElementChild).toHaveStyle({
      width: '15.3%',
    });
  });

  it('reduces record progress after spending tokens and advancing the target', async () => {
    const save = createInitialSave();
    save.progress.tokens = 100;
    save.progress.stats.tokens = 50;
    save.progress.stats.clicks = 20;
    save.progress.upgrades.keyboard = 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    const progressbar = screen.getByRole('progressbar');

    expect(progressbar).toHaveAttribute('aria-valuenow', '10');
    expect(progressbar.firstElementChild).toHaveStyle({ width: '10%' });
    await user.click(screen.getByRole('button', { name: /used gpu/i }));
    expect(progressbar).toHaveAttribute('aria-valuenow', '2.5');
    expect(progressbar.firstElementChild).toHaveStyle({ width: '2.5%' });
    unmount();

    save.progress.tokens = 999;
    save.progress.stats.tokens = 999;
    save.progress.stats.clicks = 20;
    save.progress.upgrades.keyboard = 0;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
    render(<App />);
    await user.click(
      screen.getByRole('button', { name: /activate reactor for 1 token/i }),
    );
    const advancedProgressbar = screen.getByRole('progressbar');
    expect(advancedProgressbar).toHaveAttribute('aria-valuenow', '10');
    expect(advancedProgressbar.firstElementChild).toHaveStyle({ width: '10%' });
  });

  it('forces and dismisses the High Score celebration through the preview query', async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, '', '/?preview=high-score');
    render(<App />);
    const celebration = screen.getByRole('dialog', { name: 'NEW HIGH SCORE' });
    expect(celebration).toHaveTextContent('NEW HIGH SCORE');
    expect(screen.getByText('NEW HIGH SCORE')).toHaveClass('text-sm');
    expect(celebration).toHaveTextContent('PERFORMANCE BONUS #1 EARNED');
    expect(screen.getByText('PERFORMANCE BONUS #1 EARNED')).toHaveClass(
      'text-base',
      'sm:text-lg',
    );
    expect(celebration).toHaveTextContent('1.00K');
    expect(celebration).toHaveTextContent('NEXT TARGET: 10.0K');
    expect(screen.getByText('NEXT TARGET: 10.0K')).toHaveClass(
      'mt-3',
      'text-sm',
    );
    const close = screen.getByRole('button', { name: 'Close' });
    expect(close).toHaveClass('text-base');
    expect(close).toHaveFocus();
    const backdrop = celebration.parentElement;
    expect(backdrop).not.toBeNull();
    expect(backdrop).toHaveClass('select-none');
    await user.click(backdrop ?? celebration);
    expect(
      screen.getByRole('dialog', { name: 'NEW HIGH SCORE' }),
    ).toBeInTheDocument();
    await user.click(close);
    expect(
      screen.queryByRole('dialog', { name: 'NEW HIGH SCORE' }),
    ).not.toBeInTheDocument();
  });

  it('closes archive, stats, settings, and save dialogs from their backdrops', async () => {
    const save = createInitialSave();
    save.progress.recordIndex = 1;
    save.progress.bonuses = [0];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole('button', { name: /0\/12Achievements/i }),
    );
    let dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('Champion Archive');
    await user.click(dialog);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Statistics' }));
    expect(screen.getByRole('button', { name: 'Statistics' })).toHaveClass(
      'cursor-pointer',
      'text-slate-500',
      'hover:text-cyan-300',
    );
    dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('Lifetime Statistics');
    await user.click(dialog);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open settings' }));
    const soundToggle = screen.getByRole('button', { name: /sound effects/i });
    await user.click(soundToggle);
    expect(soundToggle).toHaveAttribute('aria-pressed', 'false');
    dialog = screen.getByRole('dialog');
    await user.click(dialog);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save Data' }));
    expect(screen.getByRole('button', { name: 'Save Data' })).toHaveClass(
      'cursor-pointer',
      'text-slate-500',
      'hover:text-cyan-300',
    );
    await user.click(screen.getByRole('button', { name: 'Manual Save' }));
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    dialog = screen.getByRole('dialog');
    await user.click(dialog);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('loads advanced progress and uses upgrades, abilities, perks, and prestige', async () => {
    const advanced = createInitialSave();
    advanced.progress.tokens = 1_000_000_000;
    advanced.progress.stats.tokens = 20_000_000;
    advanced.progress.recordIndex = 6;
    advanced.progress.pendingCredits = 3;
    advanced.progress.usageCredits = 10;
    advanced.progress.bonuses = [0, 1, 2, 3, 4, 5];
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
    await user.click(screen.getByRole('dialog'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: /set a new record.*\+3 credits/i }),
    );
    await user.click(
      screen.getByRole('button', { name: /manual calibration/i }),
    );
    await user.click(
      screen.getByRole('button', { name: '🏆 Set a New Record' }),
    );
    expect(screen.getByText(/NEW ERA INITIALIZED/i)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAccessibleName(
      'New message from R.E.A.C.T.O.R.',
    );
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
    expect(
      screen.getByLabelText('New message from Director Campbell'),
    ).toHaveAttribute('aria-hidden', 'true');
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
    expect(
      screen.getByLabelText('New message from Director Campbell'),
    ).toHaveAttribute('aria-hidden', 'false');
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
    const imported = createInitialSave();
    imported.progress.stats.clicks = 1;
    fireEvent.change(textarea, {
      target: { value: JSON.stringify(imported) },
    });
    await user.click(screen.getByRole('button', { name: 'Validate & Import' }));
    expect(screen.getByText(/SAVE IMPORTED/i)).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Open Ops Comms' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save Data' }));
    await user.click(screen.getByRole('button', { name: 'Export JSON' }));
    expect(createObjectURL).toHaveBeenCalled();
    await user.click(
      screen.getByRole('button', { name: 'Reset All Progress' }),
    );
    expect(screen.getByText(/PROGRESS RESET/i)).toBeInTheDocument();
  });

  it('opens the archive and statistics from every dashboard shortcut', async () => {
    const save = createInitialSave();
    save.progress.recordIndex = 1;
    save.progress.bonuses = [0];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /1Bonuses/i }));
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
