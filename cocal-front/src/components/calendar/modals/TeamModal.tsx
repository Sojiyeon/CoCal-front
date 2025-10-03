"use client";

import React, { useEffect, useState } from "react";
import { ProjectMember } from "../types";

// 현재 로그인한 사용자의 ID (실제로는 인증 상태에서 가져와야 함)
const CURRENT_USER_ID = 1;

// API 연동 전 사용할 샘플 멤버 데이터
const sampleMembers: ProjectMember[] = [
    { userId: 1, name: "test1 (me)", email: "sample1@example.com", profileImageUrl: null, role: 'OWNER' },
    { userId: 2, name: "test2", email: "sample2@example.com", profileImageUrl: null, role: 'ADMIN' },
    { userId: 3, name: "test3", email: "sample3@example.com", profileImageUrl: null, role: 'MEMBER' },
    { userId: 4, name: "test4", email: "sample4@example.com", profileImageUrl: null, role: 'MEMBER' },
];

interface Props {
    projectId: number;
    onClose: () => void;
}

export function TeamModal({ projectId, onClose }: Props) {
    const [email, setEmail] = useState("");
    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // 컴포넌트 마운트 시 멤버 목록을 불러옵니다.
    useEffect(() => {
        // [API-연동] 실제 멤버 목록을 불러오는 API 호출 로직으로 교체 예정
        // 예: fetch(`/api/projects/${projectId}/members`).then(...)
        console.log(`Fetching members for project ${projectId}...`);
        setMembers(sampleMembers);
    }, [projectId]);

    // 팀원 초대 핸들러
    const handleInvite = () => {
        if (!email) {
            alert("Please enter an email address.");
            return;
        }
        setIsLoading(true);
        // [API-연동] 실제 멤버 목록을 불러오는 API 호출 로직으로 교체 예정
        // `project_invites` 테이블에 데이터를 추가하는 요청
        console.log(`Inviting ${email} to project ${projectId}`);
        setTimeout(() => {
            alert(`${email} has been invited.`);
            setEmail("");
            setIsLoading(false);
        }, 1000);
    };

    // 팀원 제거 핸들러
    const handleRemove = (memberId: number) => {
        if (confirm("Are you sure you want to remove this member?")) {
            // [API-연동] 실제 멤버 목록을 불러오는 API 호출 로직으로 교체 예정
            // `project_members` 테이블에서 데이터를 삭제하는 요청
            console.log(`Removing member ${memberId} from project ${projectId}`);
            setMembers(prev => prev.filter(m => m.userId !== memberId));
        }
    };

    // 초대 링크 복사 핸들러
    const handleCopyLink = () => {
        const inviteLink = `${window.location.origin}/project/${projectId}/join`;
        navigator.clipboard.writeText(inviteLink).then(() => {
            alert("Invite link copied to clipboard!");
        });
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-[480px] text-slate-800">
                {/* 모달 헤더 */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Share this calendar</h2>
                    <div className="flex items-center gap-4">
                        <button onClick={handleCopyLink} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path></svg>
                            Copy link
                        </button>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
                    </div>
                </div>

                {/* 이메일 초대 폼 */}
                <div className="flex gap-2 mb-6">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex-1 border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <button
                        onClick={handleInvite}
                        disabled={isLoading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 disabled:bg-blue-300"
                    >
                        {isLoading ? "Inviting..." : "Invite"}
                    </button>
                </div>

                {/* 멤버 목록 */}
                <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-3">Who has access</h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                        {members.map((member) => (
                            <div key={member.userId} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">
                                        {member.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-semibold">{member.name}</div>
                                        <div className="text-xs text-slate-400">{member.email}</div>
                                    </div>
                                </div>
                                {/* 현재 사용자가 아니면 'Remove' 버튼 표시 */}
                                {member.userId !== CURRENT_USER_ID ? (
                                    <button onClick={() => handleRemove(member.userId)} className="text-slate-500 hover:text-red-600 text-xs font-medium">
                                        Remove
                                    </button>
                                ) : (
                                    <span className="text-slate-400 text-xs font-medium">{member.role}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}