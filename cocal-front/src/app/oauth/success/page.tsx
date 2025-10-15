'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';

export default function OAuthSuccessPage() {
    const router = useRouter();
    const params = useSearchParams();
    const { fetchUserProfile } = useUser();

    useEffect(() => {
        const token = params.get('accessToken');
        const expiresIn = params.get('expiresIn');
        console.log("accessToken: ",token);
        console.log("expiresIn: ",expiresIn);

        if (!token) {
            router.replace('/login?error=missing_token');
            return;
        }

        // accessToken 저장
        localStorage.setItem('accessToken', token);
        if (expiresIn) {
            const expiresAt = Date.now() + Number(expiresIn) * 1000;
            localStorage.setItem('accessTokenExpiresAt', String(expiresAt));
        }

        // UserProvider의 fetchUserProfile 실행
        fetchUserProfile(token)
            .then(() => {
                console.log('프로필 동기화 성공');
                router.replace('/dashboard');
            })
            .catch(() => {
                router.replace('/login?error=profile_fail');
            });
    }, [router, params, fetchUserProfile]);

    return (
        <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
            로그인 처리 중...
        </div>
    );
}
