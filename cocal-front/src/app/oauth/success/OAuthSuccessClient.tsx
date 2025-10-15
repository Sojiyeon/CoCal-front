'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';

export default function OAuthSuccessClient() {
    const router = useRouter();
    const params = useSearchParams();
    const { fetchUserProfile } = useUser();

    useEffect(() => {
        const token = params.get('accessToken');
        const expiresIn = params.get('expiresIn');

        if (!token) {
            router.replace('/login?error=missing_token');
            return;
        }
        
        // 토큰 저장
        localStorage.setItem('accessToken', token);
        if (expiresIn) {
            const expiresAt = Date.now() + Number(expiresIn) * 1000;
            localStorage.setItem('accessTokenExpiresAt', String(expiresAt));
        }

        fetchUserProfile(token)
            .then(() => router.replace('/dashboard'))
            .catch(() => router.replace('/login?error=profile_fail'));
    }, [params, router, fetchUserProfile]);

    return null; // 화면은 필요 없음 (fallback이 대신 표시됨)
}
