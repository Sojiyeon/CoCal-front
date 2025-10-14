"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

// 하위 컴포넌트들
import WeekView from "./Week";
import DayView from "./Day";
import SidebarLeft from "./SidebarLeft";
import SidebarRight from "./SidebarRight";
import { EventDetailModal } from "./modals/EventDetailModal";
import ProfileDropdown from "./ProfileDropdown";
import ProfileSettingsModal from "./modals/ProfileSettingModal";
import { SettingsModal } from "./modals/SettingsModal";
import { EventModal } from "./modals/EventModal";
import { TeamModal } from "./modals/TeamModal";
import { MemoDetailModal } from "./modals/MemoDetailModal";

// 전역 사용자 정보와 타입 정의, 유틸 함수, 샘플 데이터
import { useUser } from "@/contexts/UserContext";
import { CalendarEvent, EventTodo, Project, ModalFormData, DateMemo, UserSummary, PrivateTodo, SidebarTodo } from "./types";
import { getMonthMatrix, formatYMD, weekdays } from "./utils";
import { sampleEvents, sampleMemos } from "./sampleData";


// 오늘 날짜를 저장하는 상수
const today = new Date();

// API 엔드포인트들을 정의하는 객체
const BASE_URL = "https://cocal-server.onrender.com/api";
const API_ENDPOINTS = {
    UPDATE_USER_NAME: `${BASE_URL}/users/edit-name`,
    UPDATE_USER_PASSWORD: `${BASE_URL}/users/edit-pwd`,
    UPDATE_USER_PHOTO: `${BASE_URL}/users/profile-image`,
    DELETE_USER_PHOTO: `${BASE_URL}/users/profile-image`,
};

// 메인 캘린더 UI 컴포넌트
export default function CalendarUI() {
    // --- 훅(Hooks) 초기화 ---
    const { user, logout, isLoading: isUserLoading } = useUser();
    const router = useRouter();
    const params = useParams();

    const projectIdParam = Array.isArray(params?.projectId) ? params.projectId[0] : params?.projectId;
    const projectId = projectIdParam ? Number(projectIdParam) : NaN;

    // --- 상태(State) 관리 ---
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());
    const [miniYear, setMiniYear] = useState(today.getFullYear());
    const [miniMonth, setMiniMonth] = useState(today.getMonth());

    const [events, setEvents] = useState<CalendarEvent[]>(sampleEvents);
    const [memos, setMemos] = useState<DateMemo[]>(sampleMemos);

    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [selectedMemo, setSelectedMemo] = useState<DateMemo | null>(null);

    const [viewMode, setViewMode] = useState<"day" | "week" | "month">("month");
    const [currentProject, setCurrentProject] = useState<Project | null>(null);

    const [sidebarTodos, setSidebarTodos] = useState<SidebarTodo[]>([]);
    const [selectedSidebarDate, setSelectedSidebarDate] = useState(today);
    const [privateTodos, setPrivateTodos] = useState<PrivateTodo[]>([]);
    const [selectedDate, setSelectedDate] = useState(today);

    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isProjectSettingsModalOpen, setIsProjectSettingsModalOpen] = useState(false);

    const [modalInitialDate, setModalInitialDate] = useState<string | null>(null);
    const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);

    // --- useEffect 훅 ---
    useEffect(() => {
        const selectedDateKey = formatYMD(selectedSidebarDate.getFullYear(), selectedSidebarDate.getMonth(), selectedSidebarDate.getDate());

        const publicTodos: SidebarTodo[] = events
            .filter(e => e.startAt.startsWith(selectedDateKey) && e.todos)
            .flatMap(event => (event.todos || []).map(todo => ({
                ...todo,
                parentEventTitle: event.title,
                parentEventColor: event.color,
            })));

        const privateTodosForDate: SidebarTodo[] = privateTodos
            .filter(todo => todo.date.startsWith(selectedDateKey))
            .map(todo => ({
                id: todo.id,
                title: todo.title,
                description: todo.description,
                status: todo.status,
                type: todo.type,
                parentEventTitle: 'Private',
                parentEventColor: '#A0AEC0',
                eventId: 0,
                urlId: 0,
                authorId: todo.userId,
                orderNo: 0,
            }));

        setSidebarTodos([...publicTodos, ...privateTodosForDate]);
    }, [events, privateTodos, selectedSidebarDate]);

    useEffect(() => {
        setTimeout(() => {
            const fetchedProjectData: Project = {
                id: projectId,
                name: '프로젝트 이름',
                ownerId: 1,
                startDate: "2025-01-01",
                endDate: "2025-12-31",
                status: 'In Progress',
                members: []
            };
            setCurrentProject(fetchedProjectData);
        }, 500);
    }, [projectId]);

    const matrix = getMonthMatrix(viewYear, viewMonth);
    const miniMatrix = getMonthMatrix(miniYear, miniMonth);

    // --- 이벤트 핸들러 함수들 ---
    const handleSidebarDateSelect = (day: number) => {
        const newDate = new Date(miniYear, miniMonth, day);
        setSelectedSidebarDate(newDate);
    };

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

    const handleOpenSettingsModal = () => setIsSettingsModalOpen(true);
    const handleCloseSettingsModal = () => setIsSettingsModalOpen(false);

    const handleOpenProjectSettingsModal = () => setIsProjectSettingsModalOpen(true);
    const handleCloseProjectSettingsModal = () => setIsProjectSettingsModalOpen(false);

    const handleEditEvent = (event: CalendarEvent) => {
        setSelectedEvent(null);
        setEventToEdit(event);
        setIsEventModalOpen(true);
    };

    const handleSaveItem = (itemData: ModalFormData, type: 'Event' | 'Todo' | 'Memo', id?: number) => {
        if (id) {
            setEvents(prevEvents => prevEvents.map(event => {
                if (event.id === id) {
                    return { ...event, ...itemData, description: itemData.content || itemData.description };
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
                color: itemData.color || '#3b82f6',
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
                author: authorInfo,
                createdAt: new Date().toISOString(),
            };
            setMemos(prevMemos => [...prevMemos, newMemo]);
        } else if (type === 'Todo') {
            const visibility = itemData.visibility;
            if (visibility === 'PRIVATE') {
                const newPrivateTodo: PrivateTodo = {
                    id: Date.now(),
                    projectId: projectId,
                    userId: user?.id || 0,
                    title: itemData.title,
                    description: itemData.description,
                    date: `${itemData.memoDate}T00:00:00`,
                    status: 'IN_PROGRESS',
                    type: 'PRIVATE',
                    url: itemData.url,
                };
                setPrivateTodos(prev => [...prev, newPrivateTodo]);
            } else {
                const newTodoItem: EventTodo = {
                    id: Date.now() + 1,
                    eventId: Date.now(),
                    title: itemData.title,
                    description: itemData.description,
                    status: 'IN_PROGRESS',
                    type: 'EVENT',
                    urlId: 0,
                    authorId: user?.id || 0,
                    orderNo: 0,
                };
                const newTodoWrapperEvent: CalendarEvent = {
                    id: newTodoItem.eventId,
                    projectId: projectId,
                    title: `Todo: ${itemData.title}`,
                    startAt: `${itemData.memoDate}T00:00:00`,
                    endAt: `${itemData.memoDate}T23:59:59`,
                    color: 'transparent',
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
        setPrivateTodos(prevPrivateTodos =>
            prevPrivateTodos.map(todo =>
                todo.id === todoId ? { ...todo, status: todo.status === 'DONE' ? 'IN_PROGRESS' : 'DONE' } : todo
            )
        );
    };

    function prevMiniMonth() {
        if (miniMonth === 0) { setMiniMonth(11); setMiniYear(y => y - 1); } else setMiniMonth(m => m - 1);
    }
    function nextMiniMonth() {
        if (miniMonth === 11) { setMiniMonth(0); setMiniYear(y => y + 1); } else setMiniMonth(m => m + 1);
    }
    function prevMonth() {
        setViewMonth(viewMonth === 0 ? 11 : viewMonth - 1);
        setViewYear(viewMonth === 0 ? viewYear - 1 : viewYear);
    }
    function nextMonth() {
        setViewMonth(viewMonth === 11 ? 0 : viewMonth + 1);
        setViewYear(viewMonth === 11 ? viewYear + 1 : viewYear);
    }

    // --- 렌더링 ---
    return (
        <div className="h-screen w-screen flex flex-col bg-white">
            {/* 상단 헤더 */}
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
            {/* 메인 영역 */}
            <div className="flex flex-1 overflow-hidden">
                {/* 왼쪽 사이드바 */}
                <SidebarLeft
                    miniYear={miniYear}
                    miniMonth={miniMonth}
                    prevMiniMonth={prevMiniMonth}
                    nextMiniMonth={nextMiniMonth}
                    miniMatrix={miniMatrix}
                    selectedSidebarDate={selectedSidebarDate}
                    handleSidebarDateSelect={handleSidebarDateSelect}
                    sidebarTodos={sidebarTodos}
                    user={(user && user.id) ? { // user와 user.id가 모두 유효한 값일 때만 객체 생성
                        userId: user.id,
                        name: user.name ?? 'User',
                        email: user.email ?? '',
                        profileImageUrl: user.profileImageUrl
                    } : null}
                    handleToggleTodoStatus={handleToggleTodoStatus}
                />
                {/* 메인 캘린더 영역 */}
                <main className="flex-1 p-6 overflow-auto">
                    {/* 메인 캘린더 헤더 */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-6">
                            <button onClick={prevMonth} className="w-12 h-12 flex items-center justify-center text-slate-800 hover:text-slate-600 text-xlp-2 rounded-full hover:bg-slate-100">&#x276E;</button>
                            <h2 className="text-lg font-semibold text-slate-800">
                                {viewMode === 'day'
                                    ? selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                                    : new Date(viewYear, viewMonth).toLocaleString("en-US", { month: "long", year: "numeric" })
                                }
                            </h2>
                            <button onClick={nextMonth} className="w-12 h-12 flex items-center justify-center text-slate-800 hover:text-slate-600 text-xlp-2 rounded-full hover:bg-slate-100">&#x276F;</button>
                        </div>
                        <div className="flex items-center gap-3">
                            <select value={viewMode} onChange={(e) => setViewMode(e.target.value as "day" | "week" | "month")} className="border rounded px-3 py-1 text-sm">
                                <option value="month">Month</option>
                                <option value="week">Week</option>
                                <option value="day">Day</option>
                            </select>
                        </div>
                    </div>
                    {/* 월간/주간/일간 뷰 렌더링 */}
                    {viewMode === "month" && (
                        <>
                            <div className="grid grid-cols-7 text-xs text-slate-400 border-t border-b py-2">{weekdays.map((w) => (<div key={w} className="text-center">{w}</div>))}</div>
                            <div className="grid grid-cols-7 gap-2 mt-3">{matrix.map((week, ri) => (
                                <React.Fragment key={ri}>{week.map((day, ci) => {
                                    const dateKey = day ? formatYMD(viewYear, viewMonth, day) : "";
                                    const dayEvents = dateKey ? events.filter((e) => e.startAt.startsWith(dateKey)) : [];
                                    const dayMemos = dateKey ? memos.filter((m) => m.memoDate === dateKey) : [];
                                    const isTodayDate = dateKey === formatYMD(today.getFullYear(), today.getMonth(), today.getDate());
                                    return (
                                        <div key={ci} className={`min-h-[92px] border rounded p-2 bg-white relative ${isTodayDate ? "ring-2 ring-slate-300" : ""}`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1">
                                                    <div className="text-sm font-medium cursor-pointer hover:text-blue-600" onClick={() => day && handleMainDateClick(day)}>
                                                        {day ?? ""}
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        {dayMemos.map(memo => (
                                                            <div key={memo.id} onClick={() => setSelectedMemo(memo)} className="w-1.5 h-1.5 bg-red-500 rounded-full cursor-pointer" title={memo.content} />
                                                        ))}
                                                    </div>
                                                </div>
                                                {day && (<button onClick={() => handleOpenEventModal(dateKey)} className="w-5 h-5 flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded-full text-lg">+</button>)}
                                            </div>
                                            <div className="mt-2 space-y-2">
                                                {dayEvents.slice(0, 2).map((ev) => (
                                                    <div key={ev.id} className="px-2 py-1 rounded text-xs text-white cursor-pointer" onClick={() => setSelectedEvent(ev)} style={{backgroundColor: ev.color}}>
                                                        <div className="truncate">{ev.title}</div>
                                                    </div>
                                                ))}
                                                {dayEvents.length > 2 && (<div className="text-[12px] text-slate-400">+{dayEvents.length - 2} more</div>)}
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
                {/* 오른쪽 사이드바 */}
                <SidebarRight onOpenTeamModal={handleOpenTeamModal} onOpenEventModal={() => handleOpenEventModal()} onOpenSettingsModal={handleOpenProjectSettingsModal} />
            </div>
            {/* 모달 렌더링 영역 */}
            {selectedEvent && <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} onEdit={handleEditEvent} />}
            {selectedMemo && <MemoDetailModal memo={selectedMemo} onClose={() => setSelectedMemo(null)} />}
            {isEventModalOpen && <EventModal onClose={handleCloseEventModal} onSave={handleSaveItem} initialDate={modalInitialDate} editEvent={eventToEdit} projectId={projectId} />}
            {isTeamModalOpen && (<TeamModal projectId={projectId} onClose={handleCloseTeamModal} />)}
            <ProfileSettingsModal isOpen={isSettingsModalOpen} onClose={handleCloseSettingsModal} apiEndpoints={API_ENDPOINTS} />
            {isProjectSettingsModalOpen && <SettingsModal onClose={handleCloseProjectSettingsModal} projectId={projectId} userId={user?.id || 0} />}
        </div>
    );
}