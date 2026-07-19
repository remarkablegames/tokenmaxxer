import { ModalShell } from 'src/components/ModalShell';
import { getTokenMultiplier } from 'src/services/game';

interface SessionResetModalProps {
  pendingPrestigeLevels: number;
  prestigeLevel: number;
  onClose: () => void;
  onConfirm: () => void;
}

export function SessionResetModal({
  pendingPrestigeLevels,
  prestigeLevel,
  onClose,
  onConfirm,
}: SessionResetModalProps) {
  const tokenMultiplier = getTokenMultiplier(prestigeLevel);
  const nextPrestigeLevel = prestigeLevel + pendingPrestigeLevels;

  return (
    <ModalShell onClose={onClose} title="Start a New Session">
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="flex items-center justify-between rounded-xl border border-amber-300/20 bg-amber-300/7 px-4 py-3">
          <span className="text-sm font-bold tracking-[0.15em] text-slate-300">
            BENCHMARK RATING
          </span>
          <strong className="text-xl text-amber-300">
            {prestigeLevel} → {nextPrestigeLevel}
          </strong>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <section className="rounded-xl border border-rose-300/10 bg-rose-300/4 p-4">
            <h3 className="text-sm font-extrabold tracking-[0.14em] text-rose-200">
              RESETS
            </h3>
            <p className="mt-2 text-base leading-relaxed text-slate-300">
              Tokens, upgrades, active abilities, and your current High Score
              ladder.
            </p>
          </section>
          <section className="rounded-xl border border-emerald-300/10 bg-emerald-300/4 p-4">
            <h3 className="text-sm font-extrabold tracking-[0.14em] text-emerald-200">
              REMAINS
            </h3>
            <p className="mt-2 text-base leading-relaxed text-slate-300">
              Long-term memory: lifetime records, Performance Bonuses,
              achievements, statistics, and Benchmark Rating.
            </p>
          </section>
        </div>
        <div className="flex flex-col gap-4 rounded-xl bg-white/4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <span>
            <span className="block text-sm font-extrabold tracking-[0.14em] text-slate-400">
              PERMANENT EFFECT
            </span>
            <strong className="mt-1 block text-xl text-cyan-300">
              Token Multiplier: {tokenMultiplier.toFixed(1)}× →{' '}
              {getTokenMultiplier(nextPrestigeLevel).toFixed(1)}×
            </strong>
          </span>
          <button
            className="cursor-pointer rounded-xl bg-linear-to-r from-cyan-600 to-violet-600 px-5 py-4 text-base font-extrabold text-white transition hover:-translate-y-px hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={pendingPrestigeLevels <= 0}
            onClick={onConfirm}
            type="button"
          >
            Start a New Session
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
