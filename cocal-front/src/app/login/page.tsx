"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import Login from '@/components/login/Login'; // 실제 로그인 폼 컴포넌트

// Mock 함수 (실제로는 쿠키/로컬 스토리지에서 토큰을 확인해야 함)
const checkAuthStatus = () => {
    if (typeof window !== 'undefined') {
        // 유효한 토큰이 있는지 확인 (클라이언트 환경)
        return localStorage.getItem('refreshToken') !== null;
    } 
    return false;
};

export default function LoginClient() {
    const router = useRouter();
    // useSearchParams를 Client Component 내부에서 안전하게 사용
    const searchParams = useSearchParams();

    // Context에서 user 정보를 가져옵니다 (필요하다면)
    const { user, isLoading } = useUser(); 

    useEffect(() => {
        // isLoading이 true라면 아직 사용자 인증 상태가 확인 중일 수 있습니다.
        if (isLoading) return; 

        const isLoggedIn = checkAuthStatus();
        const redirectPath = searchParams.get('redirect');

        if (isLoggedIn) {
            // 이미 로그인 상태일 때
            const path = redirectPath ? decodeURIComponent(redirectPath) : '/dashboard';
            console.log(`[LoginClient] Token found, redirecting to ${path}.`);
            router.replace(path);
        }
    }, [router, searchParams, isLoading]);

    // 인증 상태 확인 중이거나 이미 로그인 상태인 경우 (리디렉션 중)
    if (isLoading || checkAuthStatus()) {
        return (
            <div className="flex items-center justify-center min-h-screen text-gray-700">
                <p>인증 상태를 확인하고 있습니다...</p>
            </div>
        );
    }

    // 로그인 폼 렌더링
    return <Login />;
}
