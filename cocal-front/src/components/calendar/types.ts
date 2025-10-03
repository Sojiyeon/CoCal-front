// ===================== 타입 정의 =====================

// 이벤트 데이터 타입
export type CalendarEvent = {
    id: number;
    project_id: number; // NOT NULL이므로 null 제거
    title: string;
    description: string | null;
    start_at: string; // DATETIME 값 (e.g., "2025-09-23T10:00:00")
    end_at: string;   // DATETIME 값
    all_day: boolean; // DB의 TINYINT(1)은 boolean으로 매칭
    visibility: 'PRIVATE' | 'PUBLIC';
    author_id: number;
    location: string | null;
    color: string; // NOT NULL이므로 null 제거
    // API에서 JOIN을 통해 프로젝트 이름을 함께 보내줄 경우
    project_name?: string;
};
// 할 일 현황 대시보드 데이터 구조
export interface TaskStats {
    completed: number; // 완료 개수
    todo: number;      // 미완료 개수
    all: number;       // 전체 개수
    percent: number;   // 완료율
}

// 프로젝트 멤버 데이터 타입
export type ProjectMember = {
    userId: number;
    name: string;
    email: string;
    profileImageUrl: string | null;
    role: 'OWNER' | 'ADMIN' | 'MEMBER';
};
