"use client"

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;
console.log("API_BASE:", API_BASE);

export const authApi = {
    // 로그인
    async login(email: string, password: string) {
        if (typeof window === "undefined") {
            // 서버/엣지에서 호출되면 바로 중단
            throw new Error("login()은 client에서 실행되어야 합니다.");
        }
        try {
            console.log("login 실행");
            const response = await fetch(`${API_BASE}/api/auth/login`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({email, password}),
                credentials: 'include',
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "로그인 실패");
            }

            const accessToken = data.data?.accessToken;
            if (!accessToken) throw new Error('accessToken이 응답에 없습니다.');

            // accessToken만 localStorage에 저장
            window.localStorage.setItem('accessToken', accessToken);
            // 저장 확인 로그
            const check = window.localStorage.getItem("accessToken");
            if (!check) throw new Error("localStorage 저장 확인 실패");
            console.log('AccessToken 저장 완료');

            return accessToken;
        } catch (err: unknown) {
            if (err instanceof Error) {
                console.error('로그인 요청 실패:', err.message);
            } else {
                console.error('로그인 요청 실패: 알 수 없는 오류', err);
            }
            throw err;
        }
    },

    // 사용자 정보 조회 함수
    async getUserInfo(accessToken: string) {
        try {
            const response = await fetch(`${API_BASE}/api/users/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // refreshToken 쿠키를 함께 보냄
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || '사용자 정보를 불러오지 못했습니다.');
            }

            return data.data; // 서버에서 user 객체로 내려주는 부분
        } catch (err: unknown) {
            if (err instanceof Error) {
                console.error('사용자 정보 요청 실패:', err.message);
            } else {
                console.error('로그인 요청 실패: 알 수 없는 오류', err);
            }
            throw err;
        }
    },

    // 로그아웃
    async logout(accessToken: string) {
        const response = await fetch(`${API_BASE}/api/auth/logout`, {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            credentials: 'include', // refreshToken 쿠키를 함께 보냄
        });
        if (!response.ok) throw new Error("로그아웃 실패");
    },

    // 구글 소셜 로그인
    getGoogleAuthUrl() {
        return `${API_BASE}/oauth2/authorization/google`;
    },

};
