import type { MouseEvent } from 'react';

interface ReactorProps {
  stage: number;
  label: string;
  active: boolean;
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

export function Reactor({ stage, label, active, onActivate }: ReactorProps) {
  const satellites = Array.from({ length: stage + 2 }, (_, index) => index);

  return (
    <button
      aria-label={label}
      className={`group relative mx-auto block aspect-square w-full max-w-96 cursor-pointer rounded-full transition-transform hover:scale-[1.015] focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-cyan-300 active:scale-[.97] max-sm:max-w-76 ${active ? 'saturate-150 [&_.core-aura]:[animation-duration:.28s]' : ''}`}
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
            <stop
              offset="0.25"
              stopColor={stage >= 4 ? '#fbbf24' : '#67e8f9'}
            />
            <stop
              offset="1"
              stopColor={stage >= 5 ? '#a855f7' : '#0891b2'}
              stopOpacity="0.12"
            />
          </radialGradient>
          <filter id="core-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="8" result="blur" />
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
          stroke="#164e63"
          strokeDasharray="8 12"
          strokeWidth="2"
        />
        <circle
          className="reactor-ring"
          cx="200"
          cy="200"
          fill="none"
          r="142"
          stroke={stage >= 3 ? '#a855f7' : '#22d3ee'}
          strokeDasharray="3 18"
          strokeLinecap="round"
          strokeWidth="5"
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
            stroke="#c084fc"
            strokeDasharray="24 12"
            strokeWidth="4"
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
            stroke="#fbbf24"
            strokeWidth="3"
          />
        )}
        <circle
          className="core-aura"
          cx="200"
          cy="200"
          fill="url(#core-gradient)"
          opacity=".35"
          r={76 + stage * 5}
        />
        <circle
          cx="200"
          cy="200"
          fill="#071525"
          r="66"
          stroke={stage >= 4 ? '#fbbf24' : '#67e8f9'}
          strokeWidth="3"
        />
        <path
          d="M200 148l44 26v52l-44 26-44-26v-52z"
          fill="url(#core-gradient)"
          filter="url(#core-glow)"
        />
        <text
          fill="#082f49"
          fontSize="28"
          fontWeight="900"
          textAnchor="middle"
          x="200"
          y="210"
        >
          T
        </text>
      </svg>
      <span className="absolute inset-x-0 bottom-2 text-center text-xs font-bold tracking-[0.22em] text-cyan-200 uppercase">
        {STAGE_NAMES[stage]}
      </span>
    </button>
  );
}
