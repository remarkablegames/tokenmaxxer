const REACTOR_NODES = [
  [200, 42],
  [312, 88],
  [358, 200],
  [312, 312],
  [200, 358],
  [88, 312],
  [42, 200],
  [88, 88],
];

interface CoverArtworkProps {
  animated: boolean;
}

interface CoverImageProps {
  animated?: boolean;
}

function CoverTrophy({ animated }: CoverArtworkProps) {
  return (
    <svg
      aria-hidden="true"
      className={`size-[clamp(3.25rem,11vmin,6.5rem)] text-amber-300 drop-shadow-[0_0_18px_rgb(251_191_36/0.45)] ${animated ? 'animate-[cover-float_3s_ease-in-out_infinite]' : ''}`}
      data-testid="cover-trophy"
      viewBox="0 0 96 96"
    >
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

function CoverReactor({ animated }: CoverArtworkProps) {
  return (
    <div className="flex items-center justify-center">
      <svg
        aria-hidden="true"
        className="size-[min(64vmin,380px)] overflow-visible drop-shadow-[0_0_35px_rgb(239_68_68/0.25)] [@media(min-aspect-ratio:3/2)]:size-[min(66vmin,480px)]"
        data-animated={animated}
        data-testid="cover-reactor"
        viewBox="0 0 400 400"
      >
        <defs>
          <radialGradient id="cover-core" cx="50%" cy="45%" r="58%">
            <stop offset="0" stopColor="#fff" />
            <stop offset="0.28" stopColor="#fef3c7" />
            <stop offset="0.62" stopColor="#fb923c" />
            <stop offset="1" stopColor="#be123c" stopOpacity="0.18" />
          </radialGradient>
          <radialGradient id="cover-aura">
            <stop offset="0" stopColor="#fff7ed" stopOpacity="0.8" />
            <stop offset="0.45" stopColor="#ef4444" stopOpacity="0.42" />
            <stop offset="1" stopColor="#7f1d1d" stopOpacity="0" />
          </radialGradient>
          <filter
            id="cover-glow"
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
          >
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          className={animated ? 'core-aura' : undefined}
          cx="200"
          cy="200"
          fill="url(#cover-aura)"
          r="128"
        />
        <circle
          className={animated ? 'reactor-ring reactor-ring-slow' : undefined}
          cx="200"
          cy="200"
          fill="none"
          r="174"
          stroke="#7f1d1d"
          strokeDasharray="8 12"
          strokeWidth="3"
        />
        <circle
          className={animated ? 'reactor-ring reactor-ring-reverse' : undefined}
          cx="200"
          cy="200"
          fill="none"
          r="145"
          stroke="#fbbf24"
          strokeDasharray="3 18"
          strokeLinecap="round"
          strokeWidth="7"
        />
        <path
          className={
            animated ? 'animate-[energy-flow_1.4s_linear_infinite]' : undefined
          }
          d="M75 200a125 125 0 0 1 250 0"
          fill="none"
          stroke="#fff7ed"
          strokeDasharray="24 12"
          strokeWidth="5"
        />
        {REACTOR_NODES.map(([x, y], index) => (
          <g
            className={animated ? 'node-light' : undefined}
            key={`${String(x)}-${String(y)}`}
            style={
              animated ? { animationDelay: `${String(index * -0.18)}s` } : {}
            }
          >
            <line
              stroke="#155e75"
              strokeDasharray="5 8"
              strokeWidth="2"
              x1="200"
              x2={x}
              y1="200"
              y2={y}
            />
            <rect
              fill="#0e7490"
              height="30"
              rx="6"
              stroke="#67e8f9"
              strokeWidth="2"
              width="30"
              x={x - 15}
              y={y - 15}
            />
            <circle cx={x} cy={y} fill="#cffafe" r="4" />
          </g>
        ))}
        <ellipse
          className={animated ? 'planet-ring' : undefined}
          cx="200"
          cy="200"
          fill="none"
          rx="184"
          ry="58"
          stroke="#f59e0b"
          strokeWidth="4"
          transform="rotate(-7 200 200)"
        />
        <circle
          cx="200"
          cy="200"
          fill="#07111f"
          r="72"
          stroke="#fde68a"
          strokeWidth="4"
        />
        <path
          d="M200 142l50 29v58l-50 29-50-29v-58Z"
          fill="url(#cover-core)"
          filter="url(#cover-glow)"
        />
        <g fill="#071525" stroke="#071525" strokeLinecap="round">
          <path d="M174 181h52M200 181v42" fill="none" strokeWidth="7" />
          <circle cx="174" cy="181" r="4.5" stroke="none" />
          <circle cx="226" cy="181" r="4.5" stroke="none" />
          <circle cx="200" cy="223" r="4.5" stroke="none" />
        </g>
      </svg>
    </div>
  );
}

export function CoverImage({ animated = false }: CoverImageProps) {
  return (
    <main
      aria-label="Tokenmaxxer storefront cover"
      className="relative h-dvh w-dvw overflow-hidden bg-[#030712] text-slate-100 select-none"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_68%_48%,rgb(190_24_93/0.18),transparent_34%),radial-gradient(circle_at_45%_45%,rgb(6_182_212/0.13),transparent_44%),linear-gradient(135deg,#020611_0%,#071426_52%,#080615_100%)]"
      />
      <svg aria-hidden="true" className="absolute inset-0 size-full opacity-20">
        <defs>
          <pattern
            height="42"
            id="cover-grid"
            patternUnits="userSpaceOnUse"
            width="42"
          >
            <path
              d="M42 0H0V42"
              fill="none"
              stroke="#22d3ee"
              strokeOpacity="0.22"
            />
          </pattern>
        </defs>
        <rect fill="url(#cover-grid)" height="100%" width="100%" />
      </svg>
      <div className="absolute inset-x-[8vmin] top-[7vmin] h-px bg-linear-to-r from-transparent via-cyan-300/40 to-transparent" />

      <section
        className="relative z-10 grid h-full w-full grid-rows-[auto_minmax(0,1fr)] items-center gap-[2vmin] px-[5vmin] py-[4vmin] [@media(min-aspect-ratio:3/2)]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] [@media(min-aspect-ratio:3/2)]:grid-rows-1 [@media(min-aspect-ratio:3/2)]:gap-[4vmin] [@media(min-aspect-ratio:6/5)]:px-[7vmin]"
        data-testid="cover-layout"
      >
        <header className="flex flex-col items-center text-center [@media(min-aspect-ratio:3/2)]:col-start-1 [@media(min-aspect-ratio:3/2)]:row-start-1 [@media(min-aspect-ratio:3/2)]:items-start [@media(min-aspect-ratio:3/2)]:self-center [@media(min-aspect-ratio:3/2)]:text-left">
          <CoverTrophy animated={animated} />
          <h1 className="font-brand mt-[0.5vmin] text-[clamp(2.75rem,10.5vmin,6rem)] leading-none font-black tracking-[-0.04em] drop-shadow-[0_5px_22px_rgb(0_0_0/0.8)]">
            <span className="text-cyan-200">TOKEN</span>
            <span className="text-white">MAXXER</span>
          </h1>
        </header>

        <div className="grid min-h-0 place-items-center [@media(min-aspect-ratio:3/2)]:col-start-2 [@media(min-aspect-ratio:3/2)]:row-start-1">
          <CoverReactor animated={animated} />
        </div>
      </section>
    </main>
  );
}
