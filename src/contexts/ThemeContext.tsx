import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeStatus = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: ThemeStatus;
    isDark: boolean;
    setTheme: (theme: ThemeStatus) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<ThemeStatus>(() => {
        const saved = localStorage.getItem('app-theme') as ThemeStatus;
        return saved || 'system';
    });

    const [isSystemDark, setIsSystemDark] = useState(
        window.matchMedia('(prefers-color-scheme: dark)').matches
    );

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e: MediaQueryListEvent) => setIsSystemDark(e.matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    useEffect(() => {
        localStorage.setItem('app-theme', theme);
        const isDark = theme === 'dark' || (theme === 'system' && isSystemDark);

        if (isDark) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }, [theme, isSystemDark]);

    const isDark = theme === 'dark' || (theme === 'system' && isSystemDark);

    return (
        <ThemeContext.Provider value={{ theme, isDark, setTheme }}>
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
