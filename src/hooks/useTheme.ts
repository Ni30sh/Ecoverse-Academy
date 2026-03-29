import { useEffect, useMemo, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'eco';

const THEME_KEY = 'theme';

function normalizeTheme(value: string | null | undefined): ThemeMode {
  if (value === 'light' || value === 'dark' || value === 'eco') return value;
  return 'eco';
}

export function getStoredTheme(): ThemeMode {
  return normalizeTheme(localStorage.getItem(THEME_KEY));
}

function applyThemeToDocument(theme: ThemeMode) {
  document.documentElement.className = theme;
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(() => getStoredTheme());

  useEffect(() => {
    applyThemeToDocument(theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const setTheme = (nextTheme: ThemeMode) => {
    setThemeState(nextTheme);
  };

  const isDark = useMemo(() => theme === 'dark', [theme]);

  return { theme, setTheme, isDark };
}
