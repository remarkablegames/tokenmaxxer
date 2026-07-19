import { formatNumber, getRecordTarget } from 'src/services/game';

interface HighScorePanelProps {
  bonusesEarned: number;
  highScoreLevel: number;
  tokens: number;
}

export function HighScorePanel({
  bonusesEarned,
  highScoreLevel,
  tokens,
}: HighScorePanelProps) {
  const target = getRecordTarget(highScoreLevel);
  const recordProgress = Math.min(100, Math.max(0, (tokens / target) * 100));
  const displayedProgress = Number(recordProgress.toFixed(1));

  return (
    <section className="border-b border-amber-300/15 bg-linear-to-r from-amber-500/5 via-cyan-500/5 to-violet-500/5 py-3 sm:py-4">
      <div className="mx-auto w-full max-w-400 px-3 sm:px-6">
        <p className="text-xs font-extrabold tracking-[0.2em] text-amber-300">
          HIGH SCORE
        </p>
        <div className="mb-2 flex items-end justify-between gap-4">
          <h2 className="text-3xl font-black tabular-nums sm:text-5xl">
            <span className="text-cyan-100">{formatNumber(tokens)}</span>{' '}
            <span className="text-slate-600">/</span>{' '}
            <span>{formatNumber(target)}</span>{' '}
            <span className="text-base font-medium text-slate-500">TOKENS</span>
          </h2>
          <div className="shrink-0 pb-1 text-right">
            <span className="block text-xs font-bold tracking-wider text-slate-400">
              PROGRESS
            </span>
            <strong className="text-sm text-amber-300 sm:text-base">
              {displayedProgress.toFixed(1)}%
            </strong>
          </div>
        </div>
        <div
          aria-label="High Score progress"
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={displayedProgress}
          className="h-3 overflow-hidden rounded-full border border-white/8 bg-black/45 shadow-[inset_0_2px_5px_rgb(0_0_0/0.55)]"
          role="progressbar"
        >
          <div
            className="h-full rounded-[inherit] bg-linear-to-r from-cyan-600 via-cyan-300 to-amber-400 shadow-[0_0_20px_#22d3ee]"
            style={{ width: `${String(displayedProgress)}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-slate-500">
          <span>{bonusesEarned} PERFORMANCE BONUSES EARNED</span>
          <span>NEXT BONUS: #{highScoreLevel + 1}</span>
        </div>
      </div>
    </section>
  );
}
