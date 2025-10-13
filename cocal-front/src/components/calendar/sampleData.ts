import {CalendarEvent, DateMemo} from "./types";

// ===================== 샘플 이벤트 =====================
export const sampleEvents: CalendarEvent[] = [
    {
        id: 1,
        projectId: 101,
        urlId: 1,
        offsetMinutes: 15,
        title: "Yoga", // 제목 수정
        description: "DB 구조 및 API 명세서 확정 논의",
        startAt: "2025-09-24T10:00:00",
        endAt: "2025-09-24T11:30:00",
        allDay: false,
        visibility: 'PUBLIC',
        authorId: 1,
        location: "서울특별시 영등포구 63로 50",
        color: "bg-blue-500 text-white",
        //name: "프로젝트 1",
        // [수정] EventTodo 타입에 맞게 누락된 속성을 추가합니다.
        todos: [
            { id: 101, eventId: 1, title: "Shower", description: "After yoga", status: 'IN_PROGRESS', urlId: 1, offsetMinutes: 0, authorId: 1, orderNo: 1 },
            { id: 102, eventId: 1, title: "Protein Shake", description: null, status: 'IN_PROGRESS', urlId: 2, offsetMinutes: 0, authorId: 1, orderNo: 2 }
        ]
    },

];
//  날짜 메모 타입 (memos 테이블)
export const sampleMemos: DateMemo[] = [
    {
    id: 1,
    projectId: 101,
    memoDate: "2025-09-28",
    content: "test 임",
    createdAt: "2025-10-11T11:11:11.6262716",
    title: "메모 제목임",
    author: [
    {userId: 2, name: "새 이름", email: "test@example.com", profileImageUrl: null}
        ]
    },
];