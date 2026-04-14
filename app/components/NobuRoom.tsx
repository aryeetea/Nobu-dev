export default function NobuRoom() {
  return (
    <div aria-hidden="true" className="nobu-room">
      <style>{`
        .nobu-room { position: absolute; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; background: #0d0014; }
        .nobu-room svg { width: 100%; height: 100%; display: block; }
        .room-star { animation: star-twinkle 4.8s ease-in-out infinite; }
        .room-star:nth-of-type(2n) { animation-delay: 1.2s; }
        .room-star:nth-of-type(3n) { animation-delay: 2.1s; }
        .lamp-light { animation: lamp-pulse 5.5s ease-in-out infinite; transform-origin: 1110px 610px; }
        .curtain-left { animation: curtain-left 7s ease-in-out infinite; transform-origin: 410px 156px; }
        .curtain-right { animation: curtain-right 7s ease-in-out infinite; transform-origin: 1040px 156px; }
        .screen-glow { animation: screen-breathe 6s ease-in-out infinite; }
        .plant-leaf { animation: plant-sway 6.5s ease-in-out infinite; transform-origin: 244px 693px; }
        @keyframes star-twinkle { 0%, 100% { opacity: 0.38; } 50% { opacity: 1; } }
        @keyframes lamp-pulse { 0%, 100% { opacity: 0.24; transform: scale(0.98); } 50% { opacity: 0.46; transform: scale(1.03); } }
        @keyframes curtain-left { 0%, 100% { transform: skewY(0deg); } 50% { transform: skewY(1.6deg); } }
        @keyframes curtain-right { 0%, 100% { transform: skewY(0deg); } 50% { transform: skewY(-1.4deg); } }
        @keyframes screen-breathe { 0%, 100% { opacity: 0.48; } 50% { opacity: 0.78; } }
        @keyframes plant-sway { 0%, 100% { transform: rotate(-1deg); } 50% { transform: rotate(2deg); } }
      `}</style>

      <svg preserveAspectRatio="xMidYMid slice" viewBox="0 0 1440 900" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient cx="50%" cy="50%" id="lampGlow" r="50%">
            <stop offset="0%" stopColor="#ffd580" stopOpacity="0.72" />
            <stop offset="54%" stopColor="#ffd580" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#ffd580" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#2b0752" />
            <stop offset="100%" stopColor="#120023" />
          </linearGradient>
        </defs>

        <rect fill="#0d0014" height="900" width="1440" />
        <rect fill="#170027" height="610" width="1440" />
        <path d="M0 610h1440v290H0z" fill="#090010" />
        <path d="M0 610h1440" stroke="#7c3aed" strokeOpacity="0.35" strokeWidth="5" />

        <path d="M0 610h1440l-210 290H210z" fill="#120020" />
        <path d="M172 900l170-290M432 900l90-290M682 900l22-290M930 900l-46-290M1192 900l-118-290" stroke="#24023b" strokeWidth="4" />
        <path d="M0 738h1440M0 820h1440" stroke="#24023b" strokeWidth="4" />

        <g transform="translate(380 92)">
          <rect fill="#08000d" height="372" rx="8" width="680" />
          <rect fill="#7c3aed" height="372" opacity="0.28" rx="8" width="680" />
          <rect fill="url(#sky)" height="326" rx="4" width="628" x="26" y="24" />
          <path d="M340 24v326M26 188h628" stroke="#090010" strokeWidth="8" />
          <path d="M76 284c84-82 163-99 236-50 67 45 134 36 223-32 48 45 83 94 105 148H26c8-25 25-47 50-66Z" fill="#0d0014" opacity="0.86" />
          <circle className="room-star" cx="94" cy="78" fill="#ffd580" r="4" />
          <circle className="room-star" cx="176" cy="136" fill="#c4b5fd" r="3" />
          <circle className="room-star" cx="268" cy="72" fill="#fff7d6" r="3" />
          <circle className="room-star" cx="400" cy="112" fill="#ffd580" r="4" />
          <circle className="room-star" cx="512" cy="68" fill="#c4b5fd" r="3" />
          <circle className="room-star" cx="590" cy="156" fill="#fff7d6" r="3" />
          <path d="M500 85c45 10 78 47 80 92-34-27-79-34-120-19 36-15 48-45 40-73Z" fill="#ffd580" opacity="0.76" />
        </g>

        <path className="curtain-left" d="M352 82h82c-28 114-22 251 24 410H332c34-150 40-287 20-410Z" fill="#1a0030" />
        <path d="M352 82h82c-28 114-22 251 24 410H332c34-150 40-287 20-410Z" fill="#7c3aed" opacity="0.18" />
        <path className="curtain-right" d="M1006 82h82c-20 123-14 260 20 410H982c46-159 52-296 24-410Z" fill="#1a0030" />
        <path d="M1006 82h82c-20 123-14 260 20 410H982c46-159 52-296 24-410Z" fill="#7c3aed" opacity="0.18" />

        <g transform="translate(78 240)">
          <rect fill="#0a0010" height="364" rx="6" width="246" />
          <rect fill="#7c3aed" height="364" opacity="0.16" rx="6" width="246" />
          <path d="M26 84h194M26 176h194M26 268h194" stroke="#7c3aed" strokeOpacity="0.32" strokeWidth="5" />
          <rect fill="#ffd580" height="62" rx="3" width="20" x="42" y="22" />
          <rect fill="#3b0764" height="46" rx="3" width="18" x="78" y="38" />
          <rect fill="#7c3aed" height="68" rx="3" width="22" x="112" y="16" />
          <rect fill="#13001f" height="52" rx="3" width="28" x="152" y="32" />
          <rect fill="#7c3aed" height="76" opacity="0.7" rx="3" width="20" x="52" y="100" />
          <rect fill="#ffd580" height="52" opacity="0.8" rx="3" width="24" x="96" y="124" />
          <rect fill="#2b0752" height="68" rx="3" width="18" x="146" y="108" />
          <rect fill="#ffd580" height="78" opacity="0.58" rx="3" width="20" x="56" y="190" />
          <rect fill="#7c3aed" height="56" opacity="0.66" rx="3" width="24" x="96" y="212" />
          <rect fill="#2b0752" height="70" rx="3" width="18" x="154" y="198" />
          <rect fill="#1a0030" height="36" rx="6" width="64" x="134" y="294" />
          <path d="M146 310h40" stroke="#ffd580" strokeLinecap="round" strokeOpacity="0.7" strokeWidth="5" />
        </g>

        <g transform="translate(874 512)">
          <rect fill="#08000d" height="44" rx="5" width="354" y="178" />
          <rect fill="#1a0030" height="34" rx="4" width="324" x="15" y="154" />
          <rect fill="#090010" height="110" rx="6" width="150" x="28" y="34" />
          <rect className="screen-glow" fill="#7c3aed" height="82" opacity="0.56" rx="4" width="122" x="42" y="48" />
          <path d="M66 82h72M66 104h48" stroke="#ffd580" strokeLinecap="round" strokeOpacity="0.82" strokeWidth="5" />
          <rect fill="#060009" height="12" rx="4" width="74" x="66" y="144" />
          <path d="M252 178l40-132 40 132" fill="none" stroke="#ffd580" strokeOpacity="0.68" strokeWidth="7" />
          <path d="M240 48h104l-21-46h-62z" fill="#ffd580" />
          <path d="M242 48h100l-15 34h-70z" fill="#7c3aed" opacity="0.34" />
          <ellipse className="lamp-light" cx="292" cy="106" fill="url(#lampGlow)" rx="248" ry="190" />
        </g>

        <g transform="translate(172 666)">
          <rect fill="#050008" height="116" rx="6" width="104" x="24" y="84" />
          <path className="plant-leaf" d="M76 88C36 60 36 22 70 0c13 32 14 60 6 88Z" fill="#7c3aed" opacity="0.68" />
          <path className="plant-leaf" d="M78 90c39-27 47-65 17-90-16 31-21 60-17 90Z" fill="#ffd580" opacity="0.58" />
          <path className="plant-leaf" d="M78 94C32 100 5 77 4 38c34 8 58 26 74 56Z" fill="#1a0030" />
          <path className="plant-leaf" d="M78 94c50 3 76-22 72-62-34 11-58 32-72 62Z" fill="#2b0752" />
        </g>

        <g transform="translate(1088 330)">
          <rect fill="#0a0010" height="224" rx="6" width="192" />
          <path d="M44 54h108M44 106h108M44 158h108" stroke="#7c3aed" strokeOpacity="0.34" strokeWidth="5" />
          <path d="M62 54v-28h68v28M78 106V78h36v28M70 158v-28h52v28" fill="none" stroke="#ffd580" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.68" strokeWidth="6" />
          <circle fill="#7c3aed" opacity="0.8" r="8" cx="58" cy="196" />
          <circle fill="#ffd580" opacity="0.8" r="8" cx="94" cy="196" />
          <circle fill="#7c3aed" opacity="0.8" r="8" cx="130" cy="196" />
        </g>

        <path d="M0 792c210-38 402-32 576 18 240 69 468 62 678-18 64-25 126-40 186-46v154H0z" fill="#030005" opacity="0.9" />
      </svg>
    </div>
  )
}
