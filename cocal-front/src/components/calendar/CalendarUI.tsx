"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import WeekView from "./Week";
import DayView from "./Day";
import TaskProgress from "./TaskProgress";
import SidebarRight from "./SidebarRight";
import { EventDetailModal } from "./modals/EventDetailModal";
import ProfileDropdown from "./ProfileDropdown";
import ProfileSettingsModal from "./modals/ProfileSettingModal";
import {SettingsModal} from "./modals/SettingsModal";
import { EventModal } from "./modals/EventModal";
import { TeamModal } from "./modals/TeamModal";
import { MemoDetailModal } from "./modals/MemoDetailModal";
import { useUser } from "@/contexts/UserContext";
import { CalendarEvent, EventTodo, Project, ModalFormData, DateMemo, UserSummary  } from "./types";
import { getMonthMatrix, formatYMD, weekdays } from "./utils";
import { sampleEvents,sampleMemos  } from "./sampleData";

interface SidebarTodo extends EventTodo {
    parentEventTitle: string;
    parentEventColor: string;
}

const today = new Date();

const BASE_URL = "https://cocal-server.onrender.com/api";
const API_ENDPOINTS = {
    UPDATE_USER_NAME: `${BASE_URL}/users/edit-name`,
    UPDATE_USER_PASSWORD: `${BASE_URL}/users/edit-pwd`,
    UPDATE_USER_PHOTO: `${BASE_URL}/users/profile-image`,
};

export default function CalendarUI() {
    const { user, logout, isLoading: isUserLoading } = useUser();
    const router = useRouter();
    const params = useParams();

    const projectIdParam = Array.isArray(params?.projectId)
        ? params.projectId[0]
        : params?.projectId;
    const projectId = projectIdParam ? Number(projectIdParam) : NaN;

    // --- 상태 관리 ---
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());
    const [miniYear, setMiniYear] = useState(today.getFullYear());
    const [miniMonth, setMiniMonth] = useState(today.getMonth());

    const [events, setEvents] = useState<CalendarEvent[]>(sampleEvents);
    // 메모 데이터를 관리
    const [memos, setMemos] = useState<DateMemo[]>(sampleMemos);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    //  클릭된 메모 정보를 저장, 모달을 띄우는 역할
    const [selectedMemo, setSelectedMemo] = useState<DateMemo | null>(null);
    const [viewMode, setViewMode] = useState<"day" | "week" | "month">("month");
    const [currentProject, setCurrentProject] = useState<Project | null>(null);

    const [sidebarTodos, setSidebarTodos] = useState<SidebarTodo[]>([]);
    const [selectedSidebarDate, setSelectedSidebarDate] = useState(today);
    // Day 뷰에 표시할 특정 날짜를 관리
    const [selectedDate, setSelectedDate] = useState(today);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    // 일반 SettingsModal
    const [isProjectSettingsModalOpen, setIsProjectSettingsModalOpen] = useState(false);
    const [modalInitialDate, setModalInitialDate] = useState<string | null>(null);
    const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);

    useEffect(() => {
        const selectedDateKey = formatYMD(selectedSidebarDate.getFullYear(), selectedSidebarDate.getMonth(), selectedSidebarDate.getDate());
        const selectedDaysEvents = events.filter(e => e.startAt.startsWith(selectedDateKey));
        const allTodos: SidebarTodo[] = selectedDaysEvents.flatMap(event => (event.todos || []).map(todo => ({ ...todo, parentEventTitle: event.title, parentEventColor: event.color })));
        setSidebarTodos(allTodos);
    }, [events, selectedSidebarDate]);

    useEffect(() => {
        setTimeout(() => {
            const fetchedProjectData: Project = {
                id: projectId,
                name: '${name}',
                ownerId: 1,
                startDate: "2025-01-01",
                endDate: "2025-12-31",
                status: 'In Progress',
                members: []
            };
            setCurrentProject(fetchedProjectData);
        }, 500);
    }, [projectId]);

     //const miniMatrix = getMonthMatrix(miniYear, miniMonth);
    const matrix = getMonthMatrix(viewYear, viewMonth);

    // --- 이벤트 핸들러 함수들 ---
// 1. 미니 캘린더 날짜 클릭 핸들러: 사이드바의 할일 목록만 업데이트합니다.
    const handleSidebarDateSelect = (day: number) => {
        const newDate = new Date(miniYear, miniMonth, day);
        setSelectedSidebarDate(newDate);
    };

    // 2. 메인 캘린더 날짜 클릭 핸들러: Day 뷰로 전환합니다.
    const handleMainDateClick = (day: number) => {
        const newDate = new Date(viewYear, viewMonth, day);
        setSelectedDate(newDate);
        setViewMode("day");
    };
    const handleOpenEventModal = (dateStr?: string) => {
        setModalInitialDate(dateStr || null);
        setEventToEdit(null);
        setIsEventModalOpen(true);
    };
    const handleCloseEventModal = () => {
        setIsEventModalOpen(false);
        setEventToEdit(null);
    };

    const handleOpenTeamModal = () => setIsTeamModalOpen(true);
    const handleCloseTeamModal = () => setIsTeamModalOpen(false);
   //ProfileSettingModal핸들러
    const handleOpenSettingsModal = () => setIsSettingsModalOpen(true);
    const handleCloseSettingsModal = () => setIsSettingsModalOpen(false);
    // 일반 SettingsModal 핸들러
    const handleOpenProjectSettingsModal = () => setIsProjectSettingsModalOpen(true);
    const handleCloseProjectSettingsModal = () => setIsProjectSettingsModalOpen(false);
    const handleEditEvent = (event: CalendarEvent) => {
        setEventToEdit(event);
        setIsEventModalOpen(true);
        setSelectedEvent(null);
    };


    const handleSaveItem = (itemData: ModalFormData, type: 'Event' | 'Todo' | 'Memo', id?: number) => {
        // '수정' 로직
        if (id) {
            setEvents(prevEvents => prevEvents.map(event => {
                if (event.id === id) {
                    // [핵심 수정] 기존 event 데이터에 itemData를 덮어쓰되,
                    // description은 itemData.content 값으로 명시적으로 업데이트합니다.
                    return {
                        ...event,
                        ...itemData,
                        description: itemData.content || itemData.description, // content를 우선적으로 사용
                    };
                }
                return event;
            }));
            return;
        }
        if (type === 'Event') {
            const newEvent: CalendarEvent = {
                id: Date.now(),
                projectId: projectId,
                title: itemData.title,
                startAt: itemData.startAt,
                endAt: itemData.endAt,
                color: itemData.color || '#3b82f6', // 기본 색상
                description: itemData.content || itemData.description,
                location: itemData.location,
                visibility: itemData.visibility,
                urlId: 0,
                offsetMinutes: 0,
                allDay: false,
                authorId: user?.id || 0,
                todos: [],
            };
            setEvents(prevEvents => [...prevEvents, newEvent]);

        } else if (type === 'Memo') {
            const authorInfo: UserSummary[] = [];
            if (user && user.id) {
                authorInfo.push({
                    userId: user.id,
                    name: user.name ?? '',
                    email: user.email ?? '',
                    profileImageUrl: user.profileImageUrl
                });
            }
            const newMemo: DateMemo = {
                id: Date.now(),
                projectId: projectId,
                title: itemData.title,
                memoDate: itemData.memoDate,
                content: itemData.content,
                author: authorInfo, // 위에서 만든 authorInfo 배열을 할당
                createdAt: new Date().toISOString(),
            };
            setMemos(prevMemos => [...prevMemos, newMemo]);

        } else if (type === 'Todo') {
            // 할일을 담기 위한 보이지 않는 Event(Wrapper) 생성
            const newTodoItem: EventTodo = {
                id: Date.now() + 1,
                eventId: Date.now(),
                title: itemData.title,
                description: itemData.description,
                status: 'IN_PROGRESS',
                urlId: 0,
                offsetMinutes: 0,
                authorId: user?.id || 0,
                orderNo: 0,
            };

            const newTodoWrapperEvent: CalendarEvent = {
                id: newTodoItem.eventId,
                projectId: projectId,
                title: `Todo: ${itemData.title}`,
                startAt: `${itemData.memoDate}T00:00:00`,
                endAt: `${itemData.memoDate}T23:59:59`,
                color: 'transparent', // 캘린더에 보이지 않게 처리
                todos: [newTodoItem],
                description: null,
                location: null,
                visibility: 'PRIVATE',
                urlId: 0,
                offsetMinutes: 0,
                allDay: true,
                authorId: user?.id || 0,
            };
            setEvents(prevEvents => [...prevEvents, newTodoWrapperEvent]);
        }
    };

    const handleToggleTodoStatus = (todoId: number) => {
        setEvents(prevEvents =>
            prevEvents.map(event => {
                if (!event.todos || !event.todos.some(t => t.id === todoId)) return event;
                return {
                    ...event,
                    todos: event.todos.map(todo =>
                        todo.id === todoId ? { ...todo, status: todo.status === 'DONE' ? 'IN_PROGRESS' : 'DONE' } : todo
                    )
                };
            })
        );
    };

    function prevMiniMonth() {
        if (miniMonth === 0) { setMiniMonth(11); setMiniYear((y) => y - 1); } else setMiniMonth((m) => m - 1);
    }
    function nextMiniMonth() {
        if (miniMonth === 11) { setMiniMonth(0); setMiniYear((y) => y + 1); } else setMiniMonth((m) => m + 1);
    }
    function prevMonth() {
        const newMonth = viewMonth === 0 ? 11 : viewMonth - 1;
        const newYear = viewMonth === 0 ? viewYear - 1 : viewYear;
        setViewMonth(newMonth); setViewYear(newYear);
        setMiniMonth(newMonth); setMiniYear(newYear);
    }
    function nextMonth() {
        const newMonth = viewMonth === 11 ? 0 : viewMonth + 1;
        const newYear = viewMonth === 11 ? viewYear + 1 : viewYear;
        setViewMonth(newMonth); setViewYear(newYear);
        setMiniMonth(newMonth); setMiniYear(newYear);
    }

    // --- 렌더링 ---
    return (
        <div className="h-screen w-screen flex flex-col bg-white">
            <div className="flex items-center justify-between px-6 py-3 bg-white border-b">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push("/dashboard")} className="p-1 rounded-full hover:bg-slate-100">
                        <svg width="18" height="18" viewBox="0 0 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                    <h1 className="text-xl font-medium">{currentProject ? currentProject.name : "Project"}</h1>
                    <div className="w-2 h-2 rounded-full bg-emerald-400 ml-2" />
                </div>
                {isUserLoading ? (<div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>) : user && user.id ? (
                    <ProfileDropdown
                        user={{
                            name: user.name || "User",
                            email: user.email || "No email",
                            imageUrl: user.profileImageUrl || "https://placehold.co/100x100/A0BFFF/FFFFFF?text=User",
                        }}
                        onOpenSettings={handleOpenSettingsModal}
                        onLogout={logout}
                    />
                ) : ( <div><button onClick={() => router.push("/")}>Login</button></div>)}
            </div>
            <div className="flex flex-1 overflow-hidden">
                <aside className="w-[260px] border-r p-4 overflow-auto">
                    <div className="mb-4"><div className="w-full px-6 py-1.5 rounded-full border border-slate-300 text-sm font-medium text-slate-800 text-center">To do</div></div>
                    <div className="mb-6">
                        <div className="flex items-center justify-between"><button onClick={prevMiniMonth} className="text-xs">&#x276E;</button><div className="text-sm font-medium">{new Date(miniYear, miniMonth).toLocaleString("en-US", { month: "long", year: "numeric" })}</div><button onClick={nextMiniMonth} className="text-xs">&#x276F;</button></div>
                        <div className="mt-3 grid grid-cols-7 gap-1 text-[12px] text-slate-500">{["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (<div key={i} className="text-center">{d}</div>))}</div>
                        <div className="mt-2 grid grid-cols-7 gap-1 text-sm">{matrix.map((week, ri) => week.map((day, ci) => {
                            const isTodayDate = day && miniYear === today.getFullYear() && miniMonth === today.getMonth() && day === today.getDate();
                            const isSelected = day && miniYear === selectedSidebarDate.getFullYear() && miniMonth === selectedSidebarDate.getMonth() && day === selectedSidebarDate.getDate();
                            return (
                                <div
                                    key={`${ri}-${ci}`}
                                    // [수정] 미니 캘린더 전용 핸들러 (사이드바 할일 업데이트용)를 연결합니다.
                                    onClick={() => day && handleSidebarDateSelect(day)}
                                    className={`h-7 flex items-center justify-center rounded cursor-pointer ${isTodayDate ? "bg-slate-800 text-white" : isSelected ? "bg-slate-200 text-slate-800" : "text-slate-500 hover:bg-slate-100"}`}
                                >
                                    {day ?? ""}
                                </div>
                            );
                        }))}</div>
                    </div>
                    <div className="mb-6"><h3 className="text-sm font-medium mb-2">To do</h3><div className="space-y-3 text-sm">{sidebarTodos.length > 0 ? (sidebarTodos.map((todo) => (<div key={todo.id} className={`flex items-center gap-3 ${todo.status === "DONE" ? "opacity-50" : ""}`}><div className={`w-2 h-7 rounded ${todo.parentEventColor.startsWith("bg-") ? todo.parentEventColor : ""}`} style={{ backgroundColor: !todo.parentEventColor.startsWith("bg-") ? todo.parentEventColor : undefined }}></div><div className="flex-1"><div className={`font-medium ${todo.status === "DONE" ? "line-through text-slate-400" : ""}`}>{todo.title}</div><div className="text-xs text-slate-400">{todo.parentEventTitle}</div></div><button onClick={() => handleToggleTodoStatus(todo.id)} className="w-5 h-5 border-2 rounded-full flex items-center justify-center cursor-pointer">{todo.status === "DONE" && (<div className="w-2.5 h-2.5 bg-slate-400 rounded-full"></div>)}</button></div>))) : (<p className="text-xs text-slate-400 text-center py-4">No to-dos for the selected date.</p>)}</div></div>
                    <TaskProgress todos={sidebarTodos} />
                </aside>
                <main className="flex-1 p-6 overflow-auto">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-6">
                            <button onClick={prevMonth}
                                    className="text-slate-800 hover:text-slate-600 text-xl">&#x276E;</button>
                            {/* [수정] Day 뷰일 때는 선택된 날짜를, 아닐 때는 기존 월/년을 표시 */}
                            <h2 className="text-lg font-semibold text-slate-800">
                                {viewMode === 'day'
                                    ? selectedDate.toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })
                                    : new Date(viewYear, viewMonth).toLocaleString("en-US", {
                                        month: "long",
                                        year: "numeric"
                                    })
                                }
                            </h2>
                            <button onClick={nextMonth} className="text-slate-800 hover:text-slate-600 text-xl">&#x276F;</button>

                            </div>
                            <div className="flex items-center gap-3">
                                <select value={viewMode} onChange={(e) => setViewMode(e.target.value as "day" | "week" | "month")} className="border rounded px-3 py-1 text-sm">
                                    <option value="month">Month</option>
                                    <option value="week">Week</option>
                                    <option value="day">Day</option>
                                </select>
                            </div>
                    </div>
                    {viewMode === "month" && (<>
                                    <div
                                        className="grid grid-cols-7 text-xs text-slate-400 border-t border-b py-2">{weekdays.map((w) => (
                                        <div key={w} className="text-center">{w}</div>))}</div>
                                    <div className="grid grid-cols-7 gap-2 mt-3">{matrix.map((week, ri) => (
                                        <React.Fragment key={ri}>{week.map((day, ci) => {
                                            const dateKey = day ? formatYMD(viewYear, viewMonth, day) : "";
                                            const dayEvents = dateKey ? events.filter((e) => e.startAt.startsWith(dateKey)) : [];
                                            // 해당 날짜에 속한 메모들을 필터링
                                            const dayMemos = dateKey ? memos.filter((m) => m.memoDate === dateKey) : [];
                                            const isTodayDate = dateKey === formatYMD(today.getFullYear(), today.getMonth(), today.getDate());
                                            return (
                                                <div key={ci}
                                                     className={`min-h-[92px] border rounded p-2 bg-white relative ${isTodayDate ? "ring-2 ring-slate-300" : ""}`}>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1">
                                                            <div
                                                                className="text-sm font-medium cursor-pointer hover:text-blue-600"
                                                                onClick={() => day && handleMainDateClick(day)}
                                                            >
                                                                {day ?? ""}
                                                            </div>
                                                            <div className="flex items-center space-x-1">
                                                                {dayMemos.map(memo => (
                                                                    <div
                                                                        key={memo.id}
                                                                        onClick={() => setSelectedMemo(memo)}
                                                                        className="w-1.5 h-1.5 bg-red-500 rounded-full cursor-pointer"
                                                                        title={memo.content}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                        {day && (
                                                            <button onClick={() => handleOpenEventModal(dateKey)}
                                                                    className="w-5 h-5 flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded-full text-lg">+</button>
                                                        )}
                                                    </div>
                                                    <div className="mt-2 space-y-2">
                                                        {dayEvents.slice(0, 2).map((ev) => (
                                                            <div
                                                                key={ev.id}
                                                                className="px-2 py-1 rounded text-xs text-white cursor-pointer"
                                                                onClick={() => setSelectedEvent(ev)}
                                                                // style 속성을 사용하여 배경색 동적 할당
                                                                style={{backgroundColor: ev.color}}
                                                            >
                                                                <div className="truncate">{ev.title}</div>
                                                            </div>
                                                        ))}
                                                        {dayEvents.length > 2 && (<div
                                                            className="text-[12px] text-slate-400">+{dayEvents.length - 2} more</div>)}
                                                    </div>
                                                </div>
                                            );
                                        })}</React.Fragment>
                                    ))}</div>
                                </>
                            )}
                            {viewMode === "week" && <WeekView events={events}/>}
                    {viewMode === "day" && <DayView events={events} date={selectedDate} />}
                </main>
                <SidebarRight onOpenTeamModal={handleOpenTeamModal} onOpenEventModal={() => handleOpenEventModal()} onOpenSettingsModal={handleOpenProjectSettingsModal} />
            </div>
            {selectedEvent && (
                <EventDetailModal
                    event={selectedEvent}
                    onClose={() => setSelectedEvent(null)}

                    onEdit={handleEditEvent}
                />
            )}
            {/* selectedMemo 상태에 값이 있을 때만 MemoDetailModal 렌더링 */}
            {selectedMemo && (
                <MemoDetailModal
                    memo={selectedMemo}
                    onClose={() => setSelectedMemo(null)}
                />
            )}
            {isEventModalOpen && (
                <EventModal
                    onClose={handleCloseEventModal}
                    onSave={handleSaveItem}
                    initialDate={modalInitialDate}
                    editEvent={eventToEdit}
                    projectId={projectId}
                />
            )}
            {isTeamModalOpen && (<TeamModal projectId={projectId} onClose={handleCloseTeamModal} />)}
            <ProfileSettingsModal isOpen={isSettingsModalOpen} onClose={handleCloseSettingsModal} apiEndpoints={API_ENDPOINTS} />
            {/* SettingsModal */}
            {isProjectSettingsModalOpen && (
                <SettingsModal
                    onClose={handleCloseProjectSettingsModal}
                    projectId={projectId}
                    userId={user?.id || 0} // user 객체가 있을 경우 id를, 없으면 기본값(0)을 전달
                />
            )}
        </div>
    );
}

