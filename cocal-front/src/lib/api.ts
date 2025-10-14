// src/lib/api/auth.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface LoginRequest {
    email: string;
    password: string;
}

interface LoginResponse {
    success: boolean;
    data?: {
        accessToken?: string;
        refreshToken?: string;

    };
    message?: string;
}

export async function login(email: string, password: string) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            credentials: 'include', // 🔥 HttpOnly refreshToken 쿠키를 받기 위해 필수
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || '로그인에 실패했습니다.');
        }

        const accessToken = data.data?.accessToken;
        if (!accessToken) throw new Error('accessToken이 응답에 없습니다.');

        // accessToken만 localStorage에 저장
        localStorage.setItem('accessToken', accessToken);
        console.log('AccessToken 저장 완료:', accessToken.slice(0, 20) + '...');

        return accessToken;
    } catch (err) {
        console.error('로그인 요청 실패:', err);
        throw err;
    }
}
