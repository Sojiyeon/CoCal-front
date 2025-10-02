import { CalendarEvent } from "./types";

// ===================== 샘플 이벤트 =====================
export const sampleEvents: CalendarEvent[] = [
    {
        id: 1,
        project_id: 101,
        title: "프로젝트 1",
        description: "DB 구조 테스트",
        start_date: "2025-09-24",
        end_date: null,
        location: null,
        color: "bg-gray-300",
        project_name: "프로젝트 1",
    },
    {
        id: 2,
        project_id: null,
        title: "여기 누르면 이벤트 내용이 나온다",
        description: null,
        start_date: "2025-09-16",
        end_date: null,
        location: null,
        color: "bg-gray-200",
    },
    {
        id: 3,
        project_id: null,
        title: "여기 누르면 카드 모달로 보여",
        description: "모달 내용 확인",
        start_date: "2025-09-16",
        end_date: null,
        location: null,
        color: "bg-gray-200",
    },
];
