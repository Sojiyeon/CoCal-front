"use client"

import {fetchJsonWithAuth} from "@/utils/authService";
export type MemberRole = "OWNER" | "ADMIN" | "MEMBER";
export type MemberStatus = "ACTIVE" | "LEFT" | "KICKED";
export type InviteStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED";

// 팀원 조회 응답 형식(팀원)
export interface TeamMember {
    memberId: number;
    userId: number;
    name: string;
    email: string;
    avatarUrl: string | null;
    role: MemberRole;
    status: MemberStatus;
    updatedAt: string; // ISO
    me: boolean;
}
// 팀원 조회 응답 형식(초대 대기중)
export interface TeamInvite {
    inviteId: number;
    email: string;
    status: InviteStatus;
    createdAt: string;  // ISO
    expiresAt: string;  // ISO
}
// 서버 공통 응답 확인
interface ApiResponse<T> {
    success: boolean;
    data: T;
    error: { message?: string } | null;
    serverTime: string;
    path: string;
}
export interface TeamListData {
    members: TeamMember[];
    invites: TeamInvite[];
}
// 초대 링크 복사 응답 형식
export interface OpenLinkInviteDTO {
    id: number;
    projectId: number;
    type: "OPEN_LINK";
    email: string | null;
    status: "PENDING" | "ACCEPTED" | "DECLINED";
    expiresAt: string | null;
    createdAt: string | null;
    invitedBy: string | null;
    inviteLink: string; // ex) "https://cocal-front.vercel.app/invite/<초대토큰>"
}

// 팀 멤버/초대 목록 조회
export async function getTeamList(projectId: number | string): Promise<TeamListData> {
    const url = `/api/team/${projectId}/list`;

    const result = await fetchJsonWithAuth<ApiResponse<TeamListData>>(url, {
        method: "GET",
    });
    if (!result) {
        throw new Error("빈 응답을 받았습니다. (204 또는 본문 없음)");
    }
    if (!result.success) {
        throw new Error(result.error?.message || "팀 목록을 불러오지 못했습니다.");
    }
    console.log(result.data);
    return result.data;
}

// 이메일로 팀원 초대
export async function sendEmailInvite(
    projectId: number | string,
    email: string
): Promise<TeamInvite> {
    const url = `/api/team/${projectId}/invites-email`;
    const body = JSON.stringify({ email });
    const result = await fetchJsonWithAuth<ApiResponse<any>>(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body,
    });
    if (!result) {
        throw new Error("서버에서 응답이 없습니다.");
    }
    if (!result.success) {
        throw new Error(result.error?.message || "초대 요청에 실패했습니다.");
    }
    const invite = result.data;

    // 서버 응답의 id 필드를 inviteId로 맞춰줌
    const normalizedInvite: TeamInvite = {
        inviteId: invite.id,
        email: invite.email,
        status: invite.status,
        createdAt: invite.createdAt,
        expiresAt: invite.expiresAt,
    };

    return normalizedInvite;
}

// 팀 멤버 추방
export async function kickMember(
    projectId: number | string,
    userId: number | string
): Promise<string> {
    const url = `/api/projects/${projectId}/team/${userId}/kick`;

    const result = await fetchJsonWithAuth<ApiResponse<{ message: string }>>(url, {
        method: "POST",
    });
    if (!result) {
        throw new Error("서버 응답이 없습니다.");
    }
    if (!result.success) {
        throw new Error(result.error?.message || "멤버 추방에 실패했습니다.");
    }

    // 서버 메시지 반환
    return result.data.message;
}

// 초대를 취소하는 핸들러
export async function cancelInvite(
    projectId: number | string,
    inviteId: number | string
): Promise<string> {
    const url = `/api/projects/${projectId}/team/invites/${inviteId}`;

    const result = await fetchJsonWithAuth<ApiResponse<{ message: string }>>(url, {
        method: "POST",
    });
    if (!result) {
        throw new Error("서버 응답이 없습니다.");
    }
    if (!result.success) {
        throw new Error(result.error?.message || "초대 취소에 실패했습니다.");
    }

    // 서버 메시지 반환
    return result?.data?.message;
}

// 초대 링크 복사
export async function getOpenInviteLink(projectId: number): Promise<string> {
    const url = `/api/team/${projectId}/invites-link`;
    const res = await fetchJsonWithAuth<ApiResponse<OpenLinkInviteDTO>>(url, {
        method: "GET",
    });
    console.log(res);
    if (!res || !res.success) {
        throw new Error("초대 링크 조회에 실패했습니다.");
    }
    if (!res.data?.inviteLink) {
        throw new Error("서버 응답에 inviteLink가 없습니다.");
    }
    return res.data.inviteLink;
}