'use client'

import type { CSSProperties } from 'react'
import type { NobuRoomAction } from './NobuCharacter'

type Props = {
  activeAction: NobuRoomAction
  character: 'female' | 'male'
  onActionChange: (action: NobuRoomAction) => void
}

const characterDetails = {
  female: {
    accent: '#db2777',
    secondary: '#ffd580',
    curtain: '#ffb3c7',
    label: 'Alexia',
  },
  male: {
    accent: '#2563eb',
    secondary: '#95d5b2',
    curtain: '#b7d7ee',
    label: 'Asuka',
  },
}

const roomActions: Array<{
  id: NobuRoomAction
  label: string
  style: CSSProperties
}> = [
  { id: 'center', label: 'Center', style: { left: '49%', top: '50%' } },
  { id: 'shelf', label: 'Library', style: { left: '17%', top: '54%' } },
  { id: 'desk', label: 'Desk', style: { left: '70%', top: '62%' } },
  { id: 'chair', label: 'Chair', style: { left: '77%', top: '73%' } },
  { id: 'bed', label: 'Rest', style: { left: '33%', top: '76%' } },
]

export default function NobuRoom({ activeAction, character, onActionChange }: Props) {
  const theme = characterDetails[character]

  return (
    <section aria-label={`${theme.label} comfort room`} className={`nobu-room ${character}`}>
      <style>{`
        .nobu-room {
          background: #eaf1ec;
          inset: 0;
          overflow: hidden;
          position: absolute;
          z-index: 0;
        }

        .nobu-room svg {
          display: block;
          height: 100%;
          pointer-events: none;
          width: 100%;
        }

        .room-hotspots {
          inset: 0;
          pointer-events: none;
          position: absolute;
          z-index: 4;
        }

        .room-hotspot {
          align-items: center;
          background: rgba(255,255,255,0.7);
          border: 1px solid rgba(21,45,43,0.16);
          border-radius: 999px;
          color: rgba(21,45,43,0.72);
          cursor: pointer;
          display: flex;
          font-size: 11px;
          font-weight: 800;
          gap: 6px;
          letter-spacing: 0;
          min-height: 30px;
          padding: 7px 10px;
          pointer-events: auto;
          position: absolute;
          transform: translate(-50%, -50%);
          transition: border-color 180ms ease, color 180ms ease, background 180ms ease;
          white-space: nowrap;
        }

        .room-hotspot::before {
          background: ${theme.secondary};
          border-radius: 999px;
          box-shadow: 0 0 12px rgba(255,213,128,0.46);
          content: "";
          height: 6px;
          width: 6px;
        }

        .room-hotspot.active {
          background: rgba(255,255,255,0.92);
          border-color: ${theme.accent};
          color: #152d2b;
        }

        .light-speck { animation: light-speck 4.8s ease-in-out infinite; }
        .light-speck:nth-of-type(2n) { animation-delay: 1.1s; }
        .light-speck:nth-of-type(3n) { animation-delay: 2.1s; }
        .lamp-light { animation: lamp-pulse 5.5s ease-in-out infinite; transform-origin: 1072px 598px; }
        .curtain-left { animation: curtain-left 7s ease-in-out infinite; transform-origin: 412px 144px; }
        .curtain-right { animation: curtain-right 7s ease-in-out infinite; transform-origin: 1018px 144px; }
        .screen-glow { animation: screen-breathe 6s ease-in-out infinite; }
        .plant-leaf { animation: plant-sway 6.5s ease-in-out infinite; transform-origin: 244px 693px; }
        .focus-glow { opacity: 0; transition: opacity 240ms ease; }
        .room-svg.bed-active .bed-glow,
        .room-svg.chair-active .chair-glow,
        .room-svg.desk-active .desk-glow,
        .room-svg.shelf-active .shelf-glow,
        .room-svg.center-active .center-glow { opacity: 0.45; }

        @keyframes light-speck { 0%, 100% { opacity: 0.34; } 50% { opacity: 0.82; } }
        @keyframes lamp-pulse { 0%, 100% { opacity: 0.18; transform: scale(0.98); } 50% { opacity: 0.38; transform: scale(1.03); } }
        @keyframes curtain-left { 0%, 100% { transform: skewY(0deg); } 50% { transform: skewY(1.4deg); } }
        @keyframes curtain-right { 0%, 100% { transform: skewY(0deg); } 50% { transform: skewY(-1.3deg); } }
        @keyframes screen-breathe { 0%, 100% { opacity: 0.48; } 50% { opacity: 0.78; } }
        @keyframes plant-sway { 0%, 100% { transform: rotate(-1deg); } 50% { transform: rotate(2deg); } }

        @media (max-width: 760px) {
          .room-hotspot {
            font-size: 10px;
            min-height: 28px;
            padding: 6px 8px;
          }

          .room-hotspot:nth-child(2) { left: 20% !important; top: 62% !important; }
          .room-hotspot:nth-child(3) { left: 72% !important; top: 64% !important; }
          .room-hotspot:nth-child(4) { left: 78% !important; top: 73% !important; }
          .room-hotspot:nth-child(5) { left: 34% !important; top: 76% !important; }
        }
      `}</style>

      <svg
        className={`room-svg ${activeAction}-active`}
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1440 900"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="roomSky" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#a7d8e8" />
            <stop offset="100%" stopColor="#ffdcb6" />
          </linearGradient>
          <radialGradient cx="50%" cy="50%" id="accentGlow" r="50%">
            <stop offset="0%" stopColor={theme.accent} stopOpacity="0.45" />
            <stop offset="100%" stopColor={theme.accent} stopOpacity="0" />
          </radialGradient>
          <radialGradient cx="50%" cy="50%" id="lampGlow" r="50%">
            <stop offset="0%" stopColor="#ffd580" stopOpacity="0.72" />
            <stop offset="54%" stopColor="#ffd580" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#ffd580" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect fill="#eaf1ec" height="900" width="1440" />
        <rect fill="#dbe8e1" height="610" width="1440" />
        <path d="M0 610h1440v290H0z" fill="#f7f2ea" />
        <path d="M0 610h1440" stroke="#8fb3a8" strokeOpacity="0.6" strokeWidth="5" />
        <path d="M0 610h1440l-210 290H210z" fill="#eee6d7" opacity="0.74" />
        <path d="M172 900l170-290M432 900l90-290M682 900l22-290M930 900l-46-290M1192 900l-118-290" stroke="#d5c8b6" strokeWidth="4" />
        <path d="M0 738h1440M0 820h1440" stroke="#d5c8b6" strokeWidth="4" />

        <g transform="translate(384 82)">
          <rect fill="#ffffff" height="376" rx="10" width="672" />
          <rect fill="#8fb3a8" height="376" opacity="0.18" rx="10" width="672" />
          <rect fill="url(#roomSky)" height="326" rx="6" width="620" x="26" y="25" />
          <rect className="focus-glow center-glow" fill="url(#accentGlow)" height="326" opacity="0.16" rx="6" width="620" x="26" y="25" />
          <path d="M336 25v326M26 188h620" stroke="#f7f2ea" strokeWidth="8" />
          <path d="M78 284c84-82 164-99 238-50 66 45 134 36 222-32 48 45 82 94 104 149H26c8-26 25-48 52-67Z" fill="#7aa59b" opacity="0.5" />
          <circle className="light-speck" cx="92" cy="80" fill="#fff7d6" r="4" />
          <circle className="light-speck" cx="178" cy="136" fill="#ffffff" r="3" />
          <circle className="light-speck" cx="268" cy="72" fill="#fff7d6" r="3" />
          <circle className="light-speck" cx="402" cy="112" fill="#ffd580" r="4" />
          <circle className="light-speck" cx="514" cy="68" fill="#ffffff" r="3" />
          <path d="M504 88c42-4 76 14 98 52-44-11-86-7-126 12 27-14 37-34 28-64Z" fill="#ffffff" opacity="0.62" />
        </g>

        <path className="curtain-left" d="M352 76h82c-28 116-22 252 24 414H332c34-152 40-290 20-414Z" fill={theme.curtain} />
        <path className="curtain-right" d="M1006 76h82c-20 124-14 262 20 414H982c46-162 52-298 24-414Z" fill={theme.curtain} />

        <g transform="translate(78 232)">
          <ellipse className="focus-glow shelf-glow" cx="122" cy="188" fill="url(#accentGlow)" rx="210" ry="210" />
          <rect fill="#ffffff" height="382" rx="8" width="254" />
          <rect fill="#8fb3a8" height="382" opacity="0.16" rx="8" width="254" />
          <path d="M28 86h198M28 184h198M28 282h198" stroke="#8fb3a8" strokeOpacity="0.38" strokeWidth="5" />
          <rect fill="#ffd580" height="62" rx="3" width="20" x="42" y="22" />
          <rect fill={theme.accent} height="46" rx="3" width="18" x="78" y="38" />
          <rect fill="#0f766e" height="68" rx="3" width="22" x="112" y="16" />
          <rect fill="#203a36" height="52" rx="3" width="28" x="152" y="32" />
          <rect fill="#95d5b2" height="76" opacity="0.8" rx="3" width="20" x="52" y="108" />
          <rect fill="#ffd580" height="52" opacity="0.8" rx="3" width="24" x="96" y="132" />
          <rect fill="#31524a" height="68" rx="3" width="18" x="146" y="116" />
          <rect fill="#ffd580" height="78" opacity="0.58" rx="3" width="20" x="56" y="204" />
          <rect fill={theme.accent} height="56" opacity="0.66" rx="3" width="24" x="96" y="226" />
          <rect fill="#31524a" height="70" rx="3" width="18" x="154" y="212" />
          <rect fill="#f7f2ea" height="44" rx="8" width="74" x="136" y="314" />
          <path d="M150 336h46" stroke="#8b6f47" strokeLinecap="round" strokeOpacity="0.7" strokeWidth="5" />
        </g>

        <g transform="translate(872 490)">
          <ellipse className="focus-glow desk-glow" cx="184" cy="160" fill="url(#accentGlow)" rx="280" ry="190" />
          <rect fill="#8b6f47" height="46" rx="8" width="374" y="210" />
          <rect fill="#ffffff" height="122" rx="8" width="164" x="36" y="68" />
          <rect className="screen-glow" fill={theme.accent} height="86" opacity="0.52" rx="5" width="132" x="52" y="84" />
          <path d="M76 120h78M76 144h48" stroke="#fff7d6" strokeLinecap="round" strokeOpacity="0.9" strokeWidth="5" />
          <rect fill="#152d2b" height="12" rx="4" width="78" x="80" y="190" />
          <path d="M270 210l38-132 42 132" fill="none" stroke="#8b6f47" strokeOpacity="0.76" strokeWidth="8" />
          <path d="M254 82h112l-22-50h-68z" fill="#ffd580" />
          <ellipse className="lamp-light" cx="310" cy="146" fill="url(#lampGlow)" rx="238" ry="178" />
        </g>

        <g transform="translate(306 662)">
          <ellipse className="focus-glow bed-glow" cx="210" cy="92" fill="url(#accentGlow)" rx="290" ry="150" />
          <rect fill="#ffffff" height="60" rx="8" width="420" x="0" y="112" />
          <rect fill="#d5e7e0" height="76" rx="8" width="392" x="14" y="58" />
          <rect fill={theme.accent} height="86" opacity="0.3" rx="8" width="280" x="126" y="72" />
          <rect fill="#ffd580" height="44" opacity="0.64" rx="8" width="104" x="28" y="66" />
          <path d="M40 172v42M380 172v42" stroke="#8fb3a8" strokeOpacity="0.5" strokeWidth="10" />
        </g>

        <g transform="translate(930 646)">
          <ellipse className="focus-glow chair-glow" cx="118" cy="90" fill="url(#accentGlow)" rx="150" ry="110" />
          <path d="M46 68h118c18 0 32 14 32 32v32H22v-40c0-13 11-24 24-24Z" fill="#244741" />
          <path d="M60 68V18c0-11 9-20 20-20h70c11 0 20 9 20 20v50" fill="none" stroke={theme.secondary} strokeOpacity="0.72" strokeWidth="10" />
          <path d="M52 132l-24 74M168 132l24 74" stroke={theme.secondary} strokeLinecap="round" strokeOpacity="0.62" strokeWidth="8" />
          <rect fill={theme.accent} height="34" opacity="0.34" rx="6" width="154" x="32" y="96" />
        </g>

        <g transform="translate(1110 220)">
          <rect fill="#284b3b" height="152" rx="8" width="190" />
          <path d="M26 42h106M26 78h74M26 114h124" stroke="#f7f2d8" strokeLinecap="round" strokeOpacity="0.84" strokeWidth="7" />
          <rect fill="#f7f2d8" height="9" rx="5" width="70" x="92" y="130" />
        </g>

        <g transform="translate(1088 408)">
          <rect fill="#ffffff" height="184" rx="8" width="204" />
          <rect fill="#d8e2e8" height="118" rx="6" width="164" x="20" y="24" />
          <path d="M44 72h88M44 98h54M126 54h32M126 82h36" stroke="#2f6f88" strokeLinecap="round" strokeWidth="7" />
          <path d="M42 162h120" stroke="#9fb2bd" strokeLinecap="round" strokeWidth="9" />
        </g>

        <g transform="translate(194 474)">
          <path d="M24 0v200M218 0v200M24 32h194" stroke="#8b6f47" strokeLinecap="round" strokeWidth="9" />
          <path d="M70 40l-32 118h78L100 40z" fill={theme.accent} opacity="0.52" />
          <path d="M146 40l-36 130h88L172 40z" fill="#ffffff" />
        </g>

        <g transform="translate(542 678)">
          <rect fill="#12805f" height="34" rx="17" width="250" />
          <rect fill="#95d5b2" height="16" rx="8" width="198" x="26" y="9" />
          <circle cx="292" cy="17" fill="#12805f" r="24" />
          <circle cx="376" cy="17" fill="#12805f" r="24" />
          <path d="M292 17h84" stroke="#203a36" strokeLinecap="round" strokeWidth="10" />
        </g>

        <g transform="translate(496 260)">
          <rect fill="#ffffff" height="124" rx="8" width="164" />
          <circle cx="46" cy="42" fill="#ffd580" r="20" />
          <path d="M28 92c34-42 68-42 102 0" fill="none" stroke="#7c5ea8" strokeLinecap="round" strokeWidth="10" />
          <path d="M100 38h34M100 64h22" stroke={theme.accent} strokeLinecap="round" strokeWidth="7" />
        </g>

        <g transform="translate(174 688)">
          <rect fill="#203a36" height="116" rx="6" width="104" x="24" y="84" />
          <path className="plant-leaf" d="M76 88C36 60 36 22 70 0c13 32 14 60 6 88Z" fill="#0f766e" opacity="0.68" />
          <path className="plant-leaf" d="M78 90c39-27 47-65 17-90-16 31-21 60-17 90Z" fill="#ffd580" opacity="0.58" />
          <path className="plant-leaf" d="M78 94C32 100 5 77 4 38c34 8 58 26 74 56Z" fill="#23443f" />
          <path className="plant-leaf" d="M78 94c50 3 76-22 72-62-34 11-58 32-72 62Z" fill="#31524a" />
        </g>

        <path d="M0 800c210-38 402-32 576 18 240 69 468 62 678-18 64-25 126-40 186-46v146H0z" fill="#152d2b" opacity="0.16" />
      </svg>

      <div aria-label="Room spots" className="room-hotspots">
        {roomActions.map((action) => (
          <button
            className={`room-hotspot ${activeAction === action.id ? 'active' : ''}`}
            key={action.id}
            onClick={() => onActionChange(action.id)}
            style={action.style}
            type="button"
          >
            {action.label}
          </button>
        ))}
      </div>
    </section>
  )
}
