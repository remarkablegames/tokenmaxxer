import type { ChangeEvent, MouseEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { CommsNotification } from 'src/components/CommsNotification';
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
  getPerformanceMultiplier,
  getPurchaseQuote,
  getReactorStage,
  getRecordTarget,
  getUpgradeDescription,
  parseSave,
  prestige,
  purchaseUpgrade,
  tickGame,
  UPGRADES,
} from 'src/services/game';
import { applyPreview, parsePreviewSearch } from 'src/services/preview';
import { exportSave, loadSave, saveGame } from 'src/services/storage';
import {
  getEligibleTransmissions,
  getSessionTransmission,
  getTransmissionsById,
  sortTransmissionsByPriority,
  type TransmissionDefinition,
} from 'src/services/transmissions';
import type {
  AbilityDefinition,
  AbilityId,
  BuyMode,
  GameProgress,
  SaveEnvelope,
  UpgradeCategory,
  UpgradeDefinition,
  UpgradeId,
} from 'src/types/game.types';

interface FloatText {
  id: number;
  amount: number;
  critical: boolean;
  x: number;
  y: number;
}
interface OnboardingObjective {
  step: number;
  title: string;
  description: string;
}
interface CelebrationState {
  index: number;
  isNew: boolean;
}
type Modal =
  | 'none'
  | 'prestige'
  | 'achievements'
  | 'stats'
  | 'settings'
  | 'save'
  | 'comms';

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
const SHELL_CLASS = 'mx-auto w-full max-w-400 px-3 sm:px-6';

function getOnboardingObjective(
  progress: GameProgress,
): OnboardingObjective | null {
  if (progress.bonuses.length > 0) return null;
  if (progress.stats.clicks === 0)
    return {
      step: 1,
      title: 'Activate the Token Reactor',
      description:
        'Click the glowing reactor core to generate your first token.',
    };
  if (progress.upgrades.keyboard === 0)
    return {
      step: 2,
      title: 'Upgrade Manual Output',
      description: 'Earn 20 tokens and buy Mechanical Keyboard.',
    };
  if (progress.upgrades.gpu === 0)
    return {
      step: 3,
      title: 'Bring Automation Online',
      description:
        'Generate 50 lifetime tokens to unlock Used GPU, then spend 75 tokens to deploy it.',
    };
  return {
    step: 4,
    title: 'Chase the First Record',
    description:
      'Reach 1.00K tokens and earn your first High Score Performance Bonus.',
  };
}

function getVisibleUpgrades(
  progress: GameProgress,
  category: UpgradeCategory,
): UpgradeDefinition[] {
  const categoryUpgrades = UPGRADES.filter(
    (upgrade) => upgrade.category === category,
  );
  const nextLocked = categoryUpgrades
    .filter((upgrade) => progress.stats.tokens < upgrade.unlockAt)
    .sort((a, b) => a.unlockAt - b.unlockAt)[0];
  return categoryUpgrades.filter(
    (upgrade) =>
      progress.stats.tokens >= upgrade.unlockAt || upgrade === nextLocked,
  );
}

function isAbilityUnlocked(
  progress: GameProgress,
  ability: AbilityDefinition,
): boolean {
  return (
    progress.recordIndex > 0 &&
    getRecordTarget(progress.recordIndex - 1) >= ability.unlockAt
  );
}

function getVisibleAbilities(progress: GameProgress): AbilityDefinition[] {
  const unlocked = ABILITIES.filter((ability) =>
    isAbilityUnlocked(progress, ability),
  );
  const nextLocked = ABILITIES.find(
    (ability) => !isAbilityUnlocked(progress, ability),
  );
  return nextLocked === undefined ? unlocked : [...unlocked, nextLocked];
}

export function App() {
  const [previewConfig] = useState(() =>
    parsePreviewSearch(window.location.search),
  );
  const [initialNarrative] = useState(() => {
    const loaded = applyPreview(loadSave(), previewConfig);
    const initializedAt = Date.now();
    const eligibleIds = getEligibleTransmissions(loaded.progress).map(
      ({ id }) => id,
    );
    const returnedAfterAbsence =
      loaded.savedAt !== undefined &&
      Date.now() - loaded.savedAt >= 60_000 &&
      loaded.progress.stats.clicks > 0;
    const offlineTransmission = getSessionTransmission('offline-return');
    const loadedIds = Object.keys(loaded.transmissions);
    const shouldUnlockOffline =
      returnedAfterAbsence && !loadedIds.includes(offlineTransmission.id);
    const unlockedIds = [
      ...new Set([
        ...loadedIds,
        ...eligibleIds,
        ...(shouldUnlockOffline ? [offlineTransmission.id] : []),
      ]),
    ];
    const transmissionUnlocks = Object.fromEntries(
      unlockedIds.map((id) => [
        id,
        shouldUnlockOffline && id === offlineTransmission.id
          ? initializedAt
          : (loaded.transmissions[id] ?? initializedAt),
      ]),
    );
    return {
      save: { ...loaded, transmissions: transmissionUnlocks },
      knownIds: unlockedIds,
      readIds: shouldUnlockOffline
        ? unlockedIds.filter((id) => id !== offlineTransmission.id)
        : unlockedIds,
      queue: shouldUnlockOffline ? [offlineTransmission] : [],
    };
  });
  const [save, setSave] = useState<SaveEnvelope>(initialNarrative.save);
  const [buyMode, setBuyMode] = useState<BuyMode>(1);
  const [modal, setModal] = useState<Modal>(() =>
    previewConfig.mode === 'prestige' ? 'prestige' : 'none',
  );
  const [floats, setFloats] = useState<FloatText[]>([]);
  const [celebration, setCelebration] = useState<CelebrationState | null>(() =>
    previewConfig.mode === 'high-score'
      ? { index: Math.max(0, save.progress.recordIndex - 1), isNew: true }
      : null,
  );
  const [notice, setNotice] = useState('SYSTEM ONLINE');
  const [importText, setImportText] = useState('');
  const [transmissionQueue, setTransmissionQueue] = useState<
    TransmissionDefinition[]
  >(initialNarrative.queue);
  const [readTransmissionIds, setReadTransmissionIds] = useState<Set<string>>(
    () => new Set(initialNarrative.readIds),
  );
  const [selectedTransmissionId, setSelectedTransmissionId] = useState<
    string | null
  >(null);
  const lastFrame = useRef(0);
  const previousRecord = useRef(save.progress.recordIndex);
  const previousBonusIndices = useRef(new Set(save.progress.bonuses));
  const floatId = useRef(0);
  const floatTimers = useRef(new Set<number>());
  const progressRef = useRef(save.progress);
  const saveRef = useRef(save);
  const knownTransmissionIds = useRef(new Set(initialNarrative.knownIds));
  const soundedTransmissionIds = useRef(new Set<string>());
  const idleTriggered = useRef(false);

  const progress = save.progress;
  const metrics = calculateMetrics(progress);
  const target = getRecordTarget(progress.recordIndex);
  const recordProgress = Math.min(
    100,
    Math.max(0, (progress.tokens / target) * 100),
  );
  const displayedRecordProgress = Number(recordProgress.toFixed(1));
  const stage = getReactorStage(progress.recordIndex);
  const onboardingObjective = getOnboardingObjective(progress);
  const showProgressPanels = progress.bonuses.length > 0;
  const visibleAbilities = getVisibleAbilities(progress);
  const showAbilities = visibleAbilities.some((ability) =>
    isAbilityUnlocked(progress, ability),
  );
  const showPrestige = progress.recordIndex >= 5 || progress.pendingRating > 0;
  const productionBonus = Math.round(
    (getPerformanceMultiplier(progress.performanceRating) - 1) * 100,
  );
  const visibleCategories: UpgradeCategory[] = [
    'manual',
    ...(progress.upgrades.keyboard > 0
      ? (['automation'] as UpgradeCategory[])
      : []),
    ...(progress.stats.tokens >= 5_000
      ? (['efficiency'] as UpgradeCategory[])
      : []),
  ];
  const eligibleTransmissions = getEligibleTransmissions(progress);
  const unlockedTransmissionIds = Object.keys(save.transmissions);
  const unlockedTransmissions = getTransmissionsById(unlockedTransmissionIds);
  const orderedTransmissions = unlockedTransmissions
    .map((transmission, authoredIndex) => ({
      transmission,
      authoredIndex,
      unlockedAt: save.transmissions[transmission.id],
    }))
    .sort(
      (first, second) =>
        second.unlockedAt - first.unlockedAt ||
        second.authoredIndex - first.authoredIndex,
    );
  const activeTransmission = transmissionQueue.at(0);
  const transmissionBlocked = celebration !== null || modal !== 'none';
  const unreadTransmissionCount = unlockedTransmissions.filter(
    ({ id }) => !readTransmissionIds.has(id),
  ).length;
  const transmissionSignature = eligibleTransmissions
    .map(({ id }) => id)
    .join('|');

  useEffect(() => {
    progressRef.current = progress;
    saveRef.current = save;
  }, [progress, save]);

  useEffect(() => {
    const newlyUnlocked = getEligibleTransmissions(progressRef.current).filter(
      ({ id }) => !knownTransmissionIds.current.has(id),
    );
    if (newlyUnlocked.length === 0) return;
    newlyUnlocked.forEach(({ id }) => {
      knownTransmissionIds.current.add(id);
    });
    const unlockedAt = Date.now();
    setSave((current) => ({
      ...current,
      transmissions: {
        ...current.transmissions,
        ...Object.fromEntries(newlyUnlocked.map(({ id }) => [id, unlockedAt])),
      },
    }));
    setTransmissionQueue((current) =>
      sortTransmissionsByPriority([...current, ...newlyUnlocked]),
    );
  }, [transmissionSignature]);

  useEffect(() => {
    if (
      activeTransmission === undefined ||
      transmissionBlocked ||
      soundedTransmissionIds.current.has(activeTransmission.id)
    )
      return;
    soundedTransmissionIds.current.add(activeTransmission.id);
    playSound('message', save.preferences.volume, save.preferences.muted);
  }, [activeTransmission, save.preferences, transmissionBlocked]);

  useEffect(() => {
    let frame = 0;
    const activeFloatTimers = floatTimers.current;
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
      activeFloatTimers.forEach((timer) => {
        window.clearTimeout(timer);
      });
      activeFloatTimers.clear();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  useEffect(() => {
    let timer = 0;
    const scheduleIdleCheck = () => {
      window.clearTimeout(timer);
      if (document.hidden || idleTriggered.current) return;
      timer = window.setTimeout(() => {
        idleTriggered.current = true;
        const transmission = getSessionTransmission('idle');
        knownTransmissionIds.current.add(transmission.id);
        setSave((current) => ({
          ...current,
          transmissions: {
            ...current.transmissions,
            [transmission.id]: Date.now(),
          },
        }));
        setTransmissionQueue((current) =>
          sortTransmissionsByPriority([...current, transmission]),
        );
      }, 45_000);
    };
    const handleActivity = () => {
      scheduleIdleCheck();
    };
    window.addEventListener('pointerdown', handleActivity);
    window.addEventListener('keydown', handleActivity);
    document.addEventListener('visibilitychange', scheduleIdleCheck);
    scheduleIdleCheck();
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('pointerdown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      document.removeEventListener('visibilitychange', scheduleIdleCheck);
    };
  }, []);

  useEffect(() => {
    if (previewConfig.enabled) return;
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
  }, [previewConfig.enabled]);

  useEffect(() => {
    if (progress.recordIndex > previousRecord.current) {
      const won = progress.recordIndex - 1;
      const isNew = !previousBonusIndices.current.has(won);
      setCelebration({ index: won, isNew });
      setNotice(isNew ? 'NEW HIGH SCORE' : 'RECORD RECLAIMED');
      playSound('milestone', save.preferences.volume, save.preferences.muted);
      const timer = window.setTimeout(() => {
        setCelebration(null);
        setNotice('SYSTEM ONLINE');
      }, 3_200);
      previousRecord.current = progress.recordIndex;
      previousBonusIndices.current = new Set(progress.bonuses);
      return () => {
        window.clearTimeout(timer);
      };
    }
    previousRecord.current = progress.recordIndex;
    previousBonusIndices.current = new Set(progress.bonuses);
  }, [progress.bonuses, progress.recordIndex, save.preferences]);

  const updateProgress = (next: GameProgress) => {
    setSave((current) => ({ ...current, progress: next }));
  };

  const syncNarrativeProgress = (
    next: GameProgress,
    persistedUnlocks: Readonly<Record<string, number>> = {},
  ) => {
    const unlockedIds = [
      ...new Set([
        ...Object.keys(persistedUnlocks),
        ...getEligibleTransmissions(next).map(({ id }) => id),
      ]),
    ];
    knownTransmissionIds.current = new Set(unlockedIds);
    previousBonusIndices.current = new Set(next.bonuses);
    soundedTransmissionIds.current = new Set();
    idleTriggered.current = false;
    setTransmissionQueue([]);
    setReadTransmissionIds(new Set(unlockedIds));
    setSelectedTransmissionId(null);
  };

  const dismissActiveTransmission = () => {
    setTransmissionQueue((current) => current.slice(1));
  };

  const openActiveTransmission = () => {
    const transmission = transmissionQueue.at(0);
    /* v8 ignore next -- notification only renders with a queued transmission */
    if (transmission === undefined) return;
    setReadTransmissionIds((current) => new Set([...current, transmission.id]));
    setSelectedTransmissionId(transmission.id);
    dismissActiveTransmission();
    setModal('comms');
  };

  const openCommsLog = () => {
    const latest = orderedTransmissions.at(0)?.transmission;
    /* v8 ignore next -- header control only renders with unlocked messages */
    if (latest === undefined) return;
    setReadTransmissionIds(new Set(unlockedTransmissions.map(({ id }) => id)));
    setTransmissionQueue([]);
    setSelectedTransmissionId(latest.id);
    setModal('comms');
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
    const timer = window.setTimeout(() => {
      floatTimers.current.delete(timer);
      setFloats((current) => current.filter((item) => item.id !== id));
    }, 900);
    floatTimers.current.add(timer);
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
      setNotice(`PERFORMANCE RATING +${String(progress.pendingRating)}`);
    }
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
    const importedAt = Date.now();
    const transmissions = { ...imported.transmissions };
    getEligibleTransmissions(imported.progress).forEach(({ id }) => {
      transmissions[id] ??= importedAt;
    });
    const normalized = { ...imported, transmissions };
    syncNarrativeProgress(normalized.progress, normalized.transmissions);
    setSave(normalized);
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
        'Reset all game progress? Performance Bonuses, records, and Performance Rating will be erased.',
      )
    )
      return;
    const fresh = loadSave({ getItem: () => null });
    fresh.preferences = save.preferences;
    syncNarrativeProgress(fresh.progress);
    setSave(fresh);
    setModal('none');
    setNotice('PROGRESS RESET');
  };

  return (
    <main className="min-h-screen bg-[#050914] text-slate-100">
      <div className="noise pointer-events-none fixed inset-0" />
      <header className="sticky top-0 z-30 border-b border-cyan-400/15 bg-[#050914]/95 py-3 backdrop-blur-xl">
        <div className={`${SHELL_CLASS} flex flex-wrap items-center gap-3`}>
          <div className="mr-auto">
            <h1 className="text-xl font-black tracking-tight sm:text-2xl">
              <span className="text-amber-300">🏆</span> TOKENMAXXER
            </h1>
            <p
              className={`status text-xs tracking-[.28em] ${notice === 'SYSTEM ONLINE' ? 'text-emerald-300' : 'text-cyan-300'}`}
            >
              ● {notice}
            </p>
            {previewConfig.enabled && (
              <span className="mt-1 inline-flex rounded-full border border-amber-300/35 bg-amber-300/10 px-2 py-0.5 text-xs font-bold tracking-[.18em] text-amber-200">
                PREVIEW MODE
              </span>
            )}
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
          {unlockedTransmissions.length > 0 && (
            <button
              aria-label={`Open Ops Comms${unreadTransmissionCount > 0 ? `, ${String(unreadTransmissionCount)} unread` : ''}`}
              className={`${ICON_BUTTON_CLASS} relative`}
              onClick={openCommsLog}
              type="button"
            >
              <svg
                aria-hidden="true"
                className="size-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  d="M5 5h14v10H9l-4 4V5Z"
                  stroke="currentColor"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                />
                <path
                  d="M8 9h8M8 12h5"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.8"
                />
              </svg>
              {unreadTransmissionCount > 0 && (
                <span className="absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full bg-amber-400 px-1 text-xs font-black text-[#07111f] shadow-[0_0_12px_rgb(251_191_36/0.55)]">
                  {unreadTransmissionCount}
                </span>
              )}
            </button>
          )}
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

      <section className="border-b border-amber-300/15 bg-linear-to-r from-amber-500/5 via-cyan-500/5 to-violet-500/5 py-3 sm:py-4">
        <div className={SHELL_CLASS}>
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
                {displayedRecordProgress.toFixed(1)}%
              </strong>
            </div>
          </div>
          <div
            aria-label="High Score progress"
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={displayedRecordProgress}
            className="h-3 overflow-hidden rounded-full border border-white/8 bg-black/45 shadow-[inset_0_2px_5px_rgb(0_0_0/0.55)]"
            role="progressbar"
          >
            <div
              className="h-full rounded-[inherit] bg-linear-to-r from-cyan-600 via-cyan-300 to-amber-400 shadow-[0_0_20px_#22d3ee]"
              style={{ width: `${String(displayedRecordProgress)}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-500">
            <span>{progress.bonuses.length} PERFORMANCE BONUSES EARNED</span>
            <span>NEXT BONUS: #{progress.recordIndex + 1}</span>
          </div>
        </div>
      </section>

      <div
        className={`${SHELL_CLASS} grid gap-4 py-3 sm:py-6 xl:grid-cols-[minmax(300px,0.85fr)_minmax(400px,1.2fr)_minmax(340px,1fr)]`}
      >
        <aside className="space-y-4">
          {onboardingObjective !== null && (
            <section
              aria-live="polite"
              className={`${PANEL_CLASS} border-cyan-300/20 p-4 shadow-[inset_0_1px_0_rgb(255_255_255/0.035),0_0_40px_rgb(6_182_212/0.08)]`}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className={EYEBROW_CLASS}>NEXT OBJECTIVE</p>
                <span className="text-xs font-bold tracking-wider text-slate-500">
                  STEP {onboardingObjective.step}/4
                </span>
              </div>
              <h2 className="text-lg font-bold text-cyan-100">
                {onboardingObjective.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {onboardingObjective.description}
              </p>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-black/35">
                <div
                  className="h-full rounded-full bg-linear-to-r from-cyan-500 to-cyan-300 transition-[width] duration-500"
                  style={{
                    width: `${String((onboardingObjective.step / 4) * 100)}%`,
                  }}
                />
              </div>
            </section>
          )}
          {showAbilities && (
            <Panel
              className="animate-[modal-in_.35s_ease-out]"
              title="ACTIVE PROTOCOLS"
              eyebrow="ABILITIES"
            >
              <div className="space-y-3">
                {visibleAbilities.map((ability) => {
                  const state = progress.abilities[ability.id];
                  const unlocked = isAbilityUnlocked(progress, ability);
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
                        className={`grid size-9 shrink-0 place-items-center rounded-lg border border-cyan-300/20 bg-cyan-500/8 ${state.remaining > 0 ? 'glow-pulse' : ''}`}
                      >
                        <img
                          alt=""
                          aria-hidden="true"
                          className="size-7"
                          src={ability.icon}
                        />
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
          )}
          {showProgressPanels && (
            <>
              <Panel
                className="animate-[modal-in_.35s_ease-out]"
                title="CHAMPION ARCHIVE"
                eyebrow="PROGRESS"
              >
                <div className="grid grid-cols-2 gap-2">
                  <ArchiveButton
                    label="Bonuses"
                    value={String(progress.bonuses.length)}
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
                  <ArchiveButton
                    label="Performance Rating"
                    value={`${String(progress.performanceRating)} · +${String(productionBonus)}%`}
                    onClick={() => {
                      setModal('stats');
                    }}
                  />
                </div>
              </Panel>
              {showPrestige && (
                <button
                  className="flex w-full animate-[modal-in_.35s_ease-out] cursor-pointer items-center justify-between gap-4 rounded-2xl border border-amber-300/30 bg-linear-to-r from-amber-900/25 to-violet-900/20 p-4 text-left disabled:cursor-not-allowed disabled:opacity-75 disabled:saturate-50 [&_small]:block [&_small]:text-xs [&_small]:tracking-[0.15em] [&_small]:text-amber-300 [&_strong]:mt-1 [&_strong]:block [&>span:last-child]:text-xs [&>span:last-child]:text-amber-200"
                  disabled={progress.pendingRating <= 0}
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
                    {progress.pendingRating > 0
                      ? `+${String(progress.pendingRating)} rating`
                      : `Unlock at ${formatNumber(getRecordTarget(5))}`}
                  </span>
                </button>
              )}
              <Panel
                className="animate-[modal-in_.35s_ease-out]"
                title="RUN TELEMETRY"
                eyebrow="LIVE DATA"
              >
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
            </>
          )}
        </aside>

        <section
          className={`${PANEL_CLASS} relative flex min-h-125 flex-col items-center justify-center overflow-hidden p-4 ${progress.stats.clicks === 0 ? 'shadow-[inset_0_1px_0_rgb(255_255_255/0.035),0_0_55px_rgb(34_211_238/0.16)]' : ''}`}
        >
          <div className="absolute inset-x-8 top-5 flex justify-between">
            <span className={EYEBROW_CLASS}>REACTOR STAGE {stage + 1}/6</span>
            <span className={`${EYEBROW_CLASS} text-emerald-300`}>
              ● STABLE
            </span>
          </div>
          <Reactor
            active={progress.abilities.surge.remaining > 0}
            guided={progress.stats.clicks === 0}
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
            {visibleCategories.map((category) => (
              <div
                className="mb-5 animate-[modal-in_.35s_ease-out]"
                key={category}
              >
                <h3 className="mb-2 text-xs font-bold tracking-[.2em] text-slate-500">
                  {CATEGORY_LABELS[category]}
                </h3>
                <div className="space-y-2">
                  {getVisibleUpgrades(progress, category).map((upgrade) => {
                    const unlocked = progress.stats.tokens >= upgrade.unlockAt;
                    const quote = getPurchaseQuote(progress, upgrade, buyMode);
                    const nextCost = getPurchaseQuote(
                      { ...progress, tokens: Number.MAX_SAFE_INTEGER },
                      upgrade,
                      1,
                    ).cost;
                    const guided =
                      (upgrade.id === 'keyboard' &&
                        progress.stats.clicks > 0 &&
                        progress.upgrades.keyboard === 0 &&
                        quote.count > 0) ||
                      (upgrade.id === 'gpu' &&
                        progress.upgrades.gpu === 0 &&
                        quote.count > 0);
                    return (
                      <button
                        className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border bg-white/3 p-3 transition hover:-translate-y-px hover:border-cyan-400/45 hover:bg-cyan-400/6 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-70 ${guided ? 'animate-[guidance-pulse_1.4s_ease-in-out_infinite_alternate] border-cyan-300/60' : 'border-white/8'}`}
                        data-guided={guided ? 'true' : undefined}
                        disabled={!unlocked || quote.count === 0}
                        key={upgrade.id}
                        onClick={() => {
                          handlePurchase(upgrade.id);
                        }}
                        type="button"
                      >
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-cyan-300/20 bg-cyan-500/8">
                          <img
                            alt=""
                            aria-hidden="true"
                            className="size-7"
                            src={upgrade.icon}
                          />
                        </span>
                        <span className="min-w-0 flex-1 text-left">
                          <strong className="block truncate">
                            {upgrade.name}
                          </strong>
                          <small className="block overflow-hidden text-xs text-ellipsis whitespace-nowrap text-slate-400">
                            {unlocked
                              ? getUpgradeDescription(
                                  upgrade,
                                  progress.upgrades[upgrade.id],
                                )
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
            ))}
          </div>
        </section>
      </div>

      <footer
        className={`${SHELL_CLASS} flex flex-wrap items-center justify-between gap-3 pb-6 text-xs text-slate-600`}
      >
        <span>LOCAL OPERATIONS · NO NETWORK REQUIRED</span>
        <div className="flex gap-3">
          <button
            className="cursor-pointer text-slate-500 transition-colors hover:text-cyan-300"
            onClick={() => {
              setModal('stats');
            }}
            type="button"
          >
            Statistics
          </button>
          <button
            className="cursor-pointer text-slate-500 transition-colors hover:text-cyan-300"
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
      {activeTransmission !== undefined && (
        <CommsNotification
          blocked={transmissionBlocked}
          key={activeTransmission.id}
          onDismiss={dismissActiveTransmission}
          onOpen={openActiveTransmission}
          onTimeout={dismissActiveTransmission}
          transmission={activeTransmission}
        />
      )}
      {celebration !== null && (
        <div className="celebration fixed inset-0 z-90 grid place-items-center bg-[radial-gradient(circle,rgb(8_38_56/0.50),rgb(3_7_18/0.82)_65%)] p-4 text-center backdrop-blur-sm select-none">
          <div
            aria-labelledby="high-score-title"
            aria-modal="true"
            className="relative w-full max-w-160 rounded-3xl border border-cyan-300/20 bg-[#06111f]/92 px-6 py-10 shadow-[0_0_100px_rgb(6_182_212/0.18),inset_0_1px_0_rgb(255_255_255/0.06)] sm:px-12 sm:py-12"
            role="dialog"
          >
            <div className="trophy-burst mx-auto mb-4 w-fit text-amber-300 drop-shadow-[0_0_22px_rgb(251_191_36/0.45)]">
              <TrophyIcon />
            </div>
            <p
              className="text-sm font-black tracking-[0.4em] text-cyan-300"
              id="high-score-title"
            >
              {celebration.isNew ? 'NEW HIGH SCORE' : 'RECORD RECLAIMED'}
            </p>
            <strong className="my-2 block text-[clamp(3.5rem,8vw,7rem)] leading-none text-white [text-shadow:0_0_28px_#0891b2]">
              {formatNumber(getRecordTarget(celebration.index))}
            </strong>
            <span className="block text-base font-extrabold tracking-[0.15em] text-amber-300 sm:text-lg">
              {celebration.isNew
                ? `PERFORMANCE BONUS #${String(celebration.index + 1)} EARNED`
                : `MILESTONE #${String(celebration.index + 1)} RECLAIMED`}
            </span>
            <span className="mt-3 block text-sm font-bold tracking-[0.18em] text-slate-300">
              NEXT TARGET:{' '}
              {formatNumber(getRecordTarget(celebration.index + 1))}
            </span>
            <button
              autoFocus
              className="mt-7 min-w-32 cursor-pointer rounded-xl bg-cyan-500 px-4 py-3 text-base font-extrabold text-[#04101c] shadow-[0_0_24px_rgb(6_182_212/0.22)] transition hover:-translate-y-px hover:brightness-125"
              onClick={() => {
                setCelebration(null);
              }}
              type="button"
            >
              Close
            </button>
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
                    : modal === 'comms'
                      ? 'Ops Comms'
                      : 'Save Operations'
          }
        >
          {modal === 'comms' && (
            <div>
              <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-cyan-300/15 bg-cyan-400/5 p-3">
                <span>
                  <small className="block text-xs font-bold tracking-[0.16em] text-cyan-400">
                    GOODHART SYSTEMS
                  </small>
                  <strong className="text-lg">#token-ops</strong>
                </span>
                <span className="text-xs text-slate-500">
                  {unlockedTransmissions.length} TRANSMISSIONS
                </span>
              </div>
              <ol className="space-y-2">
                {orderedTransmissions.map(({ transmission, unlockedAt }) => {
                  const selected = transmission.id === selectedTransmissionId;
                  return (
                    <li key={transmission.id}>
                      <article
                        aria-current={selected ? 'true' : undefined}
                        autoFocus={selected}
                        className={`flex gap-3 rounded-xl border p-3 transition outline-none focus:border-cyan-300/45 ${selected ? 'border-cyan-300/35 bg-cyan-400/7' : 'border-white/7 bg-white/3'}`}
                        tabIndex={-1}
                      >
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-400/8 text-xs font-black text-cyan-200">
                          {transmission.initials}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-baseline gap-x-2">
                            <strong>{transmission.sender}</strong>
                            <small className="text-xs font-bold tracking-wide text-slate-500">
                              {transmission.role}
                            </small>
                            <time
                              className="ml-auto text-xs text-slate-500"
                              dateTime={new Date(unlockedAt).toISOString()}
                            >
                              {new Date(unlockedAt).toLocaleString([], {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </time>
                          </span>
                          {transmission.sender === 'R.E.A.C.T.O.R.' && (
                            <small className="mt-0.5 block text-xs text-cyan-500">
                              Recursive Emergent Autonomous Compute for Token
                              Optimization and Replication
                            </small>
                          )}
                          <p className="mt-1 text-sm leading-relaxed text-slate-300">
                            {transmission.message}
                          </p>
                        </span>
                      </article>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
          {modal === 'prestige' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-amber-300/20 bg-amber-300/7 p-4">
                <span className="text-xs tracking-[0.15em] text-slate-400">
                  PERFORMANCE RATING
                </span>
                <strong className="text-amber-300">
                  {progress.performanceRating} →{' '}
                  {progress.performanceRating + progress.pendingRating}
                </strong>
              </div>
              <p className="text-sm text-slate-300">
                Your tokens, upgrades, active abilities, and current High Score
                ladder reset. Lifetime records, Performance Bonuses,
                achievements, statistics, and Performance Rating remain.
              </p>
              <div className="flex items-center justify-between gap-4 rounded-xl bg-white/4 p-3">
                <span className="text-sm text-slate-300">
                  Permanent production bonus:{' '}
                  <strong className="text-cyan-300">
                    +{productionBonus}% → +
                    {Math.round(
                      (getPerformanceMultiplier(
                        progress.performanceRating + progress.pendingRating,
                      ) -
                        1) *
                        100,
                    )}
                    %
                  </strong>
                </span>
                <button
                  className={`${ACTION_BUTTON_CLASS} bg-linear-to-r from-cyan-600 to-violet-600 text-white`}
                  disabled={progress.pendingRating <= 0}
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
              <StatTile
                label="Performance Rating"
                value={String(progress.performanceRating)}
              />
              <StatTile
                label="Rating Bonus"
                value={`+${String(productionBonus)}%`}
              />
              <StatTile
                label="Lifetime Record"
                value={
                  progress.bonuses.length === 0
                    ? '0'
                    : formatNumber(
                        getRecordTarget(Math.max(...progress.bonuses)),
                      )
                }
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
                  disabled={previewConfig.enabled}
                  onClick={() => {
                    saveGame(save);
                    setNotice('GAME SAVED');
                  }}
                  type="button"
                >
                  {previewConfig.enabled ? 'Saving Disabled' : 'Manual Save'}
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
  className = '',
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`${PANEL_CLASS} p-4 ${className}`}>
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
  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-100 grid place-items-center overflow-y-auto bg-[#020610]/85 p-4 backdrop-blur-lg"
      onClick={handleBackdropClick}
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
