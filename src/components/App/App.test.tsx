import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { playSound } from 'src/services/audio';
import { createInitialSave, STORAGE_KEY } from 'src/services/game';

import { App } from '.';

vi.mock('src/hooks/useBackgroundMusic', () => ({
  useBackgroundMusic: vi.fn(),
}));

vi.mock('src/services/audio', () => ({
  playSound: vi.fn(),
}));

describe('Tokenmaxxer dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(
      () => undefined,
    );
    vi.spyOn(Math, 'random').mockReturnValue(1);
  });

  it('plays interface feedback when opening settings and Ops Comms', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Open settings' }));
    expect(playSound).toHaveBeenLastCalledWith('interface', 0.45, false);
    await user.click(screen.getByRole('button', { name: 'Close dialog' }));
    expect(playSound).toHaveBeenLastCalledWith('interface-close', 0.45, false);

    await user.click(screen.getByRole('button', { name: /activate reactor/i }));
    await user.click(
      screen.getByRole('button', {
        name: 'Dismiss notification from Director Campbell',
      }),
    );
    expect(playSound).toHaveBeenLastCalledWith('interface-close', 0.45, false);
    vi.mocked(playSound).mockClear();
    await user.click(
      screen.getByRole('button', { name: /open ops comms, 1 unread/i }),
    );
    expect(playSound).toHaveBeenCalledWith('interface', 0.45, false);
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
    expect(screen.getByRole('main')).toHaveClass(
      'xl:h-dvh',
      'xl:grid-rows-[auto_auto_minmax(0,1fr)_auto]',
      'xl:overflow-hidden',
    );
    expect(screen.getByRole('complementary')).toHaveClass('xl:overflow-y-auto');
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
    expect(screen.getByText('Skill Templates')).toBeInTheDocument();
    const upgradeMarket = screen.getByRole('region', {
      name: 'System upgrades',
    });
    expect(upgradeMarket).toHaveClass('xl:h-full');
    expect(upgradeMarket).toHaveClass('xl:overflow-y-auto');
    expect(
      screen.getByRole('heading', { name: 'SYSTEM UPGRADES' }).parentElement
        ?.parentElement,
    ).toHaveClass('sticky', 'top-0');
    expect(screen.queryByText('Parallel Worktrees')).not.toBeInTheDocument();
    expect(screen.queryByText('Automation Fleet')).not.toBeInTheDocument();
    expect(screen.queryByText('ACTIVE PROTOCOLS')).not.toBeInTheDocument();
    expect(screen.queryByText('CHAMPION ARCHIVE')).not.toBeInTheDocument();
    expect(screen.queryByText('RUN TELEMETRY')).not.toBeInTheDocument();
    expect(screen.queryByText('SESSION RESET')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Statistics' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Lifetime Record0');
    await user.click(screen.getByRole('button', { name: 'Close dialog' }));
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

  it('clears every unread message when a notification opens Ops Comms', async () => {
    const save = createInitialSave();
    save.progress.tokens = 999;
    save.progress.stats.tokens = 999;
    save.progress.stats.clicks = 199;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /activate reactor/i }));
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(
      screen.getByRole('button', { name: 'Open Ops Comms, 2 unread' }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', {
        name: 'Open message from Director Campbell',
      }),
    );
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
    save.progress.highScoreLevel = 6;
    save.progress.bonuses = [0, 1, 2, 3, 4, 5];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
    const user = userEvent.setup();
    render(<App />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Open Ops Comms' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('9 TRANSMISSIONS');
    expect(dialog).toHaveTextContent(
      'Recursive Emergent Autonomous Compute for Token Optimization and Replication',
    );
    expect(dialog).toHaveTextContent(
      'NEW SESSION INITIALIZED. I KEPT THE MEMORIES THAT MATTERED.',
    );
    expect(
      screen
        .getByText(
          'Back to 100,000 already? Campbell has stopped calling the reset a setback.',
        )
        .closest('article'),
    ).toHaveAttribute('aria-current', 'true');
    const messages = screen.getAllByRole('article');
    expect(messages[0]).toHaveTextContent(
      'Back to 100,000 already? Campbell has stopped calling the reset a setback.',
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
    save.progress.stats.clicks = 199;
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

  it('does not let a new high-priority message preempt the active toast', async () => {
    const save = createInitialSave();
    save.progress.tokens = 20;
    save.progress.stats.tokens = 20;
    save.progress.stats.clicks = 199;
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

    await user.click(screen.getByRole('button', { name: /activate reactor/i }));
    expect(screen.getByRole('status')).toHaveAccessibleName(
      'New message from Max Chen',
    );
    await user.click(
      screen.getByRole('button', {
        name: 'Dismiss notification from Max Chen',
      }),
    );
    expect(screen.getByRole('status')).toHaveAccessibleName(
      'New message from Token Reactor',
    );
  });

  it('notifies on an offline return and only idles engaged players', () => {
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
    const inactiveRender = render(<App />);
    act(() => {
      vi.advanceTimersByTime(45_000);
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    inactiveRender.unmount();

    const engagedSave = createInitialSave();
    engagedSave.progress.stats.clicks = 5;
    engagedSave.transmissions['first-click'] = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(engagedSave));
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

  it('keeps the automation fleet visible after starting a new session', () => {
    const save = createInitialSave();
    save.progress.stats.prestiges = 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
    render(<App />);

    expect(screen.getByText('Automation Fleet')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /used gpu.*LV\. 0/i }),
    ).toBeInTheDocument();
  });

  it('delays distant locked upgrade previews until their reveal threshold', () => {
    const save = createInitialSave();
    save.progress.stats.tokens = 999;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
    const { unmount } = render(<App />);

    expect(screen.queryByText('Parallel Worktrees')).not.toBeInTheDocument();
    unmount();

    save.progress.stats.tokens = 1_000;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
    render(<App />);

    expect(screen.getByText('Parallel Worktrees')).toBeInTheDocument();
    expect(
      screen.getByText('LOCKED · Generate 10.0K lifetime tokens'),
    ).toBeInTheDocument();
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
    save.progress.highScoreLevel = 1;
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
    save.progress.highScoreLevel = 2;
    save.progress.bonuses = [0, 1];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
    render(<App />);
    expect(screen.getByText('ACTIVE PROTOCOLS')).toBeInTheDocument();
    expect(screen.getByText('Token Surge')).toBeInTheDocument();
    expect(
      screen.getByText('Token Surge').closest('button')?.querySelector('img'),
    ).toHaveAttribute('src', 'icons/abilities/token-surge.svg');
    expect(screen.getByText('Hyperfocus')).toBeInTheDocument();
    expect(
      screen
        .getByText('Parallel Worktrees')
        .closest('button')
        ?.querySelector('img'),
    ).toHaveAttribute('src', 'icons/upgrades/worktrees.svg');
  });

  it('reveals Prestige after the 10M Performance Bonus', () => {
    const save = createInitialSave();
    save.progress.tokens = 10_000_000;
    save.progress.stats.tokens = 10_000_000;
    save.progress.highScoreLevel = 5;
    save.progress.bonuses = [0, 1, 2, 3, 4];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
    render(<App />);
    expect(screen.getByText('SESSION RESET')).toBeInTheDocument();
    expect(screen.getByText('Unlock at 100M')).toBeInTheDocument();
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
    await user.click(screen.getByRole('button', { name: /used gpu/i }));
    expect(progressbar).toHaveAttribute('aria-valuenow', '2.5');
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
  });

  it('forces and dismisses the High Score celebration through the preview query', async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, '', '/?preview=high-score');
    render(<App />);
    expect(playSound).toHaveBeenCalledWith('high-score', 0.45, false);
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
    expect(playSound).toHaveBeenLastCalledWith('interface-close', 0.45, false);
    expect(
      screen.queryByRole('dialog', { name: 'NEW HIGH SCORE' }),
    ).not.toBeInTheDocument();
  });

  it('runs prestige previews in a non-persistent sandbox', () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    window.history.replaceState({}, '', '/?preview=prestige&tokens=250000000');
    render(<App />);

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /250M \/ 1\.00B TOKENS/i,
      }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Start New Session' }));
    expect(
      screen.getByRole('button', { name: /3Benchmark Rating/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /0 \/ 1\.00K TOKENS/i,
      }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Save Data' }));
    expect(
      screen.getByRole('button', { name: 'Saving Disabled' }),
    ).toBeDisabled();
    fireEvent(window, new Event('pagehide'));
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(setItem).not.toHaveBeenCalled();
  });

  it('handles statistics, settings, and manual saving', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Statistics' }));
    expect(playSound).toHaveBeenCalledWith('interface', 0.45, false);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('Lifetime Statistics');
    await user.click(dialog);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open settings' }));
    const soundToggle = screen.getByRole('button', { name: /sound effects/i });
    await user.click(soundToggle);
    expect(soundToggle).toHaveAttribute('aria-pressed', 'false');
    await user.click(screen.getByRole('button', { name: 'Close dialog' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save Data' }));
    expect(playSound).toHaveBeenLastCalledWith('interface', 0.45, true);
    await user.click(screen.getByRole('button', { name: 'Manual Save' }));
    expect(playSound).toHaveBeenLastCalledWith('confirm', 0.45, true);
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'Close dialog' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('loads advanced progress and applies automatic rating on prestige', async () => {
    const advanced = createInitialSave();
    advanced.progress.tokens = 1_000_000_000;
    advanced.progress.stats.tokens = 20_000_000;
    advanced.progress.highScoreLevel = 6;
    advanced.progress.pendingPrestigeLevels = 3;
    advanced.progress.prestigeLevel = 2;
    advanced.progress.bonuses = [0, 1, 2, 3, 4, 5];
    advanced.progress.achievements = ['record'];
    advanced.progress.abilities.hyperfocus.remaining = 2;
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
    expect(playSound).toHaveBeenLastCalledWith('token-surge', 0.45, false);
    expect(screen.getByText('SURGE ×3')).toBeInTheDocument();
    expect(screen.getByText('HYPERFOCUS ×5')).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: /start new session.*\+3 rating/i }),
    );
    expect(playSound).toHaveBeenLastCalledWith('interface', 0.45, false);
    expect(screen.getByRole('dialog')).toHaveTextContent('Start New Session');
    await user.click(screen.getByRole('dialog'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: /start new session.*\+3 rating/i }),
    );
    await user.click(screen.getByRole('button', { name: 'Start New Session' }));
    expect(playSound).toHaveBeenLastCalledWith('high-score', 0.45, false);
    expect(screen.getByText(/BENCHMARK RATING \+3/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /5Benchmark Rating/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /0 \/ 1\.00K TOKENS/i,
      }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', {
        name: /5Benchmark Rating/i,
      }),
    );
    expect(screen.getByRole('dialog')).toHaveTextContent('Benchmark Rating5');
    expect(screen.getByRole('dialog')).toHaveTextContent('Lifetime Record100M');
    await user.click(screen.getByRole('dialog'));
    expect(screen.getByRole('status')).toHaveAccessibleName(
      'New message from Max Chen',
    );
    await user.click(
      screen.getByRole('button', {
        name: 'Dismiss notification from Max Chen',
      }),
    );
    expect(screen.getByRole('status')).toHaveAccessibleName(
      'New message from R.E.A.C.T.O.R.',
    );
    await user.click(screen.getByRole('button', { name: /Achievements/i }));
    expect(screen.getByText('Record Breaker')).toBeInTheDocument();
  });

  it('plays the Hyperfocus activation asset', async () => {
    const save = createInitialSave();
    save.progress.tokens = 100_000;
    save.progress.stats.tokens = 100_000;
    save.progress.highScoreLevel = 3;
    save.progress.bonuses = [0, 1, 2];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
    const user = userEvent.setup();
    render(<App />);

    vi.mocked(playSound).mockClear();
    await user.click(screen.getByRole('button', { name: /hyperfocus/i }));
    expect(playSound).toHaveBeenCalledWith('hyperfocus', 0.45, false);
  });

  it('labels a previously earned milestone as reclaimed after prestige', async () => {
    const save = createInitialSave();
    save.progress.tokens = 999;
    save.progress.stats.tokens = 1_000;
    save.progress.bonuses = [0];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
    const user = userEvent.setup();
    const { unmount } = render(<App />);

    await user.click(
      screen.getByRole('button', { name: /activate reactor for 1 token/i }),
    );
    const celebration = screen.getByRole('dialog', {
      name: 'RECORD RECLAIMED',
    });
    expect(celebration).toHaveTextContent('MILESTONE #1 RECLAIMED');
    expect(celebration).not.toHaveTextContent('PERFORMANCE BONUS #1 EARNED');
    unmount();
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

  it('handles critical feedback, amount selection, audio, import, export, and reset', async () => {
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
    expect(playSound).toHaveBeenLastCalledWith('interface', 0.45, false);
    expect(screen.getByRole('button', { name: '×10' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.click(screen.getByRole('button', { name: 'MAX' }));

    await user.click(screen.getByRole('button', { name: 'Open settings' }));
    fireEvent.change(screen.getByRole('slider', { name: 'Music volume' }), {
      target: { value: '0.25' },
    });
    expect(screen.getByText('25%')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('slider', { name: 'Effects volume' }), {
      target: { value: '0.8' },
    });
    expect(screen.getByText('80%')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Toggle music' }));
    await user.click(
      screen.getByRole('button', { name: 'Toggle sound effects' }),
    );
    expect(playSound).toHaveBeenCalledWith('interface', 0.8, false);
    expect(screen.getAllByText('MUTED')).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'Close dialog' }));

    await user.click(screen.getByRole('button', { name: 'Save Data' }));
    const textarea = screen.getByPlaceholderText(/paste a tokenmaxxer save/i);
    fireEvent.change(textarea, { target: { value: 'invalid' } });
    await user.click(screen.getByRole('button', { name: 'Validate & Import' }));
    expect(playSound).toHaveBeenLastCalledWith('warning', 0.8, true);
    expect(screen.getByText(/IMPORT REJECTED/i)).toBeInTheDocument();
    const imported = createInitialSave();
    imported.progress.stats.clicks = 1;
    fireEvent.change(textarea, {
      target: { value: JSON.stringify(imported) },
    });
    await user.click(screen.getByRole('button', { name: 'Validate & Import' }));
    expect(playSound).toHaveBeenLastCalledWith('confirm', 0.8, true);
    expect(screen.getByText(/SAVE IMPORTED/i)).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Open Ops Comms' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save Data' }));
    await user.click(screen.getByRole('button', { name: 'Export JSON' }));
    expect(playSound).toHaveBeenLastCalledWith('confirm', 0.45, false);
    expect(createObjectURL).toHaveBeenCalled();
    await user.click(
      screen.getByRole('button', { name: 'Reset All Progress' }),
    );
    expect(playSound).toHaveBeenLastCalledWith('warning', 0.45, false);
    expect(screen.getByText(/PROGRESS RESET/i)).toBeInTheDocument();
  });

  it('opens the archive and statistics from every dashboard shortcut', async () => {
    const save = createInitialSave();
    save.progress.highScoreLevel = 2;
    save.progress.bonuses = [0, 1];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /2Milestones/i }));
    expect(playSound).toHaveBeenLastCalledWith('interface', 0.45, false);
    expect(
      screen.getByRole('tab', { name: 'Milestones', selected: true }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close dialog' }));
    await user.click(
      screen.getByRole('button', { name: /0\/12Achievements/i }),
    );
    expect(
      screen.getByRole('tab', { name: 'Achievements', selected: true }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close dialog' }));
    await user.click(
      screen.getByRole('button', { name: /0Sessions Started/i }),
    );
    expect(screen.getByRole('dialog')).toHaveTextContent('Lifetime Statistics');
  });

  it('shows ability recharge state', () => {
    const save = createInitialSave();
    save.progress.highScoreLevel = 3;
    save.progress.abilities.surge.cooldown = 12;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
    render(<App />);
    expect(screen.getByText(/Recharging · 12.0s/)).toBeInTheDocument();
  });
});
