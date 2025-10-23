"use client";

import React, { useEffect, useState } from "react";
import {
    getTeamList,
    TeamMember,
    TeamInvite,
    sendEmailInvite,
    kickMember,
    getOpenInviteLink,
    cancelInvite
} from "@/api/teamApi";

interface ProjectInvite {
    inviteId: number;
    email: string;
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'CANCEL';
    createdAt: string;
    expiresAt: string;
}

interface Props {
    projectId: number;
    onClose: () => void;
}

export function TeamModal({ projectId, onClose }: Props) {
    const [email, setEmail] = useState("");
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [invites, setInvites] = useState<ProjectInvite[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copying, setCopying] = useState(false);

    // 컴포넌트가 마운트될 때 데이터를 불러오는 부분
    useEffect(() => {
        (async () => {
            setIsLoading(true);
            setError(null);
            try {
                const { members, invites } = await getTeamList(projectId);
                setMembers(members);
                setInvites(invites);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "팀원 데이터를 불러오지 못했습니다.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        })();
    }, [projectId]);

    // 이메일로 팀원을 초대하는 핸들러
    const handleInvite = async () => {
        if (!email) {
            window.alert("이메일을 적어주세요.");
            return;
        }
        setIsLoading(true);
        try {
            // api 요청
            const newInvite: TeamInvite = await sendEmailInvite(projectId, email);
            setInvites((prev) => [newInvite, ...prev]);
            setEmail("");
            window.alert(`${email}님에게 초대 메일을 보냈습니다.`);
        } catch (err: unknown) {
            if (err instanceof Error) {
                window.alert(`Invite failed: ${err.message}`);
            } else {
                window.alert("초대 요청 중 알 수 없는 에러가 발생했습니다.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    // 팀원을 제거하는 핸들러
    const handleRemoveMember = async (projectId: number, userId: number) => {
        const confirm = window.confirm("정말 이 멤버를 추방하시겠습니까?");
        if (!confirm) return;
        try {
            // api 요청
            const message = await kickMember(projectId, userId);
            alert(message);
            setMembers(prev => prev.filter(m => m.userId !== userId));
        } catch (err: unknown) {
            console.error(err);
        }
    };

    // 초대를 취소하는 핸들러
    const handleCancelInvite =  async (projectId: number, inviteId: number) => {
        if (!window.confirm("정말 이 초대를 취소하시겠습니까?")) return;
        try {
            // api 호출
            const message = await cancelInvite(projectId, inviteId);
            alert(message);
            // 성공 시 상태 업데이트
            setInvites((prev) => prev.filter((i) => i.inviteId !== inviteId));
        } catch (err: unknown) {
            console.error("초대 취소 실패:", err);
            alert(
                err instanceof Error
                    ? err.message
                    : "초대 취소 중 알 수 없는 오류가 발생했습니다."
            );
        }
    };

    // 초대 링크 복사 핸들러
    const handleCopyLink = async () => {
        if (typeof window === "undefined") return;
        setCopying(true);
        try {
            const inviteLink = await getOpenInviteLink(projectId);
            await navigator.clipboard.writeText(inviteLink);
            window.alert("초대 링크가 클립보드에 복사되었습니다!");
        } catch (err: unknown) {
            console.error(err);
        } finally {
            setCopying(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-[480px] text-slate-800">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Share this calendar</h2>
                    <div className="flex items-center gap-4">
                        <button onClick={handleCopyLink} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                            <svg width="16" height="16" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path></svg>
                            {copying ? "Copying..." : "Copy Link"}
                        </button>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
                    </div>
                </div>

                <div className="flex gap-2 mb-6">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault(); // 폼 제출 막기
                                handleInvite();
                            }
                        }}
                        className="flex-1 border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <button
                        onClick={() => void handleInvite()} // [수정] Promise 반환 무시 경고를 해결합니다.
                        disabled={isLoading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 disabled:bg-blue-300"
                    >
                        {isLoading ? "Inviting..." : "Invite"}
                    </button>
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-slate-500">Who has access</h3>
                    {error && <p className="text-xs text-red-500">{error}</p>}
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                        {members.map((member) => (
                            <div key={`member-${member.userId}`} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-3">
                                    {/* [수정] <img>를 Next.js의 <Image>로 교체하여 성능 경고를 해결합니다. */}
                                    <img src={member.avatarUrl || `https://placehold.co/32x32/E2E8F0/475569?text=${member.name.charAt(0)}`} alt={member.name} width={32} height={32} className="w-8 h-8 rounded-full" />
                                    <div>
                                        <div className="font-semibold">{member.name} {member.me && '(me)'}</div>
                                        <div className="text-xs text-slate-400">{member.email}</div>
                                    </div>
                                </div>
                                {!member.me ? (
                                    <button onClick={() => handleRemoveMember(projectId, member.userId)} className="text-slate-500 hover:text-red-600 text-xs font-medium">
                                        Remove
                                    </button>
                                ) : (
                                    <span className="text-slate-400 text-xs font-medium">{member.role}</span>
                                )}
                            </div>
                        ))}
                        {invites.map((invite) => (
                            <div key={`invite-${invite.inviteId}`} className="flex items-center justify-between text-sm opacity-70">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">?</div>
                                    <div>
                                        <div className="font-semibold italic">{invite.email}</div>
                                        <div className="text-xs text-slate-400">{invite.status}...</div>
                                    </div>
                                </div>
                                <button onClick={() => handleCancelInvite(projectId, invite.inviteId)} className="text-slate-500 hover:text-red-600 text-xs font-medium">
                                    Cancel
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

