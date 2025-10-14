const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;
const REISSUE_API_ENDPOINT = `${API_BASE_URL}/api/auth/reissue`;

export const clearSessionAndLogout = () => {
    // window 객체 유무 확인
    if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    }
    // 이 에러를 던져서 fetchWithAuth를 호출한 상위 컴포넌트(예: UserProvider의 useEffect)가
    // 이 상태를 감지하고 사용자에게 로그아웃을 유도
    throw new Error("SESSION_EXPIRED: Refresh token is invalid or missing. Must log out.");
};

export const reissueAccessToken = async () => {
    if (typeof window === 'undefined') {
        console.warn("reissueAccessToken called server-side. Skipping.");
        return null;
    }

    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
        console.error("RefreshToken이 없습니다. 로그아웃이 필요합니다.");
        clearSessionAndLogout();
    }

    try {
        console.log(`API 호출: ${REISSUE_API_ENDPOINT}로 AccessToken 재발급 요청`);

        const response = await fetch(REISSUE_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
        });

        if (response.ok) {
            const result = await response.json();
            const newAccessToken = result.data.accessToken;
            // 서버가 새 RefreshToken도 주면 업데이트하고, 아니면 기존 것을 유지
            const newRefreshToken = result.data.refreshToken || refreshToken;

            localStorage.setItem('accessToken', newAccessToken);
            localStorage.setItem('refreshToken', newRefreshToken);

            console.log("AccessToken 재발급 성공.");
            return newAccessToken;
        } else {
            // RefreshToken이 유효하지 않은 경우
            console.error("토큰 재발급 실패: RefreshToken이 유효하지 않습니다. 로그아웃 처리 필요.");
            clearSessionAndLogout();
        }
    } catch (error) {
        console.error("AccessToken 재발급 중 네트워크 오류:", error);
        clearSessionAndLogout();
    }
};

export const fetchWithAuth = async (url:string,  options: RequestInit = {}) => {
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    // Authorization 헤더가 options에 없으면 현재 AccessToken으로 추가합니다.
    const finalOptions = {
        ...options,
        headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${accessToken || ''}`,
        }
    };

    let response = await fetch(url, finalOptions);

    if (response.status === 401) {
        console.log("AccessToken 만료 감지. 재발급 시도 중...");
        try {
            const newAccessToken = await reissueAccessToken();

            if (newAccessToken) {
                console.log("재시도: 새 AccessToken으로 요청 재시도");

                const retryOptions = {
                    ...options,
                    headers: {
                        ...options.headers,
                        'Authorization': `Bearer ${newAccessToken}`,
                    },
                };
                // 요청 재시도
                response = await fetch(url, retryOptions);

                // 재시도 후에도 401이 발생하면, RefreshToken도 만료된 것으로 간주
                if (response.status === 401) {
                    console.error("재시도 요청도 401 응답: RefreshToken도 만료되었으므로, 로그아웃이 필요합니다.");
                }
            } else {
                // AccessToken 재발급 자체가 실패한 경우 (RefreshToken 만료됨)
                console.error("AccessToken 재발급 실패. 로그아웃이 필요합니다.");
                clearSessionAndLogout();
            }
        } catch (error: unknown) {
            // reissueAccessToken에서 던진 SESSION_EXPIRED 에러를 여기서 잡고, 다시 던져서
            // 최상위 호출자가 (e.g., UserProvider) 알 수 있도록 합니다.
            if (error instanceof Error) {
                throw error;
            }
            clearSessionAndLogout();
        }
    }
    return response;
};

// fetchWithAuth를 감싸서 JSON을 반환하는 함수
export const fetchJsonWithAuth = async <T = any>(
    url: string,
    options: RequestInit = {}
): Promise<T> => {
    // 기존 토큰 재발급/재시도 로직은 fetchWithAuth가 그대로 처리
    const response = await fetchWithAuth(url, options);

    // 204 No Content 대응
    if (response.status === 204) {
        return null as T;
    }

    // JSON 파싱 시도
    let data: any = null;
    try {
        // Content-Type이 JSON이 아니어도 서버가 JSON을 돌려주는 경우가 있어
        // 우선 json() 시도, 실패하면 text() 후 에러로 보냄
        data = await response.json();
    } catch (e: unknown) {
        const text = await response.text().catch(() => '');
        const parseErr = new Error(
            `JSON 파싱 실패(${response.status} ${response.statusText}): ${text?.slice(0, 200) || '응답 본문 없음'}`
        ) as Error & { status?: number; raw?: string };
        parseErr.status = response.status;
        parseErr.raw = text;
        throw parseErr;
    }

    // HTTP 에러라면 데이터 안의 메시지를 최대한 살려 에러로 throw
    if (!response.ok) {
        const err = new Error(
            data?.message || data?.error || `${response.status} ${response.statusText}`
        ) as Error & { status?: number; body?: any };
        err.status = response.status;
        err.body = data;
        throw err;
    }

    // 성공 시 JSON 그대로 반환
    return data as T;
};