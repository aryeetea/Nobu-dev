export default function NobuRoom() {
  return (
    <div aria-hidden="true" className="nobu-room">
      <style>{`
        .nobu-room { position: absolute; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; background: linear-gradient(180deg, #0d0014 0%, #1a0030 56%, #07000d 100%); }
        .nobu-room svg { width: 100%; height: 100%; display: block; }
        .room-star { animation: room-twinkle 4s ease-in-out infinite; transform-origin: center; }
        .room-star:nth-of-type(2n) { animation-delay: 1.2s; }
        .room-star:nth-of-type(3n) { animation-delay: 2.1s; }
        .lamp-glow { animation: lamp-breathe 5s ease-in-out infinite; }
        .window-glow { animation: sky-shift 9s ease-in-out infinite; }
        .steam-line { animation: steam-rise 4.5s ease-in-out infinite; opacity: 0; }
        .steam-line:nth-of-type(2) { animation-delay: 1.3s; }
        .steam-line:nth-of-type(3) { animation-delay: 2.4s; }
        @keyframes room-twinkle { 0%, 100% { opacity: 0.28; transform: scale(1); } 50% { opacity: 0.9; transform: scale(1.18); } }
        @keyframes lamp-breathe { 0%, 100% { opacity: 0.42; } 50% { opacity: 0.68; } }
        @keyframes sky-shift { 0%, 100% { opacity: 0.82; } 50% { opacity: 1; } }
        @keyframes steam-rise { 0% { opacity: 0; transform: translateY(10px); } 25% { opacity: 0.46; } 100% { opacity: 0; transform: translateY(-28px); } }
      `}</style>

      <svg preserveAspectRatio="xMidYMid slice" viewBox="0 0 1440 900" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient cx="50%" cy="50%" id="skyGradient" r="75%">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.5" />
            <stop offset="45%" stopColor="#1a0030" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#0d0014" />
          </radialGradient>
          <radialGradient cx="50%" cy="50%" id="lampGradient" r="50%">
            <stop offset="0%" stopColor="#ffd580" stopOpacity="0.78" />
            <stop offset="55%" stopColor="#ffd580" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#ffd580" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="wallGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#13001f" />
            <stop offset="100%" stopColor="#07000d" />
          </linearGradient>
          <linearGradient id="floorGradient" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#160027" />
            <stop offset="100%" stopColor="#050008" />
          </linearGradient>
        </defs>

        <rect fill="url(#wallGradient)" height="900" width="1440" />
        <path d="M0 650h1440v250H0z" fill="url(#floorGradient)" />
        <path d="M0 650h1440" stroke="#7c3aed" strokeOpacity="0.12" strokeWidth="2" />

        <g transform="translate(440 80)">
          <rect fill="#09000f" height="356" rx="8" stroke="#7c3aed" strokeOpacity="0.32" strokeWidth="4" width="560" />
          <rect className="window-glow" fill="url(#skyGradient)" height="320" rx="4" width="520" x="20" y="18" />
          <path d="M300 18v320M20 178h520" stroke="#0d0014" strokeOpacity="0.8" strokeWidth="7" />
          <circle className="room-star" cx="95" cy="78" fill="#fff" r="2" />
          <circle className="room-star" cx="176" cy="132" fill="#ffd580" r="1.7" />
          <circle className="room-star" cx="258" cy="74" fill="#fff" r="2.2" />
          <circle className="room-star" cx="389" cy="114" fill="#fff" r="1.8" />
          <circle className="room-star" cx="464" cy="65" fill="#ffd580" r="1.5" />
          <circle className="room-star" cx="482" cy="220" fill="#fff" r="2" />
          <path d="M70 268c62-60 126-79 194-50 70 30 125 23 203-42 35 42 59 90 72 144H20c10-21 27-38 50-52Z" fill="#0d0014" opacity="0.78" />
        </g>

        <g transform="translate(82 258)">
          <rect fill="#10001c" height="360" rx="8" stroke="#7c3aed" strokeOpacity="0.18" strokeWidth="3" width="250" />
          <path d="M28 76h194M28 158h194M28 242h194" stroke="#7c3aed" strokeOpacity="0.16" strokeWidth="4" />
          <rect fill="#7c3aed" height="54" opacity="0.45" rx="3" width="18" x="44" y="22" />
          <rect fill="#ffd580" height="44" opacity="0.58" rx="3" width="16" x="72" y="32" />
          <rect fill="#2a0546" height="56" rx="3" width="20" x="102" y="20" />
          <rect fill="#7c3aed" height="72" opacity="0.36" rx="3" width="18" x="146" y="86" />
          <rect fill="#ffd580" height="50" opacity="0.48" rx="3" width="24" x="177" y="108" />
          <rect fill="#2a0546" height="74" rx="3" width="17" x="54" y="168" />
          <rect fill="#7c3aed" height="60" opacity="0.5" rx="3" width="22" x="96" y="182" />
          <rect fill="#ffd580" height="82" opacity="0.34" rx="3" width="18" x="154" y="160" />
        </g>

        <g transform="translate(930 470)">
          <ellipse className="lamp-glow" cx="130" cy="108" fill="url(#lampGradient)" rx="310" ry="250" />
          <rect fill="#12001f" height="24" rx="5" width="300" y="230" />
          <path d="M92 230l38-144 38 144" fill="none" stroke="#ffd580" strokeOpacity="0.48" strokeWidth="8" />
          <path d="M77 85h106l-22-48H99z" fill="#ffd580" opacity="0.88" />
          <path d="M78 85h104l-15 36H93z" fill="#7c3aed" opacity="0.32" />
          <rect fill="#ffd580" height="12" opacity="0.7" rx="5" width="70" x="95" y="228" />
          <g transform="translate(-94 160)">
            <rect fill="#10001c" height="58" rx="8" stroke="#7c3aed" strokeOpacity="0.22" width="78" />
            <path className="steam-line" d="M28 0c-12-18 16-26 4-45" fill="none" stroke="#ffd580" strokeLinecap="round" strokeOpacity="0.42" strokeWidth="4" />
            <path className="steam-line" d="M45 0c-12-18 16-26 4-45" fill="none" stroke="#ffd580" strokeLinecap="round" strokeOpacity="0.42" strokeWidth="4" />
            <path className="steam-line" d="M61 0c-12-18 16-26 4-45" fill="none" stroke="#ffd580" strokeLinecap="round" strokeOpacity="0.42" strokeWidth="4" />
          </g>
        </g>

        <path d="M0 760c250-60 469-52 688 24 260 91 526 82 752-20v136H0z" fill="#030005" opacity="0.82" />
        <rect fill="#7c3aed" height="3" opacity="0.13" width="1440" y="760" />
      </svg>
    </div>
  )
}
