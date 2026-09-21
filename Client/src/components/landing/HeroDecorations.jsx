const UTENSILS = {
  fork: (
    <g fill="url(#steel)">
      <rect x="14" y="6" width="5" height="46" rx="2.5" />
      <rect x="22" y="4" width="5" height="48" rx="2.5" />
      <rect x="30" y="4" width="5" height="48" rx="2.5" />
      <rect x="38" y="6" width="5" height="46" rx="2.5" />
      <path d="M13 40 h34 v14 c0 11 -8 18 -17 18 s-17 -7 -17 -18 z" />
      <rect x="27" y="70" width="6" height="18" rx="3" />
      <rect x="22" y="86" width="16" height="120" rx="8" />
      <path d="M27 94 v102" stroke="rgba(255,255,255,0.65)" strokeWidth="1.6" fill="none" />
    </g>
  ),
  spoon: (
    <g fill="url(#steel)">
      <ellipse cx="30" cy="42" rx="17" ry="27" />
      <ellipse cx="30" cy="42" rx="12" ry="20" fill="url(#steel-inner)" />
      <rect x="27" y="67" width="6" height="17" rx="3" />
      <rect x="22" y="82" width="16" height="124" rx="8" />
      <path d="M27 90 v106" stroke="rgba(255,255,255,0.65)" strokeWidth="1.6" fill="none" />
    </g>
  ),
  knife: (
    <g fill="url(#steel)">
      <path d="M30 4 C42 34 43 78 42 112 L18 112 C17 78 18 34 30 4 Z" />
      <path d="M20 112 h20 v12 l-4 4 h-12 l-4 -4 z" />
      <rect x="22" y="126" width="16" height="84" rx="8" />
      <path d="M30 12 C38 42 39 80 39 108" stroke="rgba(255,255,255,0.75)" strokeWidth="1.8" fill="none" />
    </g>
  ),
};

function Utensil({ type, className = '', height = 190, transform = '', duration = '9s', delay = '0s' }) {
  const width = Math.round(height * (60 / 220));
  return (
    <div className={`pointer-events-none absolute ${className}`} style={{ perspective: '1100px' }}>
      <div className="animate-float" style={{ animationDuration: duration, animationDelay: delay }}>
        <svg
          viewBox="0 0 60 220"
          style={{
            height,
            width,
            transform,
            transformStyle: 'preserve-3d',
            filter: 'drop-shadow(0 18px 22px rgba(36,27,18,0.25))',
          }}
        >
          {UTENSILS[type]}
        </svg>
      </div>
    </div>
  );
}

function GoldOrb({ className = '', size = 22, duration = '6s', delay = '0s' }) {
  return (
    <div className={`pointer-events-none absolute ${className}`} style={{ width: size, height: size }}>
      <div
        className="animate-float h-full w-full rounded-full"
        style={{
          animationDuration: duration,
          animationDelay: delay,
          background: 'radial-gradient(circle at 35% 30%, #f3e3bd 0%, #d4b173 45%, #9e7526 100%)',
          boxShadow: '0 8px 16px rgba(158,117,38,0.35)',
        }}
      />
    </div>
  );
}

export default function HeroDecorations() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 hidden xl:block">
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="steel" x1="0" y1="0" x2="1" y2="0.2">
            <stop offset="0%" stopColor="#f7f7f4" />
            <stop offset="35%" stopColor="#d9d9d2" />
            <stop offset="55%" stopColor="#b9b8af" />
            <stop offset="75%" stopColor="#e6e5df" />
            <stop offset="100%" stopColor="#918f86" />
          </linearGradient>
          <radialGradient id="steel-inner" cx="42%" cy="38%" r="65%">
            <stop offset="0%" stopColor="#8f8d84" />
            <stop offset="55%" stopColor="#c9c8c0" />
            <stop offset="100%" stopColor="#eeede8" />
          </radialGradient>
        </defs>
      </svg>

      <Utensil
        type="fork"
        className="left-[2%] top-[12%] opacity-90"
        height={210}
        transform="rotateZ(-20deg) rotateX(12deg) rotateY(18deg)"
        duration="9s"
      />
      <Utensil
        type="knife"
        className="left-[9%] top-[56%] opacity-85"
        height={165}
        transform="rotateZ(16deg) rotateX(10deg) rotateY(20deg)"
        duration="7.5s"
        delay="1.1s"
      />

      <Utensil
        type="spoon"
        className="right-[3%] top-[13%] opacity-90"
        height={205}
        transform="rotateZ(18deg) rotateX(12deg) rotateY(-18deg)"
        duration="9.5s"
        delay="0.5s"
      />
      <Utensil
        type="knife"
        className="right-[9%] top-[55%] opacity-85"
        height={175}
        transform="rotateZ(-15deg) rotateX(10deg) rotateY(-20deg)"
        duration="8s"
        delay="0.9s"
      />

      <GoldOrb className="left-[17%] top-[36%]" size={22} duration="6s" />
      <GoldOrb className="right-[17%] top-[34%]" size={24} duration="6.5s" delay="0.4s" />
    </div>
  );
}