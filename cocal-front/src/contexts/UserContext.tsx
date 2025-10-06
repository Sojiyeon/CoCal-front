"use client";

import React, { FC, useState, createContext, useContext, useEffect, ReactNode } from 'react';

// --- 전역 타입 정의 ---
interface User {
    id: number | null;
    email: string | null;
    name: string | null;
    profileImageUrl: string | null;
}

interface UserContextType {
    user: User;
    setUser: React.Dispatch<React.SetStateAction<User>>;
    isLoading: boolean;
    fetchUserProfile: (token: string) => Promise<void>;
    logout: () => Promise<void>;
}

const API = 'https://cocal-server.onrender.com';
const API_ME_ENDPOINT = `${API}/api/users/me`;
const API_LOGOUT_ENDPOINT = `${API}/api/auth/logout`;
const initialUser: User = { id: null, email: null, name: null, profileImageUrl: null };

const UserContext = createContext<UserContextType | undefined>(undefined);

// --- 사용자 컨텍스트 훅 & 프로바이더 ---
export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};

// UserProvider 컴포넌트
export const UserProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User>(initialUser);
    const [isLoading, setIsLoading] = useState(true);

    const logout = async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
            try {
                await fetch(API_LOGOUT_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken }),
                });
            } catch (error) {
                // 에러 무시, 클라이언트 측 정리 계속 진행
            }
        }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userProfile');
        setUser(initialUser);
        window.location.href = '/'; // 로그인 페이지로 리디렉션
    };

    const fetchUserProfile = async (token: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(API_ME_ENDPOINT, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const result = await response.json();
                const data = result.data;
                const profile = {
                    id: data.id || null,
                    email: data.email || null,
                    name: data.name || null,
                    profileImageUrl: data.profileImageUrl || null
                };
                setUser(profile);
                // localStorage에도 최신 정보 저장
                localStorage.setItem('userProfile', JSON.stringify(profile));
                console.log('프로필 정보 불러오기 성공:', data);
            } else {
                const errorData = await response.json();
                console.error(`프로필 로드 실패: ${errorData.message || response.statusText}`);
                await logout();
            }
        } catch (error) {
            console.error("네트워크 오류가 발생했습니다:", error);
            await logout();
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            void fetchUserProfile(token);
        } else {
            setIsLoading(false); // 토큰이 없으면 로딩 종료
        }
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser, isLoading, fetchUserProfile, logout }}>
            {children}
        </UserContext.Provider>
    );
};

