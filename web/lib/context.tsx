'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { translations, TranslationKey } from './translations';

type Theme = 'light' | 'dark';
type Language = 'uz' | 'en';

interface AppContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: TranslationKey) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('light');
    const [language, setLanguageState] = useState<Language>('uz');

    // Initialize from localStorage
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as Theme;
        const savedLang = localStorage.getItem('language') as Language;

        if (savedTheme) setThemeState(savedTheme);
        if (savedLang) setLanguageState(savedLang);
    }, []);

    // Apply theme to document
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Apply language to document
    useEffect(() => {
        localStorage.setItem('language', language);
    }, [language]);

    const setTheme = (t: Theme) => setThemeState(t);
    const setLanguage = (l: Language) => setLanguageState(l);
    
    const t = (key: TranslationKey) => {
        return translations[language][key] || key;
    };

    return (
        <AppContext.Provider value={{ theme, setTheme, language, setLanguage, t }}>
            {children}
        </AppContext.Provider>
    );
}

export function useAppContext() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
}
