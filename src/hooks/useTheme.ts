import { useState, useEffect } from 'react';
import { ReaderTheme } from '@/types/book';

const themeOrder: ReaderTheme[] = ['light', 'dark', 'warm-blush'];

export function useTheme() {
  const [theme, setThemeState] = useState<ReaderTheme>(() =>
    (localStorage.getItem('reader-theme') as ReaderTheme) || 'light'
  );

  useEffect(() => {
    localStorage.setItem('reader-theme', theme);
    const root = document.documentElement;
    root.classList.remove('dark', 'warm-blush');
    if (theme !== 'light') root.classList.add(theme);
  }, [theme]);

  const setTheme = (t: ReaderTheme) => setThemeState(t);

  const cycleTheme = () => {
    const idx = themeOrder.indexOf(theme);
    setThemeState(themeOrder[(idx + 1) % themeOrder.length]);
  };

  return { theme, setTheme, cycleTheme, themeOrder };
}
