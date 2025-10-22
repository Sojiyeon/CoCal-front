"use client";

import React, { useMemo } from "react";
import { CalendarEvent,EventTodo } from "./types";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface TodoItemType {
    id: number;
    title: string;
    status: string;
}
interface WeekViewMobileProps {
    weekTitle: string; // ex) "Sep Week 1, 2025"
    projectName: string; // ex) "projects 1"
    days: {
        date: string; // ex) "1" 또는 "2025-09-01"
        weekday: string; // ex) "Mon" | "Tue" ...
        events: CalendarEvent[];
        todos: { id: number; title: string; status: string }[];
    }[];
    onPrevWeek?: () => void;
    onNextWeek?: () => void;
    onToggleTodoStatus?: (todoId: number) => void;
}

export default function WeekViewMobile({
                                           weekTitle,
                                           projectName,
                                           days,
                                           onPrevWeek,
                                           onNextWeek,
                                           onToggleTodoStatus,
                                       }: WeekViewMobileProps) {

    const title = useMemo(() => projectName, [projectName]);

    const weekdayInitial = (w: string) => (w?.[0] ?? "").toUpperCase();

    const toAmPm = (iso: string) => {
        const d = new Date(iso);
        const hours = d.getHours();
        const minutes = d.getMinutes();
        const ampm = hours >= 12 ? "PM" : "AM";
        const h12 = hours % 12 || 12;
        const mm = minutes.toString().padStart(2, "0");
        return `${h12}${mm === "00" ? "" : `:${mm}`} ${ampm}`;
    };

    const timeRange = (e: CalendarEvent) => {
        return `${toAmPm(e.startAt)} – ${toAmPm(e.endAt)}`;
    };

    const normalizedDayText = (dateStr: string, fallbackIndex: number) => {
        // date가 "1", "2"처럼 숫자면 그대로, ISO면 일(day) 추출
        const onlyNum = Number(dateStr);
        if (!Number.isNaN(onlyNum) && `${onlyNum}` === dateStr) return dateStr;
        const d = new Date(dateStr);
        const n = d.getDate();
        return Number.isNaN(n) ? String(fallbackIndex) : String(n);
    };
    const TodoItem = ({ todo }: { todo: TodoItemType | EventTodo }) => (
        <div
            key={todo.id}
            className={`flex items-center gap-2 ${todo.status === "DONE" ? "opacity-60" : ""}`}
        >
            <button
                onClick={() => onToggleTodoStatus?.(todo.id)}
                aria-label="toggle todo"
                className={`w-4 h-4 border-2 rounded-md flex items-center justify-center ${
                    todo.status === "DONE" ? "border-slate-400" : "border-slate-300"
                }`}
            >
                {todo.status === "DONE" && (
                    <div className="w-2 h-2 bg-slate-400 rounded-sm"/>
                )}
            </button>
            <span
                className={`text-[14px] ${
                    todo.status === "DONE"
                        ? "line-through text-slate-400"
                        : "text-slate-700"
                }`}
            >
                {todo.title}
            </span>
        </div>
    );
    return (
        <div className="w-full h-full bg-white flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b sticky top-0 z-20 bg-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onPrevWeek?.()}
                            className="h-12 w-12 flex items-center justify-center rounded-full hover:bg-slate-100 active:scale-95 transition"
                            aria-label="Previous week"
                        >
                            <ChevronLeft className="h-6 w-6 text-slate-700"/>
                        </button>
                        <p className="text-[23px] text-slate-500 ">{weekTitle}</p>
                        <button
                            onClick={() => onNextWeek?.()}
                            className="h-12 w-12 flex items-center justify-center rounded-full hover:bg-slate-100 active:scale-95 transition"
                            aria-label="Next week"
                        >
                            <ChevronRight className="h-6 w-6 text-slate-700"/>
                        </button>

                    </div>
                </div>


            </div>

            {/* Days Scroll Section */}
            <div className="flex-1 overflow-y-auto">
                {days.map((day, idx) => {
                    const dayNum = normalizedDayText(day.date, idx + 1);
                    const dayInitial = weekdayInitial(day.weekday);
                    const privateTodos = day.todos;
                    return (
                        <div key={`${day.date}-${idx}`} className="border-b">
                            {/* 한 날짜 블록 */}
                            <div className="px-4 py-4">
                                <div className="flex items-start gap-3">
                                    {/* 좌측 원형 날짜 + 요일 이니셜 */}
                                    <div className="flex flex-col items-center w-8">
                                        <div
                                            className="w-7 h-7 rounded-full bg-slate-900 text-white text-[13px] font-semibold flex items-center justify-center">
                                            {dayNum}
                                        </div>
                                        <span className="text-[11px] text-slate-400 mt-1">{dayInitial}</span>
                                    </div>

                                    {/* 우측 콘텐츠 */}
                                    <div className="flex-1">
                                        <div className="pb-3">
                                            {privateTodos.length > 0 && (
                                                <div className="mb-2">
                                                    <p className="text-[11px] text-slate-500 font-semibold mb-1.5">Private
                                                        Todo</p>
                                                    <div className="space-y-1">
                                                        {privateTodos.map((todo) => (
                                                            <TodoItem key={todo.id} todo={todo}/>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {/* Public todo 렌더링 로직은 Event 섹션으로 이동 */}
                                        </div>
                                        {/* 할일 섹션 */}
                                        <div className="pb-3">


                                            <div className="space-y-1">
                                                {day.todos.length === 0 && (
                                                    <p className="text-[12px] text-slate-400"></p>
                                                )}
                                                {day.todos.map((todo) => (
                                                    <div
                                                        key={todo.id}
                                                        className={`flex items-center gap-2 ${todo.status === "DONE" ? "opacity-60" : ""}`}
                                                    >
                                                        {/* 체크박스 (UI만, 기능 변경 X) */}
                                                        <button
                                                            onClick={() => onToggleTodoStatus?.(todo.id)}
                                                            aria-label="toggle todo"
                                                            className={`w-4 h-4 border-2 rounded-md flex items-center justify-center ${
                                                                todo.status === "DONE" ? "border-slate-400" : "border-slate-300"
                                                            }`}
                                                        >
                                                            {todo.status === "DONE" && (
                                                                <div className="w-2 h-2 bg-slate-400 rounded-sm"/>
                                                            )}
                                                        </button>
                                                        <span
                                                            className={`text-[14px] ${
                                                                todo.status === "DONE"
                                                                    ? "line-through text-slate-400"
                                                                    : "text-slate-700"
                                                            }`}
                                                        >
                                                                  {todo.title}
                                                                </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Event 섹션 */}
                                        <div className="pt-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[13px] font-semibold text-slate-700"></span>
                                            </div>

                                            {/* 이벤트 카드(시안처럼 라인/배지/시간/리스트 느낌) */}
                                            <div className="space-y-3">
                                                {day.events.length === 0 && (
                                                    <p className="text-[12px] text-slate-400"></p>
                                                )}

                                                {day.events.map((event) => (
                                                    <div key={event.id}>
                                                        {/* 시간/컬러 */}
                                                        <div className="flex items-center gap-2 mb-1">
                                                            {/* 컬러 dot */}
                                                            <span
                                                                className="inline-block w-2 h-2 rounded-full"
                                                                style={{backgroundColor: event.color || "#94a3b8"}}
                                                            />
                                                            <span
                                                                className="text-[12px] text-slate-500">{timeRange(event)}</span>
                                                        </div>

                                                        {/* 이벤트 타이틀을 체크리스트 스타일로 (UI만) */}
                                                        <div className="pl-4">
                                                            <div className="flex items-start gap-2">
                                                                <span
                                                                    className="mt-2.5 inline-block w-3 h-0.5 rounded-sm bg-slate-400"></span>
                                                                <span
                                                                    className="text-[14px] text-slate-800">{event.title}</span>
                                                            </div>
                                                        </div>
                                                        {event.todos && event.todos.length > 0 && (
                                                            <div className="pl-8 pt-2 space-y-1">
                                                                {event.todos.map(todo => (
                                                                    <TodoItem key={todo.id} todo={todo} />
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    );
                })}
            </div>

            {/* 바텀 세이프 에어리어 */}
            <div className="h-[80px]"/>
        </div>
    );
}
