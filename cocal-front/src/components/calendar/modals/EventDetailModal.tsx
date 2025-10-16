"use client";

import React, { useState } from "react";
import { CalendarEvent, EventTodo, ProjectMember } from "../types";
import { getReminderLabel } from "../utils/reminderUtils";

interface Props {
    event: CalendarEvent;
    onClose: () => void;
    onEdit: (event: CalendarEvent) => void;
    onToggleTodo?: (todoId: number) => void;
    onEditTodo?: (todo: EventTodo) => void;
    onDeleteTodo?: (todoId: number, type: "EVENT" | "PRIVATE") => void;
    members?: ProjectMember[];

}

// /** 레거시 호환: event.eventTodos / event.publicTodos를 허용 */
type LegacyCalendarEvent = CalendarEvent & {
    eventTodos?: EventTodo[];
    publicTodos?: EventTodo[];
};

type ActiveTab = "Event" | "To do";

///**  이름에서 이니셜 생성(이미지 없을 때 표시) */
const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    const a = parts[0]?.[0] ?? "";
    const b = parts.length > 1 ? parts[1][0] : "";
    return (a + b || a || "U").toUpperCase();
};

// /**  프로필 이미지 실패 시 사용하는 대체 이미지 */
const AVATAR_FALLBACK =
    "https://placehold.co/100x100/A0BFFF/FFFFFF?text=User";

// /** To-do 탭: todos 안전 합성 + 콜백 타입 명시 */
const TodoListTab = ({ event, onToggleTodo, onEditTodo, onDeleteTodo }: Props) => {
    const e = event as LegacyCalendarEvent;
    //  todos → eventTodos → publicTodos 순으로 안전하게 합성
    const todos: EventTodo[] = e.todos ?? e.eventTodos ?? e.publicTodos ?? [];

    if (todos.length === 0) {
        return <p className="text-center text-sm text-slate-500 py-8">연관된 할 일이 없습니다.</p>;
    }

    return (
        <div className="space-y-3 p-1">
            {todos.map((todo: EventTodo) => (
                <div
                    key={todo.id}
                    className={`flex items-center gap-3 p-2 rounded-lg ${todo.status === "DONE" ? "opacity-60" : ""}`}
                >
                    <button
                        onClick={() => onToggleTodo?.(todo.id)}
                        className="w-5 h-5 border-2 rounded-md flex-shrink-0 flex items-center justify-center cursor-pointer"
                    >
                        {todo.status === "DONE" && <div className="w-2.5 h-2.5 bg-slate-500 rounded-sm"></div>}
                    </button>

                    <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${todo.status === "DONE" ? "line-through text-slate-500" : ""}`}>
                            {todo.title}
                        </p>
                        {todo.description && <p className="text-xs text-slate-400 truncate">{todo.description}</p>}
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={() => onDeleteTodo?.(todo.id, "EVENT")} className="text-slate-400 hover:text-red-600">Delete</button>
                    </div>
                </div>
            ))}
        </div>
    );
};

///**  팀 아바타 스택: 최대 5명 표시 + 남은 인원은 +N 배지 */
const TeamAvatars = ({ list }: { list: ProjectMember[] }) => {
    const visible = list.slice(0, 5);
    const rest = list.length - visible.length;

    return (
        <div className="flex -space-x-2">
            {visible.map((m) => {
                const title = `${m.name}${m.email ? ` • ${m.email}` : ""}`;
                const src =
                    m.profileImageUrl?.replace?.("96x96", "40x40") ??
                    m.profileImageUrl ??
                    "";

                return (
                    <div
                        key={m.userId}
                        className="w-6 h-6 rounded-full ring-2 ring-white overflow-hidden bg-slate-200
                       flex items-center justify-center text-[10px] font-semibold text-slate-700"
                        title={title}
                    >
                        {src ? (
                            <img
                                src={src}
                                alt={m.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = AVATAR_FALLBACK; //  이미지 로드 실패 시 대체
                                }}
                            />
                        ) : (
                            <span>{getInitials(m.name)}</span> //  이미지 없으면 이니셜
                        )}
                    </div>
                );
            })}

            {rest > 0 && (
                <div className="w-6 h-6 rounded-full ring-2 ring-white bg-slate-300 text-[10px]
                        font-semibold text-slate-700 flex items-center justify-center">
                    +{rest}
                </div>
            )}
        </div>
    );
};

export function EventDetailModal({
                                     event,
                                     onClose,
                                     onEdit,
                                     onToggleTodo,
                                     onEditTodo,
                                     onDeleteTodo,
                                     members,
                                 }: Props) {
    const [activeTab, setActiveTab] = useState<ActiveTab>("Event");

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
    };

   // /** Event 탭 콘텐츠 */
    const EventContent = () => (
        <div className="space-y-4 text-sm p-1">
            <div className="flex items-center">
                <span className="w-24 text-slate-500">Time</span>
                <span className="text-slate-800 font-medium">
          {`${formatTime(event.startAt)} - ${formatTime(event.endAt)}`}
        </span>
            </div>

            {/*  Team: 실제 멤버 표시 */}
            <div className="flex items-center">
                <span className="w-24 text-slate-500">Team</span>
                {members && members.length > 0 ? (
                    <TeamAvatars list={members}/>
                ) : (
                    <span className="text-slate-400">No members</span>
                )}
            </div>

            <div className="flex items-center">
                <span className="w-24 text-slate-500">Location</span>
                <span className="text-slate-800">{event.location || "Not specified"}</span>
            </div>

            <div className="flex items-start">
                <span className="w-24 text-slate-500 pt-1">Memo</span>
                <div className="flex-1 text-slate-800 bg-slate-50 p-2 rounded-md text-xs min-h-[4rem]">
                    {event.description || "작성된 메모가 없습니다."}
                </div>
            </div>


            <div className="flex items-center">
                <span className="w-24 text-slate-500">Reminder</span>
                <span className="text-slate-800">{getReminderLabel(event.offsetMinutes ?? null)}</span>
            </div>

            <div className="flex items-center"><span className="w-24 text-slate-500">URL</span>
                {event.url ? (
                    <a href={event.url} target="_blank" rel="noopener noreferrer"
                       className="text-blue-600 truncate hover:underline">{event.url}</a>
                ) : (
                    <span>-</span>
                )}
            </div>
        </div>
    );

    ///** 탭 버튼 공통 컴포넌트 */
    const TabButton = ({tabName}: { tabName: ActiveTab }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tabName
                    ? "text-blue-600 border-blue-600"
                    : "text-slate-500 border-transparent hover:text-slate-800"
            }`}
        >
            {tabName}
        </button>
    );

    return (
        // 모바일 레이아웃: 하단 정렬 + 둥근 상단 모서리
        <div className="fixed inset-0 bg-black/60 z-50 flex flex-col justify-end sm:items-center sm:justify-center">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-lg w-full max-w-md sm:max-h-[90vh] h-[90vh] sm:h-auto overflow-hidden">
                {/* --- 헤더 --- */}
                <div className="p-4 border-b sticky top-0 bg-white z-10">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-10 rounded-full" style={{ backgroundColor: event.color }}></div>
                            <h2 className="text-xl font-bold text-slate-800 truncate">{event.title}</h2>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button onClick={() => onEdit(event)} className="text-xs font-semibold text-slate-500 hover:text-slate-800">
                                Edit
                            </button>
                            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
                        </div>
                    </div>
                </div>

                {/* --- 탭 버튼 --- */}
                <div className="flex border-b sticky top-[3.5rem] bg-white z-10">
                    <TabButton tabName="Event" />
                    <TabButton tabName="To do" />
                </div>

                {/* --- 컨텐츠 --- */}
                <div className="p-4 overflow-y-auto h-full">
                    {activeTab === "Event" ? (
                        <EventContent />
                    ) : (
                        <TodoListTab
                            event={event}
                            onClose={onClose}
                            onEdit={onEdit}
                            onToggleTodo={onToggleTodo}
                            onEditTodo={onEditTodo}
                            onDeleteTodo={onDeleteTodo}
                            members={members} // 전달은 되지만 TodoListTab에서 사용하지 않음(무시됨)
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
