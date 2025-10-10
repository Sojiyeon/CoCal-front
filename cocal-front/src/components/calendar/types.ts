// ===================== 타입 정의 =====================
// [추가] API 응답에 있는 사용자 요약 정보 타입을 정의합니다.
export interface UserSummary {
    userId: number;
    name: string;
    email: string;
    profileImageUrl: string | null;
}
// 이벤트 종속 할 일 타입 (event_todos 테이블)
export type EventTodo = {
    id: number;
    eventId: number;
    urlId: number;
    title: string;
    description: string | null;
    status: 'IN_PROGRESS' | 'DONE';
    offsetMinutes: number;
    authorId: number | null;
    orderNo: number;
};

// 이벤트 데이터 타입 (events 테이블)
export type CalendarEvent = {
    id: number;
    projectId: number;
    urlId: number;
    title: string;
    description: string | null;
    startAt: string;
    endAt: string;
    allDay: boolean;
    visibility: 'PRIVATE' | 'PUBLIC';
    authorId: number;
    location: string | null;
    offsetMinutes: number;
    color: string;
//    name: string;
    todos?: EventTodo[];
};

// 개인 할 일 타입 (private_todos 테이블)
export type PrivateTodo = {
    id: number;
    projectId: number;
    //owner_id: number;
    urlId: number;
    title: string;
    description: string | null;
    date: string | null; // DATETIME 값
    status: 'IN_PROGRESS' | 'DONE';
    offsetMinutes: number;
    orderNo: number;
};

// 날짜 메모 타입 (memos 테이블)
export type DateMemo = {
    id: number;
    projectId: number;
    authorId: number;
    memoDate: string; // DATE 값 (e.g., "2025-09-23")
    content: string;
};

// 프로젝트 멤버 타입
export interface ProjectMember {
    userId: number;
    name: string;
    email: string;
    profileImageUrl: string | null;

}
export interface Project {
    id: number;
    name: string;
    ownerId: number;
    startDate: string;
    endDate: string;
    status: 'In Progress' | 'Completed';
    members: ProjectMember[];
   // colorTags: string[]; // 색상 태그
}

// // Project
// export interface Project {
//     id: number;
//     name: string;
//     ownerId: number;
//     startDate: string;
//     endDate: string;
//     status: 'IN_PROGRESS' | 'COMPLETED';
//     members: ProjectMember[];
//
// }

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
    startAt: string;
    endAt: string;
    location: string;
    visibility: 'PUBLIC' | 'PRIVATE';
    memoDate: string;
    content: string;
    category: string;
}

