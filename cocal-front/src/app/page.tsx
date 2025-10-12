// 홈페이지(로그인 리디렉션)
"use client";
import Login from '@/components/login/Login';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Mock 함수 (실제로는 쿠키/로컬 스토리지에서 토큰을 확인해야 함)
const checkAuthStatus = () => {
    if (typeof window !== 'undefined') {
        // 유효한 토큰이 있는지 확인 (클라이언트 환경)
        return localStorage.getItem('refreshToken') !== null;
    } return false;
};

const LoginPage = () => {
    const router = useRouter();

    useEffect(() => {
        const isLoggedIn = checkAuthStatus();

        if (isLoggedIn) {
            console.log("Token found, redirecting to /dashboard.");
            router.replace('/dashboard'); // 현재 경로를 대체하며 리디렉션
        }
    }, [router]);

    // 이미 로그인 상태일 때 리디렉션 되는 동안 빈 화면을 보여주지 않기 위해 null 반환
    if (checkAuthStatus()) {
        return null;
    }

    return (
        <main>
            <Login />
        </main>
    );
};

export default LoginPage;