
import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  setTheme: (theme: ThemeMode) => void;
  roleColors: Record<string, { light: string; dark: string }>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const ROLE_COLORS = {
  customer: {
    light: 'from-blue-400 to-blue-600',
    dark: 'from-blue-600 to-blue-800'
  },
  baker: {
    light: 'from-orange-400 to-orange-600',
    dark: 'from-orange-600 to-orange-800'
  },
  shop: {
    light: 'from-green-400 to-green-600',
    dark: 'from-green-600 to-green-800'
  },
  courier: {
    light: 'from-purple-400 to-purple-600',
    dark: 'from-purple-600 to-purple-800'
  },
  operator: {
    light: 'from-yellow-400 to-yellow-600',
    dark: 'from-yellow-600 to-yellow-800'
  },
  admin: {
    light: 'from-red-400 to-red-600',
    dark: 'from-red-600 to-red-800'
  }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as ThemeMode) || 'light';
  });

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const updateTheme = () => {
      let shouldBeDark = false;

      if (theme === 'dark') {
        shouldBeDark = true;
      } else if (theme === 'auto') {
        shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      setIsDark(shouldBeDark);
      
      if (shouldBeDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    updateTheme();
    localStorage.setItem('theme', theme);

    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', updateTheme);
      return () => mediaQuery.removeEventListener('change', updateTheme);
    }
  }, [theme]);

  const value = {
    theme,
    isDark,
    setTheme,
    roleColors: ROLE_COLORS
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
