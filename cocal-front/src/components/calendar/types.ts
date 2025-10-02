// ===================== 타입 정의 =====================

// 이벤트 데이터 타입
export type CalendarEvent = {
    id: number;
    project_id: number | null;
    title: string;
    description: string | null;
    start_date: string;
    end_date: string | null;
    location: string | null;
    color: string | null;
    project_name?: string; // optional
};

// 할 일 현황 대시보드 데이터 구조
export interface TaskStats {
    completed: number; // 완료 개수
    todo: number;      // 미완료 개수
    all: number;       // 전체 개수
    percent: number;   // 완료율
}
