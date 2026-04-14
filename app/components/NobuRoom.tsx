'use client'

type Props = {
  character: 'female' | 'male'
}

const characterDetails = {
  female: {
    accent: '#e85d9b',
    curtain: '#f0a7bf',
    blanket: '#222832',
    pillow: '#fff1a8',
    wallTop: '#dceff3',
    wallBottom: '#f4f8fb',
    skyTop: '#8fd0e8',
    skyMid: '#e8c9d9',
    skyBottom: '#fff0bd',
    furniture: '#24313a',
    wood: '#557c91',
    shelfGlass: '#ffffff',
    floor: '#edf4fb',
    label: 'Alexia',
  },
  male: {
    accent: '#3b82f6',
    curtain: '#9fd4ff',
    blanket: '#253b4e',
    pillow: '#b7f7cf',
    wallTop: '#def3fb',
    wallBottom: '#f5fbff',
    skyTop: '#8bd8ff',
    skyMid: '#cfe6f7',
    skyBottom: '#d9fff1',
    furniture: '#26475b',
    wood: '#4d7890',
    shelfGlass: '#ffffff',
    floor: '#edf6ff',
    label: 'Asuka',
  },
}

export default function NobuRoom({ character }: Props) {
  const theme = characterDetails[character]

  return (
    <section aria-label={`${theme.label} anime studio apartment`} className="nobu-room">
      <style>{`
        .nobu-room {
          background: ${theme.wallBottom};
          inset: 0;
          overflow: hidden;
          position: absolute;
          z-index: 0;
        }

        .nobu-room svg {
          display: block;
          height: 100%;
          width: 100%;
        }

        .room-mobile {
          display: none;
        }

        .sun-glow {
          animation: sun-breathe 7s ease-in-out infinite;
          transform-origin: 1038px 178px;
        }

        .curtain-left {
          animation: curtain-left 8s ease-in-out infinite;
          transform-origin: 370px 88px;
        }

        .curtain-right {
          animation: curtain-right 8s ease-in-out infinite;
          transform-origin: 1070px 88px;
        }

        .lamp-glow {
          animation: lamp-breathe 5.8s ease-in-out infinite;
          transform-origin: 1058px 548px;
        }

        .screen-glow {
          animation: screen-pulse 5s ease-in-out infinite;
        }

        .plant-leaf {
          animation: plant-sway 6.5s ease-in-out infinite;
          transform-origin: 214px 742px;
        }

        .sparkle {
          animation: sparkle 4.5s ease-in-out infinite;
        }

        .sparkle:nth-of-type(2n) {
          animation-delay: 1.4s;
        }

        .sparkle:nth-of-type(3n) {
          animation-delay: 2.2s;
        }

        @keyframes sun-breathe {
          0%, 100% { opacity: 0.22; transform: scale(0.98); }
          50% { opacity: 0.42; transform: scale(1.04); }
        }

        @keyframes curtain-left {
          0%, 100% { transform: skewY(0deg); }
          50% { transform: skewY(1.2deg); }
        }

        @keyframes curtain-right {
          0%, 100% { transform: skewY(0deg); }
          50% { transform: skewY(-1.1deg); }
        }

        @keyframes lamp-breathe {
          0%, 100% { opacity: 0.18; transform: scale(0.98); }
          50% { opacity: 0.38; transform: scale(1.04); }
        }

        @keyframes screen-pulse {
          0%, 100% { opacity: 0.48; }
          50% { opacity: 0.74; }
        }

        @keyframes plant-sway {
          0%, 100% { transform: rotate(-1deg); }
          50% { transform: rotate(2deg); }
        }

        @keyframes sparkle {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 0.8; }
        }

        @media (max-width: 760px) {
          .room-desktop {
            display: none;
          }

          .room-mobile {
            display: block;
          }
        }
      `}</style>

      <svg
        aria-hidden="true"
        className="room-desktop"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1440 900"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="wallGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={theme.wallTop} />
            <stop offset="100%" stopColor={theme.wallBottom} />
          </linearGradient>
          <linearGradient id="skyGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={theme.skyTop} />
            <stop offset="58%" stopColor={theme.skyMid} />
            <stop offset="100%" stopColor={theme.skyBottom} />
          </linearGradient>
          <radialGradient cx="50%" cy="50%" id="sunGlow" r="50%">
            <stop offset="0%" stopColor="#fff4a8" stopOpacity="0.78" />
            <stop offset="60%" stopColor="#ffd58a" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#ffd58a" stopOpacity="0" />
          </radialGradient>
          <radialGradient cx="50%" cy="50%" id="lampGlow" r="50%">
            <stop offset="0%" stopColor="#ffd580" stopOpacity="0.72" />
            <stop offset="58%" stopColor="#ffd580" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ffd580" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect fill="url(#wallGradient)" height="900" width="1440" />
        <path d="M0 610h1440v290H0z" fill={theme.floor} />
        <path d="M0 610h1440" stroke="#7aa4b9" strokeOpacity="0.52" strokeWidth="5" />
        <path d="M0 610h1440l-190 290H190z" fill="#f7fbff" opacity="0.7" />
        <path d="M148 900l178-290M420 900l92-290M696 900l18-290M962 900l-58-290M1244 900l-126-290" stroke="#d5e4ef" strokeWidth="5" />
        <path d="M0 746h1440M0 826h1440" stroke="#d5e4ef" strokeWidth="5" />

        <g transform="translate(350 78)">
          <rect fill="#ffffff" height="366" rx="14" stroke={theme.furniture} strokeOpacity="0.18" strokeWidth="5" width="740" />
          <rect fill="url(#skyGradient)" height="314" rx="9" width="684" x="28" y="26" />
          <ellipse className="sun-glow" cx="560" cy="96" fill="url(#sunGlow)" rx="260" ry="180" />
          <circle cx="566" cy="96" fill="#fff4a8" r="38" />
          <path d="M370 26v314M28 186h684" stroke="#fff8ef" strokeWidth="9" />
          <path d="M66 292c88-82 174-98 254-47 68 44 140 36 230-32 58 48 98 92 120 127H28c8-18 21-34 38-48Z" fill="#6e9ead" opacity="0.55" />
          <circle className="sparkle" cx="92" cy="86" fill="#ffffff" r="4" />
          <circle className="sparkle" cx="178" cy="134" fill="#fff4a8" r="4" />
          <circle className="sparkle" cx="278" cy="72" fill="#ffffff" r="3" />
          <circle className="sparkle" cx="484" cy="128" fill="#fff4a8" r="4" />
        </g>

        <path className="curtain-left" d="M324 60h94c-32 128-26 274 22 446H296c40-164 48-312 28-446Z" fill={theme.curtain} />
        <path className="curtain-right" d="M1026 60h94c-20 134-12 282 28 446h-144c48-172 54-318 22-446Z" fill={theme.curtain} />

        <g transform="translate(82 286)">
          <rect fill={theme.shelfGlass} height="354" rx="12" stroke={theme.furniture} strokeOpacity="0.1" strokeWidth="4" width="230" />
          <path d="M28 86h174M28 178h174M28 270h174" stroke="#b8d2df" strokeLinecap="round" strokeWidth="6" />
          <rect fill="#ffd580" height="62" rx="4" width="22" x="44" y="22" />
          <rect fill={theme.accent} height="54" rx="4" width="24" x="84" y="30" />
          <rect fill="#17a389" height="76" rx="4" width="24" x="128" y="8" />
          <rect fill={theme.furniture} height="62" rx="4" width="32" x="166" y="22" />
          <rect fill="#99e3be" height="74" rx="4" width="25" x="48" y="104" />
          <rect fill="#ffe49b" height="48" rx="4" width="29" x="96" y="130" />
          <rect fill={theme.furniture} height="68" rx="4" width="24" x="156" y="110" />
          <rect fill="#ffe3a4" height="78" rx="4" width="27" x="50" y="192" />
          <rect fill={theme.accent} height="56" opacity="0.72" rx="4" width="30" x="104" y="214" />
          <rect fill={theme.furniture} height="72" rx="4" width="24" x="168" y="198" />
          <rect fill="#edf6ff" height="40" rx="8" width="72" x="128" y="296" />
          <path d="M142 316h44" stroke="#8096a3" strokeLinecap="round" strokeWidth="5" />
        </g>

        <g transform="translate(246 644)">
          <rect fill={theme.wood} height="62" rx="10" width="492" x="0" y="116" />
          <rect fill="#ffffff" height="78" rx="12" width="456" x="18" y="58" />
          <rect fill={theme.blanket} height="92" opacity="0.92" rx="12" width="326" x="148" y="72" />
          <rect fill={theme.pillow} height="48" rx="10" width="116" x="42" y="70" />
          <path d="M36 178v64M456 178v64" stroke={theme.wood} strokeLinecap="round" strokeOpacity="0.48" strokeWidth="11" />
        </g>

        <g transform="translate(844 472)">
          <rect fill={theme.wood} height="48" rx="8" width="402" y="248" />
          <path d="M42 248V92M356 248V92" stroke={theme.wood} strokeLinecap="round" strokeWidth="12" />
          <rect fill="#ffffff" height="126" rx="12" stroke={theme.furniture} strokeOpacity="0.08" strokeWidth="4" width="206" x="54" y="46" />
          <rect className="screen-glow" fill={theme.accent} height="88" opacity="0.56" rx="7" width="166" x="74" y="66" />
          <path d="M104 104h92M104 130h54" stroke="#fff8d6" strokeLinecap="round" strokeOpacity="0.92" strokeWidth="6" />
          <rect fill={theme.furniture} height="14" rx="5" width="88" x="112" y="172" />
          <path d="M300 248l42-144 44 144" fill="none" stroke={theme.wood} strokeLinecap="round" strokeOpacity="0.78" strokeWidth="9" />
          <path d="M286 110h116l-24-56h-68z" fill="#ffd580" />
          <ellipse className="lamp-glow" cx="344" cy="174" fill="url(#lampGlow)" rx="246" ry="174" />
        </g>

        <g transform="translate(1062 664)">
          <path d="M46 72h132c20 0 36 16 36 36v34H22v-44c0-14 10-26 24-26Z" fill={theme.furniture} />
          <path d="M68 72V22c0-12 9-22 22-22h76c13 0 22 10 22 22v50" fill="none" stroke="#ffd580" strokeOpacity="0.8" strokeWidth="10" />
          <rect fill={theme.accent} height="36" opacity="0.38" rx="7" width="168" x="34" y="106" />
          <path d="M56 142l-26 86M178 142l28 86" stroke="#ffd580" strokeLinecap="round" strokeOpacity="0.72" strokeWidth="8" />
        </g>

        <g transform="translate(170 700)">
          <rect fill={theme.furniture} height="126" rx="8" width="112" x="26" y="84" />
          <path className="plant-leaf" d="M82 88C38 58 38 20 76 0c14 34 15 64 6 88Z" fill="#1d9b83" opacity="0.76" />
          <path className="plant-leaf" d="M84 90c43-28 52-68 18-90-18 32-24 64-18 90Z" fill="#ffd580" opacity="0.68" />
          <path className="plant-leaf" d="M84 96C32 104 4 78 4 38c38 8 64 28 80 58Z" fill={theme.furniture} />
          <path className="plant-leaf" d="M84 96c54 4 82-24 78-66-38 12-64 34-78 66Z" fill="#2fae99" />
        </g>

        <g transform="translate(520 238)">
          <rect fill="#ffffff" height="122" rx="14" stroke={theme.furniture} strokeOpacity="0.1" strokeWidth="4" width="160" />
          <circle cx="48" cy="42" fill="#ffd580" r="20" />
          <path d="M30 92c36-42 72-42 108 0" fill="none" stroke="#7c5ea8" strokeLinecap="round" strokeWidth="10" />
          <path d="M104 40h30M104 64h22" stroke={theme.accent} strokeLinecap="round" strokeWidth="7" />
        </g>

        <path d="M0 802c196-34 386-28 570 18 244 62 482 58 714-18 56-18 108-30 156-35v133H0z" fill={theme.furniture} opacity="0.12" />
      </svg>

      <svg
        aria-hidden="true"
        className="room-mobile"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 430 932"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="mobileWallGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={theme.wallTop} />
            <stop offset="100%" stopColor={theme.wallBottom} />
          </linearGradient>
          <linearGradient id="mobileSkyGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={theme.skyTop} />
            <stop offset="58%" stopColor={theme.skyMid} />
            <stop offset="100%" stopColor={theme.skyBottom} />
          </linearGradient>
          <radialGradient cx="50%" cy="50%" id="mobileLampGlow" r="50%">
            <stop offset="0%" stopColor="#ffd580" stopOpacity="0.68" />
            <stop offset="55%" stopColor="#ffd580" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#ffd580" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect fill="url(#mobileWallGradient)" height="932" width="430" />
        <path d="M0 595h430v337H0z" fill={theme.floor} />
        <path d="M0 595h430" stroke="#7aa4b9" strokeOpacity="0.46" strokeWidth="4" />
        <path d="M0 595h430l-58 337H58z" fill="#f7fbff" opacity="0.68" />
        <path d="M50 932l64-337M164 932l26-337M270 932l-18-337M382 932l-68-337" stroke="#d5e4ef" strokeWidth="4" />
        <path d="M0 710h430M0 820h430" stroke="#d5e4ef" strokeWidth="4" />

        <g transform="translate(38 118)">
          <rect fill="#ffffff" height="248" rx="12" stroke={theme.furniture} strokeOpacity="0.16" strokeWidth="4" width="354" />
          <rect fill="url(#mobileSkyGradient)" height="210" rx="8" width="322" x="16" y="18" />
          <circle cx="270" cy="66" fill="#fff4a8" r="32" />
          <path d="M177 18v210M16 126h322" stroke="#fff8ef" strokeWidth="7" />
          <path d="M34 198c46-42 92-50 134-24 38 24 78 20 126-18 26 24 42 48 50 72H16c4-12 10-22 18-30Z" fill="#6e9ead" opacity="0.55" />
          <circle className="sparkle" cx="56" cy="60" fill="#ffffff" r="3" />
          <circle className="sparkle" cx="118" cy="94" fill="#fff4a8" r="3" />
          <circle className="sparkle" cx="230" cy="84" fill="#ffffff" r="3" />
        </g>

        <path className="curtain-left" d="M18 96h68c-22 92-18 198 16 322H0c28-118 34-224 18-322Z" fill={theme.curtain} />
        <path className="curtain-right" d="M344 96h68c-16 98-10 204 18 322H328c34-124 38-230 16-322Z" fill={theme.curtain} />

        <g transform="translate(20 414)">
          <rect fill={theme.shelfGlass} height="162" rx="10" stroke={theme.furniture} strokeOpacity="0.1" strokeWidth="3" width="96" />
          <path d="M14 48h68M14 96h68" stroke="#b8d2df" strokeLinecap="round" strokeWidth="4" />
          <rect fill={theme.accent} height="34" rx="3" width="12" x="26" y="12" />
          <rect fill="#17a389" height="42" rx="3" width="12" x="44" y="4" />
          <rect fill={theme.furniture} height="34" rx="3" width="16" x="62" y="12" />
          <rect fill="#ffd580" height="40" rx="3" width="13" x="24" y="54" />
          <rect fill={theme.accent} height="34" opacity="0.72" rx="3" width="14" x="50" y="60" />
          <rect fill={theme.furniture} height="42" rx="3" width="14" x="68" y="52" />
        </g>

        <g transform="translate(46 672)">
          <rect fill={theme.wood} height="42" rx="8" width="224" x="0" y="82" />
          <rect fill="#ffffff" height="54" rx="10" width="206" x="10" y="38" />
          <rect fill={theme.blanket} height="70" opacity="0.92" rx="10" width="146" x="70" y="52" />
          <rect fill={theme.pillow} height="36" rx="8" width="58" x="22" y="48" />
        </g>

        <g transform="translate(230 468)">
          <rect fill={theme.wood} height="36" rx="7" width="168" y="174" />
          <path d="M22 174V70M146 174V70" stroke={theme.wood} strokeLinecap="round" strokeWidth="9" />
          <rect fill="#ffffff" height="92" rx="10" stroke={theme.furniture} strokeOpacity="0.08" strokeWidth="3" width="118" x="20" y="30" />
          <rect className="screen-glow" fill={theme.accent} height="62" opacity="0.56" rx="6" width="92" x="33" y="44" />
          <path d="M50 72h54M50 90h34" stroke="#fff8d6" strokeLinecap="round" strokeOpacity="0.9" strokeWidth="4" />
          <path d="M128 174l18-92 20 92" fill="none" stroke={theme.wood} strokeLinecap="round" strokeOpacity="0.78" strokeWidth="7" />
          <path d="M116 86h58l-14-34h-30z" fill="#ffd580" />
          <ellipse className="lamp-glow" cx="146" cy="126" fill="url(#mobileLampGlow)" rx="116" ry="90" />
        </g>

        <g transform="translate(318 686)">
          <path d="M20 40h68c12 0 22 10 22 22v24H8V52c0-7 5-12 12-12Z" fill={theme.furniture} />
          <path d="M34 40V14c0-7 5-12 12-12h34c7 0 12 5 12 12v26" fill="none" stroke="#ffd580" strokeOpacity="0.8" strokeWidth="7" />
          <rect fill={theme.accent} height="22" opacity="0.38" rx="5" width="84" x="18" y="64" />
        </g>

        <path d="M0 826c92-16 178-12 258 12 76 22 134 24 172 10v84H0z" fill={theme.furniture} opacity="0.12" />
      </svg>
    </section>
  )
}
