'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export interface ThemePreset {
  id: string;
  name: string;
  emoji: string;
  mode: 'dark' | 'light';
  colors: {
    bgColor: string;
    bgColorLight: string;
    bgColorLighter: string;
    textPrimary: string;
    textSecondary: string;
    primaryAccent: string;
    primaryAccentHover: string;
    secondaryAccent: string;
    glassBg: string;
    glassBorder: string;
    glassShadow: string;
    cardHoverShadow: string;
    readerBg: string;
  };
}

export const THEME_PRESETS: ThemePreset[] = [
  // ===== DARK THEMES =====
  {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    emoji: '🌙',
    mode: 'dark',
    colors: {
      bgColor: '#0f172a',
      bgColorLight: '#1e293b',
      bgColorLighter: '#334155',
      textPrimary: '#f8fafc',
      textSecondary: '#94a3b8',
      primaryAccent: '#3b82f6',
      primaryAccentHover: '#2563eb',
      secondaryAccent: '#8b5cf6',
      glassBg: 'rgba(30, 41, 59, 0.7)',
      glassBorder: 'rgba(255, 255, 255, 0.1)',
      glassShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
      cardHoverShadow: 'rgba(59, 130, 246, 0.2)',
      readerBg: '#000',
    },
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    emoji: '👑',
    mode: 'dark',
    colors: {
      bgColor: '#1a1025',
      bgColorLight: '#2d1b4e',
      bgColorLighter: '#3d2a5c',
      textPrimary: '#f3e8ff',
      textSecondary: '#a78bfa',
      primaryAccent: '#8b5cf6',
      primaryAccentHover: '#7c3aed',
      secondaryAccent: '#c084fc',
      glassBg: 'rgba(45, 27, 78, 0.75)',
      glassBorder: 'rgba(139, 92, 246, 0.15)',
      glassShadow: '0 4px 30px rgba(139, 92, 246, 0.08)',
      cardHoverShadow: 'rgba(139, 92, 246, 0.25)',
      readerBg: '#0d0815',
    },
  },
  {
    id: 'emerald-night',
    name: 'Emerald Night',
    emoji: '🌿',
    mode: 'dark',
    colors: {
      bgColor: '#0a1f1a',
      bgColorLight: '#14332b',
      bgColorLighter: '#1f4d3f',
      textPrimary: '#ecfdf5',
      textSecondary: '#6ee7b7',
      primaryAccent: '#10b981',
      primaryAccentHover: '#059669',
      secondaryAccent: '#34d399',
      glassBg: 'rgba(20, 51, 43, 0.75)',
      glassBorder: 'rgba(16, 185, 129, 0.12)',
      glassShadow: '0 4px 30px rgba(16, 185, 129, 0.06)',
      cardHoverShadow: 'rgba(16, 185, 129, 0.2)',
      readerBg: '#050f0c',
    },
  },
  {
    id: 'crimson-dark',
    name: 'Crimson Dark',
    emoji: '🔥',
    mode: 'dark',
    colors: {
      bgColor: '#1c0a0a',
      bgColorLight: '#2d1515',
      bgColorLighter: '#4a2020',
      textPrimary: '#fef2f2',
      textSecondary: '#fca5a5',
      primaryAccent: '#ef4444',
      primaryAccentHover: '#dc2626',
      secondaryAccent: '#f97316',
      glassBg: 'rgba(45, 21, 21, 0.75)',
      glassBorder: 'rgba(239, 68, 68, 0.12)',
      glassShadow: '0 4px 30px rgba(239, 68, 68, 0.06)',
      cardHoverShadow: 'rgba(239, 68, 68, 0.2)',
      readerBg: '#0a0505',
    },
  },
  {
    id: 'ocean-deep',
    name: 'Ocean Deep',
    emoji: '🌊',
    mode: 'dark',
    colors: {
      bgColor: '#0a192f',
      bgColorLight: '#112240',
      bgColorLighter: '#1d3557',
      textPrimary: '#ccd6f6',
      textSecondary: '#8892b0',
      primaryAccent: '#64ffda',
      primaryAccentHover: '#45e6c3',
      secondaryAccent: '#57cbff',
      glassBg: 'rgba(17, 34, 64, 0.75)',
      glassBorder: 'rgba(100, 255, 218, 0.1)',
      glassShadow: '0 4px 30px rgba(100, 255, 218, 0.05)',
      cardHoverShadow: 'rgba(100, 255, 218, 0.15)',
      readerBg: '#020c1b',
    },
  },
  {
    id: 'sakura-night',
    name: 'Sakura Night',
    emoji: '🌸',
    mode: 'dark',
    colors: {
      bgColor: '#1a0f1e',
      bgColorLight: '#2a1a30',
      bgColorLighter: '#3d2845',
      textPrimary: '#fdf2f8',
      textSecondary: '#f9a8d4',
      primaryAccent: '#ec4899',
      primaryAccentHover: '#db2777',
      secondaryAccent: '#f472b6',
      glassBg: 'rgba(42, 26, 48, 0.75)',
      glassBorder: 'rgba(236, 72, 153, 0.12)',
      glassShadow: '0 4px 30px rgba(236, 72, 153, 0.06)',
      cardHoverShadow: 'rgba(236, 72, 153, 0.2)',
      readerBg: '#0d0710',
    },
  },
  // ===== LIGHT THEMES =====
  {
    id: 'clean-light',
    name: 'Clean Light',
    emoji: '☀️',
    mode: 'light',
    colors: {
      bgColor: '#f1f5f9',
      bgColorLight: '#ffffff',
      bgColorLighter: '#e2e8f0',
      textPrimary: '#0f172a',
      textSecondary: '#475569',
      primaryAccent: '#2563eb',
      primaryAccentHover: '#1d4ed8',
      secondaryAccent: '#7c3aed',
      glassBg: 'rgba(255, 255, 255, 0.8)',
      glassBorder: 'rgba(0, 0, 0, 0.08)',
      glassShadow: '0 4px 30px rgba(0, 0, 0, 0.06)',
      cardHoverShadow: 'rgba(37, 99, 235, 0.15)',
      readerBg: '#f8fafc',
    },
  },
  {
    id: 'warm-cream',
    name: 'Warm Cream',
    emoji: '🍦',
    mode: 'light',
    colors: {
      bgColor: '#faf6f1',
      bgColorLight: '#ffffff',
      bgColorLighter: '#f0e6d6',
      textPrimary: '#2c1810',
      textSecondary: '#78716c',
      primaryAccent: '#d97706',
      primaryAccentHover: '#b45309',
      secondaryAccent: '#ea580c',
      glassBg: 'rgba(255, 255, 255, 0.8)',
      glassBorder: 'rgba(120, 80, 40, 0.08)',
      glassShadow: '0 4px 30px rgba(120, 80, 40, 0.06)',
      cardHoverShadow: 'rgba(217, 119, 6, 0.15)',
      readerBg: '#fffbf5',
    },
  },
  {
    id: 'lavender-mist',
    name: 'Lavender Mist',
    emoji: '💜',
    mode: 'light',
    colors: {
      bgColor: '#f3f0ff',
      bgColorLight: '#ffffff',
      bgColorLighter: '#e8e0f7',
      textPrimary: '#1e1033',
      textSecondary: '#6b5b8a',
      primaryAccent: '#7c3aed',
      primaryAccentHover: '#6d28d9',
      secondaryAccent: '#a855f7',
      glassBg: 'rgba(255, 255, 255, 0.8)',
      glassBorder: 'rgba(124, 58, 237, 0.08)',
      glassShadow: '0 4px 30px rgba(124, 58, 237, 0.06)',
      cardHoverShadow: 'rgba(124, 58, 237, 0.15)',
      readerBg: '#faf8ff',
    },
  },
  {
    id: 'mint-fresh',
    name: 'Mint Fresh',
    emoji: '🍃',
    mode: 'light',
    colors: {
      bgColor: '#ecfdf5',
      bgColorLight: '#ffffff',
      bgColorLighter: '#d1fae5',
      textPrimary: '#064e3b',
      textSecondary: '#4b7a6a',
      primaryAccent: '#059669',
      primaryAccentHover: '#047857',
      secondaryAccent: '#10b981',
      glassBg: 'rgba(255, 255, 255, 0.8)',
      glassBorder: 'rgba(5, 150, 105, 0.08)',
      glassShadow: '0 4px 30px rgba(5, 150, 105, 0.06)',
      cardHoverShadow: 'rgba(5, 150, 105, 0.15)',
      readerBg: '#f0fdf9',
    },
  },
];

interface ThemeContextType {
  activeTheme: ThemePreset;
  setThemeById: (id: string) => void;
  isPanelOpen: boolean;
  togglePanel: () => void;
  closePanel: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  activeTheme: THEME_PRESETS[0],
  setThemeById: () => {},
  isPanelOpen: false,
  togglePanel: () => {},
  closePanel: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function applyThemeColors(preset: ThemePreset) {
  const root = document.documentElement;
  const c = preset.colors;
  root.style.setProperty('--bg-color', c.bgColor);
  root.style.setProperty('--bg-color-light', c.bgColorLight);
  root.style.setProperty('--bg-color-lighter', c.bgColorLighter);
  root.style.setProperty('--text-primary', c.textPrimary);
  root.style.setProperty('--text-secondary', c.textSecondary);
  root.style.setProperty('--primary-accent', c.primaryAccent);
  root.style.setProperty('--primary-accent-hover', c.primaryAccentHover);
  root.style.setProperty('--secondary-accent', c.secondaryAccent);
  root.style.setProperty('--glass-bg', c.glassBg);
  root.style.setProperty('--glass-border', c.glassBorder);
  root.style.setProperty('--glass-shadow', c.glassShadow);
  root.style.setProperty('--card-hover-shadow', c.cardHoverShadow);
  root.style.setProperty('--reader-bg', c.readerBg);

  // Set mode-specific variables
  if (preset.mode === 'light') {
    root.style.setProperty('--chapter-hover-bg', 'rgba(0, 0, 0, 0.03)');
    root.style.setProperty('--synopsis-bg', 'rgba(0, 0, 0, 0.04)');
    root.style.setProperty('--filter-remove-bg', 'rgba(0, 0, 0, 0.08)');
    root.style.setProperty('--back-btn-bg', 'rgba(0, 0, 0, 0.06)');
    root.style.setProperty('--back-btn-hover-bg', 'rgba(0, 0, 0, 0.1)');
  } else {
    root.style.setProperty('--chapter-hover-bg', 'rgba(255, 255, 255, 0.03)');
    root.style.setProperty('--synopsis-bg', 'rgba(0, 0, 0, 0.1)');
    root.style.setProperty('--filter-remove-bg', 'rgba(255, 255, 255, 0.1)');
    root.style.setProperty('--back-btn-bg', 'rgba(255, 255, 255, 0.1)');
    root.style.setProperty('--back-btn-hover-bg', 'rgba(255, 255, 255, 0.2)');
  }

  root.setAttribute('data-theme', preset.mode);
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [activeTheme, setActiveTheme] = useState<ThemePreset>(THEME_PRESETS[0]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedId = localStorage.getItem('nekoma-theme-id');
    if (savedId) {
      const found = THEME_PRESETS.find(t => t.id === savedId);
      if (found) {
        setActiveTheme(found);
        applyThemeColors(found);
      }
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    applyThemeColors(activeTheme);
    localStorage.setItem('nekoma-theme-id', activeTheme.id);
  }, [activeTheme, mounted]);

  const setThemeById = (id: string) => {
    const found = THEME_PRESETS.find(t => t.id === id);
    if (found) {
      setActiveTheme(found);
      setIsPanelOpen(false);
    }
  };

  const togglePanel = () => setIsPanelOpen(prev => !prev);
  const closePanel = () => setIsPanelOpen(false);

  if (!mounted) {
    // Return children immediately to prevent blank screen.
    // Apply default theme to html tag if possible.
    return (
      <ThemeContext.Provider value={{ activeTheme, setThemeById, isPanelOpen, togglePanel, closePanel }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ activeTheme, setThemeById, isPanelOpen, togglePanel, closePanel }}>
      {children}
    </ThemeContext.Provider>
  );
}
