import React from 'react';

export default function HayagrivaLogo({ 
  size = 42, 
  showText = false, 
  showGlow = false, 
  lightMode = false, 
  className = '' 
}) {
  // Colors for dark theme (vibrant, luminous) vs light mode (for printed receipts)
  const colors = lightMode ? {
    star: '#F5A623',
    leafBranch: '#1E8238',
    leaf: '#1E8238',
    cap: '#0D224A',
    capStroke: '#0D224A',
    student: '#0D224A',
    book: '#0D224A',
    bookBase: '#1E8238',
    tassel: '#F5A623'
  } : {
    star: '#FBBF24',
    leafBranch: '#10B981',
    leaf: '#22C55E',
    cap: 'url(#hayagrivaBlueGrad)',
    capStroke: '#93C5FD',
    student: 'url(#hayagrivaStudentGrad)',
    book: 'url(#hayagrivaBookGrad)',
    bookBase: '#34D399',
    tassel: '#FBBF24'
  };

  const glowFilter = showGlow 
    ? 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.55)) drop-shadow(0 0 3px rgba(251, 191, 36, 0.4))' 
    : undefined;

  return (
    <div 
      className={`hayagriva-logo-container ${className}`} 
      style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}
    >
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, filter: glowFilter, transition: 'all 0.2s ease' }}
      >
        <defs>
          <linearGradient id="hayagrivaStudentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#93C5FD" />
            <stop offset="50%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>

          <linearGradient id="hayagrivaBookGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="60%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>

          <linearGradient id="hayagrivaBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#1E40AF" />
          </linearGradient>
        </defs>

        {/* Golden Star at Top with Radiant Fill */}
        <path 
          d="M58 8 L60.5 14 L67 14.8 L62 19 L63.5 25.5 L58 22 L52.5 25.5 L54 19 L49 14.8 L55.5 14 Z" 
          fill={colors.star} 
          stroke={!lightMode ? '#FEF08A' : undefined}
          strokeWidth={!lightMode ? '0.8' : undefined}
        />

        {/* Circular Growth Branch & Green Leaves */}
        <path 
          d="M26 40 C22 28, 34 16, 46 14 C44 18, 41 24, 43 28 C45 23, 49 19, 52 17 C50 22, 49 28, 51 32" 
          stroke={colors.leafBranch} 
          strokeWidth="3.5" 
          strokeLinecap="round" 
        />
        {/* Leaves */}
        <path d="M28 28 C23 26, 21 21, 25 17 C29 19, 29 24, 28 28 Z" fill={colors.leaf} />
        <path d="M34 22 C30 18, 31 13, 36 11 C38 15, 37 19, 34 22 Z" fill={colors.leaf} />
        <path d="M22 38 C17 37, 16 32, 20 28 C24 30, 23 35, 22 38 Z" fill={colors.leaf} />
        <path d="M24 48 C18 48, 17 43, 21 39 C25 41, 25 46, 24 48 Z" fill={colors.leaf} />

        {/* Graduation Cap / Mortarboard */}
        <path d="M57 24 L69 28 L57 32 L45 28 Z" fill={colors.cap} stroke={colors.capStroke} strokeWidth="1" />
        <path d="M57 32 L57 36 C57 37, 61 38, 63 37 L63 33" stroke={colors.capStroke} strokeWidth="1.5" />
        <circle cx="57" cy="27" r="1.5" fill={colors.tassel} />
        <path d="M68 28.5 L68 34" stroke={colors.tassel} strokeWidth="1.2" strokeLinecap="round" />

        {/* Student Victorious / Reaching Figure */}
        <path 
          d="M48 40 C52 36, 62 36, 66 40 C63 48, 61 58, 57 66 C53 58, 51 48, 48 40 Z" 
          fill={colors.student} 
        />
        <path 
          d="M44 48 C41 42, 38 38, 34 46 C37 54, 45 62, 51 68 C49 61, 47 54, 44 48 Z" 
          fill={colors.student} 
        />
        <path 
          d="M70 48 C73 42, 76 38, 80 46 C77 54, 69 62, 63 68 C65 61, 67 54, 70 48 Z" 
          fill={colors.student} 
        />

        {/* Open Book Base */}
        {/* Left Page */}
        <path 
          d="M57 74 C43 72, 27 75, 18 84 C28 83, 45 80, 57 84 Z" 
          fill={colors.book} 
          stroke={!lightMode ? '#60A5FA' : undefined}
          strokeWidth={!lightMode ? '0.8' : undefined}
        />
        {/* Right Page */}
        <path 
          d="M57 74 C71 72, 87 75, 96 84 C86 83, 69 80, 57 84 Z" 
          fill={colors.book} 
          stroke={!lightMode ? '#60A5FA' : undefined}
          strokeWidth={!lightMode ? '0.8' : undefined}
        />
        {/* Green Underlying Arc / Page Foundation */}
        <path 
          d="M18 87 C32 83, 46 82, 57 86 C68 82, 82 83, 96 87 C84 89, 69 88, 57 91 C45 88, 30 89, 18 87 Z" 
          fill={colors.bookBase} 
        />
      </svg>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
          <div style={{ 
            fontFamily: 'Outfit, sans-serif', 
            fontSize: '1.25rem', 
            fontWeight: 800, 
            letterSpacing: '0.04em',
            color: 'var(--text-primary)'
          }}>
            HAYAGRIVA
          </div>
          <div style={{ 
            fontFamily: 'Outfit, sans-serif', 
            fontSize: '0.78rem', 
            fontWeight: 700, 
            letterSpacing: '0.22em',
            color: '#22C55E'
          }}>
            — TUTORIALS —
          </div>
          <div style={{ 
            fontSize: '0.62rem', 
            fontWeight: 600, 
            letterSpacing: '0.15em', 
            color: 'var(--text-secondary)',
            marginTop: '2px'
          }}>
            LEARN • GROW • SUCCEED
          </div>
        </div>
      )}
    </div>
  );
}
