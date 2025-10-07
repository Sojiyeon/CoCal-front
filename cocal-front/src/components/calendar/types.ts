// ===================== 타입 정의 =====================

// 이벤트 데이터 타입 (events 테이블)
export type CalendarEvent = {
    id: number;
    project_id: number;
    url_id: number; // [추가]
    title: string;
    description: string | null;
    start_at: string; // DATETIME 값 (e.g., "2025-09-23T10:00:00")
    end_at: string;
    all_day: boolean;
    visibility: 'PRIVATE' | 'PUBLIC';
    author_id: number;
    location: string | null;
    offset_minutes: number; // [추가]
    color: string;
    project_name?: string;
    todos?: EventTodo[];
};

// 이벤트 종속 할 일 타입 (event_todos 테이블)
export type EventTodo = {
    id: number;
    event_id: number;
    url_id: number; // [추가]
    title: string;
    description: string | null;
    status: 'IN_PROGRESS' | 'DONE';
    offset_minutes: number; // [추가]
    author_id: number | null; // [추가]
    order_no: number; // [추가]
};

// 개인 할 일 타입 (private_todos 테이블)
export type PrivateTodo = {
    id: number;
    project_id: number;
    owner_id: number;
    url_id: number; // [추가]
    title: string;
    description: string | null;
    date: string | null; // DATETIME 값
    status: 'IN_PROGRESS' | 'DONE';
    offset_minutes: number; // [추가]
    order_no: number; // [추가]
};

// 날짜 메모 타입 (date_memos 테이블)
export type DateMemo = {
    id: number;
    project_id: number;
    author_id: number;
    memo_date: string; // DATE 값 (e.g., "2025-09-23")
    content: string;
};
// [추가] 프로젝트 멤버의 상세 타입을 정의합니다. (API 응답 참고)
export interface ProjectMemberDetail {
    userId: number;
    name: string;
    email: string;
    profileImageUrl: string | null;
}

// [추가 또는 수정] 프로젝트 데이터 타입을 API 응답에 맞춰 상세하게 정의합니다.
export interface Project {
    id: number;
    name: string;
    ownerId: number;
    startDate: string;
    endDate: string;
    status: 'IN_PROGRESS' | 'COMPLETED'; // status 타입을 구체적으로 명시
    description: string | null;
    members: ProjectMemberDetail[];
    // colorTags는 API 응답에 없으므로 제거하거나, 프론트에서 별도로 관리해야 합니다.
}
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

