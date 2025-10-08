// ===================== 타입 정의 =====================

// 이벤트 종속 할 일 타입 (event_todos 테이블)
export type EventTodo = {
    id: number;
    event_id: number;
    url_id: number;
    title: string;
    description: string | null;
    status: 'IN_PROGRESS' | 'DONE';
    offset_minutes: number;
    author_id: number | null;
    order_no: number;
};

// 이벤트 데이터 타입 (events 테이블)
export type CalendarEvent = {
    id: number;
    project_id: number;
    url_id: number;
    title: string;
    description: string | null;
    start_at: string;
    end_at: string;
    all_day: boolean;
    visibility: 'PRIVATE' | 'PUBLIC';
    author_id: number;
    location: string | null;
    offset_minutes: number;
    color: string;
    project_name?: string;
    todos?: EventTodo[];
};

// 개인 할 일 타입 (private_todos 테이블)
export type PrivateTodo = {
    id: number;
    project_id: number;
    owner_id: number;
    url_id: number;
    title: string;
    description: string | null;
    date: string | null; // DATETIME 값
    status: 'IN_PROGRESS' | 'DONE';
    offset_minutes: number;
    order_no: number;
};

// 날짜 메모 타입 (memos 테이블)
export type DateMemo = {
    id: number;
    project_id: number;
    author_id: number;
    memo_date: string; // DATE 값 (e.g., "2025-09-23")
    content: string;
};

// [수정] TeamModal 및 Dashboard에서 함께 사용할 프로젝트 멤버 타입을 정의합니다.
export interface ProjectMember {
    userId: number;
    name: string;
    email: string;
    profileImageUrl: string | null;
    // role과 같은 추가 정보가 필요하면 여기에 추가할 수 있습니다.
}

// [수정] 프로젝트 데이터 타입을 API 응답에 맞춰 상세하게 정의합니다.
// ProjectMemberDetail 대신 ProjectMember를 사용하고, description 필드를 제거합니다.
export interface Project {
    id: number;
    name: string;
    ownerId: number;
    startDate: string;
    endDate: string;
    status: 'IN_PROGRESS' | 'COMPLETED';
    members: ProjectMember[];
    // description 필드는 DB에 없으므로 제거했습니다. 필요하다면 DB에 추가해야 합니다.
}

// [추가] TeamModal에서 사용할 팀 멤버 상세 타입을 API 응답에 맞춰 정의합니다.
export interface TeamMemberDetail extends ProjectMember {
    memberId: number;
    role: 'OWNER' | 'ADMIN' | 'MEMBER';
    status: 'ACTIVE' | 'BLOCKED' | 'DELETED' | 'LEFT' | 'KICKED';
    me: boolean;
}

// [추가] TeamModal에서 사용할 프로젝트 초대 타입을 정의합니다.
export interface ProjectInvite {
    inviteId: number;
    email: string;
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'CANCEL';
    createdAt: string;
    expiresAt: string;
}

// 할 일 현황 대시보드 데이터 구조
export interface TaskStats {
    completed: number;
    todo: number;
    all: number;
    percent: number;
}

// EventModal에서 사용하는 폼 데이터의 통합 타입
export interface ModalFormData {
    title: string;
    description: string;
    url: string;
    start_at: string;
    end_at: string;
    location: string;
    visibility: 'PUBLIC' | 'PRIVATE';
    memo_date: string;
    content: string;
    category: string;
}

