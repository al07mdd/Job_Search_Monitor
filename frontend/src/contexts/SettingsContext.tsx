import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'dark' | 'light';
type Language = 'en' | 'de';

interface SettingsContextType {
    theme: Theme;
    reportLanguage: Language;
    setTheme: (theme: Theme) => void;
    setReportLanguage: (lang: Language) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Load from localStorage or default
    const [theme, setThemeState] = useState<Theme>(() =>
        (localStorage.getItem('theme') as Theme) || 'dark'
    );
    const [reportLanguage, setReportLanguageState] = useState<Language>(() =>
        (localStorage.getItem('reportLanguage') as Language) || 'en'
    );

    const setTheme = (t: Theme) => {
        setThemeState(t);
        localStorage.setItem('theme', t);
        // Apply class to body for global styles
        if (t === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const setReportLanguage = (l: Language) => {
        setReportLanguageState(l);
        localStorage.setItem('reportLanguage', l);
    };

    // Initial effect
    useEffect(() => {
        setTheme(theme);
    }, []);

    return (
        <SettingsContext.Provider value={{ theme, reportLanguage, setTheme, setReportLanguage }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) throw new Error('useSettings must be used within SettingsProvider');
    return context;
};
