"use client";

import React, { useState, useEffect, useContext, type ReactNode } from 'react';

// 1. Context 타입 정의
interface ThemeContextType {
    isDarkMode: boolean;
    toggleTheme: () => void;
}

// 2. Context 생성 및 useTheme 훅
const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

interface ThemeProviderProps {
    children: ReactNode;
}

// 3. Provider 컴포넌트
const ThemeProvider = ({ children }: ThemeProviderProps) => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    // 테마 상태를 변경하고, localStorage와 <html> 클래스를 업데이트하는 핵심 함수
    const applyTheme = (isDark: boolean) => {
        const html = document.documentElement;
        setIsDarkMode(isDark);
        if (isDark) {
            // 다크 모드 클래스 추가
            html.classList.add('dark');
            // 사용자 설정 저장 (다크 모드)
            localStorage.setItem('theme', 'dark');
        } else {
            // 다크 모드 클래스 제거
            html.classList.remove('dark');
            // 사용자 설정 저장 (라이트 모드)
            localStorage.setItem('theme', 'light');
        }
    }

    // ThemeProvider 마운트 시 테마 초기화 및 OS 변경 감지 로직
    useEffect(() => {
        // 1. Local Storage에서 사용자 설정 확인 (가장 우선)
        const savedTheme = localStorage.getItem('theme');
        let initialDarkMode: boolean;

        if (savedTheme === 'dark') {
            initialDarkMode = true;
        } else if (savedTheme === 'light') {
            initialDarkMode = false;
        } else {
            initialDarkMode = false;
        }
        applyTheme(initialDarkMode);
    }, []);

    const toggleTheme = () => {
        applyTheme(!isDarkMode); // 현재 상태의 반대로 테마 적용
    };

    const contextValue = {
        isDarkMode,
        toggleTheme,
    };

    return (
        <ThemeContext.Provider value={contextValue}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeProvider;