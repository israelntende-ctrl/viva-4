import React, { useState } from 'react';
import vivaBadgeImg from '../assets/viva_badge.png';

interface VivaBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'hero';
  className?: string;
  watermark?: boolean;
  opacity?: number;
  useImageOnly?: boolean;
}

export const VivaBadge: React.FC<VivaBadgeProps> = ({
  size = 'md',
  className = '',
  watermark = false,
  opacity,
  useImageOnly = false,
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeMap = {
    xs: { width: 32, height: 42 },
    sm: { width: 48, height: 62 },
    md: { width: 72, height: 94 },
    lg: { width: 108, height: 140 },
    xl: { width: 150, height: 195 },
    '2xl': { width: 210, height: 275 },
    hero: { width: 280, height: 365 },
  };

  const { width, height } = sizeMap[size] || sizeMap.md;

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{
        width,
        height,
        opacity: watermark ? opacity ?? 0.08 : opacity ?? 1,
      }}
    >
      {/* Official High-Resolution VIVA School Crest Badge */}
      {!imageError && (
        <img
          src={vivaBadgeImg || '/viva_badge.png'}
          alt="Victory College VIVA Crest"
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain drop-shadow-sm pointer-events-none"
          onError={() => setImageError(true)}
          style={{ display: imageError ? 'none' : 'block' }}
        />
      )}

      {/* High-Fidelity Vector SVG Fallback with exact torch, crimson shield, VIVA ribbon, and motto */}
      {(imageError || !useImageOnly) && (
        <svg
          viewBox="0 0 200 260"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`w-full h-full drop-shadow-sm ${!imageError ? 'hidden' : 'block'}`}
        >
          <defs>
            {/* Flame Gradients */}
            <linearGradient id="flameOuter" x1="100" y1="2" x2="100" y2="78" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFF176" />
              <stop offset="35%" stopColor="#FBC02D" />
              <stop offset="70%" stopColor="#F57C00" />
              <stop offset="100%" stopColor="#D84315" />
            </linearGradient>
            <linearGradient id="flameInner" x1="100" y1="20" x2="100" y2="70" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="40%" stopColor="#FFF59D" />
              <stop offset="100%" stopColor="#FFB300" />
            </linearGradient>

            {/* Torch Bowl Gradient */}
            <linearGradient id="torchBowl" x1="75" y1="72" x2="125" y2="72" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#CFD8DC" />
              <stop offset="50%" stopColor="#ECEFF1" />
              <stop offset="100%" stopColor="#90A4AE" />
            </linearGradient>

            {/* Shield Deep Crimson / Maroon Gradients */}
            <linearGradient id="shieldBg" x1="100" y1="58" x2="100" y2="246" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#871727" />
              <stop offset="50%" stopColor="#751120" />
              <stop offset="100%" stopColor="#560A15" />
            </linearGradient>

            {/* Gold Trim Gradient */}
            <linearGradient id="goldTrim" x1="20" y1="55" x2="180" y2="245" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F6D365" />
              <stop offset="30%" stopColor="#D4AF37" />
              <stop offset="70%" stopColor="#AA771C" />
              <stop offset="100%" stopColor="#855806" />
            </linearGradient>

            {/* Ribbon Gradients */}
            <linearGradient id="ribbonBlack" x1="10" y1="105" x2="190" y2="105" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1E1E1E" />
              <stop offset="15%" stopColor="#141414" />
              <stop offset="50%" stopColor="#2A2A2A" />
              <stop offset="85%" stopColor="#141414" />
              <stop offset="100%" stopColor="#1E1E1E" />
            </linearGradient>

            {/* Bottom White Banner */}
            <linearGradient id="bottomRibbon" x1="25" y1="210" x2="175" y2="210" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#E0E0E0" />
              <stop offset="20%" stopColor="#FFFFFF" />
              <stop offset="80%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#E0E0E0" />
            </linearGradient>
          </defs>

          {/* 1. FLAME TORCH AT TOP */}
          <g id="torchFlame">
            <path
              d="M100 4C108 18 126 36 126 56C126 70 115 76 100 76C85 76 74 70 74 56C74 42 85 24 95 14C94 22 98 28 102 30C104 22 101 12 100 4Z"
              fill="url(#flameOuter)"
            />
            <path
              d="M80 38C76 46 75 54 78 62C80 56 84 50 88 46C86 42 83 40 80 38Z"
              fill="#FFA000"
            />
            <path
              d="M120 38C124 46 125 54 122 62C120 56 116 50 112 46C114 42 117 40 120 38Z"
              fill="#FFB300"
            />
            <path
              d="M100 24C104 33 114 44 114 58C114 68 107 72 100 72C93 72 86 68 86 58C86 48 93 34 100 24Z"
              fill="url(#flameInner)"
            />
            <path
              d="M82 72C82 72 90 77 100 77C110 77 118 72 118 72L115 79C115 79 108 81 100 81C92 81 85 79 85 79L82 72Z"
              fill="url(#torchBowl)"
              stroke="#546E7A"
              strokeWidth="0.75"
            />
            <path
              d="M93 79L91 85H109L107 79H93Z"
              fill="#78909C"
            />
          </g>

          {/* 2. MAIN HERALDIC SHIELD */}
          <g id="mainShield">
            <path
              d="M100 58C132 58 174 65 174 65V152C174 200 134 232 100 245C66 232 26 200 26 152V65C26 65 68 58 100 58Z"
              fill="url(#goldTrim)"
            />
            <path
              d="M100 62C130 62 170 69 170 69V152C170 197 132 227 100 240C68 227 30 197 30 152V69C30 69 70 62 100 62Z"
              fill="#F4F2EB"
            />
            <path
              d="M100 65C128 65 166 71 166 71V151C166 193 130 223 100 235C70 223 34 193 34 151V71C34 71 72 65 100 65Z"
              fill="#231F20"
            />
            <path
              d="M100 67C126 67 163 73 163 73V150C163 190 128 220 100 231C72 220 37 190 37 150V73C37 73 74 67 100 67Z"
              fill="url(#shieldBg)"
            />
            <path
              d="M100 67C126 67 163 73 163 73V130C125 120 75 140 37 150V73C37 73 74 67 100 67Z"
              fill="#FFFFFF"
              fillOpacity="0.07"
            />
          </g>

          {/* 3. INNER MINI EMBLEM / SHIELD IN LOWER CREST */}
          <g id="innerCrest">
            <path
              d="M100 168C112 168 122 173 122 185C122 201 109 211 100 216C91 211 78 201 78 185C78 173 88 168 100 168Z"
              fill="#560A15"
              stroke="#D4AF37"
              strokeWidth="2.5"
            />
            <path
              d="M100 174C105 174 114 178 114 187C114 197 106 204 100 209C94 204 86 197 86 187C86 178 95 174 100 174Z"
              fill="#F6D365"
              fillOpacity="0.25"
            />
            {/* Center Ring / Crest Monogram */}
            <circle cx="100" cy="188" r="7" stroke="#F6D365" strokeWidth="2" fill="none" />
            <path d="M100 184V192" stroke="#F6D365" strokeWidth="1.5" />
          </g>

          {/* 4. BLACK HORIZONTAL BANNER WITH "VIVA" */}
          <g id="vivaBanner">
            <path
              d="M6 108L24 98V146L6 136L14 122L6 108Z"
              fill="#1E1E1E"
              stroke="#D4AF37"
              strokeWidth="0.8"
            />
            <path
              d="M194 108L176 98V146L194 136L186 122L194 108Z"
              fill="#1E1E1E"
              stroke="#D4AF37"
              strokeWidth="0.8"
            />
            <rect
              x="20"
              y="98"
              width="160"
              height="48"
              rx="2"
              fill="url(#ribbonBlack)"
              stroke="#F4F2EB"
              strokeWidth="1.5"
            />
            <rect
              x="23"
              y="101"
              width="154"
              height="42"
              rx="1"
              fill="none"
              stroke="#D4AF37"
              strokeWidth="0.75"
            />
            <text
              x="100"
              y="130"
              textAnchor="middle"
              fontFamily="'Playfair Display', 'Newsreader', Georgia, serif"
              fontWeight="900"
              fontSize="30"
              letterSpacing="3"
              fill="#FFFFFF"
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
            >
              VIVA
            </text>
            <text
              x="100"
              y="140"
              textAnchor="middle"
              fontFamily="'Plus Jakarta Sans', -apple-system, sans-serif"
              fontWeight="800"
              fontSize="5.5"
              letterSpacing="1.8"
              fill="#F6D365"
            >
              VOICE OF EDUCATION
            </text>
          </g>

          {/* 5. BOTTOM WHITE CURVED SCROLL / MOTTO RIBBON */}
          <g id="bottomMotto">
            <path
              d="M32 216C54 235 146 235 168 216C158 226 138 238 100 240C62 238 42 226 32 216Z"
              fill="#0F0F0F"
            />
            <path
              d="M34 213C55 233 145 233 166 213C161 224 140 234 100 236C60 234 39 224 34 213Z"
              fill="url(#bottomRibbon)"
              stroke="#1A1A1A"
              strokeWidth="0.8"
            />
            <text
              x="100"
              y="227"
              textAnchor="middle"
              fontFamily="'Plus Jakarta Sans', sans-serif"
              fontWeight="800"
              fontSize="5.2"
              letterSpacing="0.8"
              fill="#6B0F1D"
            >
              DISCITE • JUSTITIAM • MONITI
            </text>
          </g>
        </svg>
      )}
    </div>
  );
};

export default VivaBadge;

