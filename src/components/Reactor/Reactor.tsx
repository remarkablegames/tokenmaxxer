import type { MouseEvent } from 'react';

interface ReactorProps {
  stage: number;
  overdriveLevel: number;
  label: string;
  active: boolean;
  guided: boolean;
  onActivate: (event: MouseEvent<HTMLButtonElement>) => void;
}

const STAGE_NAMES = [
  'Workstation',
  'Server Core',
  'AI Cluster',
  'Datacenter',
  'Planetary Processor',
  'Cosmic Token Reactor',
];

interface ReactorPalette {
  accent: string;
  core: string;
  edge: string;
  orbit: string;
  outerRing: string;
  ring: string;
}

const REACTOR_PALETTES: ReactorPalette[] = [
  {
    accent: '#67e8f9',
    core: '#67e8f9',
    edge: '#0891b2',
    orbit: '#22d3ee',
    outerRing: '#164e63',
    ring: '#22d3ee',
  },
  {
    accent: '#7dd3fc',
    core: '#38bdf8',
    edge: '#2563eb',
    orbit: '#38bdf8',
    outerRing: '#1e3a8a',
    ring: '#38bdf8',
  },
  {
    accent: '#a78bfa',
    core: '#818cf8',
    edge: '#6d28d9',
    orbit: '#a78bfa',
    outerRing: '#312e81',
    ring: '#818cf8',
  },
  {
    accent: '#e879f9',
    core: '#c084fc',
    edge: '#a21caf',
    orbit: '#e879f9',
    outerRing: '#581c87',
    ring: '#d946ef',
  },
  {
    accent: '#fb923c',
    core: '#fbbf24',
    edge: '#f97316',
    orbit: '#fbbf24',
    outerRing: '#78350f',
    ring: '#f59e0b',
  },
  {
    accent: '#fb7185',
    core: '#fb923c',
    edge: '#dc2626',
    orbit: '#ef4444',
    outerRing: '#7f1d1d',
    ring: '#f97316',
  },
];

const OVERDRIVE_PALETTES: ReactorPalette[] = [
  {
    accent: '#fda4af',
    core: '#fb7185',
    edge: '#ef4444',
    orbit: '#f43f5e',
    outerRing: '#991b1b',
    ring: '#f43f5e',
  },
  {
    accent: '#fb7185',
    core: '#fff7ed',
    edge: '#be123c',
    orbit: '#e11d48',
    outerRing: '#881337',
    ring: '#e11d48',
  },
  {
    accent: '#fff7ed',
    core: '#fef3c7',
    edge: '#ef4444',
    orbit: '#f59e0b',
    outerRing: '#7f1d1d',
    ring: '#fbbf24',
  },
];

const OVERDRIVE_LABELS = ['', 'I', 'II', 'III'];

export function Reactor({
  stage,
  label,
  active,
  guided,
  onActivate,
  overdriveLevel,
}: ReactorProps) {
  const satellites = Array.from({ length: stage + 2 }, (_, index) => index);
  const cappedOverdriveLevel = Math.min(3, Math.max(0, overdriveLevel));
  const palette =
    stage === 5 && cappedOverdriveLevel > 0
      ? OVERDRIVE_PALETTES[cappedOverdriveLevel - 1]
      : REACTOR_PALETTES[stage];

  return (
    <button
      aria-label={label}
      className={`group relative mx-auto block aspect-square w-full max-w-108 cursor-pointer rounded-full transition-transform select-none hover:scale-[1.015] focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-cyan-300 active:scale-[.97] max-sm:max-w-80 ${active ? 'saturate-150 [&_.core-aura]:[animation-duration:.28s]' : ''} ${guided ? '[&_.core-aura]:animate-[glow-pulse_1s_ease-in-out_infinite_alternate]' : ''}`}
      onClick={onActivate}
      type="button"
    >
      <svg
        aria-hidden="true"
        className="h-full w-full overflow-visible"
        viewBox="0 0 400 400"
      >
        <defs>
          <radialGradient id="core-gradient">
            <stop offset="0" stopColor="#fff" />
            <stop offset="0.25" stopColor={palette.core} />
            <stop offset="1" stopColor={palette.edge} stopOpacity="0.12" />
          </radialGradient>
          <filter id="core-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur
              stdDeviation={8 + cappedOverdriveLevel * 2}
              result="blur"
            />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          className="reactor-ring reactor-ring-slow"
          cx="200"
          cy="200"
          fill="none"
          r="170"
          stroke={palette.outerRing}
          strokeDasharray="8 12"
          strokeWidth="2"
        />
        <circle
          className="reactor-ring"
          cx="200"
          cy="200"
          fill="none"
          r="142"
          stroke={palette.ring}
          strokeDasharray="3 18"
          strokeLinecap="round"
          strokeWidth={5 + cappedOverdriveLevel}
        />
        {satellites.map((index) => {
          const angle = (index / satellites.length) * Math.PI * 2;
          const x = 200 + Math.cos(angle) * 142;
          const y = 200 + Math.sin(angle) * 142;
          return (
            <g key={index}>
              <line className="energy-line" x1="200" x2={x} y1="200" y2={y} />
              <rect
                fill="#0e7490"
                height="28"
                rx="5"
                stroke="#67e8f9"
                width="28"
                x={x - 14}
                y={y - 14}
              />
              <circle
                className="node-light"
                cx={x}
                cy={y}
                fill="#cffafe"
                r="4"
              />
            </g>
          );
        })}
        {stage >= 2 && (
          <path
            className="reactor-ring reactor-ring-reverse"
            d="M78 200a122 122 0 0 1 244 0"
            fill="none"
            stroke={palette.accent}
            strokeDasharray="24 12"
            strokeWidth={4 + cappedOverdriveLevel * 0.5}
          />
        )}
        {stage >= 4 && (
          <ellipse
            className="planet-ring"
            cx="200"
            cy="200"
            fill="none"
            rx="178"
            ry="54"
            stroke={palette.orbit}
            strokeWidth={3 + cappedOverdriveLevel * 0.5}
          />
        )}
        <circle
          className="core-aura"
          cx="200"
          cy="200"
          fill="url(#core-gradient)"
          opacity={0.35 + cappedOverdriveLevel * 0.07}
          r={76 + stage * 5}
        />
        <circle
          cx="200"
          cy="200"
          fill="#071525"
          r="66"
          stroke={palette.core}
          strokeWidth="3"
        />
        <path
          d="M200 148l44 26v52l-44 26-44-26v-52z"
          fill="url(#core-gradient)"
          filter="url(#core-glow)"
        />
        <g fill="#082f49" stroke="#082f49" strokeLinecap="round">
          <path d="M176 183h48M200 183v36" fill="none" strokeWidth="6" />
          <circle cx="176" cy="183" r="4" stroke="none" />
          <circle cx="224" cy="183" r="4" stroke="none" />
          <circle cx="200" cy="219" r="4" stroke="none" />
        </g>
      </svg>
      <span className="absolute inset-x-0 bottom-2 text-center text-xs font-bold tracking-[0.22em] uppercase">
        <span className="block text-cyan-200">{STAGE_NAMES[stage]}</span>
        {cappedOverdriveLevel > 0 && (
          <small className="mt-1 block text-xs tracking-[0.18em] text-amber-300">
            OVERDRIVE {OVERDRIVE_LABELS[cappedOverdriveLevel]}
          </small>
        )}
      </span>
    </button>
  );
}
