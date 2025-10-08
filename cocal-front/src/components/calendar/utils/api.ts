// 서버의 기본 URL 주소입니다.
const API_BASE_URL = 'https://cocal-server.onrender.com/api';

/**
 * 모든 API 요청을 처리하는 중앙 함수입니다.
 * 자동으로 인증 토큰을 헤더에 추가합니다.
 * @param endpoint API 경로 (예: '/auth/login')
 * @param options fetch에 전달할 추가 옵션 (method, body 등)
 */
async function fetcher(endpoint: string, options: RequestInit = {}) {
    const accessToken = localStorage.getItem('accessToken');
    const headers: HeadersInit = { 'Content-Type': 'application/json', ...options.headers };

    if (accessToken) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

    // 응답 본문이 없는 경우 (예: 204 No Content), 성공으로 간주하고 null을 반환합니다.
    if (response.status === 204) {
        return null;
    }

    // [수정] 모든 응답에 대해 JSON인지 먼저 확인합니다.
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        // 응답이 JSON이 아니면 (HTML 등), SyntaxError를 방지하기 위해 에러를 발생시킵니다.
        throw new Error(`서버로부터 JSON 형식이 아닌 응답을 받았습니다 (Content-Type: ${contentType}). 로그인이 만료되었을 수 있습니다.`);
    }

    const data = await response.json();

    // 서버 응답이 실패한 경우 (예: 401, 403), 서버가 보낸 에러 메시지를 사용합니다.
    if (!response.ok) {
        throw new Error(data.message || 'API 요청에 실패했습니다.');
    }

    // 성공적인 응답의 경우, JSON 데이터를 반환합니다.
    return data;
}

// 앞으로 사용할 API 호출 메소드들입니다.
export const api = {
    get: (endpoint: string) => fetcher(endpoint, { method: 'GET' }),
    post: (endpoint: string, body: unknown) => fetcher(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    patch: (endpoint: string, body: unknown) => fetcher(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (endpoint: string) => fetcher(endpoint, { method: 'DELETE' }),
};

