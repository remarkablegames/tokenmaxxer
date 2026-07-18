import type { ChangeEvent, MouseEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Reactor } from 'src/components/Reactor';
import { playSound } from 'src/services/audio';
import {
  ABILITIES,
  ACHIEVEMENTS,
  activateAbility,
  calculateMetrics,
  clickReactor,
  formatDuration,
  formatNumber,
  getPerkCost,
  getPurchaseQuote,
  getReactorStage,
  getRecordTarget,
  parseSave,
  PERKS,
  prestige,
  purchasePerk,
  purchaseUpgrade,
  tickGame,
  UPGRADES,
} from 'src/services/game';
import { exportSave, loadSave, saveGame } from 'src/services/storage';
import type {
  AbilityId,
  BuyMode,
  GameProgress,
  PerkId,
  SaveEnvelope,
  UpgradeCategory,
  UpgradeId,
} from 'src/types/game.types';

interface FloatText {
  id: number;
  amount: number;
  critical: boolean;
  x: number;
  y: number;
}
type Modal =
  'none' | 'prestige' | 'achievements' | 'stats' | 'settings' | 'save';

const CATEGORY_LABELS: Record<UpgradeCategory, string> = {
  manual: 'Manual Systems',
  automation: 'Automation Fleet',
  efficiency: 'Efficiency Lab',
};
const PANEL_CLASS =
  'rounded-2xl border border-white/8 bg-linear-to-br from-[#0f1e31]/90 to-[#060e1c]/95 shadow-[inset_0_1px_0_rgb(255_255_255/0.035),0_18px_60px_rgb(0_0_0/0.22)]';
const EYEBROW_CLASS = 'text-xs font-extrabold tracking-[0.2em] text-cyan-300';
const ICON_BUTTON_CLASS =
  'grid size-10 cursor-pointer place-items-center rounded-xl border border-white/10 bg-white/4 text-slate-300 transition-colors hover:border-cyan-300/45 hover:bg-cyan-400/8';
const ACTION_BUTTON_CLASS =
  'cursor-pointer rounded-xl px-4 py-3 text-xs font-extrabold transition hover:-translate-y-px hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-40';

export function App() {
  const [save, setSave] = useState<SaveEnvelope>(() => loadSave());
  const [buyMode, setBuyMode] = useState<BuyMode>(1);
  const [modal, setModal] = useState<Modal>('none');
  const [floats, setFloats] = useState<FloatText[]>([]);
  const [celebration, setCelebration] = useState<number | null>(() =>
    new URLSearchParams(window.location.search).get('preview') === 'high-score'
      ? Math.max(0, save.progress.recordIndex - 1)
      : null,
  );
  const [notice, setNotice] = useState('SYSTEM ONLINE');
  const [importText, setImportText] = useState('');
  const lastFrame = useRef(0);
  const previousRecord = useRef(save.progress.recordIndex);
  const floatId = useRef(0);
  const progressRef = useRef(save.progress);
  const saveRef = useRef(save);

  const progress = save.progress;
  const metrics = calculateMetrics(progress);
  const target = getRecordTarget(progress.recordIndex);
  const recordProgress = Math.min(
    100,
    Math.max(0, (progress.tokens / target) * 100),
  );
  const stage = getReactorStage(progress.recordIndex);

  useEffect(() => {
    progressRef.current = progress;
    saveRef.current = save;
  }, [progress, save]);

  useEffect(() => {
    let frame = 0;
    lastFrame.current = performance.now();
    const loop = (now: number) => {
      const delta = (now - lastFrame.current) / 1_000;
      lastFrame.current = now;
      if (!document.hidden)
        setSave((current) => ({
          ...current,
          progress: tickGame(current.progress, delta),
        }));
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    const onVisibility = () => {
      lastFrame.current = performance.now();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      saveGame({ ...saveRef.current, progress: progressRef.current });
    }, 5_000);
    const onPageHide = () => {
      saveGame({ ...saveRef.current, progress: progressRef.current });
    };
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, []);

  useEffect(() => {
    if (progress.recordIndex > previousRecord.current) {
      const won = progress.recordIndex - 1;
      setCelebration(won);
      setNotice('NEW HIGH SCORE');
      playSound('milestone', save.preferences.volume, save.preferences.muted);
      const timer = window.setTimeout(() => {
        setCelebration(null);
        setNotice('SYSTEM ONLINE');
      }, 3_200);
      previousRecord.current = progress.recordIndex;
      return () => {
        window.clearTimeout(timer);
      };
    }
    previousRecord.current = progress.recordIndex;
  }, [progress.recordIndex, save.preferences]);

  const updateProgress = (next: GameProgress) => {
    setSave((current) => ({ ...current, progress: next }));
  };

  const handleReactor = (event: MouseEvent<HTMLButtonElement>) => {
    const result = clickReactor(progress);
    updateProgress(result.progress);
    playSound(
      result.critical ? 'critical' : 'click',
      save.preferences.volume,
      save.preferences.muted,
    );
    const id = floatId.current++;
    setFloats((current) => [
      ...current.slice(-7),
      {
        id,
        amount: result.amount,
        critical: result.critical,
        x: event.clientX,
        y: event.clientY,
      },
    ]);
    window.setTimeout(() => {
      setFloats((current) => current.filter((item) => item.id !== id));
    }, 900);
  };

  const handlePurchase = (id: UpgradeId) => {
    const next = purchaseUpgrade(progress, id, buyMode);
    /* v8 ignore else -- disabled upgrade controls enforce affordable actions */
    if (next !== progress) {
      updateProgress(next);
      playSound('purchase', save.preferences.volume, save.preferences.muted);
    }
  };

  const handleAbility = (id: AbilityId) => {
    const next = activateAbility(progress, id);
    /* v8 ignore else -- disabled ability controls enforce ready actions */
    if (next !== progress) {
      updateProgress(next);
      playSound('ability', save.preferences.volume, save.preferences.muted);
    }
  };

  const handlePrestige = () => {
    const next = prestige(progress);
    /* v8 ignore else -- the prestige control is disabled without a payout */
    if (next !== progress) {
      updateProgress(next);
      setModal('none');
      playSound('prestige', save.preferences.volume, save.preferences.muted);
      setNotice('NEW ERA INITIALIZED');
    }
  };

  const handlePerk = (id: PerkId) => {
    updateProgress(purchasePerk(progress, id));
  };

  const handleVolume = (event: ChangeEvent<HTMLInputElement>) => {
    setSave((current) => ({
      ...current,
      preferences: {
        ...current.preferences,
        volume: Number(event.target.value),
      },
    }));
  };

  const handleImport = () => {
    const imported = parseSave(importText);
    if (imported === null) {
      setNotice('IMPORT REJECTED');
      return;
    }
    setSave(imported);
    setImportText('');
    setModal('none');
    setNotice('SAVE IMPORTED');
  };

  const handleExport = () => {
    const text = exportSave(save);
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'tokenmaxxer-save.json';
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice('SAVE EXPORTED');
  };

  const handleReset = () => {
    /* v8 ignore next -- native confirmation is exercised manually */
    if (
      !window.confirm(
        'Reset all game progress? Trophies, records, and perks will be erased.',
      )
    )
      return;
    const fresh = loadSave({ getItem: () => null });
    fresh.preferences = save.preferences;
    setSave(fresh);
    setModal('none');
    setNotice('PROGRESS RESET');
  };

  return (
    <main className="min-h-screen bg-[#050914] text-slate-100">
      <div className="noise pointer-events-none fixed inset-0" />
      <header className="sticky top-0 z-30 border-b border-cyan-400/15 bg-[#050914]/95 px-3 py-3 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-400 flex-wrap items-center gap-3">
          <div className="mr-auto">
            <h1 className="text-xl font-black tracking-tight sm:text-2xl">
              <span className="text-amber-300">🏆</span> TOKENMAXXER
            </h1>
            <p className="status text-xs tracking-[.28em] text-cyan-300">
              ● {notice}
            </p>
          </div>
          <Stat
            label="TOKENS"
            value={formatNumber(progress.tokens)}
            highlight
          />
          <Stat
            label="PER SECOND"
            value={formatNumber(metrics.tokensPerSecond)}
          />
          <Stat
            label="PER CLICK"
            value={formatNumber(metrics.tokensPerClick)}
          />
          <button
            className={ICON_BUTTON_CLASS}
            aria-label="Open settings"
            onClick={() => {
              setModal('settings');
            }}
            type="button"
          >
            ⚙
          </button>
        </div>
      </header>

      <section className="border-b border-amber-300/15 bg-linear-to-r from-amber-500/5 via-cyan-500/5 to-violet-500/5 px-3 py-3 sm:px-6 sm:py-4">
        <div className="mx-auto max-w-400">
          <p className={`${EYEBROW_CLASS} text-amber-300`}>HIGH SCORE</p>
          <div className="mb-2 flex items-end justify-between gap-4">
            <h2 className="text-3xl font-black tabular-nums sm:text-5xl">
              <span className="text-cyan-100">
                {formatNumber(progress.tokens)}
              </span>{' '}
              <span className="text-slate-600">/</span>{' '}
              <span>{formatNumber(target)}</span>{' '}
              <span className="text-base font-medium text-slate-500">
                TOKENS
              </span>
            </h2>
            <div className="shrink-0 pb-1 text-right">
              <span className="block text-xs font-bold tracking-wider text-slate-400">
                PROGRESS
              </span>
              <strong className="text-sm text-amber-300 sm:text-base">
                {recordProgress.toFixed(1)}%
              </strong>
            </div>
          </div>
          <div
            aria-label="High Score progress"
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={Number(recordProgress.toFixed(1))}
            className="h-3 overflow-hidden rounded-full border border-white/8 bg-black/45 shadow-[inset_0_2px_5px_rgb(0_0_0/0.55)]"
            role="progressbar"
          >
            <div
              className="h-full rounded-[inherit] bg-linear-to-r from-cyan-600 via-cyan-300 to-amber-400 shadow-[0_0_20px_#22d3ee] transition-[width] duration-300 ease-out"
              style={{ width: `${String(recordProgress)}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-500">
            <span>{progress.trophies.length} TROPHIES SECURED</span>
            <span>NEXT TROPHY: #{progress.recordIndex + 1}</span>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-400 gap-4 p-3 sm:p-6 xl:grid-cols-[minmax(300px,0.85fr)_minmax(400px,1.2fr)_minmax(340px,1fr)]">
        <aside className="space-y-4">
          <Panel title="ACTIVE PROTOCOLS" eyebrow="ABILITIES">
            <div className="space-y-3">
              {ABILITIES.map((ability) => {
                const state = progress.abilities[ability.id];
                const unlocked =
                  progress.recordIndex > 0 &&
                  getRecordTarget(progress.recordIndex - 1) >= ability.unlockAt;
                return (
                  <button
                    key={ability.id}
                    className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border p-3 transition hover:-translate-y-px active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-70 ${state.remaining > 0 ? 'border-cyan-400/50 bg-cyan-400/6 shadow-[inset_0_0_24px_rgb(34_211_238/0.08)]' : 'border-white/8 bg-white/3 hover:border-cyan-400/45 hover:bg-cyan-400/6'}`}
                    disabled={!unlocked || state.cooldown > 0}
                    onClick={() => {
                      handleAbility(ability.id);
                    }}
                    type="button"
                  >
                    <span
                      className={`grid size-9 shrink-0 place-items-center rounded-lg border border-cyan-300/20 bg-cyan-500/8 text-lg text-cyan-300 ${state.remaining > 0 ? 'glow-pulse' : ''}`}
                    >
                      {ability.id === 'surge' ? 'ϟ' : '◉'}
                    </span>
                    <span className="min-w-0 flex-1 text-left">
                      <strong className="block">{ability.name}</strong>
                      <small className="block overflow-hidden text-xs text-ellipsis whitespace-nowrap text-slate-400">
                        {!unlocked
                          ? `Unlock at ${formatNumber(ability.unlockAt)}`
                          : state.remaining > 0
                            ? `ACTIVE · ${state.remaining.toFixed(1)}s`
                            : state.cooldown > 0
                              ? `Recharging · ${state.cooldown.toFixed(1)}s`
                              : ability.description}
                      </small>
                    </span>
                    <span className="text-xs font-extrabold text-cyan-300">
                      {!unlocked
                        ? 'LOCKED'
                        : state.cooldown > 0
                          ? `${String(Math.ceil(state.cooldown))}s`
                          : 'READY'}
                    </span>
                  </button>
                );
              })}
            </div>
          </Panel>
          <Panel title="CHAMPION ARCHIVE" eyebrow="PROGRESS">
            <div className="grid grid-cols-3 gap-2">
              <ArchiveButton
                label="Trophies"
                value={String(progress.trophies.length)}
                onClick={() => {
                  setModal('achievements');
                }}
              />
              <ArchiveButton
                label="Achievements"
                value={`${String(progress.achievements.length)}/12`}
                onClick={() => {
                  setModal('achievements');
                }}
              />
              <ArchiveButton
                label="Prestiges"
                value={String(progress.stats.prestiges)}
                onClick={() => {
                  setModal('stats');
                }}
              />
            </div>
          </Panel>
          <button
            className="flex w-full cursor-pointer items-center justify-between gap-4 rounded-2xl border border-amber-300/30 bg-linear-to-r from-amber-900/25 to-violet-900/20 p-4 text-left disabled:cursor-not-allowed disabled:opacity-75 disabled:saturate-50 [&_small]:block [&_small]:text-xs [&_small]:tracking-[0.15em] [&_small]:text-amber-300 [&_strong]:mt-1 [&_strong]:block [&>span:last-child]:text-xs [&>span:last-child]:text-amber-200"
            disabled={progress.pendingCredits <= 0}
            onClick={() => {
              setModal('prestige');
            }}
            type="button"
          >
            <span>
              <small>PRESTIGE PROTOCOL</small>
              <strong>🏆 Set a New Record</strong>
            </span>
            <span>
              {progress.pendingCredits > 0
                ? `+${String(progress.pendingCredits)} credits`
                : `Unlock at ${formatNumber(getRecordTarget(5))}`}
            </span>
          </button>
          <Panel title="RUN TELEMETRY" eyebrow="LIVE DATA">
            <div className="grid grid-cols-2 gap-2">
              <MiniMetric
                label="Lifetime Tokens"
                value={formatNumber(progress.stats.tokens)}
              />
              <MiniMetric
                label="Reactor Clicks"
                value={formatNumber(progress.stats.clicks)}
              />
              <MiniMetric
                label="Critical Clicks"
                value={formatNumber(progress.stats.criticalClicks)}
              />
              <MiniMetric
                label="Active Time"
                value={formatDuration(progress.stats.playTime)}
              />
            </div>
          </Panel>
        </aside>

        <section
          className={`${PANEL_CLASS} relative flex min-h-125 flex-col items-center justify-center overflow-hidden p-4`}
        >
          <div className="absolute inset-x-8 top-5 flex justify-between">
            <span className={EYEBROW_CLASS}>REACTOR STAGE {stage + 1}/6</span>
            <span className={`${EYEBROW_CLASS} text-emerald-300`}>
              ● STABLE
            </span>
          </div>
          <Reactor
            active={progress.abilities.surge.remaining > 0}
            label={`Activate reactor for ${formatNumber(metrics.tokensPerClick)} tokens`}
            onActivate={handleReactor}
            stage={stage}
          />
          <p className="mt-2 text-center text-sm text-slate-400">
            CLICK THE CORE TO GENERATE
          </p>
          <strong className="text-xl text-cyan-200">
            +{formatNumber(metrics.tokensPerClick)} TOKENS
          </strong>
          <div className="mt-4 flex gap-2 text-xs">
            <span className="rounded-full border border-cyan-300/15 bg-cyan-400/6 px-3 py-1.5 text-slate-400">
              CRIT {(metrics.criticalChance * 100).toFixed(0)}%
            </span>
            {progress.abilities.surge.remaining > 0 && (
              <span className="glow-pulse rounded-full border border-amber-300/30 bg-cyan-400/6 px-3 py-1.5 text-amber-300">
                SURGE ×3
              </span>
            )}
            {progress.abilities.hyperfocus.remaining > 0 && (
              <span className="glow-pulse rounded-full border border-amber-300/30 bg-cyan-400/6 px-3 py-1.5 text-amber-300">
                HYPERFOCUS ×5
              </span>
            )}
          </div>
        </section>

        <section className={`${PANEL_CLASS} min-h-125 overflow-hidden`}>
          <div className="flex items-center justify-between border-b border-white/8 p-4">
            <div>
              <p className={EYEBROW_CLASS}>PRODUCTION MARKET</p>
              <h2 className="text-lg font-bold">SYSTEM UPGRADES</h2>
            </div>
            <div
              className="flex rounded-lg border border-white/8 bg-black/25 p-0.5"
              aria-label="Purchase amount"
            >
              {([1, 10, 'max'] as const).map((mode) => (
                <button
                  aria-pressed={buyMode === mode}
                  className="cursor-pointer rounded-md px-2 py-1 text-xs font-extrabold text-slate-400 aria-pressed:bg-cyan-700 aria-pressed:text-white"
                  key={mode}
                  onClick={() => {
                    setBuyMode(mode);
                  }}
                  type="button"
                >
                  {mode === 'max' ? 'MAX' : `×${String(mode)}`}
                </button>
              ))}
            </div>
          </div>
          <div className="max-h-155 [scrollbar-color:#155e75_transparent] overflow-y-auto p-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-cyan-800/50 [&::-webkit-scrollbar-thumb:hover]:bg-cyan-600/80 [&::-webkit-scrollbar-track]:bg-transparent">
            {(['manual', 'automation', 'efficiency'] as const).map(
              (category) => (
                <div className="mb-5" key={category}>
                  <h3 className="mb-2 text-xs font-bold tracking-[.2em] text-slate-500">
                    {CATEGORY_LABELS[category]}
                  </h3>
                  <div className="space-y-2">
                    {UPGRADES.filter(
                      (upgrade) => upgrade.category === category,
                    ).map((upgrade) => {
                      const unlocked =
                        progress.stats.tokens >= upgrade.unlockAt;
                      const quote = getPurchaseQuote(
                        progress,
                        upgrade,
                        buyMode,
                      );
                      const nextCost = getPurchaseQuote(
                        { ...progress, tokens: Number.MAX_SAFE_INTEGER },
                        upgrade,
                        1,
                      ).cost;
                      return (
                        <button
                          className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-white/8 bg-white/3 p-3 transition hover:-translate-y-px hover:border-cyan-400/45 hover:bg-cyan-400/6 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-70"
                          disabled={!unlocked || quote.count === 0}
                          key={upgrade.id}
                          onClick={() => {
                            handlePurchase(upgrade.id);
                          }}
                          type="button"
                        >
                          <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-cyan-300/20 bg-cyan-500/8 text-lg text-cyan-300">
                            {upgrade.icon}
                          </span>
                          <span className="min-w-0 flex-1 text-left">
                            <strong className="block truncate">
                              {upgrade.name}
                            </strong>
                            <small className="block overflow-hidden text-xs text-ellipsis whitespace-nowrap text-slate-400">
                              {unlocked
                                ? upgrade.description
                                : `LOCKED · Generate ${formatNumber(upgrade.unlockAt)} lifetime tokens`}
                            </small>
                          </span>
                          <span className="flex shrink-0 flex-col items-end gap-0.5 tabular-nums">
                            <em className="text-xs whitespace-nowrap text-slate-400 not-italic">
                              LV. {progress.upgrades[upgrade.id]}
                            </em>
                            <span className="text-xs font-extrabold whitespace-nowrap text-amber-300">
                              {quote.count > 0
                                ? `${formatNumber(quote.cost)} T`
                                : `${formatNumber(nextCost)} T`}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ),
            )}
          </div>
        </section>
      </div>

      <footer className="mx-auto flex max-w-400 flex-wrap items-center justify-between gap-3 px-4 pb-6 text-xs text-slate-600">
        <span>LOCAL OPERATIONS · NO NETWORK REQUIRED</span>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setModal('stats');
            }}
            type="button"
          >
            Statistics
          </button>
          <button
            onClick={() => {
              setModal('save');
            }}
            type="button"
          >
            Save Data
          </button>
        </div>
      </footer>

      {floats.map((item) => (
        <span
          className={`float-token pointer-events-none fixed z-80 font-black ${item.critical ? 'text-lg text-yellow-300 [text-shadow:0_0_16px_#f59e0b]' : 'text-base text-cyan-300 [text-shadow:0_0_12px_#0891b2]'}`}
          key={item.id}
          style={{ left: item.x, top: item.y }}
        >
          {item.critical ? 'CRITICAL ' : '+'}
          {formatNumber(item.amount)}
        </span>
      ))}
      {celebration !== null && (
        <div className="celebration fixed inset-0 z-90 grid place-items-center bg-[radial-gradient(circle,rgb(8_38_56/0.50),rgb(3_7_18/0.82)_65%)] p-4 text-center backdrop-blur-sm">
          <button
            aria-label="Dismiss High Score celebration"
            className="absolute inset-0 cursor-pointer"
            onClick={() => {
              setCelebration(null);
            }}
            type="button"
          />
          <div
            className="pointer-events-none relative w-full max-w-160 rounded-3xl border border-cyan-300/20 bg-[#06111f]/92 px-6 py-10 shadow-[0_0_100px_rgb(6_182_212/0.18),inset_0_1px_0_rgb(255_255_255/0.06)] sm:px-12 sm:py-12"
            role="status"
          >
            <div className="trophy-burst mx-auto mb-4 w-fit text-amber-300 drop-shadow-[0_0_22px_rgb(251_191_36/0.45)]">
              <TrophyIcon />
            </div>
            <p className="text-xs font-black tracking-[0.4em] text-cyan-300">
              NEW HIGH SCORE
            </p>
            <strong className="my-2 block text-[clamp(3.5rem,8vw,7rem)] leading-none text-white [text-shadow:0_0_28px_#0891b2]">
              {formatNumber(getRecordTarget(celebration))}
            </strong>
            <span className="block font-extrabold tracking-[0.15em] text-amber-300">
              TROPHY #{celebration + 1} SECURED
            </span>
            <span className="mt-5 block text-xs font-bold tracking-[0.18em] text-slate-300">
              NEXT TARGET: {formatNumber(getRecordTarget(celebration + 1))}
            </span>
            <small className="mt-7 block text-xs tracking-[0.14em] text-slate-400">
              CLICK ANYWHERE TO CONTINUE
            </small>
          </div>
        </div>
      )}
      {modal !== 'none' && (
        <ModalShell
          onClose={() => {
            setModal('none');
          }}
          title={
            modal === 'prestige'
              ? 'Set a New Record'
              : modal === 'achievements'
                ? 'Champion Archive'
                : modal === 'stats'
                  ? 'Lifetime Statistics'
                  : modal === 'settings'
                    ? 'System Settings'
                    : 'Save Operations'
          }
        >
          {modal === 'prestige' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-amber-300/20 bg-amber-300/7 p-4">
                <span className="text-xs tracking-[0.15em] text-slate-400">
                  PENDING PAYOUT
                </span>
                <strong className="text-amber-300">
                  +{progress.pendingCredits} Usage Credits
                </strong>
              </div>
              <p className="text-sm text-slate-300">
                Tokens, upgrades, and active abilities reset. Your records,
                trophies, achievements, lifetime statistics, Usage Credits, and
                permanent perks remain.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {PERKS.map((perk) => {
                  const level = progress.perks[perk.id];
                  const maxed =
                    perk.maxLevel !== undefined && level >= perk.maxLevel;
                  const cost = getPerkCost(perk, level);
                  return (
                    <button
                      className="flex cursor-pointer flex-col items-start rounded-xl border border-white/8 bg-white/3 p-3 text-left hover:border-amber-300/35 disabled:cursor-not-allowed disabled:opacity-45 [&_small]:mt-2 [&_small]:text-amber-300 [&_span]:text-xs [&_span]:text-slate-400"
                      disabled={maxed || progress.usageCredits < cost}
                      key={perk.id}
                      onClick={() => {
                        handlePerk(perk.id);
                      }}
                      type="button"
                    >
                      <strong>
                        {perk.name} · LV. {level}
                      </strong>
                      <span>{perk.description}</span>
                      <small>
                        {maxed ? 'MAX LEVEL' : `${String(cost)} Usage Credits`}
                      </small>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white/4 p-3">
                <span>
                  Available credits:{' '}
                  <strong className="text-amber-300">
                    {progress.usageCredits}
                  </strong>
                </span>
                <button
                  className={`${ACTION_BUTTON_CLASS} bg-linear-to-r from-cyan-600 to-violet-600 text-white`}
                  disabled={progress.pendingCredits <= 0}
                  onClick={handlePrestige}
                  type="button"
                >
                  🏆 Set a New Record
                </button>
              </div>
            </div>
          )}
          {modal === 'achievements' && (
            <div className="grid gap-2 sm:grid-cols-2">
              {ACHIEVEMENTS.map((achievement) => (
                <div
                  className={`flex items-center gap-3 rounded-xl border p-3 ${progress.achievements.includes(achievement.id) ? 'border-amber-300/25 bg-amber-300/5 opacity-100' : 'border-white/6 opacity-45'}`}
                  key={achievement.id}
                >
                  <span className="text-amber-400">
                    {progress.achievements.includes(achievement.id) ? '◆' : '◇'}
                  </span>
                  <div className="[&_small]:block [&_small]:text-xs [&_small]:text-slate-400 [&_strong]:block">
                    <strong>{achievement.name}</strong>
                    <small>{achievement.description}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
          {modal === 'stats' && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <StatTile
                label="Lifetime Tokens"
                value={formatNumber(progress.stats.tokens)}
              />
              <StatTile
                label="Manual Tokens"
                value={formatNumber(progress.stats.manualTokens)}
              />
              <StatTile
                label="Reactor Clicks"
                value={formatNumber(progress.stats.clicks)}
              />
              <StatTile
                label="Critical Clicks"
                value={formatNumber(progress.stats.criticalClicks)}
              />
              <StatTile
                label="Upgrades"
                value={formatNumber(progress.stats.upgradesPurchased)}
              />
              <StatTile
                label="Abilities Used"
                value={formatNumber(progress.stats.abilitiesUsed)}
              />
              <StatTile
                label="Best TPS"
                value={formatNumber(progress.stats.highestTps)}
              />
              <StatTile
                label="Best Click"
                value={formatNumber(progress.stats.highestTpc)}
              />
              <StatTile
                label="Active Time"
                value={formatDuration(progress.stats.playTime)}
              />
            </div>
          )}
          {modal === 'settings' && (
            <div className="space-y-5">
              <label className="flex items-center justify-between gap-4">
                <span>
                  <strong className="block">Sound Effects</strong>
                  <small className="text-slate-500">
                    Synthesized locally in your browser
                  </small>
                </span>
                <button
                  aria-pressed={!save.preferences.muted}
                  className="min-w-18 cursor-pointer rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-xs font-extrabold text-cyan-300"
                  onClick={() => {
                    setSave((current) => ({
                      ...current,
                      preferences: {
                        ...current.preferences,
                        muted: !current.preferences.muted,
                      },
                    }));
                  }}
                  type="button"
                >
                  {save.preferences.muted ? 'MUTED' : 'ON'}
                </button>
              </label>
              <label className="block">
                <span className="mb-2 flex justify-between">
                  <strong>Volume</strong>
                  <span>{Math.round(save.preferences.volume * 100)}%</span>
                </span>
                <input
                  className="w-full accent-cyan-400"
                  max="1"
                  min="0"
                  onChange={handleVolume}
                  step="0.05"
                  type="range"
                  value={save.preferences.volume}
                />
              </label>
            </div>
          )}
          {modal === 'save' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  className={`${ACTION_BUTTON_CLASS} border border-cyan-400/25 bg-cyan-400/7 text-cyan-200`}
                  onClick={() => {
                    saveGame(save);
                    setNotice('GAME SAVED');
                  }}
                  type="button"
                >
                  Manual Save
                </button>
                <button
                  className={`${ACTION_BUTTON_CLASS} border border-cyan-400/25 bg-cyan-400/7 text-cyan-200`}
                  onClick={handleExport}
                  type="button"
                >
                  Export JSON
                </button>
              </div>
              <label className="block">
                <span className={EYEBROW_CLASS}>IMPORT SAVE JSON</span>
                <textarea
                  className="mt-2 h-28 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-xs"
                  onChange={(event) => {
                    setImportText(event.target.value);
                  }}
                  placeholder="Paste a Tokenmaxxer save here…"
                  value={importText}
                />
              </label>
              <button
                className={`${ACTION_BUTTON_CLASS} w-full bg-linear-to-r from-cyan-600 to-violet-600 text-white`}
                disabled={importText.trim() === ''}
                onClick={handleImport}
                type="button"
              >
                Validate & Import
              </button>
              <button
                className={`${ACTION_BUTTON_CLASS} w-full border border-rose-500/25 bg-rose-500/6 text-rose-300`}
                onClick={handleReset}
                type="button"
              >
                Reset All Progress
              </button>
            </div>
          )}
        </ModalShell>
      )}
    </main>
  );
}

function Panel({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`${PANEL_CLASS} p-4`}>
      <p className={EYEBROW_CLASS}>{eyebrow}</p>
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}
function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="min-w-20 border-l border-white/9 pl-3 max-sm:order-3 max-sm:min-w-0 max-sm:flex-1">
      <small className="block text-xs tracking-[0.12em] text-slate-400">
        {label}
      </small>
      <strong
        className={`text-base tabular-nums max-sm:text-sm ${highlight ? 'text-cyan-200' : ''}`}
      >
        {value}
      </strong>
    </div>
  );
}
function ArchiveButton({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      className="cursor-pointer rounded-xl border border-white/7 bg-white/3 px-1 py-3 text-center hover:border-amber-300/35"
      onClick={onClick}
      type="button"
    >
      <strong className="block text-amber-300">{value}</strong>
      <small className="mt-0.5 block text-xs text-slate-400">{label}</small>
    </button>
  );
}
function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/7 bg-white/3 p-3">
      <small className="block text-xs text-slate-400">{label}</small>
      <strong className="mt-1 block text-lg text-cyan-100">{value}</strong>
    </div>
  );
}
function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/7 bg-black/15 p-2.5">
      <small className="block text-xs tracking-wide text-slate-300">
        {label}
      </small>
      <strong className="mt-0.5 block text-sm text-cyan-100">{value}</strong>
    </div>
  );
}
function TrophyIcon() {
  return (
    <svg aria-hidden="true" className="size-20 sm:size-24" viewBox="0 0 96 96">
      <path
        d="M29 14h38v17c0 18-7 30-19 35-12-5-19-17-19-35V14Z"
        fill="currentColor"
      />
      <path
        d="M29 23H17v8c0 13 7 20 20 21M67 23h12v8c0 13-7 20-20 21"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="7"
      />
      <path
        d="M48 65v12M34 84h28"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="8"
      />
      <path
        d="m48 25 4 8 9 1-6.5 6.5L56 50l-8-4.5L40 50l1.5-9.5L35 34l9-1Z"
        fill="#fff7d6"
      />
    </svg>
  );
}
function ModalShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-100 grid place-items-center overflow-y-auto bg-[#020610]/85 p-4 backdrop-blur-lg"
      role="dialog"
    >
      <section className="modal-card max-h-[calc(100vh-2rem)] w-full max-w-184 overflow-y-auto rounded-2xl border border-cyan-300/20 bg-[#0a1221] shadow-[0_25px_100px_#000]">
        <header className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <div>
            <p className={EYEBROW_CLASS}>TOKENMAXXER CONTROL</p>
            <h2 className="text-2xl font-black">{title}</h2>
          </div>
          <button
            aria-label="Close dialog"
            className={ICON_BUTTON_CLASS}
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </header>
        <div className="p-5">{children}</div>
      </section>
    </div>
  );
}
