import { Suspense } from 'react';
import OAuthSuccessClient from './OAuthSuccessClient';

export const dynamic = 'force-dynamic'; // 프리렌더(정적 생성) 회피

export default function Page() {
    return (
        <Suspense fallback={<div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>로그인 처리 중...</div>}>
            <OAuthSuccessClient />
        </Suspense>
    );
}