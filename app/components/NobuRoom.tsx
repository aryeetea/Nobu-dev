'use client'

import { useState } from 'react'
import type { NobuRoomAction } from './NobuCharacter'

type Props = {
  character: 'female' | 'male'
  onRoomAction?: (action: NobuRoomAction) => void
}

type RoomArea = 'bed' | 'desk' | 'chair' | 'window' | 'lights'

const roomImages = {
  female: '/rooms/nobu-room-Alexia.png',
  male: '/rooms/nobu-room-Asuka.png',
}

const roomThemes = {
  female: {
    wall: '#f8eef4',
    wallShade: '#eadce8',
    trim: '#ffffff',
    skyTop: '#91c7e6',
    skyBottom: '#ffd8e4',
    mountain: '#9eb9b4',
    accent: '#d85b8f',
    accentSoft: '#f4aac7',
    dark: '#25323a',
    wood: '#8b6f48',
    woodLight: '#d9ba7c',
    blanket: '#20252d',
    rug: '#f5c1d6',
    plant: '#16473f',
    lamp: '#ffd782',
  },
  male: {
    wall: '#eef7fb',
    wallShade: '#d9edf6',
    trim: '#ffffff',
    skyTop: '#83c8ef',
    skyBottom: '#d6fff1',
    mountain: '#8fb7be',
    accent: '#3b82c4',
    accentSoft: '#a9d8ff',
    dark: '#263b48',
    wood: '#846d4d',
    woodLight: '#d3b37a',
    blanket: '#273d4d',
    rug: '#bfe2f5',
    plant: '#174d43',
    lamp: '#ffe08d',
  },
}

export default function NobuRoom({ character, onRoomAction }: Props) {
  const theme = roomThemes[character]
  const roomImage = roomImages[character]
  const [activeArea, setActiveArea] = useState<RoomArea | null>(null)

  function activateArea(area: RoomArea) {
    setActiveArea((current) => {
      const nextArea = current === area ? null : area
      onRoomAction?.(nextArea ?? 'center')
      return nextArea
    })
  }

  return (
    <section
      aria-label="Anime studio apartment"
      className={[
        'nobu-room',
        'photo-room',
        activeArea ? `room-active-${activeArea}` : '',
      ].join(' ')}
    >
      <style>{`
        .nobu-room {
          background: ${theme.wall};
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

        .photo-room-art {
          display: none;
        }

        .nobu-room.photo-room {
          background: #f2dfd8;
        }

        .nobu-room.photo-room .room-desktop,
        .nobu-room.photo-room .room-mobile {
          display: none;
        }

        .nobu-room.photo-room .photo-room-art {
          display: block;
          height: 100%;
          inset: 0;
          object-fit: cover;
          object-position: center center;
          position: absolute;
          width: 100%;
          z-index: 0;
        }

        .room-atmosphere {
          background:
            radial-gradient(circle at 48% 38%, rgba(255,255,255,0.16), transparent 30%),
            linear-gradient(180deg, rgba(255,246,231,0.08), rgba(71,42,47,0.08));
          inset: 0;
          opacity: 0.72;
          pointer-events: none;
          position: absolute;
          transition: opacity 0.28s ease, background 0.28s ease;
          z-index: 1;
        }

        .room-active-window .room-atmosphere {
          background:
            radial-gradient(circle at 58% 18%, rgba(255,255,255,0.34), transparent 28%),
            linear-gradient(180deg, rgba(170,219,255,0.16), rgba(255,246,231,0.04));
          opacity: 0.9;
        }

        .room-active-lights .room-atmosphere {
          background:
            radial-gradient(circle at 14% 8%, rgba(255,215,130,0.36), transparent 28%),
            radial-gradient(circle at 52% 8%, rgba(255,215,130,0.24), transparent 24%),
            linear-gradient(180deg, rgba(255,231,190,0.2), rgba(93,55,52,0.08));
          opacity: 1;
        }

        .room-active-bed .room-atmosphere {
          background:
            radial-gradient(ellipse at 22% 66%, rgba(255,215,226,0.36), transparent 28%),
            linear-gradient(180deg, rgba(255,246,231,0.08), rgba(71,42,47,0.08));
          opacity: 0.95;
        }

        .room-active-desk .room-atmosphere {
          background:
            radial-gradient(ellipse at 56% 56%, rgba(255,235,180,0.28), transparent 26%),
            linear-gradient(180deg, rgba(255,246,231,0.08), rgba(71,42,47,0.08));
          opacity: 0.95;
        }

        .room-active-chair .room-atmosphere {
          background:
            radial-gradient(ellipse at 42% 64%, rgba(255,219,230,0.3), transparent 22%),
            linear-gradient(180deg, rgba(255,246,231,0.08), rgba(71,42,47,0.08));
          opacity: 0.94;
        }

        .room-hotspots {
          inset: 0;
          pointer-events: none;
          position: absolute;
          z-index: 30;
        }

        .room-hotspot {
          appearance: none;
          background: transparent;
          border: 0;
          border-radius: 8px;
          cursor: pointer;
          opacity: 0;
          pointer-events: auto;
          position: absolute;
          touch-action: manipulation;
        }

        .room-hotspot:focus-visible {
          box-shadow: 0 0 0 3px rgba(255, 215, 130, 0.76);
          opacity: 1;
          outline: none;
        }

        .hotspot-bed { bottom: 14%; height: 28%; left: 4%; width: 35%; }
        .hotspot-desk { bottom: 22%; height: 30%; left: 43%; width: 28%; }
        .hotspot-chair { bottom: 16%; height: 30%; left: 34%; width: 14%; }
        .hotspot-window { height: 44%; left: 40%; top: 8%; width: 36%; }
        .hotspot-lights { height: 14%; left: 0; top: 0; width: 54%; }

        .room-mobile {
          display: none;
        }

        .sun {
          animation: room-sun 7s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: center;
        }

        .curtain {
          animation: room-curtain 8s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: top center;
        }

        .lamp-glow {
          animation: room-glow 5.5s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: center;
        }

        .plant-leaf {
          animation: room-leaf 6s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: bottom center;
        }

        .sparkle {
          animation: room-sparkle 4.8s ease-in-out infinite;
        }

        .fairy-light {
          animation: room-light-twinkle 3.8s ease-in-out infinite;
        }

        .sparkle:nth-of-type(2n) {
          animation-delay: 1.2s;
        }

        .fairy-light:nth-of-type(2n) {
          animation-delay: 0.8s;
        }

        .fairy-light:nth-of-type(3n) {
          animation-delay: 1.6s;
        }

        @keyframes room-sun {
          0%, 100% { opacity: 0.82; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.04); }
        }

        @keyframes room-curtain {
          0%, 100% { transform: skewX(0deg); }
          50% { transform: skewX(1.5deg); }
        }

        @keyframes room-glow {
          0%, 100% { opacity: 0.2; transform: scale(0.98); }
          50% { opacity: 0.44; transform: scale(1.05); }
        }

        @keyframes room-leaf {
          0%, 100% { transform: rotate(-1deg); }
          50% { transform: rotate(2deg); }
        }

        @keyframes room-sparkle {
          0%, 100% { opacity: 0.28; }
          50% { opacity: 0.8; }
        }

        @keyframes room-light-twinkle {
          0%, 100% { opacity: 0.42; }
          50% { opacity: 1; }
        }

        @media (max-width: 760px) {
          .room-desktop {
            display: none;
          }

          .room-mobile {
            display: block;
          }

          .nobu-room.photo-room .photo-room-art {
            object-position: center center;
          }

          .hotspot-bed { bottom: 15%; height: 26%; left: 0; width: 48%; }
          .hotspot-desk { bottom: 32%; height: 24%; left: 38%; width: 38%; }
          .hotspot-chair { bottom: 24%; height: 26%; left: 30%; width: 22%; }
          .hotspot-window { height: 34%; left: 36%; top: 10%; width: 46%; }
          .hotspot-lights { height: 12%; left: 0; top: 0; width: 72%; }
        }
      `}</style>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        aria-hidden="true"
        className="photo-room-art"
        decoding="async"
        draggable={false}
        fetchPriority="high"
        src={roomImage}
      />
      <div aria-hidden="true" className="room-atmosphere" />
      <div className="room-hotspots">
        <button
          aria-label="Focus the bed area"
          aria-pressed={activeArea === 'bed'}
          className="room-hotspot hotspot-bed"
          onClick={() => activateArea('bed')}
          type="button"
        />
        <button
          aria-label="Focus the desk area"
          aria-pressed={activeArea === 'desk'}
          className="room-hotspot hotspot-desk"
          onClick={() => activateArea('desk')}
          type="button"
        />
        <button
          aria-label="Focus the chair area"
          aria-pressed={activeArea === 'chair'}
          className="room-hotspot hotspot-chair"
          onClick={() => activateArea('chair')}
          type="button"
        />
        <button
          aria-label="Focus the window area"
          aria-pressed={activeArea === 'window'}
          className="room-hotspot hotspot-window"
          onClick={() => activateArea('window')}
          type="button"
        />
        <button
          aria-label="Toggle room lights"
          aria-pressed={activeArea === 'lights'}
          className="room-hotspot hotspot-lights"
          onClick={() => activateArea('lights')}
          type="button"
        />
      </div>

      <svg
        aria-hidden="true"
        className="room-desktop"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1440 900"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="desktopWall" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={theme.wall} />
            <stop offset="100%" stopColor={theme.wallShade} />
          </linearGradient>
          <linearGradient id="desktopSky" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={theme.skyTop} />
            <stop offset="100%" stopColor={theme.skyBottom} />
          </linearGradient>
          <radialGradient id="desktopLampGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={theme.lamp} stopOpacity="0.8" />
            <stop offset="62%" stopColor={theme.lamp} stopOpacity="0.22" />
            <stop offset="100%" stopColor={theme.lamp} stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect fill="url(#desktopWall)" height="900" width="1440" />
        <rect fill="#f8f2e8" height="254" width="1440" y="646" />
        <path d="M0 646h1440" stroke="#d8cdbb" strokeWidth="5" />
        <path d="M0 646h1440l-176 254H176z" fill="#fffaf0" opacity="0.64" />
        <path d="M130 900l150-254M394 900l86-254M654 900l24-254M916 900l-46-254M1184 900l-110-254" stroke="#ddd0bd" strokeWidth="5" />
        <path d="M0 750h1440M0 836h1440" stroke="#ddd0bd" strokeWidth="5" />

        <path d="M0 0h1440L1242 86H198z" fill="#ead5c7" opacity="0.48" />
        <path d="M198 86h1044M198 86L0 0M1242 86l198-86" stroke="#8a6b5c" strokeOpacity="0.36" strokeWidth="4" />
        <g transform="translate(618 22)">
          <ellipse cx="102" cy="36" fill="#fff7ec" rx="54" ry="18" stroke="#8a6b5c" strokeOpacity="0.28" strokeWidth="3" />
          <path d="M102 36L20 18M102 36l86-22M102 36l0-34" stroke="#8a6b5c" strokeOpacity="0.4" strokeLinecap="round" strokeWidth="5" />
          <path d="M18 18c48 16 92 16 136 0" fill="none" stroke={theme.wood} strokeLinecap="round" strokeOpacity="0.62" strokeWidth="10" />
          <path d="M186 14c-42 18-84 20-126 4" fill="none" stroke={theme.wood} strokeLinecap="round" strokeOpacity="0.62" strokeWidth="10" />
        </g>

        <path d="M22 68c118 28 236 20 354-24 82-30 166-26 252 12" fill="none" stroke={theme.wood} strokeOpacity="0.58" strokeWidth="3" />
        <circle className="fairy-light" cx="26" cy="70" fill={theme.lamp} r="5" />
        <circle className="fairy-light" cx="86" cy="78" fill={theme.lamp} r="5" />
        <circle className="fairy-light" cx="148" cy="76" fill={theme.lamp} r="5" />
        <circle className="fairy-light" cx="214" cy="62" fill={theme.lamp} r="5" />
        <circle className="fairy-light" cx="282" cy="44" fill={theme.lamp} r="5" />
        <circle className="fairy-light" cx="354" cy="42" fill={theme.lamp} r="5" />
        <circle className="fairy-light" cx="430" cy="48" fill={theme.lamp} r="5" />
        <circle className="fairy-light" cx="548" cy="52" fill={theme.lamp} r="5" />

        <g transform="translate(42 134)">
          <path d="M0 58h210" stroke={theme.wood} strokeLinecap="round" strokeWidth="12" />
          <path d="M18 58l-16 44M194 58l18 44" stroke={theme.wood} strokeLinecap="round" strokeWidth="5" />
          <rect fill="#fff9f1" height="62" rx="5" stroke="#8a6b5c" strokeOpacity="0.28" strokeWidth="3" width="54" x="28" y="-8" />
          <rect fill={theme.accentSoft} height="70" rx="6" stroke="#8a6b5c" strokeOpacity="0.28" strokeWidth="3" width="48" x="94" y="-18" />
          <rect fill={theme.dark} height="58" rx="5" stroke="#8a6b5c" strokeOpacity="0.28" strokeWidth="3" width="42" x="154" y="-6" />
          <circle cx="54" cy="26" fill={theme.accent} r="9" />
          <path d="M40 44c18-22 36-22 54 0" fill="none" stroke={theme.dark} strokeLinecap="round" strokeWidth="4" />
          <path d="M110 8h14M110 26h20M166 18h18M166 36h14" stroke="#fff7ec" strokeLinecap="round" strokeWidth="4" />
        </g>

        <g transform="translate(340 132)">
          <path d="M0 64h216" stroke={theme.wood} strokeLinecap="round" strokeWidth="11" />
          <path d="M18 64l-14 38M198 64l16 38" stroke={theme.wood} strokeLinecap="round" strokeWidth="5" />
          <rect fill="#fff9f1" height="50" rx="4" width="30" x="28" y="10" />
          <rect fill={theme.accentSoft} height="62" rx="4" width="32" x="66" y="-2" />
          <rect fill={theme.dark} height="54" rx="4" width="34" x="106" y="6" />
          <rect fill="#e0c496" height="46" rx="4" width="28" x="150" y="14" />
          <path d="M48 26h92" stroke="#8a6b5c" strokeOpacity="0.24" strokeWidth="2" />
          <path className="plant-leaf" d="M188 58c-16-26-8-46 18-58 6 24 0 42-18 58Z" fill={theme.plant} />
          <path className="plant-leaf" d="M188 58c22-20 42-22 58-6-18 15-38 17-58 6Z" fill="#4b9b73" />
        </g>

        <g transform="translate(52 250)">
          <rect fill="#fff7ef" height="142" rx="6" stroke="#8a6b5c" strokeOpacity="0.26" strokeWidth="3" width="86" />
          <rect fill="#d7ebf7" height="142" rx="6" stroke="#8a6b5c" strokeOpacity="0.26" strokeWidth="3" width="86" x="104" y="-16" />
          <rect fill={theme.accentSoft} height="88" rx="5" stroke="#8a6b5c" strokeOpacity="0.24" strokeWidth="3" width="70" x="202" y="34" />
          <path d="M20 108c18-26 38-32 62-18" fill="none" stroke={theme.accent} strokeLinecap="round" strokeWidth="5" />
          <circle cx="44" cy="48" fill={theme.dark} opacity="0.82" r="18" />
          <circle cx="148" cy="40" fill={theme.lamp} r="18" />
          <path d="M128 110c24-34 48-34 72 0" fill="none" stroke={theme.dark} strokeLinecap="round" strokeWidth="6" />
          <path d="M218 72h40M218 94h28" stroke="#fff7ec" strokeLinecap="round" strokeWidth="5" />
        </g>

        <g transform="translate(418 86)">
          <rect fill={theme.trim} height="360" rx="22" stroke="#cdbfb7" strokeOpacity="0.32" strokeWidth="6" width="604" />
          <rect fill="url(#desktopSky)" height="306" rx="16" width="546" x="29" y="27" />
          <circle className="sun" cx="448" cy="98" fill="#fff0a6" r="46" />
          <path d="M302 27v306M29 192h546" stroke="#fff7ec" strokeWidth="9" />
          <path d="M38 284c82-78 164-90 246-36 70 46 136 34 214-42 42 38 68 78 80 127H29c2-18 5-34 9-49Z" fill={theme.mountain} opacity="0.62" />
          <circle className="sparkle" cx="96" cy="84" fill="#fff7d6" r="5" />
          <circle className="sparkle" cx="192" cy="122" fill="#ffffff" r="4" />
          <circle className="sparkle" cx="362" cy="80" fill="#ffffff" r="4" />
        </g>

        <path className="curtain" d="M374 58h82c-24 122-20 258 14 410H336c36-154 48-292 38-410Z" fill={theme.accentSoft} />
        <path className="curtain" d="M984 58h82c-10 118 2 256 38 410H970c34-152 38-288 14-410Z" fill={theme.accentSoft} />

        <g transform="translate(90 278)">
          <rect fill="#fffdfa" height="364" rx="20" stroke="#dccfc4" strokeOpacity="0.46" strokeWidth="4" width="246" />
          <path d="M32 92h182M32 188h182M32 282h182" stroke="#d8cdbb" strokeLinecap="round" strokeWidth="7" />
          <rect fill={theme.lamp} height="72" rx="5" width="24" x="48" y="18" />
          <rect fill={theme.accent} height="54" rx="5" width="26" x="92" y="36" />
          <rect fill="#0f8a78" height="80" rx="5" width="28" x="138" y="10" />
          <rect fill={theme.dark} height="62" rx="5" width="34" x="178" y="28" />
          <rect fill="#a4dab8" height="78" rx="5" width="28" x="50" y="108" />
          <rect fill="#ffe2a2" height="56" rx="5" width="31" x="98" y="130" />
          <rect fill={theme.dark} height="74" rx="5" width="27" x="162" y="112" />
          <rect fill="#ffe8b0" height="82" rx="5" width="30" x="50" y="198" />
          <rect fill={theme.accent} height="58" opacity="0.82" rx="5" width="34" x="104" y="222" />
          <rect fill={theme.dark} height="76" rx="5" width="28" x="170" y="204" />
          <rect fill="#f3eee7" height="42" rx="9" width="78" x="132" y="306" />
          <path d="M148 326h44" stroke={theme.wood} strokeLinecap="round" strokeWidth="6" />
        </g>

        <g transform="translate(222 624)">
          <ellipse cx="286" cy="194" fill={theme.rug} opacity="0.54" rx="294" ry="58" />
          <rect fill={theme.wood} height="68" rx="13" width="548" x="0" y="128" />
          <rect fill="#fffefa" height="88" rx="16" width="508" x="20" y="70" />
          <rect fill={theme.blanket} height="98" opacity="0.95" rx="15" width="356" x="172" y="86" />
          <rect fill={theme.lamp} height="52" rx="13" width="132" x="42" y="84" />
          <path d="M48 196v72M508 196v72" stroke={theme.wood} strokeLinecap="round" strokeOpacity="0.52" strokeWidth="12" />
        </g>

        <g transform="translate(874 490)">
          <rect fill={theme.wood} height="54" rx="10" width="412" y="242" />
          <path d="M46 242V84M360 242V84" stroke={theme.wood} strokeLinecap="round" strokeWidth="13" />
          <rect fill="#fffdfa" height="132" rx="16" stroke="#d8cdbb" strokeOpacity="0.5" strokeWidth="4" width="208" x="50" y="36" />
          <rect fill="#cfe6ef" height="84" rx="8" width="166" x="70" y="58" />
          <path d="M96 100h94M96 124h56" stroke={theme.accent} strokeLinecap="round" strokeWidth="7" />
          <rect fill={theme.dark} height="15" rx="5" width="90" x="110" y="168" />
          <path d="M308 242l44-144 44 144" fill="none" stroke={theme.woodLight} strokeLinecap="round" strokeWidth="10" />
          <path d="M294 106h116l-24-56h-68z" fill={theme.lamp} />
          <ellipse className="lamp-glow" cx="352" cy="170" fill="url(#desktopLampGlow)" rx="250" ry="180" />
          <rect fill={theme.accentSoft} height="28" opacity="0.72" rx="6" width="86" x="266" y="210" />
          <rect fill="#fff7ec" height="14" rx="4" width="62" x="278" y="218" />
          <path d="M164 22h28M200 20h18M232 24h26" stroke={theme.wood} strokeLinecap="round" strokeWidth="6" />
          <circle cx="282" cy="30" fill="#67a876" r="12" />
          <path d="M282 18c-10-20 0-36 22-44 4 20-4 34-22 44Z" fill="#4b9b73" />
        </g>

        <g transform="translate(1182 120)">
          <path d="M0 58h226" stroke={theme.wood} strokeLinecap="round" strokeWidth="12" />
          <path d="M20 58l-18 48M206 58l18 48" stroke={theme.wood} strokeLinecap="round" strokeWidth="5" />
          <rect fill="#fff7ec" height="46" rx="6" stroke="#8a6b5c" strokeOpacity="0.24" strokeWidth="3" width="36" x="18" y="8" />
          <rect fill="#fff7ec" height="56" rx="7" stroke="#8a6b5c" strokeOpacity="0.24" strokeWidth="3" width="42" x="64" y="-2" />
          <rect fill="#d5c1a6" height="50" rx="6" stroke="#8a6b5c" strokeOpacity="0.24" strokeWidth="3" width="36" x="116" y="4" />
          <rect fill="#fff7ec" height="60" rx="7" stroke="#8a6b5c" strokeOpacity="0.24" strokeWidth="3" width="42" x="166" y="-6" />
          <path d="M24 30h24M72 22h26M122 28h24M174 20h28" stroke={theme.wood} strokeOpacity="0.55" strokeLinecap="round" strokeWidth="3" />
        </g>

        <g transform="translate(1198 238)">
          <rect fill="#fffdfa" height="350" rx="16" stroke="#dccfc4" strokeOpacity="0.46" strokeWidth="4" width="214" />
          <path d="M0 128h214" stroke={theme.wood} strokeWidth="7" />
          <rect fill="#e8d6c7" height="90" rx="12" width="178" x="18" y="28" />
          <ellipse cx="68" cy="74" fill="none" rx="26" ry="18" stroke={theme.wood} strokeWidth="5" />
          <ellipse cx="116" cy="74" fill="none" rx="26" ry="18" stroke={theme.wood} strokeWidth="5" />
          <path d="M44 176h120M44 212h96M44 248h132" stroke={theme.wood} strokeLinecap="round" strokeWidth="7" />
          <path d="M170 164c20 26 18 54-8 84" fill="none" stroke={theme.dark} strokeLinecap="round" strokeWidth="6" />
          <rect fill={theme.lamp} height="74" opacity="0.8" rx="8" width="42" x="122" y="264" />
          <rect fill={theme.dark} height="58" rx="8" width="46" x="22" y="280" />
        </g>

        <g transform="translate(1058 646)">
          <path d="M48 78h144c21 0 38 17 38 38v40H22v-50c0-16 11-28 26-28Z" fill={theme.dark} />
          <path d="M72 78V26c0-13 10-24 24-24h82c14 0 24 11 24 24v52" fill="none" stroke={theme.lamp} strokeOpacity="0.82" strokeWidth="10" />
          <rect fill={theme.accent} height="38" opacity="0.34" rx="8" width="178" x="38" y="118" />
          <path d="M60 156l-28 92M190 156l30 92" stroke={theme.lamp} strokeLinecap="round" strokeOpacity="0.75" strokeWidth="8" />
        </g>

        <g transform="translate(184 706)">
          <rect fill={theme.dark} height="138" rx="12" width="118" x="30" y="88" />
          <path className="plant-leaf" d="M90 92C44 60 42 18 82 0c14 34 17 66 8 92Z" fill="#5d9f98" />
          <path className="plant-leaf" d="M92 94c46-30 56-72 18-94-18 34-24 66-18 94Z" fill={theme.lamp} opacity="0.8" />
          <path className="plant-leaf" d="M92 102C36 112 6 82 8 40c40 9 68 30 84 62Z" fill={theme.plant} />
          <path className="plant-leaf" d="M92 102c58 4 88-26 84-70-42 13-70 36-84 70Z" fill="#2b8a76" />
        </g>
      </svg>

      <svg
        aria-hidden="true"
        className="room-mobile"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 430 932"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="mobileWall" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={theme.wall} />
            <stop offset="100%" stopColor={theme.wallShade} />
          </linearGradient>
          <linearGradient id="mobileSky" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={theme.skyTop} />
            <stop offset="100%" stopColor={theme.skyBottom} />
          </linearGradient>
          <radialGradient id="mobileLampGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={theme.lamp} stopOpacity="0.78" />
            <stop offset="62%" stopColor={theme.lamp} stopOpacity="0.2" />
            <stop offset="100%" stopColor={theme.lamp} stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect fill="url(#mobileWall)" height="932" width="430" />
        <rect fill="#f8f2e8" height="312" width="430" y="620" />
        <path d="M0 620h430" stroke="#d8cdbb" strokeWidth="4" />
        <path d="M0 620h430l-62 312H62z" fill="#fffaf0" opacity="0.66" />
        <path d="M48 932l62-312M162 932l26-312M270 932l-16-312M382 932l-70-312" stroke="#ddd0bd" strokeWidth="4" />
        <path d="M0 734h430M0 838h430" stroke="#ddd0bd" strokeWidth="4" />

        <g transform="translate(42 126)">
          <rect fill={theme.trim} height="242" rx="18" stroke="#cdbfb7" strokeOpacity="0.34" strokeWidth="4" width="346" />
          <rect fill="url(#mobileSky)" height="204" rx="14" width="310" x="18" y="18" />
          <circle className="sun" cx="262" cy="66" fill="#fff0a6" r="34" />
          <path d="M173 18v204M18 128h310" stroke="#fff7ec" strokeWidth="7" />
          <path d="M30 196c48-46 96-54 144-24 40 26 82 18 132-30 24 25 34 50 38 80H18c2-10 6-18 12-26Z" fill={theme.mountain} opacity="0.62" />
          <circle className="sparkle" cx="62" cy="64" fill="#fff7d6" r="4" />
          <circle className="sparkle" cx="124" cy="94" fill="#ffffff" r="3" />
          <circle className="sparkle" cx="224" cy="76" fill="#ffffff" r="3" />
        </g>

        <path d="M12 78c74 20 148 14 222-18 42-18 90-14 144 10" fill="none" stroke={theme.wood} strokeOpacity="0.52" strokeWidth="2.5" />
        <circle className="fairy-light" cx="16" cy="80" fill={theme.lamp} r="4" />
        <circle className="fairy-light" cx="58" cy="86" fill={theme.lamp} r="4" />
        <circle className="fairy-light" cx="104" cy="78" fill={theme.lamp} r="4" />
        <circle className="fairy-light" cx="154" cy="62" fill={theme.lamp} r="4" />
        <circle className="fairy-light" cx="206" cy="58" fill={theme.lamp} r="4" />
        <circle className="fairy-light" cx="274" cy="62" fill={theme.lamp} r="4" />

        <g transform="translate(18 250)">
          <rect fill="#fff7ef" height="82" rx="5" stroke="#8a6b5c" strokeOpacity="0.24" strokeWidth="2" width="48" />
          <rect fill="#d7ebf7" height="86" rx="5" stroke="#8a6b5c" strokeOpacity="0.24" strokeWidth="2" width="52" x="58" y="-8" />
          <rect fill={theme.accentSoft} height="54" rx="5" stroke="#8a6b5c" strokeOpacity="0.24" strokeWidth="2" width="42" x="120" y="22" />
          <circle cx="24" cy="30" fill={theme.dark} opacity="0.82" r="10" />
          <circle cx="82" cy="26" fill={theme.lamp} r="10" />
          <path d="M72 62c14-16 28-16 42 0" fill="none" stroke={theme.dark} strokeLinecap="round" strokeWidth="4" />
          <path d="M130 44h22M130 58h14" stroke="#fff7ec" strokeLinecap="round" strokeWidth="3" />
        </g>

        <path className="curtain" d="M20 98h64c-20 92-16 198 16 318H0c27-118 33-224 20-318Z" fill={theme.accentSoft} />
        <path className="curtain" d="M346 98h64c-13 94-7 200 20 318H330c32-120 36-226 16-318Z" fill={theme.accentSoft} />

        <g transform="translate(20 426)">
          <rect fill="#fffdfa" height="168" rx="14" stroke="#dccfc4" strokeOpacity="0.48" strokeWidth="3" width="104" />
          <path d="M16 52h72M16 100h72" stroke="#d8cdbb" strokeLinecap="round" strokeWidth="4" />
          <rect fill={theme.accent} height="36" rx="3" width="13" x="28" y="14" />
          <rect fill="#0f8a78" height="44" rx="3" width="13" x="48" y="6" />
          <rect fill={theme.dark} height="36" rx="3" width="16" x="68" y="14" />
          <rect fill={theme.lamp} height="42" rx="3" width="13" x="26" y="56" />
          <rect fill={theme.accent} height="34" opacity="0.82" rx="3" width="15" x="52" y="64" />
          <rect fill={theme.dark} height="42" rx="3" width="14" x="72" y="56" />
        </g>

        <g transform="translate(52 672)">
          <ellipse cx="130" cy="154" fill={theme.rug} opacity="0.54" rx="164" ry="42" />
          <rect fill={theme.wood} height="44" rx="10" width="230" x="0" y="82" />
          <rect fill="#fffefa" height="58" rx="12" width="212" x="9" y="42" />
          <rect fill={theme.blanket} height="72" opacity="0.95" rx="10" width="150" x="71" y="54" />
          <rect fill={theme.lamp} height="36" rx="8" width="62" x="22" y="52" />
        </g>

        <g transform="translate(238 472)">
          <rect fill={theme.wood} height="38" rx="8" width="164" y="168" />
          <path d="M24 168V68M140 168V68" stroke={theme.wood} strokeLinecap="round" strokeWidth="9" />
          <rect fill="#fffdfa" height="90" rx="12" stroke="#d8cdbb" strokeOpacity="0.5" strokeWidth="3" width="112" x="22" y="28" />
          <rect fill="#cfe6ef" height="58" rx="6" width="86" x="35" y="44" />
          <path d="M51 72h50M51 88h32" stroke={theme.accent} strokeLinecap="round" strokeWidth="4" />
          <path d="M122 168l20-88 20 88" fill="none" stroke={theme.woodLight} strokeLinecap="round" strokeWidth="7" />
          <path d="M112 84h58l-14-34h-30z" fill={theme.lamp} />
          <ellipse className="lamp-glow" cx="142" cy="124" fill="url(#mobileLampGlow)" rx="116" ry="92" />
        </g>

        <g transform="translate(316 686)">
          <path d="M20 42h72c12 0 22 10 22 22v26H8V54c0-7 5-12 12-12Z" fill={theme.dark} />
          <path d="M34 42V14c0-7 5-12 12-12h38c7 0 12 5 12 12v28" fill="none" stroke={theme.lamp} strokeOpacity="0.82" strokeWidth="7" />
          <rect fill={theme.accent} height="22" opacity="0.34" rx="5" width="86" x="18" y="68" />
        </g>

        <g transform="translate(20 742)">
          <rect fill={theme.dark} height="116" rx="10" width="82" x="22" y="74" />
          <path className="plant-leaf" d="M64 78C32 54 30 18 60 0c10 30 13 56 4 78Z" fill="#5d9f98" />
          <path className="plant-leaf" d="M66 80c34-24 42-58 14-78-14 28-19 54-14 78Z" fill={theme.lamp} opacity="0.8" />
          <path className="plant-leaf" d="M66 88C24 94 4 70 6 38c30 7 50 24 60 50Z" fill={theme.plant} />
          <path className="plant-leaf" d="M66 88c42 4 64-20 62-54-30 10-52 28-62 54Z" fill="#2b8a76" />
        </g>
      </svg>
    </section>
  )
}
