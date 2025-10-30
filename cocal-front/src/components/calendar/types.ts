
//  API 응답에 있는 사용자 요약 정보 타입을 정의
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
    title: string;
    description: string | null;
    status: 'IN_PROGRESS' | 'DONE';
    authorId: number | null;
    orderNo: number;
    type: 'EVENT' | 'PRIVATE'; // [수정] 'PRIVATE'도 허용하도록 확장
    url?: string;
};
// 사이드바의 'To do' 목록에 사용될 확장된 타입 정의
export interface SidebarTodo extends EventTodo {
    id: number;
    title: string;
    status: 'IN_PROGRESS' | 'DONE';
    type: 'EVENT' | 'PRIVATE'; // Public(EVENT) / Private 구분
    parentEventTitle?: string;
    parentEventColor?: string;
    parentPrivateBorder?: string;
    authorId: number | null;
    url?: string;
    eventId: number;
    date:string;
    offsetMinutes?: number | null;

}

// 이벤트 데이터 타입  (events 테이블)
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
    offsetMinutes?: number | null;
    color: string;
//    name: string;
    todos?: EventTodo[];
    memo?: DateMemo[];
    url?: string;

};

// 개인 할 일 타입 (private_todos 테이블)


export interface PrivateTodo {
    id: number;
    title: string;
    description: string | null;
    date: string;
    status: 'IN_PROGRESS' | 'DONE';
    type: 'PRIVATE';
    projectId: number;
    userId: number;
    url?: string | null;
    offsetMinutes?: number | null;
}

// [수정] 날짜 메모 타입 (memos 테이블)
export type DateMemo = {
    id: number; //
    projectId: number;
    memoDate: string;
    content: string;
    author: UserSummary[];
    createdAt: string;
    title: string;
    url: string;
};

// 프로젝트 멤버 타입
export interface ProjectMember {
    userId: number;
    name: string;
    email: string;
    profileImageUrl: string | null;
}
// 프로젝트 타입
export interface Project {
    id: number;
    name: string;
    ownerId: number;
    startDate: string;
    endDate: string;
    status: 'In Progress' | 'Completed';
    members: ProjectMember[];
    description?: string;
   // colorTags: string[]; // 색상 태그
}

// 뷰 타입
export type DefaultView = 'MONTH' | 'WEEK' | 'DAY';

// TeamModal에서 사용할 팀 멤버 상세 타입을 API 응답에 맞춰 정의
export interface TeamMemberDetail extends ProjectMember {
    memberId: number;
    role: 'OWNER' | 'ADMIN' | 'MEMBER';
    status: 'ACTIVE' | 'BLOCKED' | 'DELETED' | 'LEFT' | 'KICKED';
    me: boolean;
}

//TeamModal에서 사용할 프로젝트 초대 타입
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
    color: string;
    offsetMinutes?: number | null;
    eventId?: number;
}

// 서버 공통 응답 형식
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    error: { message?: string } | null;
    serverTime: string;
    path: string;
}

export interface MessageData {
    message: string;
}

// 이벤트 생성 응답 형식(memberUserIds: number[] 사용)
export interface EventCreateResponse {
    id: number;
    projectId: number;
    title: string;
    description: string;
    startAt: string;
    endAt: string;
    allDay: boolean;
    visibility: 'PUBLIC' | 'PRIVATE';
    location: string | null;
    url: string | null;
    creatorId: number;
    createdAt: string;
    offsetMinutes: number;
    color: string;
    urls: EventUrl[];
    memberUserIds: number[];
}
// 이벤트 생성/수정 요청 형식
export type EventRequest = {
    projectId: number;
    title: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    allDay?: boolean;
    visibility?: 'PUBLIC' | 'PRIVATE';
    description?: string;
    location?: string | null;
    offsetMinutes?: number;
    color?: string;
    urls?: string[];
    memberUserIds?: number[];
};
// 이벤트 응답 형식(members:ProjectMember[] 사용)
export interface EventData {
    id: number;
    projectId: number;
    title: string;
    description: string;
    startAt: string;
    endAt: string;
    allDay: boolean;
    visibility: 'PUBLIC' | 'PRIVATE';
    location: string | null;
    url: string | null;
    creatorId: number;
    createdAt: string;
    offsetMinutes: number;
    color: string;
    urls: EventUrl[];
    members: ProjectMember[];
}
// 이벤트 url 응답 형식
export interface EventUrl {
    id: number;
    url: string;
    orderNo: number;
}

// 이벤트 별 투두 조회 응답
export interface EventTodoListResponse {
    projectId: number;
    date: string | null;
    count: number;
    items: RealEventTodo[];
}
export type RealEventTodo = {
    id: number;
    eventId: number;
    title: string;
    description: string | null;
    eventTitle: string | null;
    eventColor: string | null;
    status: 'IN_PROGRESS' | 'DONE';
    authorId: number | null;
    orderNo: number;
    type: 'EVENT' | 'PRIVATE';
    url?: string;
};
