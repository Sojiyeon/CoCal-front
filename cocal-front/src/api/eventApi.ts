"use client"

import {fetchJsonWithAuth} from "@/utils/authService";
import {ApiResponse, EventData, EventCreateResponse, EventRequest} from "@/components/calendar/types";

const PROJECT_URL: string = "/api/projects/";

// 이벤트 조회
export async function getEvent(projectId: number, eventId: number): Promise<EventData> {
    const url = `${PROJECT_URL}${projectId}/events/${eventId}`
    // api 호출
    const result = await fetchJsonWithAuth<ApiResponse<EventData>>(url, {
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
    console.log(result.data);
    // data만 추출 후 반환
    return result.data;
}

// 이벤트 생성
export async function createEvent(projectId: number, body: EventRequest): Promise<EventCreateResponse> {
    console.log("createEvent 호출됨");
    const url = `${PROJECT_URL}${projectId}/events`
    // api 호출
    const result = await fetchJsonWithAuth<ApiResponse<EventCreateResponse>>(url, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    if (!result) {
        throw new Error("빈 응답을 받았습니다.");
    }
    if (!result.success) {
        throw new Error(result.error?.message || "이벤트를 생성하지 못했습니다.");
    }
    console.log(result.data);
    // data만 추출 후 반환
    return result.data;
}

// 이벤트 수정
export async function updateEvent(projectId: number, eventId: number, body: EventRequest): Promise<EventData> {
    const url = `${PROJECT_URL}${projectId}/events/${eventId}`
    // api 호출
    const result = await fetchJsonWithAuth<ApiResponse<EventData>>(url, {
        method: "PUT",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    if (!result) {
        throw new Error("빈 응답을 받았습니다.");
    }
    if (!result.success) {
        throw new Error(result.error?.message || "이벤트를 생성하지 못했습니다.");
    }
    console.log(result.data);
    // data만 추출 후 반환
    return result.data;
}