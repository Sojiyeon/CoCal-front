// src/hooks/useAuthRedirect.js

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * 로컬 스토리지의 accessToken을 확인하고 인증되지 않았다면 로그인 페이지로 리디렉트하는 훅
 */
// 🚨 브라우저 전용 API에 안전하게 접근하기 위한 헬퍼 함수
const getAccessToken = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('accessToken');
    }
    return null;
};


const useAuthRedirect = () => {
    const router = useRouter();
    const pathname = usePathname();
    // 초기값은 토큰 존재 여부를 클라이언트에서 확인해야 하므로 true로 유지
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        // useEffect는 클라이언트에서만 실행되지만,
        // 안전을 위해 getAccessToken 헬퍼 함수를 통해 접근합니다.

        const accessToken = getAccessToken(); // 👈 헬퍼 함수 사용

        // 토큰이 없으면 로그인 페이지로 리디렉션
        if (!accessToken) {
            console.log('No accessToken found in LocalStorage. Redirecting to /login.');

            // 현재 경로를 'redirect' 파라미터에 담아 로그인 페이지로 이동
            // (요청하셨던 대로 '/'로 리디렉션하도록 유지했습니다.)
            router.replace(`/`);
        } else {
            // 토큰이 있다면 (로그인 상태), 확인 완료
            setIsChecking(false);
        }

    }, [router, pathname]);

    // 🚨 여기서 localStorage를 직접 참조하면 서버에서 에러가 납니다.
    // 헬퍼 함수를 사용하여 안전하게 토큰 존재 여부를 반환합니다.
    const isAuthenticated = !!getAccessToken();

    // isChecking 상태는 useEffect가 실행되기 전까지 true이므로,
    // 서버 렌더링 시에는 isAuthenticated가 false라도 isChecking이 true일 것입니다.
    return { isChecking, isAuthenticated };
};

export default useAuthRedirect;