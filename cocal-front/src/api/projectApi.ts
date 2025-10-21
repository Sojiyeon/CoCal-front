"use client"

import {fetchJsonWithAuth} from "@/utils/authService";
import {ApiResponse, MessageData, Project} from "@/components/calendar/types";

const PROJECT_URL: string = "/api/projects/";

// 프로젝트 정보 조회
export async function getProject(projectId: number): Promise<Project> {
    const url = `${PROJECT_URL}${projectId}`
    // api 호출
    const result = await fetchJsonWithAuth<ApiResponse<Project>>(url, {
        method: "GET",
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (!result) {
        throw new Error("빈 응답을 받았습니다.");
    }
    if (!result.success) {
        throw new Error(result.error?.message || "프로젝트 정보를 불러오지 못했습니다.");
    }
    console.log(result.data);
    // data만 추출 후 반환
    return result.data;
}

// 프로젝트 수정
export async function editProject (
    projectId: number,
    data: {
        name?: string;
        startDate?: string;
        endDate?: string;
        status?: string;
    }
): Promise<Project> {
    const url = `${PROJECT_URL}${projectId}`;
    const res = await fetchJsonWithAuth<ApiResponse<Project>>(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!res) {
        throw new Error("서버에서 응답이 없습니다.");
    }
    if (!res.success) {
        throw new Error(res.error?.message || "프로젝트 수정에 실패했습니다.");
    }

    // data만 추출
    const project = res.data as Project;

    return project;
};

// 프로젝트 자발적 나가기
export async function leaveProject(projectId: number): Promise<string> {
    const url = `${PROJECT_URL}${projectId}/team/leave`
    // api 호출
    const result = await fetchJsonWithAuth<ApiResponse<MessageData>>(url, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (!result) {
        throw new Error("빈 응답을 받았습니다.");
    }
    if (!result.success) {
        throw new Error(result.error?.message || "프로젝트를 나가지 못했습니다.");
    }
    console.log(result.data);
    // data만 추출 후 반환
    return result.data.message;
}

// 프로젝트 삭제
export async function deleteProject(projectId: number): Promise<string> {
    const url = `${PROJECT_URL}${projectId}`
    // api 호출
    const result = await fetchJsonWithAuth<ApiResponse<MessageData>>(url, {
        method: "DELETE",
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (!result) {
        throw new Error("빈 응답을 받았습니다.");
    }
    if (!result.success) {
        throw new Error(result.error?.message || "프로젝트를 삭제하지 못했습니다.");
    }
    console.log(result.data);
    // data만 추출 후 반환
    return result.data.message;
}