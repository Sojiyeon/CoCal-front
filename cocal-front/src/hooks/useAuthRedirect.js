'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * 로컬 스토리지의 accessToken을 확인하고 인증되지 않았다면 로그인 페이지로 리디렉트하는 훅
 */
const useAuthRedirect = () => {
    const router = useRouter();
    const pathname = usePathname();
    const [isChecking, setIsChecking] = useState(true); // 인증 확인 상태

    useEffect(() => {
        // 클라이언트 환경에서만 실행되도록 확인
        if (typeof window === 'undefined') {
            setIsChecking(false);
            return;
        }

        const accessToken = localStorage.getItem('accessToken');

        // 토큰이 없으면 로그인 페이지로 리디렉션
        if (!accessToken) {
            console.log('No accessToken found in LocalStorage. Redirecting to /login.');

            // 현재 경로를 'redirect' 파라미터에 담아 로그인 페이지로 이동
            router.replace(`/`);
        } else {
            // 토큰이 있다면 (로그인 상태), 확인 완료
            setIsChecking(false);
        }

    }, [router, pathname]);

    // 토큰이 유효한지 여부를 boolean으로 반환 (여기서는 존재 여부만 확인)
    const isAuthenticated = !!localStorage.getItem('accessToken');

    return { isChecking, isAuthenticated };
};

export default useAuthRedirect;