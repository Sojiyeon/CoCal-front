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
    project_name?: string;
};

interface WeekViewProps {
    events: CalendarEvent[];
}

export default function WeekView({ events }: WeekViewProps) {
    // 요일 헤더
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    // 시간대 (8AM ~ 11PM 예시)
    const hours = Array.from({ length: 16 }, (_, i) => i + 8);

    // 이벤트를 위치에 맞게 배치
    const renderEvents = (dayIdx: number) => {
        const dayEvents = events.filter((e) => {
            const start = new Date(e.start_date);
            return start.getDay() === (dayIdx + 1) % 7; // Monday=0 기준
        });

        return dayEvents.map((event) => {
            const start = new Date(event.start_date);
            const end = new Date(event.end_date || event.start_date);

            const startHour = start.getHours() + start.getMinutes() / 60;
            const endHour = end.getHours() + end.getMinutes() / 60;

            // 위치 계산
            const top = (startHour - 8) * 64; // 64px per hour
            const height = (endHour - startHour) * 64;

            return (
                <div
                    key={event.id}
                    className="absolute left-1 right-1 rounded p-1 text-xs text-white shadow"
                    style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        backgroundColor: event.color || "#6366f1", // fallback indigo
                    }}
                >
                    <div className="font-medium">{event.title}</div>
                    {event.description && (
                        <div className="text-[10px] opacity-80">{event.description}</div>
                    )}
                </div>
            );
        });
    };

    return (
        <div className="border rounded-lg overflow-hidden">
            {/* 요일 헤더 */}
            <div className="grid grid-cols-8 border-b bg-slate-50 text-sm font-medium">
                <div className="p-2 text-right text-slate-400">시간</div>
                {days.map((day, idx) => (
                    <div key={idx} className="p-2 text-center">
                        {day}
                    </div>
                ))}
            </div>

            <div className="flex">
                {/* 시간 표시 */}
                <div className="flex flex-col border-r text-xs text-slate-400">
                    {hours.map((h) => (
                        <div key={h} className="h-16 px-1 text-right">
                            {h} AM
                        </div>
                    ))}
                </div>

                {/* 요일별 칸 */}
                <div className="grid grid-cols-7 flex-1 relative">
                    {days.map((_, dayIdx) => (
                        <div key={dayIdx} className="relative border-l">
                            {/* 시간 칸 */}
                            {hours.map((_, h) => (
                                <div key={h} className="h-16 border-b" />
                            ))}

                            {/* 이벤트 배치 */}
                            {renderEvents(dayIdx)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
