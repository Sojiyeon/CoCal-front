"use client";

import React, { useState,useEffect } from "react";
import {CalendarEvent, EventData, EventTodo, ProjectMember} from "../types";
import { getReminderLabel } from "../utils/reminderUtils";
import {getEvent} from "@/api/eventApi";

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

// --- START: 아이콘 컴포넌트 정의 추가 ---


const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
);

const ChevronLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
);
const ChevronRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
);


// /** To-do 탭: todos 안전 합성 + 콜백 타입 명시 */
const TodoListTab = ({ event,  onDeleteTodo }: Props) => {
    const [currentTodoIndex, setCurrentTodoIndex] = useState(0);

    const e = event as LegacyCalendarEvent;
    //  todos → eventTodos → publicTodos 순으로 안전하게 합성
    const todos: EventTodo[] = e.todos ?? e.eventTodos ?? e.publicTodos ?? [];
   // ---  삭제 후 UI 오류 방지 로직 ---
    useEffect(() => {
        // 할 일이 삭제되어 현재 인덱스가 배열 범위를 벗어나는 경우,
        // 인덱스를 유효한 마지막 값으로 재설정하여 오류를 방지합니다.
        if (todos.length > 0 && currentTodoIndex >= todos.length) {
            setCurrentTodoIndex(todos.length - 1);
        }
    }, [todos.length, currentTodoIndex]);
    // ---  삭제 후 UI 오류 방지 로직 ---
    if (todos.length === 0) {
        return <p className="text-center text-sm text-slate-500 py-8">연관된 할 일이 없습니다.</p>;
    }
    const currentTodo = todos[currentTodoIndex];

    // 다음 할 일로 이동
    const goToNext = () => {
        setCurrentTodoIndex((prevIndex) => (prevIndex + 1) % todos.length);
    };

    // 이전 할 일로 이동
    const goToPrev = () => {
        setCurrentTodoIndex((prevIndex) => (prevIndex - 1 + todos.length) % todos.length);
    };
    const DetailRow = ({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) => (
        <div className="flex text-sm">
            <div className="w-28 text-slate-500 flex items-center gap-2 flex-shrink-0">
                {icon}
                <span className="font-semibold">{label}</span>
            </div>
            <div className="text-slate-800 break-words min-w-0">{children}</div>
        </div>
    );

    return (
        <div className="p-1 space-y-1">
            {/* 제목, 수정/삭제/탐색 버튼 */}
            <div className="flex justify-between items-center">
                <h3 className="text-1xl font-bold text-slate-800 truncate"></h3>
                <div className="flex items-center gap-3 text-slate-600">
                    {/* 할 일이 2개 이상일 때만 화살표 표시 */}
                    {todos.length > 1 && (
                        <div className="flex items-center gap-1">
                            <button onClick={goToPrev} className="p-1 rounded-full hover:bg-slate-100"><ChevronLeftIcon /></button>
                            <span className="text-xs font-mono w-12 text-center">{currentTodoIndex + 1} / {todos.length}</span>
                            <button onClick={goToNext} className="p-1 rounded-full hover:bg-slate-100"><ChevronRightIcon /></button>
                        </div>
                    )}

                    <button onClick={() => onDeleteTodo?.(currentTodo.id, "EVENT")} className="hover:text-red-600"><DeleteIcon /></button>
                </div>
            </div>

            {/* 상세 정보 */}
            <div className="space-y-4">
                <DetailRow label="Title">
                    {currentTodo.title || <span className="text-slate-400">메모가 없습니다.</span>}
                </DetailRow>
                <DetailRow label="Description">
                    {currentTodo.description || <span className="text-slate-400">메모가 없습니다.</span>}
                </DetailRow>
                <DetailRow label="Category">
                    {event.title || <span className="text-slate-400">미지정</span>}
                </DetailRow>

                <DetailRow label="URL" >
                    {currentTodo.url ? (
                        <a href={currentTodo.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                            {currentTodo.url}
                        </a>
                    ) : (
                        <span className="text-slate-400">없음</span>
                    )}
                </DetailRow>
            </div>
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

// 이벤트 ui
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
    const [currentTodoIndex, setCurrentTodoIndex] = useState(0);
    // 이벤트 정보 담는 상태
    const [eventData, setEventData] = useState<EventData | null>(null);
    // 이벤트 멤버 담는 상태
    const [eventMembers, setEventMembers] = useState<ProjectMember[]>([]);
    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
    };
    // 2025-10-11 11:00 형식
    const formatISO = (dateString: string) => {
        const date = new Date(dateString);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        const h = String(date.getHours()).padStart(2, "0");
        const min = String(date.getMinutes()).padStart(2, "0");
        return `${y}.${m}.${d} ${h}:${min}`;
    };

    const handleMainEditClick = () => {
        if (activeTab === "Event") {
            onEdit(event);
        } else { // "To do" 탭이 활성화된 경우
            const e = event as LegacyCalendarEvent;
            const todos: EventTodo[] = e.todos ?? e.eventTodos ?? e.publicTodos ?? [];

            if (todos.length > 0 && todos[currentTodoIndex]) {
                const currentTodo = todos[currentTodoIndex];
                onEditTodo?.(currentTodo); // 현재 보고 있는 할일를 수정합니다.
            }
        }
    };

    // 이벤트 정보 조회
    useEffect(() => {
        (async () => {
            try {
                // api 호출
                // 이벤트 조회(members:ProjectMember[] 사용)
                const data: EventData = await getEvent(event.projectId, event.id);
                // 이벤트멤버 저장
                setEventMembers(data.members);
                console.log("이벤트 조회 성공:", data);
                if (!data) {
                    window.alert("이벤트 정보를 가져오지 못했습니다.");
                    return;
                }
                setEventData(data);
            } catch (err: unknown) {
                console.error('이벤트 정보 로드 실패:', err);
            } finally {
            }
        })();
    }, [event]);

   // /** Event 탭 콘텐츠 */
    const EventContent = () => (
        <div className="space-y-4 text-sm p-1">
            <div className="flex items-center">
                <span className="w-24 text-slate-500">Time</span>
                <span className="text-slate-800 font-medium">
          {`${formatISO(eventData?.startAt ?? "")} ~ ${formatISO(eventData?.endAt ?? "")}`}
        </span>
            </div>

            {/*  Team: 실제 멤버 표시 */}
            <div className="flex items-center">
                <span className="w-24 text-slate-500">Team</span>
                {eventMembers && eventMembers.length > 0 ? (
                    <TeamAvatars list={eventMembers}/>
                ) : (
                    <span className="text-slate-400">No members</span>
                )}
            </div>

            <div className="flex items-center">
                <span className="w-24 text-slate-500">Location</span>
                <span className="text-slate-800">{eventData?.location || "Not specified"}</span>
            </div>

            <div className="flex items-start">
                <span className="w-24 text-slate-500 pt-1">Memo</span>
                <div className="flex-1 text-slate-800 bg-slate-50 p-2 rounded-md text-xs min-h-[4rem]">
                    {eventData?.description || "작성된 설명이 없습니다."}
                </div>
            </div>


            <div className="flex items-center">
                <span className="w-24 text-slate-500">Reminder</span>
                <span className="text-slate-800">{getReminderLabel(eventData?.offsetMinutes ?? null)}</span>
            </div>

            <div className="flex items-start">
                <span className="w-24 text-slate-500 mt-1">URL</span>
                <div className="flex flex-col gap-1">
                    {eventData?.urls && eventData.urls.length > 0 ? (
                        eventData.urls.map((urlObj, index) => (
                            <a
                                key={index}
                                href={typeof urlObj === "string" ? urlObj : urlObj.url} // EventUrl[] 형태면 .url 접근
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 truncate hover:underline"
                            >
                                {typeof urlObj === "string" ? urlObj : urlObj.url}
                            </a>
                        ))
                    ) : (
                        <span>-</span>
                    )}
                </div>
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
                            <div className="w-2.5 h-10 rounded-full" style={{backgroundColor: eventData?.color}}></div>
                            <h2 className="text-xl font-bold text-slate-800 truncate">{eventData?.title}</h2>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {/* --- START: 수정된 부분 --- */}
                            {/* 메인 Edit 버튼에 새로운 핸들러를 연결합니다. */}
                            <button onClick={handleMainEditClick}
                                    className="text-xs font-semibold text-slate-500 hover:text-slate-800">
                                Edit
                            </button>
                            {/* --- END: 수정된 부분 --- */}
                            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">×
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- 탭 버튼 --- */}
                <div className="flex border-b sticky top-[3.5rem] bg-white z-10">
                    <TabButton tabName="Event"/>
                    <TabButton tabName="To do"/>
                </div>

                {/* --- 컨텐츠 --- */}
                <div className="p-4 overflow-y-auto h-full">
                    {activeTab === "Event" ? (
                        <EventContent/>
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
