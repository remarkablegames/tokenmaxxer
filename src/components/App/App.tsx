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
const STAGE_COLORS = ['cyan', 'cyan', 'violet', 'violet', 'amber', 'fuchsia'];

export function App() {
  const [save, setSave] = useState<SaveEnvelope>(() => loadSave());
  const [buyMode, setBuyMode] = useState<BuyMode>(1);
  const [modal, setModal] = useState<Modal>('none');
  const [floats, setFloats] = useState<FloatText[]>([]);
  const [celebration, setCelebration] = useState<number | null>(null);
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
  const priorTarget =
    progress.recordIndex === 0 ? 0 : getRecordTarget(progress.recordIndex - 1);
  const recordProgress = Math.min(
    100,
    Math.max(
      0,
      ((progress.tokens - priorTarget) / (target - priorTarget)) * 100,
    ),
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
    <main
      className={`min-h-screen bg-[#050914] text-slate-100 stage-${STAGE_COLORS[stage]}`}
    >
      <div className="noise pointer-events-none fixed inset-0" />
      <header className="sticky top-0 z-30 border-b border-cyan-400/15 bg-[#050914]/95 px-3 py-3 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-400 flex-wrap items-center gap-3">
          <div className="mr-auto">
            <h1 className="text-xl font-black tracking-tight sm:text-2xl">
              <span className="text-amber-300">🏆</span> TOKENMAXXER
            </h1>
            <p className="status text-[10px] tracking-[.28em] text-cyan-300">
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
            className="icon-button"
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

      <section className="border-b border-amber-300/15 bg-linear-to-r from-amber-500/5 via-cyan-500/5 to-violet-500/5 px-3 py-5 sm:px-6">
        <div className="mx-auto max-w-400">
          <div className="mb-2 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-amber-300">
                CURRENT HIGH SCORE TARGET
              </p>
              <h2 className="text-3xl font-black tabular-nums sm:text-5xl">
                {formatNumber(target)}{' '}
                <span className="text-base font-medium text-slate-500">
                  TOKENS
                </span>
              </h2>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">RECORD PROGRESS</p>
              <strong className="text-amber-300">
                {recordProgress.toFixed(1)}%
              </strong>
            </div>
          </div>
          <div className="progress-track h-3">
            <div
              className="progress-fill"
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
                    className={`ability-card ${state.remaining > 0 ? 'ability-live' : ''}`}
                    disabled={!unlocked || state.cooldown > 0}
                    onClick={() => {
                      handleAbility(ability.id);
                    }}
                    type="button"
                  >
                    <span className="ability-icon">
                      {ability.id === 'surge' ? 'ϟ' : '◉'}
                    </span>
                    <span className="min-w-0 flex-1 text-left">
                      <strong className="block">{ability.name}</strong>
                      <small>
                        {!unlocked
                          ? `Unlock at ${formatNumber(ability.unlockAt)}`
                          : state.remaining > 0
                            ? `ACTIVE · ${state.remaining.toFixed(1)}s`
                            : state.cooldown > 0
                              ? `Recharging · ${state.cooldown.toFixed(1)}s`
                              : ability.description}
                      </small>
                    </span>
                    <span className="text-cyan-300">
                      {state.cooldown > 0
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
            className="prestige-banner"
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
        </aside>

        <section className="panel relative flex min-h-125 flex-col items-center justify-center overflow-hidden p-4">
          <div className="absolute inset-x-8 top-5 flex justify-between">
            <span className="eyebrow">REACTOR STAGE {stage + 1}/6</span>
            <span className="eyebrow text-emerald-300">● STABLE</span>
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
            <span className="chip">
              CRIT {(metrics.criticalChance * 100).toFixed(0)}%
            </span>
            {progress.abilities.surge.remaining > 0 && (
              <span className="chip chip-live">SURGE ×3</span>
            )}
            {progress.abilities.hyperfocus.remaining > 0 && (
              <span className="chip chip-live">HYPERFOCUS ×5</span>
            )}
          </div>
        </section>

        <section className="panel min-h-125 overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/8 p-4">
            <div>
              <p className="eyebrow">PRODUCTION MARKET</p>
              <h2 className="text-lg font-bold">SYSTEM UPGRADES</h2>
            </div>
            <div className="segmented" aria-label="Purchase amount">
              {([1, 10, 'max'] as const).map((mode) => (
                <button
                  aria-pressed={buyMode === mode}
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
          <div className="max-h-155 overflow-y-auto p-3">
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
                          className="upgrade-card"
                          disabled={!unlocked || quote.count === 0}
                          key={upgrade.id}
                          onClick={() => {
                            handlePurchase(upgrade.id);
                          }}
                          type="button"
                        >
                          <span className="upgrade-icon">{upgrade.icon}</span>
                          <span className="min-w-0 flex-1 text-left">
                            <span className="flex items-center justify-between gap-2">
                              <strong className="truncate">
                                {upgrade.name}
                              </strong>
                              <em>LV. {progress.upgrades[upgrade.id]}</em>
                            </span>
                            <small>
                              {unlocked
                                ? upgrade.description
                                : `LOCKED · Generate ${formatNumber(upgrade.unlockAt)} lifetime tokens`}
                            </small>
                          </span>
                          <span className="cost">
                            {quote.count > 0
                              ? `${formatNumber(quote.cost)} T`
                              : `${formatNumber(nextCost)} T`}
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
          className={`float-token ${item.critical ? 'float-critical' : ''}`}
          key={item.id}
          style={{ left: item.x, top: item.y }}
        >
          {item.critical ? 'CRITICAL ' : '+'}
          {formatNumber(item.amount)}
        </span>
      ))}
      {celebration !== null && (
        <div className="celebration" role="status">
          <div className="trophy-burst">🏆</div>
          <p>NEW HIGH SCORE</p>
          <strong>{formatNumber(getRecordTarget(celebration))}</strong>
          <span>TROPHY #{celebration + 1} SECURED</span>
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
              <div className="credit-payout">
                <span>PENDING PAYOUT</span>
                <strong>+{progress.pendingCredits} Usage Credits</strong>
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
                      className="perk-card"
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
                  className="primary-button"
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
                  className={`achievement ${progress.achievements.includes(achievement.id) ? 'achievement-unlocked' : ''}`}
                  key={achievement.id}
                >
                  <span>
                    {progress.achievements.includes(achievement.id) ? '◆' : '◇'}
                  </span>
                  <div>
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
                  className="toggle"
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
                  className="secondary-button"
                  onClick={() => {
                    saveGame(save);
                    setNotice('GAME SAVED');
                  }}
                  type="button"
                >
                  Manual Save
                </button>
                <button
                  className="secondary-button"
                  onClick={handleExport}
                  type="button"
                >
                  Export JSON
                </button>
              </div>
              <label className="block">
                <span className="eyebrow">IMPORT SAVE JSON</span>
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
                className="primary-button w-full"
                disabled={importText.trim() === ''}
                onClick={handleImport}
                type="button"
              >
                Validate & Import
              </button>
              <button
                className="danger-button w-full"
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
    <section className="panel p-4">
      <p className="eyebrow">{eyebrow}</p>
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
    <div className="header-stat">
      <small>{label}</small>
      <strong className={highlight ? 'text-cyan-200' : ''}>{value}</strong>
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
    <button className="archive-button" onClick={onClick} type="button">
      <strong>{value}</strong>
      <small>{label}</small>
    </button>
  );
}
function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-tile">
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
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
    <div aria-modal="true" className="modal-backdrop" role="dialog">
      <section className="modal-card">
        <header>
          <div>
            <p className="eyebrow">TOKENMAXXER CONTROL</p>
            <h2 className="text-2xl font-black">{title}</h2>
          </div>
          <button
            aria-label="Close dialog"
            className="icon-button"
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
