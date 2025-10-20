// src/components/calendar/utils/todoApi.ts
import {api} from "@/components/calendar/utils/api";
import {ApiResponse, EventTodo, EventTodoListResponse, RealEventTodo} from "@/components/calendar/types";
import {fetchJsonWithAuth} from "@/utils/authService";

const PROJECT_URL: string = "/api/projects/";
export type TodoType = "PRIVATE" | "EVENT";
export type Status = "IN_PROGRESS" | "DONE";

export interface TodoData {
    title: string;
    description?: string;
    url?: string;
    date: string; // ISO string
    offsetMinutes: number | null;
    type: TodoType;
    eventId?: number;
    projectId: number;
}

export interface updateTodoRequest {
    title: string;
    description?: string;
    url?: string;
    status: Status;
    type: TodoType
    eventId: number;
    projectId: number;
}

// Todo 생성
export const createTodo = async (projectId: number, data: TodoData) => {
    const res = await api.post(`/projects/${projectId}/todos`, data);
    return res.data;
};

// 이벤트별 Todo 조회
export async function getEventTodoAll(projectId: number, eventId: number): Promise<RealEventTodo[]> {
    const url = `${PROJECT_URL}${projectId}/events/${eventId}/todos`
    // api 호출
    const result = await fetchJsonWithAuth<ApiResponse<EventTodoListResponse>>(url, {
        method: "GET",
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (!result) {
        throw new Error("빈 응답을 받았습니다.");
    }
    if (!result.success) {
        throw new Error(result.error?.message || "이벤트를 조회하지 못했습니다.");
    }
    console.log("getEventTodoAll: ", result.data);
    // data만 추출 후 반환
    return result.data.items;
}

// 투두 수정    
export async function updateTodo(projectId: number, todoId: number, data: updateTodoRequest): Promise<RealEventTodo> {
    const url = `${PROJECT_URL}${projectId}/todos/${todoId}`
    // api 호출
    const result = await fetchJsonWithAuth<ApiResponse<RealEventTodo>>(url, {
        method: "PUT",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!result) {
        throw new Error("빈 응답을 받았습니다.");
    }
    if (!result.success) {
        throw new Error(result.error?.message || "이벤트를 수정하지 못했습니다.");
    }
    console.log("updateTodo: ", result.data);
    // data만 추출 후 반환
    return result.data;
}

// 투두 삭제
export async function deleteTodo(projectId:number, todoId: number, eventId: number,  type: "EVENT" | "PRIVATE"): Promise<string> {
    const url = `${PROJECT_URL}${projectId}/todos/${todoId}?type=${type}&eventId=${eventId}`
    // api 호출
    const result = await fetchJsonWithAuth<ApiResponse<string>>(url, {
        method: "DELETE",
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (!result) {
        throw new Error("빈 응답을 받았습니다.");
    }
    if (!result.success){
        throw new Error(result.error?.message || "이벤트를 삭제하지 못했습니다.");
    }
    console.log("delete: ", result.data);
    // data만 반환
    return result.data;
}
