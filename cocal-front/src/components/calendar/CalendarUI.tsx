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
    // 메인 캘린더의 연도와 월 상태
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());
    // 왼쪽 사이드바 미니 캘린더의 연도와 월 상태
    const [miniYear, setMiniYear] = useState(today.getFullYear());
    const [miniMonth, setMiniMonth] = useState(today.getMonth());

    // 전체 이벤트와 메모 데이터 상태
    const [events, setEvents] = useState<CalendarEvent[]>(sampleEvents);
    const [memos, setMemos] = useState<DateMemo[]>(sampleMemos);

    // 사용자가 클릭한 이벤트나 메모의 상세 정보를 저장하는 상태 (상세 모달 열기용)
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [selectedMemo, setSelectedMemo] = useState<DateMemo | null>(null);

    // 현재 캘린더 뷰 모드 ('month', 'week', 'day') 상태
    const [viewMode, setViewMode] = useState<"day" | "week" | "month">("month");
    // 현재 보고 있는 프로젝트의 정보 상태
    const [currentProject, setCurrentProject] = useState<Project | null>(null);

    // 왼쪽 사이드바에 표시될 'To do' 목록과 선택된 날짜 상태
    const [sidebarTodos, setSidebarTodos] = useState<SidebarTodo[]>([]);
    const [selectedSidebarDate, setSelectedSidebarDate] = useState(today);
    const [privateTodos, setPrivateTodos] = useState<PrivateTodo[]>([]);
    // 'Day' 뷰에 표시할 날짜 상태
    const [selectedDate, setSelectedDate] = useState(today);
    // 각종 모달의 열림/닫힘 상태
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isProjectSettingsModalOpen, setIsProjectSettingsModalOpen] = useState(false);
    // 생성/수정 모달에 전달할 초기 데이터 상태
    const [modalInitialDate, setModalInitialDate] = useState<string | null>(null);
    const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);


    // --- useEffect 훅 ---
    // 왼쪽 사이드바의 'To do' 목록을 업데이트
    useEffect(() => {
        const selectedDateKey = formatYMD(selectedSidebarDate.getFullYear(), selectedSidebarDate.getMonth(), selectedSidebarDate.getDate());

        // 1. 이벤트에 종속된 Public 할일을 SidebarTodo 형태로 변환
        const publicTodos: SidebarTodo[] = events
            .filter(e => e.startAt.startsWith(selectedDateKey) && e.todos)
            .flatMap(event => (event.todos || []).map(todo => ({
                ...todo,
                parentEventTitle: event.title,
                parentEventColor: event.color,
            })));

        // 2. 독립적인 Private 할일을 SidebarTodo 형태로 변환
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

        // 3. Public과 Private 할일을 합쳐 사이드바 상태를 업데이트
        setSidebarTodos([...publicTodos, ...privateTodosForDate]);
    }, [events, privateTodos, selectedSidebarDate]);

    // 페이지 로드 시 프로젝트 정보를 가져오는 효과 (현재는 임시 데이터 사용)
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

    // 현재 뷰의 연도와 월에 맞는 날짜 배열(매트릭스) 생성
    const matrix = getMonthMatrix(viewYear, viewMonth);
    const miniMatrix = getMonthMatrix(miniYear, miniMonth);

    // --- 이벤트 핸들러 함수들 ---
    // 미니 캘린더 날짜 클릭 시, 사이드바의 'To do' 목록만 업데이트
    const handleSidebarDateSelect = (day: number) => {
        const newDate = new Date(miniYear, miniMonth, day);
        setSelectedSidebarDate(newDate);
    };

    // 메인 캘린더 날짜 클릭 시, 'Day' 뷰로 전환
    const handleMainDateClick = (day: number) => {
        const newDate = new Date(viewYear, viewMonth, day);
        setSelectedDate(newDate);
        setViewMode("day");
    };

    // 이벤트 '생성' 모달 열기
    const handleOpenEventModal = (dateStr?: string) => {
        setModalInitialDate(dateStr || null);
        setEventToEdit(null);
        setIsEventModalOpen(true);
    };

    // 이벤트 생성/수정 모달 닫기
    const handleCloseEventModal = () => {
        setIsEventModalOpen(false);
        setEventToEdit(null);
    };

    // 팀 모달 열기/닫기
    const handleOpenTeamModal = () => setIsTeamModalOpen(true);
    const handleCloseTeamModal = () => setIsTeamModalOpen(false);

    // 프로필 설정 모달 열기/닫기
    const handleOpenSettingsModal = () => setIsSettingsModalOpen(true);
    const handleCloseSettingsModal = () => setIsSettingsModalOpen(false);

    // 프로젝트 설정 모달 열기/닫기
    const handleOpenProjectSettingsModal = () => setIsProjectSettingsModalOpen(true);
    const handleCloseProjectSettingsModal = () => setIsProjectSettingsModalOpen(false);

    // 이벤트 '수정 모드'로 전환
    const handleEditEvent = (event: CalendarEvent) => {
        setSelectedEvent(null);
        setEventToEdit(event);
        setIsEventModalOpen(true);
    };

    // EventModal에서 'Save' 버튼 클릭 시 실행되는 함수
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

        // '생성' 로직 (id가 없는 경우)
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

    // 사이드바의 할일 완료 상태(체크박스)를 변경하는 함수
    const handleToggleTodoStatus = (todoId: number) => {

        // Public 할일 상태 업데이트
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
        // Private 할일 상태 업데이트
        setPrivateTodos(prevPrivateTodos =>
            prevPrivateTodos.map(todo =>
                todo.id === todoId ? { ...todo, status: todo.status === 'DONE' ? 'IN_PROGRESS' : 'DONE' } : todo
            )
        );
    };

    // 미니 캘린더 월 이동 함수
    function prevMiniMonth() {
        if (miniMonth === 0) { setMiniMonth(11); setMiniYear(y => y - 1); } else setMiniMonth(m => m - 1);
    }
    function nextMiniMonth() {
        if (miniMonth === 11) { setMiniMonth(0); setMiniYear(y => y + 1); } else setMiniMonth(m => m + 1);
    }

    // 메인 캘린더 월 이동 함수
    function prevMonth() {
        setViewMonth(viewMonth === 0 ? 11 : viewMonth - 1);
        setViewYear(viewMonth === 0 ? viewYear - 1 : viewYear);
    }
    function nextMonth() {
        setViewMonth(viewMonth === 11 ? 0 : viewMonth + 1);
        setViewYear(viewMonth === 11 ? viewYear + 1 : viewYear);
    }

    // --- 렌더링 ---
    // 이벤트가 해당 주에 걸쳐 있는지 확인하고, 시작 및 끝 요일을 계산하는 헬퍼 함수
    const getWeekEvents = (week: (number | null)[]) => {
        const weekStart = new Date(viewYear, viewMonth, week.find(day => day !== null)!);
        const weekEnd = new Date(viewYear, viewMonth, week.filter(day => day !== null).pop()!);

        // 해당 주에 걸쳐있는 모든 이벤트를 찾습니다.
        return events.filter(event => {
            const eventStart = new Date(event.startAt.split('T')[0]);
            const eventEnd = new Date(event.endAt.split('T')[0]);
            // 이벤트가 이 주의 시작일보다 일찍 시작하거나 이 주의 종료일보다 늦게 끝나더라도,
            // 이 주와 겹치면 포함
            return (eventStart <= weekEnd && eventEnd >= weekStart);
        });
    };
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
                {/* 왼쪽 사이드바:자식 컴포넌트로 분리하여 렌더링 */}
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
                            <div className="grid grid-cols-7 text-xs text-slate-400 border-t border-b py-2">
                                {weekdays.map((w) => (<div key={w} className="text-center">{w}</div>))}
                            </div>
                            <div className="grid grid-cols-1 border-l border-gray-200">
                                {matrix.map((week, weekIndex) => {
                                    // 현재 주(week)에 걸쳐있는 모든 이벤트를 찾습니다.
                                    const weekEvents = events.filter(event => {
                                        const eventStart = new Date(event.startAt.split('T')[0]);
                                        const weekStartDay = week.find(d => d);
                                        if (!weekStartDay) return false;
                                        const weekStartDate = new Date(viewYear, viewMonth, weekStartDay);

                                        const eventEnd = new Date(event.endAt.split('T')[0]);
                                        const weekEndDay = [...week].reverse().find(d => d);
                                        if (!weekEndDay) return false;
                                        const weekEndDate = new Date(viewYear, viewMonth, weekEndDay);

                                        return eventStart <= weekEndDate && eventEnd >= weekStartDate;
                                    });

                                    return (
                                        <div key={weekIndex} className="grid grid-cols-7 relative border-b border-gray-200">
                                            {week.map((day, dayIndex) => {
                                                if (!day) return <div key={`empty-${dayIndex}`} className="min-h-[120px] border-r border-gray-200 bg-gray-50"></div>;

                                                const dateKey = formatYMD(viewYear, viewMonth, day);
                                                const isToday = dateKey === formatYMD(today.getFullYear(), today.getMonth(), today.getDate());
                                                const dayMemos = memos.filter(m => m.memoDate === dateKey);

                                                return (
                                                    <div key={dateKey} className={`min-h-[120px] border-r border-gray-200 p-2 relative ${isToday ? 'bg-blue-50' : 'bg-white'}`}>
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-1">
                                                                <div className={`text-sm font-medium cursor-pointer hover:text-blue-600 ${isToday ? 'text-blue-600 font-bold' : ''}`} onClick={() => handleMainDateClick(day)}>
                                                                    {day}
                                                                </div>
                                                                <div className="flex items-center space-x-1">
                                                                    {dayMemos.map(memo => <div key={memo.id} onClick={() => setSelectedMemo(memo)} className="w-1.5 h-1.5 bg-red-500 rounded-full cursor-pointer" title={memo.content} />)}
                                                                </div>
                                                            </div>
                                                            <button onClick={() => handleOpenEventModal(dateKey)} className="w-5 h-5 flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded-full text-lg">+</button>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* 이벤트 띠 렌더링 영역 */}
                                            <div className="absolute top-8 left-0 right-0 h-full">
                                                {weekEvents.map((event, eventIndex) => {
                                                    const eventStart = new Date(event.startAt.split('T')[0]);
                                                    const eventEnd = new Date(event.endAt.split('T')[0]);

                                                    let startCol = 0;
                                                    let endCol = 6;
                                                    let foundStart = false;

                                                    for (let i = 0; i < 7; i++) {
                                                        const dayInWeek = week[i];
                                                        if (dayInWeek === null) continue;
                                                        const currentWeekDate = new Date(viewYear, viewMonth, dayInWeek);

                                                        if (eventStart.toDateString() === currentWeekDate.toDateString()) {
                                                            startCol = i;
                                                            foundStart = true;
                                                        }
                                                        if (eventEnd.toDateString() === currentWeekDate.toDateString()) {
                                                            endCol = i;
                                                        }
                                                    }

                                                    const span = endCol - startCol + 1;
                                                    const showTitle = foundStart || (week[0] && new Date(viewYear, viewMonth, week[0]) > eventStart);

                                                    // 띠의 둥근 모서리 스타일
                                                    const roundedClass =
                                                        (foundStart ? 'rounded-l ' : '') +
                                                        (endCol < 6 || eventEnd.toDateString() === new Date(viewYear, viewMonth, week[endCol]!).toDateString() ? 'rounded-r' : '');

                                                    return (
                                                        <div
                                                            key={event.id}
                                                            className={`absolute h-5 px-2 text-xs text-white cursor-pointer truncate ${roundedClass}`}
                                                            onClick={() => setSelectedEvent(event)}
                                                            style={{
                                                                backgroundColor: event.color,
                                                                top: `${eventIndex * 22}px`, // 겹치는 이벤트를 위해 y축 위치 조절
                                                                left: `calc(${(startCol / 7) * 100}% + 2px)`,
                                                                width: `calc(${(span / 7) * 100}% - 4px)`,
                                                            }}
                                                        >
                                                            {showTitle && event.title}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                    {viewMode === "week" && <WeekView events={events} />}
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