"use client";

import React, { useState,useEffect } from "react";
import {CalendarEvent, EventData, ProjectMember, RealEventTodo} from "../types";
import { getReminderLabel } from "../utils/reminderUtils";
import {getEvent} from "@/api/eventApi";
import {getEventTodoAll, updateTodo, updateTodoRequest} from "@/api/todoApi";
import { ActiveTab } from "@/components/calendar/modals/EventModal";

interface Props {
    event: CalendarEvent;
    onClose: () => void;
    onEdit: (event: CalendarEvent) => void;
    onToggleTodo?: (todoId: number) => void;
    onEditTodo?: (todo: RealEventTodo) => void;
    onDeleteTodo?: (projectId: number,  todoId: number, eventId: number, type: "EVENT" | "PRIVATE") => void;
    onDeleteEvent?: (projectId: number, eventId: number) => void;
    members?: ProjectMember[];
}

// /** 레거시 호환: event.eventTodos / event.publicTodos를 허용 */
// type LegacyCalendarEvent = CalendarEvent & {
//     eventTodos?: EventTodo[];
//     publicTodos?: EventTodo[];
// };

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

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18"></path>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
);

// --- START: 아이콘 컴포넌트 정의 추가 ---


// const DeleteIcon = () => (
//     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
// );

const ChevronLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
);
const ChevronRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
);


// /** To-do 탭: todos 안전 합성 + 콜백 타입 명시 */
const TodoListTab = ({ event, onSelectTodo }: Props & { onSelectTodo?: (todo: RealEventTodo) => void }) => {
    // 이벤트 투두 상태
    const [eventTodos, setEventTodos] = useState<RealEventTodo[]>([]);
    // 이벤트 투두 index 상태
    const [currentTodoIndex, setCurrentTodoIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    // 현재 보고 있는 Todo가 바뀔 때 부모에 알림 (edit 위해 필요)
    useEffect(() => {
        if (onSelectTodo && eventTodos[currentTodoIndex]) {
            onSelectTodo(eventTodos[currentTodoIndex]);
        }
    }, [currentTodoIndex, eventTodos, onSelectTodo]);

    // 이벤트 투두 완료 핸들러
    const onTodoComplete = async (projectId:number, currentTodo:RealEventTodo) => {
        if (!currentTodo) return;
        try {
            setIsLoading(true);

            // 투두 상태 변경
            if (currentTodo.status === "IN_PROGRESS") currentTodo.status = "DONE";
            else if (currentTodo.status === "DONE") currentTodo.status = "IN_PROGRESS";

            // 요청 보낼 reqeust
            const requestTodo:updateTodoRequest = {
                title: currentTodo.title,
                description: currentTodo.description ?? "",
                status: currentTodo.status,
                url: currentTodo.url ?? "",
                type: "EVENT",
                eventId: currentTodo.eventId,
                projectId: projectId,
            };
            // api 호출
            await updateTodo(projectId, currentTodo.id, requestTodo);
            console.log("Todo 완료 성공");
        } catch (err) {
            console.error("Todo 상태 변경 실패:", err);
            alert("Failed to update the completion status.");
        } finally {
            setIsLoading(false);
        }
    };

    // ---  삭제 후 UI 오류 방지 로직 ---
    useEffect(() => {
        // 할 일이 삭제되어 현재 인덱스가 배열 범위를 벗어나는 경우,
        // 인덱스를 유효한 마지막 값으로 재설정하여 오류를 방지합니다.
        if (eventTodos.length > 0 && currentTodoIndex >= eventTodos.length) {
            setCurrentTodoIndex(eventTodos.length - 1);
        }
    }, [eventTodos.length, currentTodoIndex]);

    // 이벤트 투두 조회
    useEffect(() => {
        if (!event?.id || !event?.projectId) {console.log("이벤트가 없음."); return;}
        (async () => {
            try {
                // api 호출
                // 이벤트 조회(members:ProjectMember[] 사용)
                const data: RealEventTodo[] = await getEventTodoAll(event.projectId, event.id);
                // 이벤트멤버 저장
                console.log("이벤트 투두 조회 성공:", data);
                if (!data) {
                    window.alert("Failed to fetch event information.");
                    return;
                }
                setEventTodos(data);
            } catch (err: unknown) {
                console.error('이벤트 정보 로드 실패:', err);
            } finally {
            }
        })();
    }, [event?.id, event?.projectId, isLoading]);

    // ---  삭제 후 UI 오류 방지 로직 ---
    if (eventTodos.length === 0) {
        return <p className="text-center text-sm text-slate-500 dark:text-neutral-300 py-8">연관된 할 일이 없습니다.</p>;
    }
    const currentTodo = eventTodos?.[currentTodoIndex];

    // 다음 할 일로 이동
    const goToNext = () => {
        setCurrentTodoIndex((prevIndex) => (prevIndex + 1) % eventTodos.length);
    };

    // 이전 할 일로 이동
    const goToPrev = () => {
        setCurrentTodoIndex((prevIndex) => (prevIndex - 1 + eventTodos.length) % eventTodos.length);
    };
    const DetailRow = ({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) => (
        <div className="flex text-sm">
            <div className="w-28 text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-shrink-0">
                {icon}
                <span className="font-sm">{label}</span>
            </div>
            <div className="text-slate-800 dark:text-neutral-300 break-words min-w-0">{children}</div>
        </div>
    );

    return (
        <div className="p-1 space-y-1">
            {/* 상세 정보 */}
            <div className="space-y-4">
                <DetailRow label="Title">
                    {currentTodo?.title || <span className="text-slate-400">제목이 없습니다.</span>}
                </DetailRow>
                <DetailRow label="Description">
                    {currentTodo?.description || <span className="text-slate-400">설명이 없습니다.</span>}
                </DetailRow>
                <DetailRow label="Category">
                    {event.title || <span className="text-slate-400">미지정</span>}
                </DetailRow>

                <DetailRow label="URL" >
                    {currentTodo?.url ? (
                        <a href={currentTodo?.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate dark:text-blue-400">
                            {currentTodo?.url}
                        </a>
                    ) : (
                        <span className="text-slate-400">없음</span>
                    )}
                </DetailRow>

                <DetailRow label="Completed">
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={currentTodo?.status === "DONE"}
                            onChange={() => onTodoComplete(event.projectId, currentTodo) }
                            className="w-4 h-4 accent-blue-600 cursor-pointer"
                            disabled={!currentTodo} // currentTodo 없으면 비활성화
                        />
                        <span className={currentTodo?.status === "DONE" ? "text-green-600" : "text-slate-500 dark:text-neutral-300"}>
                          {currentTodo?.status === "DONE" ? "DONE" : "IN_PROGRESS"}
                        </span>
                    </div>
                </DetailRow>

                {/* 제목, 수정/삭제/탐색 버튼 */}
                <div className="flex justify-center items-center pt-3">
                    <h3 className="text-1xl font-bold text-slate-800 dark:text-neutral-300 truncate"></h3>
                    <div className="flex items-center gap-3 text-slate-600 ">
                        {/* 할 일이 2개 이상일 때만 화살표 표시 */}
                        {eventTodos.length > 1 && (
                            <div className="flex items-center gap-1">
                                <button onClick={goToPrev} className="p-1 rounded-full hover:bg-slate-100"><ChevronLeftIcon /></button>
                                <span className="text-xs font-mono w-auto text-center">{currentTodoIndex + 1} / {eventTodos.length}</span>
                                <button onClick={goToNext} className="p-1 rounded-full hover:bg-slate-100"><ChevronRightIcon /></button>
                            </div>
                        )}

                        {/*    <button onClick={() => onDeleteTodo?.(event.projectId, currentTodo.id, event.id, "EVENT")} className="hover:text-red-600"><DeleteIcon /></button>*/}
                    </div>
                </div>
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
                                     onDeleteEvent,
                                     members,
                                 }: Props) {
    const [activeTab, setActiveTab] = useState<ActiveTab>("Event");
    // const [currentTodoIndex, setCurrentTodoIndex] = useState(0);
    const [currentTodo, setCurrentTodo] = useState<RealEventTodo | null>(null);
    // 이벤트 정보 담는 상태
    const [eventData, setEventData] = useState<EventData | null>(null);
    // 이벤트 멤버 담는 상태
    const [eventMembers, setEventMembers] = useState<ProjectMember[]>([]);
    // --- 1. 로딩 상태 추가 ---
    const [isLoading, setIsLoading] = useState(true); // 처음엔 true로 설정

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
        } else if (activeTab === "Todo" && currentTodo) {
            onEditTodo?.(currentTodo);
            console.log("수정할 todo: ", currentTodo);
        } else {
            alert("No To-do items to edit.");
        }
    };
    const handleMainDeleteClick = () => {
        if (activeTab === "Event") {
            if (window.confirm("Are you sure you want to delete this event? All associated to-dos will also be deleted.")) {
                onDeleteEvent?.(event.projectId, event.id);
            }
        } else if (activeTab === "Todo" && currentTodo) {
            if (window.confirm("Are you sure you want to delete this to-do?")) {
                onDeleteTodo?.(event.projectId, currentTodo.id, event.id, "EVENT");
            }
        } else if (activeTab === "Todo" && !currentTodo) {
            alert("There is no to-do to delete.");
        }
    };

    // 이벤트 정보 조회
    useEffect(() => {
        // --- 2. 로딩 상태 관리 ---
        setIsLoading(true); // 새 이벤트가 선택될 때마다 로딩 시작
        (async () => {
            try {
                // api 호출
                // 이벤트 조회(members:ProjectMember[] 사용)
                const data: EventData = await getEvent(event.projectId, event.id);
                // 이벤트멤버 저장
                setEventMembers(data.members);
                console.log("이벤트 조회 성공:", data);
                if (!data) {
                    window.alert("Failed to fetch event information.");
                    return;
                }
                setEventData(data);
            } catch (err: unknown) {
                console.error('이벤트 정보 로드 실패:', err);
            } finally {
                setIsLoading(false);
            }
        })();
    }, [event]);

    // /** Event 탭 콘텐츠 */
    const EventContent = () => (
        <div className="space-y-4 text-sm p-1">
            <div className="flex items-center">
                <span className="w-24 text-slate-500 dark:text-slate-400">Time</span>
                <span className="text-slate-800 dark:text-neutral-300 font-medium">
          {`${formatISO(eventData?.startAt ?? "")} ~ ${formatISO(eventData?.endAt ?? "")}`}
        </span>
            </div>

            {/*  Team: 실제 멤버 표시 */}
            <div className="flex items-center">
                <span className="w-24 text-slate-500 dark:text-slate-400">Team</span>
                {eventMembers && eventMembers.length > 0 ? (
                    <TeamAvatars list={eventMembers}/>
                ) : (
                    <span className="text-slate-400">No members</span>
                )}
            </div>

            <div className="flex items-center">
                <span className="w-24 text-slate-500 dark:text-slate-400">Location</span>
                <span className="text-slate-800 dark:text-neutral-300">{eventData?.location || "Not specified"}</span>
            </div>

            <div className="flex items-start">
                <span className="w-24 text-slate-500 dark:text-slate-400 pt-1">Memo</span>
                <div className="flex-1 text-slate-800 dark:text-neutral-300 bg-slate-50 dark:bg-neutral-900 p-2 rounded-md text-xs min-h-[4rem]">
                    {eventData?.description || "No description available."}
                </div>
            </div>


            <div className="flex items-center">
                <span className="w-24 text-slate-500 dark:text-slate-400">Reminder</span>
                <span className="text-slate-800 dark:text-neutral-300">{getReminderLabel(eventData?.offsetMinutes ?? null)}</span>
            </div>

            <div className="flex items-start">
                <span className="w-24 text-slate-500 dark:text-slate-400 mt-1">URL</span>
                <div className="flex flex-col gap-1 dark:text-neutral-300">
                    {eventData?.urls && eventData.urls.length > 0 ? (
                        eventData.urls.map((urlObj, index) => (
                            <a
                                key={index}
                                href={typeof urlObj === "string" ? urlObj : urlObj.url} // EventUrl[] 형태면 .url 접근
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 truncate hover:underline"
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
                    ? "text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400"
                    : "text-slate-500 border-transparent hover:text-slate-800 dark:hover:text-slate-300"
            }`}
        >
            {tabName}
        </button>
    );

    return (
        // 모바일 레이아웃: 하단 정렬 + 둥근 상단 모서리
        <div className="fixed inset-0 bg-black/60 z-50 flex flex-col justify-end sm:items-center sm:justify-center">
            <div
                className="bg-white dark:bg-neutral-950 rounded-t-2xl sm:rounded-2xl shadow-lg w-full max-w-md sm:max-h-[90vh] h-[90vh] sm:h-auto overflow-hidden flex flex-col">
                {/* --- 헤더 --- */}
                <div className="p-4 border-b sticky top-0 bg-white z-10 dark:bg-neutral-950 dark:border-neutral-700">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-10 rounded-full" style={{backgroundColor: eventData?.color}}></div>
                            <h2 className="text-xl font-bold text-slate-800 truncate dark:text-white">{eventData?.title}</h2>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {/* --- START: 수정된 부분 --- */}
                            {/* 메인 Edit 버튼에 새로운 핸들러를 연결합니다. */}
                            <button
                                onClick={handleMainEditClick}
                                className="p-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-100/20 hover:text-slate-800 dark:hover:text-slate-300 transition-colors duration-150"
                                aria-label="Edit item"
                            >
                                <EditIcon/>
                            </button>
                            <button
                                onClick={handleMainDeleteClick}
                                className="p-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-100/20 hover:text-red-600 transition-colors duration-150"
                                aria-label="Delete item"
                            >
                                <TrashIcon/>
                            </button>
                            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">×
                            </button>

                        </div>
                    </div>
                </div>

                {/* --- 탭 버튼 --- */}
                <div className="flex border-b sticky top-[3.5rem] bg-white dark:bg-neutral-950 z-10 dark:border-neutral-700">
                    <TabButton tabName="Event"/>
                    <TabButton tabName="Todo"/>
                </div>

                {/* --- 컨텐츠 --- */}
                <div className="p-4 overflow-y-auto flex-1 min-h-0">
                    {/* --- 3. 로딩 상태에 따른 조건부 렌더링 --- */}
                    {activeTab === "Event" ? (
                        isLoading ? (
                            <div className="text-center text-slate-500 dark:text-neutral-300 py-8">
                                Loading...
                            </div>
                        ) : (
                            <EventContent/>
                        )
                    ) : (
                        <TodoListTab
                            event={event}
                            onClose={onClose}
                            onEdit={onEdit}
                            onToggleTodo={onToggleTodo}
                            onEditTodo={onEditTodo}
                            onDeleteTodo={onDeleteTodo}
                            onDeleteEvent={onDeleteEvent}
                            members={members} // 전달은 되지만 TodoListTab에서 사용하지 않음(무시됨)
                            onSelectTodo={setCurrentTodo} // 현재 보고 있는 Todo를 상위로 전달
                        />
                    )}
                </div>
            </div>
        </div>
    );
}