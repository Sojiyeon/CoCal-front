// app/login/LoginHandler.tsx
"use client";
import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Login from '@/components/login/Login';
import { useUser } from '@/contexts/UserContext';

// Mock 함수 (이곳에 두어 로그인 확인 로직을 집중)
const checkAuthStatus = () => {
    if (typeof window !== 'undefined') {
        // 리프레시 토큰 확인이 적절합니다. (Login.tsx의 accessToken과 통일 권장)
        return localStorage.getItem('refreshToken') !== null;
    } return false;
};

const LoginHandler = () => {
    const router = useRouter();
    // 훅 사용은 클라이언트 컴포넌트 내부에서만! (Suspense로 보호됨)
    const searchParams = useSearchParams();

    useEffect(() => {
        const isLoggedIn = checkAuthStatus();
        const redirectPath = searchParams.get('redirect');

        // 리디렉션 로직: 최상위에서 한 번만 실행
        if (isLoggedIn) {
            router.replace(decodeURIComponent(redirectPath || '/dashboard'));
        }
    }, [router, searchParams]);

    // 이미 로그인 상태일 때 리디렉션 되는 동안 빈 화면을 보여주지 않기 위해 null 반환
    if (checkAuthStatus()) {
        return null;
    }

    // 로그인하지 않은 상태일 때, 로그인 폼 컴포넌트 렌더링
    // 리디렉션 경로를 prop으로 전달하여 Login.tsx에서 활용하도록 수정
    const redirectUrl = searchParams.get('redirect') || undefined;

    return (
        <main>
            {/* redirectUrl prop을 Login 컴포넌트에 전달 */}
            <Login redirectUrl={redirectUrl} />
        </main>
    );
};

export default LoginHandler;