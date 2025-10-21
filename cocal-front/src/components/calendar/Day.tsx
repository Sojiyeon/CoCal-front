"use client";

import React from "react";
import { CalendarEvent,EventTodo } from "./types";

interface DayViewProps {
    events: CalendarEvent[];
    date?: Date;

}

export default function DayView({ events, date = new Date() }: DayViewProps) {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const hourSlotHeight = 64; // h-16 (64px)
    const dayEvents = events.filter((e) => {
        const start = new Date(e.startAt);
        const end = new Date(e.endAt || e.startAt);
        const day = new Date(date);

        // 이벤트 날짜와 현재 뷰의 날짜가 하루라도 겹치는지 확인합니다.
        const eventStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const eventEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());
        const viewDate = new Date(day.getFullYear(), day.getMonth(), day.getDate());

        return viewDate >= eventStart && viewDate <= eventEnd;
    });


    const renderEvents = () => {
            return dayEvents.map((event) => {
                const start = new Date(event.startAt);
                const end = new Date(event.endAt || event.startAt);

                // 이벤트가 오늘 시작/종료하는지 확인하여 렌더링 시간 조정
                const dayStart = new Date(date);
                dayStart.setHours(0, 0, 0, 0);

                const dayEnd = new Date(date);
                dayEnd.setHours(23, 59, 59, 999);

                const displayStart = start < dayStart ? dayStart : start;
                const displayEnd = end > dayEnd ? dayEnd : end;

                const startHour = displayStart.getHours() + displayStart.getMinutes() / 60;
                let endHour = displayEnd.getHours() + displayEnd.getMinutes() / 60;

                // 자정에 끝나는 이벤트(예: 23:00~00:00)가 다음 날 0시로 계산되는 경우, 24시로 보정
                if (endHour === 0 && displayEnd.getTime() > displayStart.getTime()) {
                    endHour = 24;
                }

                // [수정] top 계산을 0시 기준으로 변경 ( - 8 제거)
                const top = startHour * hourSlotHeight;
                const height = (endHour - startHour) * hourSlotHeight;

                // 높이가 0보다 작거나 같으면 렌더링하지 않음
                if (height <= 0) return null;
                const todos: EventTodo[] = event.todos || [];
                return (
                    <div
                        key={event.id}
                        className="absolute left-1 right-1 rounded p-2 text-xs text-white shadow"
                        style={{
                            top: `${top}px`,
                            height: `${height}px`,
                            backgroundColor: event.color || "#6366f1",
                            zIndex: 10,
                        }}
                    >
                        <div className="font-medium">{event.title}</div>
                        {event.description && (
                            <div className="text-[11px] opacity-80">{event.description}</div>
                        )}
                        {todos.length > 0 && (
                            <div className="mt-1 space-y-1">
                                <h4 className="text-[11px] font-bold opacity-70">할 일:</h4>
                                {todos.map((todo) => (
                                    <div key={todo.id} className="flex items-center text-[11px] opacity-90">
                                        <input
                                            type="checkbox"
                                            checked={todo.status === 'DONE'}
                                            readOnly
                                            className="mr-1.5 h-3 w-3 flex-shrink-0 rounded-sm border-white/60 bg-transparent text-indigo-300 focus:ring-0 focus:ring-offset-0"
                                        />
                                        <span className={`${todo.status === 'DONE' ? "line-through opacity-70" : ""}`}>
                                            {todo.title}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            });
    };


        return (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="grid grid-cols-2 border-b border border-gray-200 bg-slate-50 text-sm font-medium">
                    <div className="p-2 text-left text-slate-400">시간</div>
                    <div className="p-2 text-left text-slate-400">

                        {date.toLocaleDateString("ko-KR", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            weekday: "short",
                        })}
                    </div>
                </div>

                <div className="flex">
                    <div className="flex flex-col border-r border border-gray-200 text-xs text-slate-400">
                        {/* [수정] 시간 레이블 로직 변경 */}
                        {hours.map((h) => {
                            const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
                            const ampm = h < 12 ? 'AM' : 'PM';

                            return (
                                <div key={h} className="h-16 px-1 text-right pt-1">
                                    {`${displayHour} ${ampm}`}
                                </div>
                            );
                        })}
                    </div>

                    <div className="relative flex-1 border-l border border-gray-200">
                        {hours.map((_, h) => (
                            <div key={h} className="h-16 border-b border border-gray-200"/>
                        ))}

                        {renderEvents()}
                    </div>
                </div>
            </div>
        );
    }