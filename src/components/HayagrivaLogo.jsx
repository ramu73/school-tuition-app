import React from 'react';

export default function HayagrivaLogo({ 
  size = 42, 
  showText = false, 
  showGlow = false, 
  lightMode = false, 
  variant = 'icon', // 'icon' or 'full'
  className = '' 
}) {
  const glowFilter = showGlow 
    ? '0 0 16px rgba(255, 255, 255, 0.45), 0 2px 8px rgba(0, 0, 0, 0.25)' 
    : '0 2px 6px rgba(0, 0, 0, 0.15)';

  if (variant === 'full') {
    return (
      <div className={`hayagriva-logo-container ${className}`} style={{ display: 'inline-flex', alignItems: 'center' }}>
        <img 
          src="/hayagriva-logo.png" 
          alt="Hayagriva Tutorials" 
          style={{ 
            height: `${size}px`, 
            width: 'auto', 
            maxWidth: '100%', 
            objectFit: 'contain',
            background: '#FFFFFF',
            borderRadius: '12px',
            padding: '6px 12px',
            boxShadow: glowFilter,
            transition: 'all 0.25s ease'
          }} 
        />
      </div>
    );
  }

  return (
    <div 
      className={`hayagriva-logo-container ${className}`} 
      style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}
    >
      <div
        className="hayagriva-emblem-badge"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          minWidth: `${size}px`,
          borderRadius: '50%',
          background: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: `${Math.max(2, Math.round(size * 0.05))}px`,
          boxShadow: glowFilter,
          border: '1.5px solid rgba(255, 255, 255, 0.95)',
          overflow: 'hidden',
          flexShrink: 0,
          transition: 'all 0.25s ease'
        }}
      >
        <img 
          src="/hayagriva-emblem.png" 
          alt="Hayagriva Tutorials Emblem" 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'contain',
            display: 'block'
          }} 
        />
      </div>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
          <div style={{ 
            fontFamily: "'Times New Roman', serif, Outfit", 
            fontSize: '1.25rem', 
            fontWeight: 800, 
            letterSpacing: '0.04em',
            color: lightMode ? '#0D224A' : '#FFFFFF'
          }}>
            HAYAGRIVA
          </div>
          <div style={{ 
            fontFamily: 'Outfit, sans-serif', 
            fontSize: '0.78rem', 
            fontWeight: 700, 
            letterSpacing: '0.22em',
            color: '#16A34A'
          }}>
            — TUTORIALS —
          </div>
          <div style={{ 
            fontSize: '0.62rem', 
            fontWeight: 600, 
            letterSpacing: '0.15em', 
            color: lightMode ? '#475569' : '#94A3B8',
            marginTop: '2px'
          }}>
            LEARN • GROW • SUCCEED
          </div>
        </div>
      )}
    </div>
  );
}
