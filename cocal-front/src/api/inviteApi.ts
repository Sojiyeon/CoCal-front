import {ApiResponse, MessageData} from "@/components/calendar/types";

// 프로젝트 초대 수락/거절
import {fetchJsonWithAuth} from "@/utils/authService";

export async function inviteAation(inviteId: number, action: string): Promise<string> {
    const url = `/api/team/invites/${inviteId}/${action}`
    // api 호출
    const result = await fetchJsonWithAuth <ApiResponse<MessageData>> (url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    });
    if (!result) {
        throw new Error("빈 응답을 받았습니다.");
    }
    if (!result.success) {
        throw new Error(result.error?.message || "이벤트를 수정하지 못했습니다.");
    }
    console.log("updateTodo: ", result.data);
    // data만 추출 후 반환
    return result.data.message;
}