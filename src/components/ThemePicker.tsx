'use client';

import { useEffect, useRef } from 'react';
import { useTheme, THEME_PRESETS } from './ThemeProvider';
import { Check, Palette, X } from 'lucide-react';

export default function ThemePicker() {
  const { activeTheme, setThemeById, isPanelOpen, togglePanel, closePanel } = useTheme();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel();
    };
    if (isPanelOpen) {
      document.addEventListener('keydown', handleKey);
    }
    return () => document.removeEventListener('keydown', handleKey);
  }, [isPanelOpen, closePanel]);

  const darkThemes = THEME_PRESETS.filter(t => t.mode === 'dark');
  const lightThemes = THEME_PRESETS.filter(t => t.mode === 'light');

  return (
    <>
      <button
        onClick={togglePanel}
        className={`theme-toggle-btn flex-center ${isPanelOpen ? 'active' : ''}`}
        id="theme-toggle"
        aria-label="Open theme picker"
        title="Change theme"
      >
        <Palette size={20} />
      </button>

      {/* Overlay */}
      <div 
        className={`theme-overlay ${isPanelOpen ? 'open' : ''}`} 
        onClick={closePanel} 
      />

      {/* Side Panel */}
      <div className={`theme-drawer ${isPanelOpen ? 'open' : ''}`} ref={panelRef}>
        <div className="theme-drawer-header">
          <h3 className="theme-drawer-title">
            <Palette size={20} />
            <span>Pilih Tema</span>
          </h3>
          <button className="theme-drawer-close flex-center" onClick={closePanel}>
            <X size={20} />
          </button>
        </div>

        <div className="theme-drawer-body">
          {/* Active indicator */}
          <div className="theme-active-badge">
            <span className="theme-active-dot" style={{ background: activeTheme.colors.primaryAccent }} />
            <span>Aktif: <strong>{activeTheme.emoji} {activeTheme.name}</strong></span>
          </div>

          {/* Dark Themes */}
          <div className="theme-group">
            <p className="theme-group-label">🌙 Dark Mode</p>
            <div className="theme-grid">
              {darkThemes.map(preset => (
                <button
                  key={preset.id}
                  className={`theme-swatch ${activeTheme.id === preset.id ? 'active' : ''}`}
                  onClick={() => setThemeById(preset.id)}
                  title={preset.name}
                >
                  <div
                    className="swatch-preview"
                    style={{
                      background: `linear-gradient(135deg, ${preset.colors.bgColor} 50%, ${preset.colors.primaryAccent} 50%)`,
                    }}
                  >
                    {activeTheme.id === preset.id && (
                      <div className="swatch-check">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <span className="swatch-name">{preset.emoji} {preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Light Themes */}
          <div className="theme-group">
            <p className="theme-group-label">☀️ Light Mode</p>
            <div className="theme-grid">
              {lightThemes.map(preset => (
                <button
                  key={preset.id}
                  className={`theme-swatch ${activeTheme.id === preset.id ? 'active' : ''}`}
                  onClick={() => setThemeById(preset.id)}
                  title={preset.name}
                >
                  <div
                    className="swatch-preview"
                    style={{
                      background: `linear-gradient(135deg, ${preset.colors.bgColor} 50%, ${preset.colors.primaryAccent} 50%)`,
                    }}
                  >
                    {activeTheme.id === preset.id && (
                      <div className="swatch-check">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <span className="swatch-name">{preset.emoji} {preset.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
