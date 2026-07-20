import type { MouseEvent, ReactNode } from 'react';

interface ModalShellProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
  onCloseButton?: () => void;
}

export function ModalShell({
  title,
  children,
  onClose,
  onCloseButton,
}: ModalShellProps) {
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
            <p className="text-xs font-extrabold tracking-[0.2em] text-cyan-300">
              TOKENMAXXER CONTROL
            </p>
            <h2 className="text-2xl font-black">{title}</h2>
          </div>
          <button
            aria-label="Close dialog"
            className="grid size-10 cursor-pointer place-items-center rounded-xl border border-white/10 bg-white/4 text-slate-300 transition-colors hover:border-cyan-300/45 hover:bg-cyan-400/8"
            onClick={onCloseButton ?? onClose}
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
