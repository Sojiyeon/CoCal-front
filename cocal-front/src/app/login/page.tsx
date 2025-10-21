// 홈페이지(로그인 리디렉션)
"use client";
import LoginHandler from './LoginHandler';
import { Suspense } from 'react';

export default function LoginPage() {
    return (
        // 클라이언트 전용 훅(useSearchParams)을 사용하는 컴포넌트를 Suspense로 감쌉니다.
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <p>인증 상태를 확인하는 중입니다...</p>
            </div>
        }>
            {/* useSearchParams와 리디렉션 로직만 담당하는 컴포넌트 */}
            <LoginHandler />
        </Suspense>
    );
}