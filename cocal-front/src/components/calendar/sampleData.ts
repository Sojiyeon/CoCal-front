import { CalendarEvent } from "./types";

// ===================== 샘플 이벤트 =====================
export const sampleEvents: CalendarEvent[] = [
    {
        id: 1,
        project_id: 101,
        title: "Yoga", // 제목 수정
        description: "DB 구조 및 API 명세서 확정 논의",
        start_at: "2025-09-24T10:00:00",
        end_at: "2025-09-24T11:30:00",
        all_day: false,
        visibility: 'PUBLIC',
        author_id: 1,
        location: "서울특별시 영등포구 63로 50",
        color: "bg-blue-500 text-white",
        project_name: "프로젝트 1",
        // [추가] 이 이벤트에 종속된 할 일 목록
        todos: [
            { id: 101, event_id: 1, title: "Shower", description: "After yoga", status: 'IN_PROGRESS' },
            { id: 102, event_id: 1, title: "Protein Shake", description: null, status: 'IN_PROGRESS' }
        ]
    },
    // ... (다른 이벤트 데이터는 그대로 유지) ...
    {
        id: 2,
        project_id: 102,
        title: "여기 누르면 이벤트 내용이 나온다",
        description: "이벤트 상세 내용이 여기에 표시됩니다.",
        start_at: "2025-09-16T14:00:00",
        end_at: "2025-09-16T15:00:00",
        all_day: false,
        visibility: 'PUBLIC',
        author_id: 2,
        location: null,
        color: "bg-green-500 text-white",
    },
];
