import React, { createContext, useCallback, useContext, useState } from 'react';
import { type ActiveTheme, setActiveTheme } from './tokens';

type ThemeContextValue = {
  theme: ActiveTheme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ActiveTheme>('dark');

  const toggleTheme = useCallback(() => {
    setTheme(current => {
      const next: ActiveTheme = current === 'dark' ? 'light' : 'dark';
      setActiveTheme(next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
