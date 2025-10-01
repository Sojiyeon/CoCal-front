"use client";
// Next.js에서 이 파일이 클라이언트 컴포넌트임을 명시 (브라우저에서 실행)

import React, { useState } from "react";
import Button from "./Button"; // 재사용 가능한 버튼 컴포넌트
import WeekView from "./Week";
import DayView from "./Day";



/**
 * CalendarUI.tsx
 * - 달력 UI 전체 컴포넌트
 * - Tailwind CSS 기반 레이아웃
 * - Month / Week / Day 뷰 지원
 */

// 이벤트 데이터 구조 정의
type CalendarEvent = {
    id: number;
    project_id: number | null;
    title: string;
    description: string | null;
    start_date: string; // YYYY-MM-DD
    end_date: string | null;
    location: string | null;
    color: string | null; // Tailwind 색상 클래스
    project_name?: string; // optional
};

// 샘플 이벤트 데이터
const sampleEvents: CalendarEvent[] = [
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

// 요일 헤더
const weekdays = ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"];

/**
 * getMonthMatrix(year, monthIndex)
 * - 특정 연도/월의 달력을 2차원 배열 형태로 생성
 * - 각 주(행)에는 7일(열)이 들어감
 * - 달력에 표시할 날짜 없으면 null
 */
function getMonthMatrix(year: number, monthIndex: number) {
    const first = new Date(year, monthIndex, 1); // 해당 달 첫날
    const last = new Date(year, monthIndex + 1, 0); // 해당 달 마지막 날
    const firstDay = (first.getDay() + 6) % 7; // 요일 보정 (월=0)
    const daysInMonth = last.getDate(); // 해당 달의 총 일수

    const rows: (number | null)[][] = [];
    let currentDay = 1 - firstDay;

    while (currentDay <= daysInMonth) {
        const week: (number | null)[] = [];
        for (let i = 0; i < 7; i++) {
            if (currentDay < 1 || currentDay > daysInMonth) week.push(null); // 빈 칸
            else week.push(currentDay); // 실제 날짜
            currentDay++;
        }
        rows.push(week);
    }
    return rows;
}

// 메인 달력 컴포넌트
export default function CalendarUI() {
    const today = new Date("2025-09-23"); // mock: 실제라면 new Date() 사용
    const [viewYear, setViewYear] = useState(today.getFullYear()); // 현재 보고 있는 연도
    const [viewMonth, setViewMonth] = useState(today.getMonth());  // 현재 보고 있는 월
    const [events] = useState<CalendarEvent[]>(sampleEvents);      // 이벤트 목록
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null); // 선택된 이벤트 (모달 표시용)

    // ✅ 달력 모드 상태 (day | week | month)
    const [viewMode, setViewMode] = useState<"day" | "week" | "month">("month");

    const matrix = getMonthMatrix(viewYear, viewMonth); // 달력 2차원 배열

    // 날짜를 YYYY-MM-DD 포맷으로 변환
    function formatYMD(year: number, month: number, day: number) {
        const m = String(month + 1).padStart(2, "0");
        const d = String(day).padStart(2, "0");
        return `${year}-${m}-${d}`;
    }

    // 이전 달로 이동
    function prevMonth() {
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear((y) => y - 1);
        } else setViewMonth((m) => m - 1);
    }

    // 다음 달로 이동
    function nextMonth() {
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear((y) => y + 1);
        } else setViewMonth((m) => m + 1);
    }

    return (
        <div className="h-screen w-screen flex flex-col bg-white">
            {/* 상단 Top bar */}
            <div className="flex items-center justify-between px-6 py-3 bg-white border-b">
                {/* 왼쪽: 프로젝트명 */}
                <div className="flex items-center gap-3">
                    <button className="p-1 rounded-full hover:bg-slate-100">
                        {/* 좌측 화살표 아이콘 */}
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M15 18l-6-6 6-6"
                                stroke="#0f172a"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                    <h1 className="text-xl font-medium">projects 1</h1>
                    <div className="w-2 h-2 rounded-full bg-emerald-400 ml-2" />
                </div>

                {/* 오른쪽: 사용자 정보 */}
                <div className="flex items-center gap-4">
                    <div className="text-sm text-slate-500">
                        Name
                        <div className="text-xs text-slate-400">test123@gmail.com</div>
                    </div>
                    <img
                        src="/profile-placeholder.png"
                        alt="avatar"
                        className="w-8 h-8 rounded-full object-cover"
                    />
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* 왼쪽 사이드바 */}
                <aside className="w-[260px] border-r p-4 overflow-auto">
                    {/* 미니 캘린더 */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-medium">September 2025</div>
                            <button className="text-xs text-slate-500">Month ▾</button>
                        </div>

                        {/* 요일 */}
                        <div className="mt-3 grid grid-cols-7 gap-1 text-[12px] text-slate-500">
                            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                                <div key={i} className="text-center">
                                    {d}
                                </div>
                            ))}
                        </div>

                        {/* 날짜 (고정된 5주짜리 예시) */}
                        <div className="mt-2 grid grid-cols-7 gap-1 text-sm">
                            {Array.from({ length: 35 }).map((_, i) => {
                                const isToday = i === 22;
                                return (
                                    <div
                                        key={i}
                                        className={`h-7 flex items-center justify-center rounded ${
                                            isToday ? "bg-slate-800 text-white" : "text-slate-500"
                                        }`}
                                    >
                                        {i > 0 ? i : ""}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* To do 리스트 */}
                    <div>
                        <h3 className="text-sm font-medium mb-2">To do</h3>
                        <div className="space-y-3 text-sm">
                            {/* 진행 중 */}
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-7 bg-pink-400 rounded" />
                                <div className="flex-1">
                                    <div className="font-medium">Review calendar</div>
                                    <div className="text-xs text-slate-400">Yoga</div>
                                </div>
                            </div>
                            {/* 완료된 작업 */}
                            <div className="flex items-center gap-3 opacity-50">
                                <div className="w-2 h-7 bg-pink-400 rounded" />
                                <div className="flex-1 line-through text-slate-400">
                                    Reply to messages
                                </div>
                            </div>
                            <div className="flex items-center gap-3 opacity-50">
                                <div className="w-2 h-7 bg-pink-400 rounded" />
                                <div className="flex-1 line-through text-slate-400">
                                    Backup files
                                </div>
                            </div>
                        </div>

                        {/* 진행 상태 */}
                        <div className="mt-6">
                            <div className="text-xs text-slate-400">IN PROGRESS</div>
                            <div className="mt-2 flex items-end gap-4">
                                <div className="text-2xl font-bold">12</div>
                                <div className="text-sm text-slate-500">Completed</div>
                            </div>
                            <div className="mt-2 text-sm text-slate-700">5 To do</div>
                        </div>
                    </div>
                </aside>

                {/* 메인 캘린더 영역 */}
                <main className="flex-1 p-6 overflow-auto">
                    {/* 상단 컨트롤 (월 이동, 뷰 전환) */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <Button onClickAction={prevMonth} className="p-2">◀</Button>
                            <h2 className="text-2xl font-semibold">September 2025</h2>
                            <Button onClickAction={nextMonth} className="p-2">▶</Button>
                        </div>

                        {/* ✅ 드롭다운 콤보박스 + Today 버튼 */}
                        <div className="flex items-center gap-3">
                            <select
                                value={viewMode}
                                onChange={(e) => setViewMode(e.target.value as "day" | "week" | "month")}
                                className="border rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                            >
                                <option value="month">Month</option>
                                <option value="week">Week</option>
                                <option value="day">Day</option>
                            </select>
                            <Button variant="outline">Today</Button>
                        </div>
                    </div>

                    {/* 달력 뷰 (월/주/일) */}
                    {viewMode === "month" && (
                        <>
                            {/* 요일 헤더 */}
                            <div className="grid grid-cols-7 text-xs text-slate-400 border-t border-b py-2">
                                {weekdays.map((w) => (
                                    <div key={w} className="text-center">
                                        {w}
                                    </div>
                                ))}
                            </div>

                            {/* 날짜 칸 */}
                            <div className="grid grid-cols-7 gap-2 mt-3">
                                {matrix.map((week, ri) => (
                                    <React.Fragment key={ri}>
                                        {week.map((day, ci) => {
                                            // 현재 날짜
                                            const dateKey = day
                                                ? formatYMD(viewYear, viewMonth, day)
                                                : "";

                                            // 해당 날짜의 이벤트
                                            const dayEvents = events.filter(
                                                (e) => e.start_date === dateKey
                                            );

                                            // 오늘 날짜인지 체크
                                            const isToday =
                                                dateKey ===
                                                formatYMD(
                                                    today.getFullYear(),
                                                    today.getMonth(),
                                                    today.getDate()
                                                );

                                            return (
                                                <div
                                                    key={ci}
                                                    className={`min-h-[92px] border rounded p-2 bg-white ${
                                                        isToday ? "ring-2 ring-slate-300" : ""
                                                    }`}
                                                >
                                                    {/* 날짜 숫자 */}
                                                    <div className="flex items-start justify-between">
                                                        <div className="text-sm font-medium">
                                                            {day ?? ""}
                                                        </div>
                                                    </div>

                                                    {/* 이벤트 표시 */}
                                                    <div className="mt-2 space-y-2">
                                                        {dayEvents.slice(0, 2).map((ev) => (
                                                            <div
                                                                key={ev.id}
                                                                className={`px-2 py-1 rounded text-xs ${
                                                                    ev.color ?? "bg-slate-200"
                                                                } cursor-pointer`}
                                                                onClick={() => setSelectedEvent(ev)}
                                                            >
                                                                <div className="truncate">{ev.title}</div>
                                                                {ev.project_name && (
                                                                    <div className="text-[10px] text-slate-500">
                                                                        ◯ {ev.project_name}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                        {/* 이벤트가 3개 이상일 경우 */}
                                                        {dayEvents.length > 2 && (
                                                            <div className="text-[12px] text-slate-400">
                                                                +{dayEvents.length - 2} more
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                            </div>
                        </>
                    )}


                    {/* 주간 뷰 */}
                    {viewMode === "week" && <WeekView events={events} />}

                    {/* 일간 뷰 */}
                    {viewMode === "day" && <DayView events={events} />}

                </main>
            </div>

            {/* 모달 (이벤트 클릭 시 표시) */}
            {selectedEvent && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-lg p-6 w-[420px]">
                        {/* 모달 헤더 */}
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">{selectedEvent.title}</h3>
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="text-slate-400"
                            >
                                ✕
                            </button>
                        </div>
                        {/* 모달 본문 */}
                        <div className="text-sm text-slate-600">
                            {selectedEvent.description ?? "이벤트 설명이 없습니다."}
                        </div>
                        {/* 닫기 버튼 */}
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="px-4 py-2 border rounded"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
