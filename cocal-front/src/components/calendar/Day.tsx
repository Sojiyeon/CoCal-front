"use client";

import React, { useMemo } from "react";
import { CalendarEvent,EventTodo } from "./types";

interface DayViewProps {
    events: CalendarEvent[];
    date?: Date;
    onSelectEvent: (event: CalendarEvent) => void;
    onToggleTodoStatus?: (todoId: number) => void;

}
interface PositionedEvent {
    event: CalendarEvent;
    start: Date;
    end: Date;
    column: number;
    totalColumns: number;
}


export default function DayView({
                                     events,
                                     date = new Date(),
                                     onSelectEvent,
                                    onToggleTodoStatus,
                                 }: DayViewProps) {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const hourSlotHeight = 64; // h-16 (64px)
    const { allDayEventsForDay, timedEventsForDay } = useMemo(() => {
        const allDay: CalendarEvent[] = [];
        const timed: CalendarEvent[] = [];
        const day = new Date(date);
        const viewDate = new Date(day.getFullYear(), day.getMonth(), day.getDate());

        events.forEach((event) => {
            const start = new Date(event.startAt);
            const end = new Date(event.endAt || event.startAt);

            // 1. 오늘 날짜에 겹치는지 확인 (기존 dayEvents 필터 로직)
            const eventStart = new Date(
                start.getFullYear(),
                start.getMonth(),
                start.getDate()
            );
            const eventEnd = new Date(
                end.getFullYear(),
                end.getMonth(),
                end.getDate()
            );

            if (!(viewDate >= eventStart && viewDate <= eventEnd)) {
                return; // 이 날짜에 해당 안되면 스킵
            }

            // 2. 겹치는 이벤트 중 종일/시간 지정 분리 (WeekView 로직)
            const durationHours =
                (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            if (event.allDay || durationHours >= 24) {
                allDay.push(event);
            } else {
                timed.push(event);
            }
        });

        return { allDayEventsForDay: allDay, timedEventsForDay: timed };
    }, [events, date]);

    const timedEventsLayout = useMemo(() => {
        const eventsWithPos = timedEventsForDay
            .map(event => ({
                event,
                start: new Date(event.startAt),
                end: new Date(event.endAt || event.startAt),
                column: -1, // -1: 아직 처리되지 않음
                totalColumns: 1,
            }))
            .sort((a, b) => a.start.getTime() - b.start.getTime());

        for (let i = 0; i < eventsWithPos.length; i++) {
            const pEvent = eventsWithPos[i];
            if (pEvent.column !== -1) continue;

            // pEvent와 겹치는 모든 이벤트 그룹을 찾음
            const group: (typeof eventsWithPos[0])[] = [];
            const q = [pEvent];
            pEvent.column = 0; // 임시 방문 표시

            while(q.length > 0) {
                const current = q.shift()!;
                group.push(current);

                eventsWithPos.forEach(other => {
                    if (other.column === -1 && current.start < other.end && current.end > other.start) {
                        other.column = 0;
                        q.push(other);
                    }
                });
            }

            group.sort((a, b) => a.start.getTime() - b.start.getTime());

            const groupColumns: { endTime: Date }[] = [];
            group.forEach(eventInGroup => {
                let placed = false;
                for (let colIdx = 0; colIdx < groupColumns.length; colIdx++) {
                    if (eventInGroup.start >= groupColumns[colIdx].endTime) {
                        groupColumns[colIdx].endTime = eventInGroup.end;
                        eventInGroup.column = colIdx;
                        placed = true;
                        break;
                    }
                }
                if (!placed) {
                    eventInGroup.column = groupColumns.length;
                    groupColumns.push({ endTime: eventInGroup.end });
                }
            });

            const totalGroupColumns = groupColumns.length;
            group.forEach(eventInGroup => {
                eventInGroup.totalColumns = totalGroupColumns;
            });
        }
        return eventsWithPos;
    }, [timedEventsForDay]);

    const renderEvents = () => {
        return timedEventsLayout.map(({ event, start, end, column, totalColumns }) => {
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);

            const displayStart = start < dayStart ? dayStart : start;
            const displayEnd = end > dayEnd ? dayEnd : end;

            const startHour = displayStart.getHours() + displayStart.getMinutes() / 60;
            let endHour = displayEnd.getHours() + displayEnd.getMinutes() / 60;

            if (endHour === 0 && displayEnd.getTime() > displayStart.getTime()) {
                endHour = 24;
            }

            const top = startHour * hourSlotHeight;
            const height = (endHour - startHour) * hourSlotHeight;

            if (height <= 0) return null;

            // 너비와 왼쪽 위치 계산
            const width = 100 / totalColumns;
            const left = column * width;

            const todos: EventTodo[] = event.todos || [];
            return (
                <div
                    key={event.id}
                    onClick={() => onSelectEvent(event)}
                    className="absolute rounded p-2 text-xs text-white shadow flex flex-col overflow-hidden cursor-pointer"
                    style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        left: `calc(${left}% + 2px)`,
                        width: `calc(${width}% - 4px)`,
                        backgroundColor: event.color || "#6366f1",
                        zIndex: 10 + column,
                    }}
                >
                    {/*  제목과 설명을 묶는 div 추가 (상단 고정) */}
                    <div className="flex-shrink-0">
                        <div className="font-medium">{event.title}</div>
                        {event.description && (
                            <div className="text-[11px] opacity-80">{event.description}</div>
                        )}
                    </div>

                    {/*  할일 목록 컨테이너에 flex-1과 overflow-y-auto 추가 */}
                    {todos.length > 0 && (
                        <div
                            className="mt-1 space-y-1 flex-1 overflow-y-auto
                                    [&::-webkit-scrollbar]:w-1.5
                                    [&::-webkit-scrollbar-track]:bg-transparent
                                    [&::-webkit-scrollbar-thumb]:bg-white/40
                                    [&::-webkit-scrollbar-thumb]:rounded-full
                                    hover:[&::-webkit-scrollbar-thumb]:bg-white/60"
                        >
                            <h4 className="text-[11px] font-bold opacity-70">To do</h4>
                            {todos.map((todo) => (
                                <div
                                    key={todo.id}
                                    className="flex items-center text-[11px] opacity-90 cursor-pointer" // [추가] cursor-pointer
                                    onClick={(e) => {
                                        // [추가] Todo 클릭 핸들러
                                        e.stopPropagation(); // 부모(이벤트 카드) 클릭 방지
                                        onToggleTodoStatus?.(todo.id);
                                    }}
                                >
                                    <div className="mr-1.5 h-3 w-3 flex-shrink-0 rounded-full flex items-center justify-center bg-white/30">
                                        {todo.status === "DONE" && (
                                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                        )}
                                    </div>
                                    <span
                                        className={`${
                                            todo.status === "DONE" ? "line-through opacity-70" : ""
                                        }`}
                                    >
                      {todo.title}
                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
            }
        );

    };
    return (
        <div className="border border-gray-200 dark:border-neutral-700 rounded-lg overflow-hidden">
            <div className="grid grid-cols-[auto_1fr_auto] items-center border-b border border-gray-200 bg-slate-50 dark:bg-neutral-900 dark:border-slate-700 text-sm font-medium">

                {/* 1열: 'Time' (w-11 적용) */}
                <div className="p-2 text-left text-slate-400 dark:text-slate-200 w-11">Time</div>

                {/* 2열: 날짜 (text-center 적용) */}
                <div className="p-2 text-center text-slate-400 dark:text-slate-200">
                    {date.toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        weekday: "short",
                    })}
                </div>
            </div>

            {allDayEventsForDay.length > 0 && (
                <div className="flex border-b border-gray-200 dark:border-neutral-700">
                    <div className="w-11 flex-shrink-0">
                        {/* 이 칸은 너비 맞춤용 빈 칸입니다. */}
                    </div>
                    <div className="relative flex-1 p-1 space-y-1 border-l border-gray-200 dark:border-neutral-700">
                        {allDayEventsForDay.map(event => {
                            const todos: EventTodo[] = event.todos || [];
                            return (
                                <div
                                    key={event.id}
                                    onClick={() => onSelectEvent(event)}
                                    className="rounded p-1 text-xs text-white shadow cursor-pointer flex flex-col overflow-hidden max-h-17"
                                    style={{
                                        backgroundColor: event.color || "#6366f1",
                                        zIndex: 10,
                                    }}
                                >
                                    {/*  제목 영역을 flex-shrink-0로 묶음 */}
                                    <div className="flex-shrink-0">
                                        <div className="font-medium">{event.title}</div>
                                    </div>

                                    {/* 종일 이벤트의 할 일(todo) 목록 렌더링 */}
                                    {todos.length > 0 && (
                                        <div
                                            //  'border-t border-white/20 pt-1' 클래스 제거
                                            className="mt-1 space-y-1 flex-1 overflow-y-auto
                                                    [&::-webkit-scrollbar]:w-1.5
                                                    [&::-webkit-scrollbar-track]:bg-transparent
                                                    [&::-webkit-scrollbar-thumb]:bg-white/40
                                                    [&::-webkit-scrollbar-thumb]:rounded-full
                                                    hover:[&::-webkit-scrollbar-thumb]:bg-white/60"
                                        >
                                            {/*  'To do' 헤더 */}
                                            <h4 className="text-[11px] font-bold opacity-70">
                                                To do
                                            </h4>

                                            {todos.map((todo) => (
                                                <div
                                                    key={todo.id}
                                                    //  className과 onClick 핸들러를 추가합니다.
                                                    className="flex items-center text-[11px] opacity-90 cursor-pointer"
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // 부모(이벤트 카드) 클릭 방지
                                                        onToggleTodoStatus?.(todo.id);
                                                    }}
                                                >
                                                    <div className="mr-1.5 h-3 w-3 flex-shrink-0 rounded-full flex items-center justify-center bg-white/30">
                                                        {todo.status === "DONE" && (
                                                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                                        )}
                                                    </div>
                                                    <span
                                                        className={`${
                                                            todo.status === "DONE"
                                                                ? "line-through opacity-70"
                                                                : ""
                                                        }`}
                                                    >
                            {todo.title}
                          </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            <div className="flex">
                <div className="flex flex-col border-r border border-gray-200 dark:border-neutral-700 text-xs text-slate-400 dark:text-slate-200">
                    {/*  시간 레이블 로직 변경 */}
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

                <div className="relative flex-1 border-l border border-gray-200 dark:border-neutral-700">
                    {hours.map((_, h) => (
                        <div key={h} className="h-16 border-b border border-gray-200 dark:border-neutral-700"/>
                    ))}

                    {/*  이제 timedEventsForDay만 렌더링합니다. */}
                    {renderEvents()}
                </div>
            </div>
        </div>
    );
}
