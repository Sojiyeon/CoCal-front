import {api} from "@/components/calendar/utils/api";

// 메모 생성
export const createMemo = async (projectId: number, data: {
    title: string;
    content: string;
    url?: string;
    memoDate: string;
}) => {
    const res = await api.post(`/projects/${projectId}/memos`, data);
    return res.data;
};

// 메모 수정
export const updateMemo = async (projectId: number, memoId: number, data: {
    title?: string;
    content?: string;
    url?: string;
    memoDate?: string;
}) => {
    const res = await api.put(`/projects/${projectId}/memos/${memoId}`, data);
    return res.data;
};

// 메모 삭제
export const deleteMemo = async (projectId: number, memoId: number) => {
    try {
        await api.delete(`/projects/${projectId}/memos/${memoId}`);
        // 성공하면 그냥 return
        return true;
    } catch (err) {
        console.error("메모 삭제 실패:", err);
        throw err; // catch로 내려보내서 모달에서 알림 가능
    }
};

