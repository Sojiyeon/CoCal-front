import { Suspense } from 'react';
// 새로 생성된 클라이언트 컴포넌트를 임포트합니다. 경로를 확인해주세요.
import Login from '@/components/login/Login';

// Next.js App Router에서 클라이언트 전용 훅(useSearchParams 등)을
// 서버 컴포넌트(이 page.tsx)에서 안전하게 사용하기 위한 표준 구조입니다.

export default function HomePage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen text-gray-700 dark:text-white bg-gray-50 dark:bg-neutral-900">
                <p>인증 상태를 확인하는 중입니다...</p>
            </div>
        }>
            <Login />
        </Suspense>
    );
}
