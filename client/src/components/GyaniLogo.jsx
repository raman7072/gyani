import React from 'react';

export function GyaniLogo({ size = 32, showSubtext = true, onClick }) {
  return (
    <div 
      style={{ display: 'flex', alignItems: 'center', gap: '11px', cursor: onClick ? 'pointer' : 'default', userSelect: 'none' }}
      onClick={onClick}
    >
      {/* Tactile Ink Stamp Mark */}
      <div style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '5px',
        background: 'var(--text-primary)',
        color: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '1px 1px 0px var(--border-strong)',
        border: '1px solid var(--border-color)',
        position: 'relative',
        flexShrink: 0
      }}>
        <span style={{
          fontFamily: "var(--font-serif)",
          fontWeight: 700,
          fontSize: `${size * 0.62}px`,
          lineHeight: 1,
          marginTop: '-1px'
        }}>
          ज्ञ
        </span>
      </div>

      {/* Typography */}
      <div>
        <div style={{ 
          fontFamily: 'var(--font-serif)',
          fontWeight: 700, 
          fontSize: `${size * 0.68}px`, 
          letterSpacing: '-0.015em',
          color: 'var(--text-primary)',
          lineHeight: 1.1,
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          Gyani
          <span style={{ 
            fontSize: '0.62rem', 
            fontFamily: 'var(--font-mono)', 
            fontWeight: 500, 
            letterSpacing: '0.04em',
            padding: '1px 5px',
            borderRadius: '3px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-tertiary)',
            verticalAlign: 'middle'
          }}>
            ज्ञानी
          </span>
        </div>
        {showSubtext && (
          <div className="logo-subtext" style={{ 
            fontFamily: 'var(--font-mono)',
            fontSize: '0.64rem', 
            color: 'var(--text-tertiary)', 
            letterSpacing: '0.06em', 
            textTransform: 'uppercase' 
          }}>
            Knowledge & Code Archive
          </div>
        )}
      </div>
    </div>
  );
}

export default GyaniLogo;
