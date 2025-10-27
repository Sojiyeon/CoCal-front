"use client";

import React, { useMemo, useEffect, useState } from "react";
import { CalendarEvent, EventTodo, DateMemo,SidebarTodo } from "./types";
//import { ChevronRight, ChevronLeft } from "lucide-react";
import { api } from "@/components/calendar/utils/api";

import { TodoUpdatePayload } from "@/api/todoApi";
interface ApiTodoItem {
    id: number;
    title: string;
    status: string; // "IN_PROGRESS" | "DONE"
    description: string | null;
}
interface TodoItemType {
    id: number;
    title: string;
    status: string;
    description: string | null;
}
interface WeekViewMobileProps {
    //  weekTitle: string;
    // projectName: string;
    projectId: number;
    days: {
        date: string;
        fullDate: string;
        weekday: string;
        events: CalendarEvent[];
        todos: [];
        memos: DateMemo[];
    }[];
    //onPrevWeek?: () => void;
    //onNextWeek?: () => void;
    onToggleTodoStatus?: (todoId: number) => void;
    onTodoDataChanged?: () => void;
    onSelectMemo?: (memo: DateMemo) => void;
    onEditTodo: (todo: SidebarTodo) => void;
}

export default function WeekViewMobile({
                                           //weekTitle,
                                           //projectName,
                                           projectId,
                                           days,
                                           //onPrevWeek,
                                           //onNextWeek,
                                           onToggleTodoStatus,
                                           onTodoDataChanged,
                                           onSelectMemo,
                                           onEditTodo,
                                       }: WeekViewMobileProps) {
    const [privateTodosMap, setPrivateTodosMap] = useState<
        Map<string, TodoItemType[]>
    >(new Map());

    useEffect(() => {
        if (!projectId || days.length === 0) return;

        const fetchWeekPrivateTodos = async () => {
            const newTodoMap = new Map<string, TodoItemType[]>();

            const fetchPromises = days.map((day) => {
                return api
                    .get(`/projects/${projectId}/todos?date=${day.fullDate}`)
                    .then((res) => {
                        if (res.success && res.data && res.data.items) {
                            const todos: TodoItemType[] = res.data.items.map(
                                (item: ApiTodoItem) => ({
                                    id: item.id,
                                    title: item.title,
                                    status: item.status,
                                    description: item.description,
                                })
                            );
                            return { date: day.fullDate, todos };
                        }
                        return { date: day.fullDate, todos: [] };
                    })
                    .catch((err) => {
                        console.error(
                            `Failed to fetch private todos for ${day.fullDate}:`,
                            err
                        );
                        return { date: day.fullDate, todos: [] };
                    });
            });

            const results = await Promise.all(fetchPromises);

            results.forEach((result) => {
                newTodoMap.set(result.date, result.todos);
            });

            setPrivateTodosMap(newTodoMap);
        };

        fetchWeekPrivateTodos();
    }, [days, projectId]);

    const handleTogglePrivateTodo = async (
        todoId: number,
        fullDate: string
    ) => {
        const todosForDate = privateTodosMap.get(fullDate);
        if (!todosForDate) return;

        const todoToUpdate = todosForDate.find((t) => t.id === todoId);
        if (!todoToUpdate) {
            console.error(
                `WeekViewMobile: 토글할 Private Todo(ID: ${todoId})를 찾지 못했습니다.`
            );
            return;
        }

        const originalStatus = todoToUpdate.status;
        const newStatus = originalStatus === "DONE" ? "IN_PROGRESS" : "DONE";

        setPrivateTodosMap((prevMap) => {
            const newMap = new Map(prevMap);
            const currentDateTodos = newMap.get(fullDate) || [];
            const updatedDateTodos = currentDateTodos.map((t) =>
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
            type: "PRIVATE",
            projectId: projectId,
            visibility: "PRIVATE",
            date: fullDate + "T00:00:00", // 날짜 정보 사용
            offsetMinutes: null, // List API에 없으므로 기본값
        };

        try {
            await api.put(`/projects/${projectId}/todos/${todoId}`, payload);

            onTodoDataChanged?.();
        } catch (error) {
            console.error("Private Todo 상태 업데이트 API 호출 실패:", error);

            setPrivateTodosMap((prevMap) => {
                const newMap = new Map(prevMap);
                const currentDateTodos = newMap.get(fullDate) || [];
                const updatedDateTodos = currentDateTodos.map((t) =>
                    t.id === todoId ? { ...t, status: originalStatus } : t // 원래 status로 복구
                );
                newMap.set(fullDate, updatedDateTodos);
                return newMap;
            });
            alert("할 일 상태 변경에 실패했습니다.");
        }
    };
    const handleEditPrivateTodo = (
        todo: TodoItemType,
        fullDate: string
    ) => {
        if (!onEditTodo) return;


        const sidebarTodo: SidebarTodo = {
            id: todo.id,
            title: todo.title,
            description: todo.description || "",
            status: todo.status as 'DONE' | 'IN_PROGRESS',
            type: "PRIVATE",
            parentEventColor: "#ffffff",
            parentEventTitle: 'Private',
            parentPrivateBorder: "1px solid gray",
            eventId: 0,
            date: fullDate,
            url: "",
            authorId: 0,
            offsetMinutes: null,
            orderNo: 0,
        };

        onEditTodo(sidebarTodo);
    };

    // [추가] Public Todo (EventTodo)를 클릭했을 때 SidebarTodo로 변환하여 onEditTodo를 호출하는 핸들러
    const handleEditPublicTodo = (
        todo: EventTodo,
        event: CalendarEvent, // 부모 이벤트 정보
        fullDate: string
    ) => {
        if (!onEditTodo) return;

        const sidebarTodo: SidebarTodo = {
            id: todo.id,
            title: todo.title,

            description: todo.description || "",
            status: todo.status as 'DONE' | 'IN_PROGRESS',
            type: "EVENT",
            parentEventColor: event.color || "#94a3b8",
            parentEventTitle: event.title,
            eventId: event.id,
            date: fullDate,

            url: todo.url || "",
            authorId: 0,
           // offsetMinutes: todo.offsetMinutes ?? null,
            orderNo: todo.orderNo || 0,
        };

        onEditTodo(sidebarTodo);
    };
    //const title = useMemo(() => projectName, [projectName]);

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

    // 메모 아이콘
    const MemoIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000"
             strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round"
             className="lucide lucide-message-square-text-icon lucide-message-square-text">
            <path
                d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"/>
            <path d="M7 11h10"/>
            <path d="M7 15h6"/>
            <path d="M7 7h8"/>
        </svg>
    );

    const TodoItem = ({
                          todo,
                          onClick,
                          onTitleClick, // [추가] 제목 클릭 핸들러
                      }: {
        todo: TodoItemType | EventTodo;
        onClick: () => void;
        onTitleClick: () => void; // [추가]
    }) => (
        <div
            key={todo.id}
            className={`flex items-center gap-2 ${todo.status === "DONE" ? "opacity-60" : ""
            }`}
        >
            <button
                onClick={onClick}
                aria-label="toggle todo"
                className={`w-4 h-4 border-2 rounded-md flex items-center justify-center ${todo.status === "DONE"
                    ? "border-slate-400"
                    : "border-slate-300"
                }`}
            >
                {todo.status === "DONE" && (
                    <div className="w-2 h-2 bg-slate-400 rounded-sm" />
                )}
            </button>
            {/* [수정] span에 onClick과 cursor-pointer 추가 */}
            <span
                onClick={onTitleClick}
                className={`text-[14px] cursor-pointer ${todo.status === "DONE"
                    ? "line-through text-slate-400"
                    : "text-slate-700"
                }`}
            >
                {todo.title}
            </span>
        </div>
    );
    return (
        <div className="w-full h-full bg-white flex flex-col dark:bg-neutral-900">

            {/* Days Scroll Section */}
            <div className="flex-1 overflow-y-auto">
                {days.map((day, idx) => {
                    const dayNum = normalizedDayText(day.date, idx + 1);
                    const dayInitial = weekdayInitial(day.weekday);
                    const dayMemos = day.memos || []; // 그날의 메모 가져오기
                    const privateTodos =
                        privateTodosMap.get(day.fullDate) || [];

                    return (
                        <div key={`${day.date}-${idx}`} className="border-b border-gray-300 dark:border-neutral-600">
                            {/* 한 날짜 블록 (relative 추가) */}
                            <div className="px-4 py-4 relative">

                                {/* --- 1. [수정] 메모 아이콘 (우측 상단) --- */}
                                {dayMemos.length > 0 && (
                                    <button
                                        onClick={() => onSelectMemo?.(dayMemos[0])} // 첫 번째 메모를 엽니다.
                                        className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:text-neutral-500 dark:hover:text-neutral-300"
                                        title={dayMemos[0].content} // 툴팁으로 첫 메모 내용 표시
                                    >
                                        <MemoIcon />
                                    </button>
                                )}



                                <div className="flex items-start gap-3">
                                    {/* 좌측 원형 날짜 + 요일 이니셜 */}
                                    <div className="flex flex-col items-center w-10">


                                        <div>
                                            <div className="w-7 h-7 rounded-full bg-slate-900 dark:bg-slate-800 text-white text-[13px] font-semibold flex items-center justify-center ">
                                                {dayNum}
                                            </div>

                                        </div>
                                        <span className="text-[11px] text-slate-400 mt-1 dark:text-slate-300">
                                            {dayInitial}
                                        </span>
                                    </div>

                                    {/* 우측 콘텐츠 (수정 없음) */}
                                    <div className="flex-1 pt-6">
                                        {/* === Private Todo 섹션 === */}
                                        <div className="pb-3">
                                            {privateTodos.length > 0 && (
                                                <div className="mb-2">
                                                    {/* KOR-MOD: 헤더와 리스트를 flex로 나란히 배치 */}
                                                    <div className="flex items-start gap-20">
                                                        {/* 헤더 */}
                                                        <p className="text-[11px] text-slate-500 font-semibold w-16 flex-shrink-0 pt-1">
                                                            Private Todo
                                                        </p>

                                                        {/* 목록 */}
                                                        <div className="flex-1 space-y-1">
                                                            {privateTodos.map(
                                                                (todo) => (
                                                                    <TodoItem
                                                                        key={
                                                                            todo.id
                                                                        }
                                                                        todo={
                                                                            todo
                                                                        }
                                                                        onClick={() =>
                                                                            handleTogglePrivateTodo(
                                                                                todo.id,
                                                                                day.fullDate
                                                                            )
                                                                        }
                                                                        // [추가] 제목 클릭 시 모달 열기
                                                                        onTitleClick={() =>
                                                                            handleEditPrivateTodo(
                                                                                todo,
                                                                                day.fullDate
                                                                            )
                                                                        }
                                                                    />
                                                                )
                                                            )}
                                                        </div>
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
                                                                style={{
                                                                    backgroundColor:
                                                                        event.color ||
                                                                        "#94a3b8",
                                                                }}
                                                            />
                                                            <span className="text-[12px] text-slate-500">
                                                                {timeRange(
                                                                    event
                                                                )}
                                                            </span>
                                                        </div>

                                                        {/* KOR-MOD: 이벤트 타이틀과 Public Todo 리스트를 flex로 나란히 배치 */}
                                                        <div className="flex items-start pl-4 gap-18">
                                                            {/* 1. 이벤트 타이틀 */}
                                                            <div className="flex items-start gap-2 w-15">
                                                                <span className="mt-2.5 inline-block w-3 h-0.5 rounded-sm bg-slate-400"></span>
                                                                <span className="text-[14px] text-slate-800 dark:text-slate-200">
                                                                    {event.title}
                                                                </span>
                                                            </div>

                                                            {/* 2. Public Todo 목록 */}
                                                            {event.todos &&
                                                                event.todos
                                                                    .length >
                                                                0 && (
                                                                    <div className="flex-1 space-y-1 pt-0.5">
                                                                        {event.todos.map(
                                                                            (
                                                                                todo
                                                                            ) => (
                                                                                <TodoItem
                                                                                    key={
                                                                                        todo.id
                                                                                    }
                                                                                    todo={
                                                                                        todo
                                                                                    }
                                                                                    onClick={() =>
                                                                                        onToggleTodoStatus?.(
                                                                                            todo.id
                                                                                        )
                                                                                    }
                                                                                    // [추가] 제목 클릭 시 모달 열기
                                                                                    onTitleClick={() =>
                                                                                        handleEditPublicTodo(
                                                                                            todo,
                                                                                            event,
                                                                                            day.fullDate
                                                                                        )
                                                                                    }
                                                                                />
                                                                            )
                                                                        )}
                                                                    </div>
                                                                )}
                                                        </div>
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
            <div className="h-[80px]" />
        </div>
    );
}