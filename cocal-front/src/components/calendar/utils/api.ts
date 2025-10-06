// 서버의 기본 URL 주소입니다.
const API_BASE_URL = 'https://cocal-server.onrender.com/api';

async function fetcher(endpoint: string, options: RequestInit = {}) {
    // localStorage에서 로그인 시 저장된 AccessToken을 가져옵니다.
    const accessToken = localStorage.getItem('accessToken');

    // headers의 타입을 'HeadersInit'으로 설정하여 타입 호환성 문제를 해결합니다.
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // AccessToken이 존재하면, 'Authorization' 헤더에 추가합니다.
    if (accessToken) {
        // 타입 단언을 사용하여 headers가 인덱싱 가능한 객체임을 명시합니다.
        (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
    }

    // fetch를 사용하여 서버에 요청을 보냅니다.
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    // 서버 응답이 실패한 경우(예: 401 인증 오류, 404 찾을 수 없음)
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        // 에러를 발생시켜 catch 블록에서 처리하도록 합니다.
        throw new Error(errorData.message || 'API 요청에 실패했습니다.');
    }

    // 응답 본문이 없는 경우 (예: 204 No Content)
    if (response.status === 204) {
        return null;
    }

    // 성공적인 응답의 경우, JSON 데이터를 반환합니다.
    return response.json();
}

// 앞으로 사용할 API 호출 메소드들입니다.
export const api = {
    get: (endpoint: string) => fetcher(endpoint, { method: 'GET' }),
    post: (endpoint: string, body: unknown) => fetcher(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    patch: (endpoint: string, body: unknown) => fetcher(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (endpoint: string) => fetcher(endpoint, { method: 'DELETE' }),
};
