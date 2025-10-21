// 홈페이지(로그인 리디렉션)
"use client";
import { Suspense } from 'react';
import Login from '@/components/login/Login';
import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';

// Mock 함수 (실제로는 쿠키/로컬 스토리지에서 토큰을 확인해야 함)
const checkAuthStatus = () => {
    if (typeof window !== 'undefined') {
        // 유효한 토큰이 있는지 확인 (클라이언트 환경)
        return localStorage.getItem('refreshToken') !== null;
    } return false;
};

export default function LoginPage = () => {
    const router = useRouter();
    // useSearchParams를 Client Component 내부에서 안전하게 사용
    const searchParams = useSearchParams();

    useEffect(() => {
        const isLoggedIn = checkAuthStatus();
        const redirectPath = searchParams.get('redirect');

        if (isLoggedIn) {
            if (redirectPath) {
                // redirect 파라미터가 있으면 그곳으로 이동 (초대 링크 복귀)
                console.log(`Token found, redirecting to ${redirectPath}.`);
                // URL 인코딩된 경로를 디코딩하여 사용
                router.replace(decodeURIComponent(redirectPath));
            } else {
                // redirect 파라미터가 없으면 기본 대시보드로 이동
                console.log("Token found, redirecting to /dashboard.");
                router.replace('/dashboard');
            }
        }
    }, [router, searchParams]);
    // 이미 로그인 상태일 때 리디렉션 되는 동안 빈 화면을 보여주지 않기 위해 null 반환
    if (checkAuthStatus()) {
        return null;
    }

    return (
        <Suspense>
            {/* 실제 로그인 폼 컴포넌트 렌더링 */}
            <Login />
        </Suspense>
    );
};

export default LoginPage;