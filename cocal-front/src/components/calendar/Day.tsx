"use client";

import React from "react";

export type CalendarEvent = {
    id: number;
    project_id: number | null;
    title: string;
    description: string | null;
    start_date: string;
    end_date: string | null;
    location: string | null;
    color: string | null;
};

interface DayViewProps {
    events: CalendarEvent[];
    date?: Date; // ✅ 선택적으로 변경 (없으면 오늘 날짜 사용)
}

export default function DayView({ events, date = new Date() }: DayViewProps) {
    // 시간대 (8AM ~ 11PM)
    const hours = Array.from({ length: 16 }, (_, i) => i + 8);

    // 오늘 이벤트만 필터링
    const dayEvents = events.filter((e) => {
        const start = new Date(e.start_date);
        return (
            start.getFullYear() === date.getFullYear() &&
            start.getMonth() === date.getMonth() &&
            start.getDate() === date.getDate()
        );
    });

    // 이벤트 UI 렌더링
    const renderEvents = () => {
        return dayEvents.map((event) => {
            const start = new Date(event.start_date);
            const end = new Date(event.end_date || event.start_date);

            const startHour = start.getHours() + start.getMinutes() / 60;
            const endHour = end.getHours() + end.getMinutes() / 60;

            const top = (startHour - 8) * 64; // 64px per hour
            const height = (endHour - startHour) * 64;

            return (
                <div
                    key={event.id}
                    className="absolute left-1 right-1 rounded p-2 text-xs text-white shadow"
                    style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        backgroundColor: event.color || "#6366f1", // 기본 보라색
                    }}
                >
                    <div className="font-medium">{event.title}</div>
                    {event.description && (
                        <div className="text-[11px] opacity-80">{event.description}</div>
                    )}
                </div>
            );
        });
    };

    return (
        <div className="border rounded-lg overflow-hidden">
            {/* 헤더: 선택된 날짜 */}
            <div className="grid grid-cols-2 border-b bg-slate-50 text-sm font-medium">
                <div className="p-2 text-right text-slate-400">시간</div>
                <div className="p-2 text-center">
                    {date.toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        weekday: "short",
                    })}
                </div>
            </div>

            <div className="flex">
                {/* 시간 라벨 */}
                <div className="flex flex-col border-r text-xs text-slate-400">
                    {hours.map((h) => (
                        <div key={h} className="h-16 px-1 text-right">
                            {h < 12 ? `${h} AM` : h === 12 ? `12 PM` : `${h - 12} PM`}
                        </div>
                    ))}
                </div>

                {/* 이벤트 칸 */}
                <div className="relative flex-1 border-l">
                    {/* 시간칸 */}
                    {hours.map((_, h) => (
                        <div key={h} className="h-16 border-b" />
                    ))}

                    {/* 이벤트 렌더 */}
                    {renderEvents()}
                </div>
            </div>
        </div>
    );
}
