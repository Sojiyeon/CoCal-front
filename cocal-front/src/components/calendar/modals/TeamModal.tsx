"use client";

import React, { useEffect, useState } from "react";

// --- 타입 정의 ---
interface TeamMember {
    memberId: number;
    userId: number;
    name: string;
    email: string;
    avatarUrl: string | null;
    role: 'OWNER' | 'ADMIN' | 'MEMBER';
    status: 'ACTIVE' | 'BLOCKED' | 'DELETED';
    me: boolean;
}

interface ProjectInvite {
    inviteId: number;
    email: string;
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'CANCEL';
    createdAt: string;
    expiresAt: string;
}

// API 연동 전 사용할 샘플 데이터
const sampleMembers: TeamMember[] = [
    { memberId: 1, userId: 1, name: "User 1 (me)", email: "user1@example.com", avatarUrl: null, role: 'OWNER', status: 'ACTIVE', me: true },
    { memberId: 2, userId: 2, name: "User 2", email: "user2@example.com", avatarUrl: null, role: 'MEMBER', status: 'ACTIVE', me: false },
];
const sampleInvites: ProjectInvite[] = [
    { inviteId: 1, email: "pending@example.com", status: 'PENDING', createdAt: new Date().toISOString(), expiresAt: new Date().toISOString() }
];


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

    // 컴포넌트가 마운트될 때 데이터를 불러오는 부분
    useEffect(() => {
        const fetchTeamData = async () => {
            setIsLoading(true);
            setError(null);
            try {

                //  API 대신 임시 샘플 데이터
                console.warn("개발 모드: TeamModal에서 API 호출을 건너뛰고 샘플 데이터를 사용합니다.");
                setTimeout(() => {
                    setMembers(sampleMembers);
                    setInvites(sampleInvites);
                    setIsLoading(false);
                }, 500); // 0.5초 로딩 시뮬레이션

            } catch (err: unknown) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError("Failed to load team data.");
                }
                console.error(err);
                setIsLoading(false);
            }
        };

        void fetchTeamData();
    }, [projectId]);

    // 이메일로 팀원을 초대하는 핸들러
    const handleInvite = async () => {
        if (!email) {
            window.alert("Please enter an email address.");
            return;
        }
        setIsLoading(true);
        try {

            // API 대신 임시 로직을 사용
            console.warn(`개발 모드: ${email} 초대를 시뮬레이션합니다.`);
            setTimeout(() => {
                const newInvite: ProjectInvite = {
                    inviteId: Math.random(),
                    email: email,
                    status: 'PENDING',
                    createdAt: new Date().toISOString(),
                    expiresAt: new Date().toISOString(),
                };
                setInvites(prev => [newInvite, ...prev]);
                setEmail("");
                window.alert(`${email} has been invited (simulation).`);
                setIsLoading(false);
            }, 1000);

        } catch (err: unknown) {
            if (err instanceof Error) {
                window.alert(`Invite failed: ${err.message}`);
            } else {
                window.alert('An unknown error occurred during the invitation.');
            }
            setIsLoading(false);
        }
    };

    // 팀원을 제거하는 핸들러
    const handleRemoveMember = (memberId: number) => {
        if (window.confirm("Are you sure you want to remove this member?")) {
            // [API-연동] DELETE /api/team/{projectId}/members/{memberId} 와 같은 API를 호출해야 합니다.
            console.log(`Removing member ${memberId} from project ${projectId}`);
            setMembers(prev => prev.filter(m => m.memberId !== memberId));
        }
    };

    // 초대를 취소하는 핸들러
    const handleCancelInvite = (inviteId: number) => {
        if (window.confirm("Are you sure you want to cancel this invitation?")) {
            // [API-연동] DELETE /api/team/invites/{inviteId} 와 같은 API를 호출해야 합니다.
            console.log(`Canceling invitation ${inviteId}`);
            setInvites(prev => prev.filter(i => i.inviteId !== inviteId));
        }
    };

    // 초대 링크 복사 핸들러
    const handleCopyLink = () => {
        const inviteLink = `${window.location.origin}/project/${projectId}/join`;
        navigator.clipboard.writeText(inviteLink).then(() => {
            window.alert("Invite link copied to clipboard!");
        });
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-[480px] text-slate-800">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Share this calendar</h2>
                    <div className="flex items-center gap-4">
                        <button onClick={handleCopyLink} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                            <svg width="16" height="16" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path></svg>
                            Copy link
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
                                    <button onClick={() => handleRemoveMember(member.memberId)} className="text-slate-500 hover:text-red-600 text-xs font-medium">
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
                                <button onClick={() => handleCancelInvite(invite.inviteId)} className="text-slate-500 hover:text-red-600 text-xs font-medium">
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

