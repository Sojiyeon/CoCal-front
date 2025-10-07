"use client";

import React from 'react';
import CalendarUI from '@/components/calendar/CalendarUI';
// UserProvider를 import 합니다. (경로는 실제 프로젝트 구조에 맞게 조정하세요)
import { UserProvider } from '@/contexts/UserContext';

export default function CalendarPage() {
    return (
        // UserProvider로 CalendarUI 컴포넌트 전체를 감싸줍니다.
        // 이렇게 하면 CalendarUI와 그 하위의 모든 컴포넌트(프로필 모달 등)들이
        // useUser 훅을 통해 사용자 정보에 접근할 수 있게 됩니다.
        <UserProvider>
            <CalendarUI />
        </UserProvider>
    );
}

