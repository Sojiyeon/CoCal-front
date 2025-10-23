// src/app/invites/[token]/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import InviteModal from '@/components/modals/InviteModal';
import { fetchWithAuth } from '@/utils/authService'; // API 호출 유틸리티
import { CheckCircle, XCircle } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

// 모달에 보여줄 프로젝트 정보 타입 (서버에서 가져올 정보)
interface ProjectInviteInfo {
    projectId: number;
    projectName: string;
    projectDescription: string;
    inviterEmail: string;
}

type InviteStatus = 'loading' | 'info_loaded' | 'pending' | 'accepted' | 'error' | 'expired';

const InvitePage = ({_params}: { _params: { token: string } }) => {
    const router = useRouter();
    const pathname = usePathname();
    const pathSegments = pathname.split('/');
    const inviteToken = pathSegments[pathSegments.length - 1];

    const {user, isLoading: isUserLoading} = useUser(); // UserContext에서 유저 정보와 로딩 상태를 가져옴

    // 모달에 표시할 프로젝트 정보 상태
    const [inviteInfo, setInviteInfo] = useState<ProjectInviteInfo | null>(null);
    // 초대 유효성 및 상태 (로딩)
    const [status, setStatus] = useState<InviteStatus>('loading');

    // 초대 정보 확인 및 상태 분기 처리
    useEffect(() => {
        if (!inviteToken) { // 토큰이 없으면 리디렉션
            if (!inviteToken) router.push('/');
            return;
        }
        if (status !== 'loading') return;

        const checkInvite = async () => {
            setStatus('loading');

            try {
                // 1-1. 비인증 API 호출
                const response = await fetch(`${API_BASE_URL}/api/invites/resolve?token=${inviteToken}`);
                const rawData = await response.json();

                if (!response.ok || !rawData.success || !rawData.data) {
                    const statusText = rawData.data?.status || 'UNKNOWN';

                    if (statusText === 'CANCEL' || statusText === 'EXPIRED') {
                        setStatus('expired');
                    } else {
                        setStatus('error');
                    }
                    return;
                }
                const data = rawData.data;

                const mappedData: ProjectInviteInfo = {
                    projectId: data.projectId,
                    projectName: data.projectName,
                    projectDescription: data.message || "프로젝트에 대한 상세 설명은 제공되지 않았습니다.",
                    inviterEmail: data.invitedByEmail,
                };
                setInviteInfo(mappedData);
                // 1-3. API 호출 성공, 인증 상태 확인을 위해 'info_loaded'로 상태 전환
                setStatus('info_loaded');

            } catch (error) {
                console.error("초대 확인 오류:", error);
                setStatus('error');
            }
        };
        checkInvite();
    }, [inviteToken, router]);

    // 로그인 상태 확인 및 리디렉션
    useEffect(() => {
        // 초대 정보 확인이 끝나지 않았거나, 이미 수락/오류 상태인 경우 대기
        if (status !== 'info_loaded' || isUserLoading) return; // UserContext 로딩 중인 경우 대기
        // 유저 정보 로드가 완료되었을 때 (isUserLoading === false)
        if (!user) {
            // 로그인이 안 되어 있다면: 로그인 페이지로 리디렉션
            const currentPath = window.location.pathname;
            router.push(`/?redirect=${encodeURIComponent(currentPath)}`);
        } else {
            // 로그인이 되어 있다면: 모달을 띄울 준비 (Pending)
            setStatus('pending');
        }

    }, [isUserLoading, status, user, router]);

    // 초대 수락 핸들러 (모달 내부에서 호출) 로그인 필요
    const handleAcceptInvite = useCallback(async () => {
        if (!inviteInfo) return;

        // 사용자 요청 사항 반영: 수락 버튼 클릭 시점에 user(AccessToken) 체크
        if (!user) {
            console.error("AccessToken missing. Redirecting to login.");
            const currentPath = window.location.href;
            router.push(`/?redirect=${encodeURIComponent(currentPath)}`);
            return;
        }
        try {
            // 인증된 사용자로 /api/invites/accept API 호출
            const response = await fetchWithAuth(`${API_BASE_URL}/api/invites/accept`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: inviteToken }),
            });

            if (!response.ok) {
                // ... (에러 처리)
                setStatus('error');
                return;
            }

            // 수락 성공 시
            setStatus('accepted');
            setTimeout(() => {
                // 대시보드로 이동
                router.push(`/dashboard?inviteAccepted=true`);
            }, 3000);

        } catch (error) {
            console.error("초대 수락 오류:", error);
            if (error instanceof Error && error.message.includes('SESSION_EXPIRED')) { //
                console.warn("Session expired detected. Forcing redirect to home/login.");
                const currentPath = window.location.href;
                router.push(`/?redirect=${encodeURIComponent(currentPath)}`);
                return; // 즉시 리디렉션 후 함수 종료
            }
            setStatus('error'); // 기타 네트워크 오류나 서버 오류일 경우
        }
    }, [inviteToken, inviteInfo, user, router]);

    // --- 렌더링 ---

    // 로딩 중이거나, 로그인/로그아웃 처리를 위해 UserContext 로딩 중일 때
    if (status === 'loading' || isUserLoading) {
        return <div className="min-h-screen flex items-center justify-center dark:bg-dark-bg text-gray-500 dark:text-dark-text-secondary">초대 정보 확인 중...</div>;
    }

    // 로그인 되어 있고, 정보 확인이 완료되었을 때 (inviteInfo가 있어야 모달 띄움)
    if (user && status === 'pending' && inviteInfo) {
        return (
            <InviteModal
                isOpen={true}
                onClose={() => router.push('/')}
                projectName={inviteInfo.projectName}
                description={inviteInfo.projectDescription}
                inviterEmail={inviteInfo.inviterEmail}
                onAccept={handleAcceptInvite}
            />
        );
    }
    // 초대 만료 또는 오류 메시지
    if (status === 'expired' || status === 'error') {
        const title = status === 'expired' ? '초대 링크 만료/유효하지 않음' : '처리 중 오류 발생';
        const message = status === 'expired' ? '초대 링크가 만료되었거나 올바르지 않습니다.' : '초대 정보를 처리하는 중 문제가 발생했습니다.';

        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-dark-bg">
                <div className="bg-white dark:bg-dark-surface p-10 rounded-xl shadow-lg text-center max-w-sm">
                    <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2 dark:text-dark-text-primary">{title}</h2>
                    <p className="text-gray-600 dark:text-dark-text-secondary mb-6">{message}</p>
                    <button
                        onClick={() => router.push('/')}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
                    >
                        대시보드로 돌아가기
                    </button>
                </div>
            </div>
        );
    }

    // 초대 수락 성공 메시지
    if (status === 'accepted' && inviteInfo) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-dark-bg">
                <div className="bg-white dark:bg-dark-surface p-10 rounded-xl shadow-lg text-center max-w-sm">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2 dark:text-dark-text-primary">초대 수락 완료!</h2>
                    <p className="text-gray-600 dark:text-dark-text-secondary mb-6">
                        &apos;{inviteInfo.projectName}&apos; 프로젝트에 성공적으로 참여했습니다. 잠시 후 대시보드로 이동합니다.
                    </p>
                    <button
                        onClick={() => router.push('/dashboard')} // 버튼 클릭 시 즉시 이동 가능
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
                    >
                        대시보드로 즉시 이동
                    </button>
                </div>
            </div>
        );
    }
    return null; // 그 외의 경우는 처리 중이거나 리디렉션될 예정
};

export default InvitePage;