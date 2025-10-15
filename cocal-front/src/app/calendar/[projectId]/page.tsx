"use client";

import React from 'react';
import CalendarUI from '@/components/calendar/CalendarUI';
// UserProvider를 import 합니다. (경로는 실제 프로젝트 구조에 맞게 조정하세요)
import { UserProvider } from '@/contexts/UserContext';
import useAuthRedirect from '@/hooks/useAuthRedirect'; // 👈 훅 임포트

export default function CalendarPage() {
    // 훅을 호출하여 인증 상태 확인 및 리디렉션 로직 실행
    const { isChecking, isAuthenticated } = useAuthRedirect();
    // 인증 확인 중이거나 인증되지 않았을 때 (리디렉션 중)
    if (isChecking || !isAuthenticated) {
        // useAuthRedirect 훅이 이미 /로 리디렉션 로직을 실행했으므로,
        // 여기서는 빈 화면(null)이나 로딩 상태를 표시하여 깜빡임을 최소화합니다.
        return null;
    }

    return (
        // UserProvider로 CalendarUI 컴포넌트 전체를 감싸줍니다.
        // 이렇게 하면 CalendarUI와 그 하위의 모든 컴포넌트(프로필 모달 등)들이
        // useUser 훅을 통해 사용자 정보에 접근할 수 있게 됩니다.
        <UserProvider>
            <CalendarUI />
        </UserProvider>
    );
}

