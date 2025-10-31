"use client"

import { fetchWithAuth } from '@/utils/authService';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;


type ViewOption = 'DAY' | 'WEEK' | 'MONTH';


export const updateDefaultView = async (newView: ViewOption) => {
    const API_ENDPOINT = `${API_BASE_URL}/api/users/view`;

    try {
        const response = await fetchWithAuth(API_ENDPOINT, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ defaultView: newView })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '기본 뷰 설정에 실패했습니다.');
        }

        // 성공 시 응답 데이터를 반환합니다.
        const result = await response.json();
        return result.data;

    } catch (error) {
        console.error("Default View 변경 중 오류:", error);
        // 에러를 다시 throw하여 호출한 쪽에서 catch할 수 있게 합니다.
        throw error;
    }
};

