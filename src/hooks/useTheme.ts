import { useEffect } from 'react';
import { useChatStore } from '../store/chatStore';

export function useTheme() {
  const theme = useChatStore((s) => s.theme);
  const toggleTheme = useChatStore((s) => s.toggleTheme);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (theme === 'dark') {
      root.classList.add('dark');
      body.classList.remove('light-theme');
    } else {
      root.classList.remove('dark');
      body.classList.add('light-theme');
    }
  }, [theme]);

  return { theme, toggleTheme };
}
