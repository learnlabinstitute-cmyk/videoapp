import React from 'react';

interface StudioLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showGlow?: boolean;
}

export function StudioLogo({ className = '', size = 'md', showGlow = true }: StudioLogoProps) {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const dim = sizeMap[size] || sizeMap.md;

  return (
    <div className={`relative flex items-center justify-center flex-shrink-0 ${className}`}>
      {showGlow && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-amber-400/30 via-rose-500/30 to-indigo-500/30 blur-md pointer-events-none transform scale-110" />
      )}

      {/* Modern High-End App Icon */}
      <div
        className={`${dim} relative rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-[1.5px] shadow-lg shadow-indigo-950/20 overflow-hidden flex items-center justify-center border border-white/20`}
      >
        {/* Iridescent background shine */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-rose-500/20 to-amber-400/20" />

        {/* Vector SVG Emblem: Celestial 3D Studio Prism */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full p-1.5 relative z-10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gold Sunburst Gradient */}
            <linearGradient id="goldSun" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>

            {/* Prism Iris Gradient */}
            <linearGradient id="prismIris" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EC4899" />
              <stop offset="50%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>

            {/* Metallic Ring */}
            <radialGradient id="ringGlow" cx="50%" cy="50%" r="50%">
              <stop offset="70%" stopColor="#FCD34D" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.2" />
            </radialGradient>
          </defs>

          {/* Outer Astrological Ring with tick marks */}
          <circle
            cx="50"
            cy="50"
            r="44"
            stroke="url(#goldSun)"
            strokeWidth="1.5"
            strokeDasharray="2 3"
            opacity="0.85"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="#6366F1"
            strokeWidth="0.8"
            opacity="0.6"
          />

          {/* 12 Celestial Zodiac Hour Rays */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <g key={deg} transform={`rotate(${deg} 50 50)`}>
              <line
                x1="50"
                y1="8"
                x2="50"
                y2="14"
                stroke="url(#goldSun)"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <circle cx="50" cy="17" r="1.2" fill="#FDE047" />
            </g>
          ))}

          {/* 3D Motion Camera Aperture / Celestial Diamond Core */}
          <polygon
            points="50,22 74,36 74,64 50,78 26,64 26,36"
            stroke="url(#prismIris)"
            strokeWidth="2"
            fill="rgba(15, 23, 42, 0.75)"
          />

          {/* Radiant Sun Face / Video Play Core */}
          <circle cx="50" cy="50" r="16" fill="url(#goldSun)" />

          {/* Central 3D Aperture Diamond */}
          <polygon
            points="50,39 61,50 50,61 39,50"
            fill="#0F172A"
          />

          {/* Central Play / Star Prism */}
          <polygon
            points="46,43 57,50 46,57"
            fill="#FFFFFF"
          />

          {/* Sparkling Micro Starlets */}
          <circle cx="32" cy="30" r="1.5" fill="#38BDF8" className="animate-pulse" />
          <circle cx="68" cy="30" r="1.5" fill="#F472B6" className="animate-pulse" />
          <circle cx="50" cy="71" r="1.2" fill="#FDE047" />
        </svg>
      </div>
    </div>
  );
}
