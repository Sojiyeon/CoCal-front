// ===================== 타입 정의 =====================

// 이벤트 데이터 타입 (events 테이블)
export type CalendarEvent = {
    id: number;
    project_id: number;
    title: string;
    description: string | null;
    start_at: string; // DATETIME 값 (e.g., "2025-09-23T10:00:00")
    end_at: string;
    all_day: boolean;
    visibility: 'PRIVATE' | 'PUBLIC';
    author_id: number;
    location: string | null;
    color: string;
    project_name?: string;
};

// 개인 할 일 타입 (private_todos 테이블)
export type PrivateTodo = {
    id: number;
    project_id: number;
    owner_id: number;
    title: string;
    description: string | null;
    date: string | null; // DATETIME 값
    status: 'IN_PROGRESS' | 'DONE';

};

// 날짜 메모 타입 (date_memos 테이블)
export type DateMemo = {
    id: number;
    project_id: number;
    author_id: number;
    memo_date: string; // DATE 값 (e.g., "2025-09-23")
    content: string;
};

// 할 일 현황 대시보드 데이터 구조
export interface TaskStats {
    completed: number;
    todo: number;
    all: number;
    percent: number;
}

// 프로젝트 멤버 데이터 타입
export type ProjectMember = {
    userId: number;
    name: string;
    email: string;
    profileImageUrl: string | null;
    role: 'OWNER' | 'ADMIN' | 'MEMBER';
};
