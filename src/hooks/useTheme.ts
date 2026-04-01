import { useCallback, useSyncExternalStore } from 'react';
import { ReaderTheme } from '@/types/book';

const STORAGE_KEY = 'reader-theme';
const themeOrder: ReaderTheme[] = ['light', 'dark', 'warm-blush'];

// Shared listeners for cross-component sync
const listeners = new Set<() => void>();
function emitChange() {
  listeners.forEach(l => l());
}

function applyThemeToDOM(theme: ReaderTheme) {
  const root = document.documentElement;
  root.classList.remove('dark', 'warm-blush');
  if (theme !== 'light') root.classList.add(theme);
}

function getSnapshot(): ReaderTheme {
  return (localStorage.getItem(STORAGE_KEY) as ReaderTheme) || 'light';
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot);

  const setTheme = useCallback((t: ReaderTheme) => {
    localStorage.setItem(STORAGE_KEY, t);
    applyThemeToDOM(t);
    emitChange();
  }, []);

  const cycleTheme = useCallback(() => {
    const current = getSnapshot();
    const next = themeOrder[(themeOrder.indexOf(current) + 1) % themeOrder.length];
    setTheme(next);
  }, [setTheme]);

  return { theme, setTheme, cycleTheme, themeOrder };
}
