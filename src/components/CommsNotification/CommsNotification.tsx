import { useEffect, useRef, useState } from 'react';
import type { TransmissionDefinition } from 'src/services/transmissions';

interface CommsNotificationProps {
  transmission: TransmissionDefinition;
  blocked: boolean;
  onDismiss: () => void;
  onOpen: () => void;
  onTimeout: () => void;
}

const NOTIFICATION_DURATION = 8_000;

export function CommsNotification({
  transmission,
  blocked,
  onDismiss,
  onOpen,
  onTimeout,
}: CommsNotificationProps) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const remaining = useRef(NOTIFICATION_DURATION);
  const dismissRef = useRef(onDismiss);
  const timeoutRef = useRef(onTimeout);

  useEffect(() => {
    dismissRef.current = onDismiss;
    timeoutRef.current = onTimeout;
  }, [onDismiss, onTimeout]);

  useEffect(() => {
    remaining.current = NOTIFICATION_DURATION;
  }, [transmission.id]);

  useEffect(() => {
    if (blocked || hovered || focused) return;
    const started = Date.now();
    const timer = window.setTimeout(() => {
      remaining.current = 0;
      timeoutRef.current();
    }, remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current = Math.max(
        0,
        remaining.current - (Date.now() - started),
      );
    };
  }, [blocked, focused, hovered, transmission.id]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !blocked) dismissRef.current();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [blocked]);

  const handleMouseEnter = () => {
    setHovered(true);
  };
  const handleMouseLeave = () => {
    setHovered(false);
  };
  const handleFocus = () => {
    setFocused(true);
  };
  const handleBlur = () => {
    setFocused(false);
  };

  return (
    <aside
      aria-hidden={blocked}
      aria-label={`New message from ${transmission.sender}`}
      className={`comms-toast group fixed z-50 h-32 w-[calc(100%-1.5rem)] max-w-96 rounded-2xl border border-cyan-300/30 bg-[#0a1422]/95 p-3 shadow-[0_20px_60px_rgb(0_0_0/0.5),0_0_30px_rgb(6_182_212/0.12)] backdrop-blur-xl transition-[opacity,visibility] max-sm:inset-x-3 max-sm:bottom-3 sm:top-20 sm:right-4 ${blocked ? 'pointer-events-none invisible opacity-0' : 'visible opacity-100'}`}
      onBlurCapture={handleBlur}
      onFocusCapture={handleFocus}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="status"
    >
      <button
        aria-label={`Open message from ${transmission.sender}`}
        className="flex w-full cursor-pointer gap-3 pr-7 text-left"
        onClick={onOpen}
        type="button"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-cyan-300/25 bg-cyan-400/10 text-xs font-black text-cyan-200">
          {transmission.initials}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <strong className="truncate text-sm text-slate-100">
              {transmission.sender}
            </strong>
            <small className="ml-auto shrink-0 text-xs text-slate-500">
              now
            </small>
          </span>
          <small className="block text-xs font-bold tracking-wide text-cyan-400">
            #token-ops · {transmission.role}
          </small>
          <span className="mt-1 line-clamp-2 text-sm leading-snug text-slate-300">
            {transmission.message}
          </span>
        </span>
      </button>
      <button
        aria-label={`Dismiss notification from ${transmission.sender}`}
        className="absolute top-2 right-2 grid size-7 cursor-pointer place-items-center rounded-full text-base text-slate-400 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-white/8 hover:text-white focus:opacity-100 focus-visible:outline-2 focus-visible:outline-cyan-300 max-sm:opacity-100 [@media(hover:none)]:opacity-100"
        onClick={onDismiss}
        type="button"
      >
        ×
      </button>
    </aside>
  );
}
