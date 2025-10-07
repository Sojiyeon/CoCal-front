"use client";

import React, { FC, useState, createContext, useContext, useEffect, ReactNode, useCallback } from 'react';

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

export const UserProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User>(initialUser);
    const [isLoading, setIsLoading] = useState(true);

    // [수정] logout 함수를 useCallback으로 감싸서 의존성 배열에 안전하게 사용합니다.
    const logout = useCallback(async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
            try {
                await fetch(API_LOGOUT_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken }),
                });
            } catch (_error) { // 미사용 변수 경고 해결
                // 에러 무시, 클라이언트 측 정리 계속 진행
            }
        }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userProfile');
        setUser(initialUser);
        window.location.href = '/'; // 로그인 페이지로 리디렉션
    }, []);

    // [수정] fetchUserProfile 함수를 useCallback으로 감싸서 의존성 배열에 안전하게 사용합니다.
    const fetchUserProfile = useCallback(async (token: string) => {
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
                localStorage.setItem('userProfile', JSON.stringify(profile));
            } else {
                console.error(`프로필 로드 실패`);
                await logout();
            }
        } catch (_error) { // 미사용 변수 경고 해결
            console.error("네트워크 오류가 발생했습니다:", _error);
            await logout();
        } finally {
            setIsLoading(false);
        }
    }, [logout]);

    // [수정] useEffect 의존성 배열에 fetchUserProfile을 추가하여 경고를 해결합니다.
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            // "Promise returned from fetchUserProfile is ignored" 경고 해결
            void fetchUserProfile(token);
        } else {
            setIsLoading(false);
        }
    }, [fetchUserProfile]);

    return (
        <UserContext.Provider value={{ user, setUser, isLoading, fetchUserProfile, logout }}>
            {children}
        </UserContext.Provider>
    );
};

