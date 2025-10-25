"use client";


import React, { useMemo, useEffect, useState } from "react";

import { CalendarEvent, EventTodo } from "./types";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { api } from "@/components/calendar/utils/api";

import { TodoUpdatePayload } from "@/api/todoApi";

interface TodoItemType {
    id: number;
    title: string;
    status: string;
    description: string | null;

}
interface WeekViewMobileProps {
    weekTitle: string;
    projectName: string;
    projectId: number;
    days: {
        date: string;
        fullDate: string;
        weekday: string;
        events: CalendarEvent[];
        todos: [];
    }[];
    onPrevWeek?: () => void;
    onNextWeek?: () => void;
    onToggleTodoStatus?: (todoId: number) => void;
    onTodoDataChanged?: () => void;
}

export default function WeekViewMobile({
                                           weekTitle,
                                           projectName,
                                           projectId,
                                           days,
                                           onPrevWeek,
                                           onNextWeek,
                                           onToggleTodoStatus,
                                           onTodoDataChanged,
                                       }: WeekViewMobileProps) {


    const [privateTodosMap, setPrivateTodosMap] = useState<Map<string, TodoItemType[]>>(new Map());


    useEffect(() => {
        if (!projectId || days.length === 0) return;

        const fetchWeekPrivateTodos = async () => {
            const newTodoMap = new Map<string, TodoItemType[]>();

            const fetchPromises = days.map(day => {
                return api.get(`/projects/${projectId}/todos?date=${day.fullDate}`)
                    .then(res => {
                        if (res.success && res.data && res.data.items) {

                            const todos: TodoItemType[] = res.data.items.map((item: any) => ({
                                id: item.id,
                                title: item.title,
                                status: item.status,
                                description: item.description,
                            }));
                            return { date: day.fullDate, todos };
                        }
                        return { date: day.fullDate, todos: [] };
                    })
                    .catch(err => {
                        console.error(`Failed to fetch private todos for ${day.fullDate}:`, err);
                        return { date: day.fullDate, todos: [] };
                    });
            });

            const results = await Promise.all(fetchPromises);

            results.forEach(result => {
                newTodoMap.set(result.date, result.todos);
            });

            setPrivateTodosMap(newTodoMap);
        };

        fetchWeekPrivateTodos();

    }, [days, projectId]);



    const handleTogglePrivateTodo = async (todoId: number, fullDate: string) => {
        const todosForDate = privateTodosMap.get(fullDate);
        if (!todosForDate) return;

        const todoToUpdate = todosForDate.find(t => t.id === todoId);
        if (!todoToUpdate) {
            console.error(`WeekViewMobile: 토글할 Private Todo(ID: ${todoId})를 찾지 못했습니다.`);
            return;
        }

        const originalStatus = todoToUpdate.status;
        const newStatus = originalStatus === 'DONE' ? 'IN_PROGRESS' : 'DONE';


        setPrivateTodosMap(prevMap => {
            const newMap = new Map(prevMap);
            const currentDateTodos = newMap.get(fullDate) || [];
            const updatedDateTodos = currentDateTodos.map(t =>
                t.id === todoId ? { ...t, status: newStatus } : t
            );
            newMap.set(fullDate, updatedDateTodos);
            return newMap;
        });


        const payload: TodoUpdatePayload = {
            title: todoToUpdate.title,
            description: todoToUpdate.description || "",
            url: "", // List API에 없으므로 기본값
            status: newStatus,
            type: 'PRIVATE',
            projectId: projectId,
            visibility: 'PRIVATE',
            date: fullDate + "T00:00:00", // 날짜 정보 사용
            offsetMinutes: null, // List API에 없으므로 기본값
        };


        try {
            await api.put(`/projects/${projectId}/todos/${todoId}`, payload);

            onTodoDataChanged?.();
        } catch (error) {
            console.error("Private Todo 상태 업데이트 API 호출 실패:", error);


            setPrivateTodosMap(prevMap => {
                const newMap = new Map(prevMap);
                const currentDateTodos = newMap.get(fullDate) || [];
                const updatedDateTodos = currentDateTodos.map(t =>
                    t.id === todoId ? { ...t, status: originalStatus } : t // 원래 status로 복구
                );
                newMap.set(fullDate, updatedDateTodos);
                return newMap;
            });
            alert("할 일 상태 변경에 실패했습니다.");
        }
    };


    const title = useMemo(() => projectName, [projectName]);

    const weekdayInitial = (w: string) => (w?.[0] ?? "").toUpperCase();

    // === KOR-ADD: START :: Public Event 렌더링에 필요한 헬퍼 함수  ===
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
    // === KOR-ADD: END :: 헬퍼 함수 ===


    const normalizedDayText = (dateStr: string, fallbackIndex: number) => {
        const onlyNum = Number(dateStr);
        if (!Number.isNaN(onlyNum) && `${onlyNum}` === dateStr) return dateStr;
        const d = new Date(dateStr);
        const n = d.getDate();
        return Number.isNaN(n) ? String(fallbackIndex) : String(n);
    };


    const TodoItem = ({ todo, onClick }: { todo: TodoItemType | EventTodo, onClick: () => void }) => (
        <div
            key={todo.id}
            className={`flex items-center gap-2 ${todo.status === "DONE" ? "opacity-60" : ""}`}
        >
            <button
                onClick={onClick}
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

                    const privateTodos = privateTodosMap.get(day.fullDate) || [];

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
                                        {/* === Private Todo 섹션 === */}
                                        <div className="pb-3">
                                            {privateTodos.length > 0 && (
                                                <div className="mb-2">
                                                    <p className="text-[11px] text-slate-500 font-semibold mb-1.5">Private
                                                        Todo</p>
                                                    <div className="space-y-1">
                                                        {privateTodos.map((todo) => (
                                                            <TodoItem
                                                                key={todo.id}
                                                                todo={todo}
                                                                onClick={() => handleTogglePrivateTodo(todo.id, day.fullDate)}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>


                                        {/* === KOR-ADD: START :: Public Event/Todo 렌더링 섹션  === */}
                                        {/* 할일 섹션 */}
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

                                                        {/* Public Todo 목록 */}
                                                        {event.todos && event.todos.length > 0 && (
                                                            <div className="pl-8 pt-2 space-y-1">
                                                                {event.todos.map(todo => (
                                                                    /* KOR-ADD: 'onClick' prop을 사용하는 새 TodoItem 컴포넌트 호출 방식으로 수정 */
                                                                    <TodoItem
                                                                        key={todo.id}
                                                                        todo={todo}
                                                                        onClick={() => onToggleTodoStatus?.(todo.id)}
                                                                    />
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        {/* === KOR-ADD: END :: Public Event/Todo 렌더링 섹션 === */}

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