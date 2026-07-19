import { formatNumber } from 'src/services/game';

interface DashboardHeaderProps {
  hasComms: boolean;
  notice: string;
  onOpenComms: () => void;
  onOpenSettings: () => void;
  previewEnabled: boolean;
  tokens: number;
  tokensPerClick: number;
  tokensPerSecond: number;
  unreadCount: number;
}

const ICON_BUTTON_CLASS =
  'grid size-10 cursor-pointer place-items-center rounded-xl border border-white/10 bg-white/4 text-slate-300 transition-colors hover:border-cyan-300/45 hover:bg-cyan-400/8';

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

export function DashboardHeader({
  hasComms,
  notice,
  onOpenComms,
  onOpenSettings,
  previewEnabled,
  tokens,
  tokensPerClick,
  tokensPerSecond,
  unreadCount,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-cyan-400/15 bg-[#050914]/95 py-3 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-400 flex-wrap items-center gap-3 px-3 sm:px-6">
        <div className="mr-auto">
          <h1 className="text-xl font-black tracking-tight sm:text-2xl">
            <span className="text-amber-300">🏆</span> TOKENMAXXER
          </h1>
          <p
            className={`status text-xs tracking-[.28em] ${notice === 'SYSTEM ONLINE' ? 'text-emerald-300' : 'text-cyan-300'}`}
          >
            ● {notice}
          </p>
          {previewEnabled && (
            <span className="mt-1 inline-flex rounded-full border border-amber-300/35 bg-amber-300/10 px-2 py-0.5 text-xs font-bold tracking-[.18em] text-amber-200">
              PREVIEW MODE
            </span>
          )}
        </div>
        <Stat label="TOKENS" value={formatNumber(tokens)} highlight />
        <Stat label="PER SECOND" value={formatNumber(tokensPerSecond)} />
        <Stat label="PER CLICK" value={formatNumber(tokensPerClick)} />
        {hasComms && (
          <button
            aria-label={`Open Ops Comms${unreadCount > 0 ? `, ${String(unreadCount)} unread` : ''}`}
            className={`${ICON_BUTTON_CLASS} relative`}
            onClick={onOpenComms}
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
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full bg-amber-400 px-1 text-xs font-black text-[#07111f] shadow-[0_0_12px_rgb(251_191_36/0.55)]">
                {unreadCount}
              </span>
            )}
          </button>
        )}
        <button
          aria-label="Open settings"
          className={ICON_BUTTON_CLASS}
          onClick={onOpenSettings}
          type="button"
        >
          ⚙
        </button>
      </div>
    </header>
  );
}
