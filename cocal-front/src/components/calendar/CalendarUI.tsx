"use client";

import React, {useState, useEffect, useMemo, useRef} from "react";
import {useRouter, useParams} from "next/navigation";

// 하위 컴포넌트들
import TaskProgress from "./TaskProgress";
import WeekView from "./Week";
import DayView from "./Day";
import SidebarLeft from "./SidebarLeft";
import SidebarRight from "./SidebarRight";
import {EventDetailModal} from "./modals/EventDetailModal";
import ProfileDropdown from "./ProfileDropdown";
import ProfileSettingsModal from "./modals/ProfileSettingModal";
import {SettingsModal} from "./modals/SettingsModal";
import {EventModal} from "./modals/EventModal";
import {TeamModal} from "./modals/TeamModal";
import {MemoDetailModal} from "./modals/MemoDetailModal";
import {TodoEditModal} from "./modals/TodoEditModal";
import WeekViewMobile from "./WeekViewMobile";
// 전역 사용자 정보와 타입 정의, 유틸 함수, 샘플 데이터
import { useUser } from "@/contexts/UserContext";
import {
    CalendarEvent,
    EventTodo,
    Project,
    ModalFormData,
    DateMemo,
    UserSummary,
    PrivateTodo,
    SidebarTodo,
    RealEventTodo
} from "./types";
import { getMonthMatrix, formatYMD, weekdays } from "./utils";
import { sampleEvents, sampleMemos } from "./sampleData";
import {api} from "@/components/calendar/utils/api";
import {deleteTodo} from "@/api/todoApi";


// 오늘 날짜를 저장하는 상수
const today = new Date();

// API 엔드포인트들을 정의하는 객체
const BASE_URL = process.env.NEXT_PUBLIC_API_URL! + "/api";
const API_ENDPOINTS = {
    UPDATE_USER_NAME: `${BASE_URL}/users/edit-name`,
    UPDATE_USER_PASSWORD: `${BASE_URL}/users/edit-pwd`,
    UPDATE_USER_PHOTO: `${BASE_URL}/users/profile-image`,
    DELETE_USER_PHOTO: `${BASE_URL}/users/profile-image`,
};

// 메인 캘린더 UI 컴포넌트
export default function CalendarUI() {
    // --- 훅(Hooks) 초기화 ---
    const {user, logout, isLoading: isUserLoading} = useUser();
    // 고유 ID 생성을 위한 ref 카운터 추가
    // 초기값을 Date.now()로 설정하여 페이지를 새로고침해도 겹칠 확률을 줄이기 위함
    const nextId = useRef(Date.now());
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
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
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
    const [todoToEditInEventModal, setTodoToEditInEventModal] = useState<RealEventTodo | null>(null);
    //  To-do 수정 모달을 제어하는 상태
    const [todoToEdit, setTodoToEdit] = useState<SidebarTodo | null>(null);
    // FIX: 모바일 사이드바 표시 상태를 관리하기 위한 state 추가
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    // TaskProgress에 전달할 전체 할일 목록을 계산합니다.
    const allProjectTodos = useMemo(() => {
        // 모든 이벤트에서 todos 배열을 추출하여 하나의 배열로 합칩니다.
        return events.flatMap(event => event.todos || []);
    }, [events]);

    //  [MOBILE WEEKVIEW] 모바일 여부 판단 state 추가
    const [isMobile, setIsMobile] = useState(false);
    //  [MOBILE WEEKVIEW] 주간 anchor 상태
    const [weekMobileAnchor, setWeekMobileAnchor] = useState<Date>(today);

    //  [MOBILE WEEKVIEW] WeekViewMobile 표시 제어 및 데이터 state 추가
    const [isWeekMobileOpen, setIsWeekMobileOpen] = useState(false);
    const [weekMobileData, setWeekMobileData] = useState<{
        weekTitle: string;
        projectName: string;
        days: {
            date: string;
            weekday: string;
            events: CalendarEvent[];
            todos: { id: number; title: string; status: string }[];
        }[];
    } | null>(null);

    // Todo 데이터의 버전을 관리할 상태 추가
    const [todoVersion, setTodoVersion] = useState(0);

    // --- useEffect 훅 ---
    // 왼쪽 사이드바의 'To do' 목록을 업데이트
    useEffect(() => {
        const selectedDateKey = formatYMD(selectedSidebarDate.getFullYear(), selectedSidebarDate.getMonth(), selectedSidebarDate.getDate());

        // 1. 이벤트에 종속된 Public 할일을 SidebarTodo 형태로 변환
        const publicTodos: SidebarTodo[] = events
            .filter(e => e.startAt.startsWith(selectedDateKey) && e.todos)
            .flatMap(event => (event.todos || []).map(todo => ({
                ...todo,
                date: event.startAt,
                parentEventTitle: event.title,
                parentEventColor: event.color,
                eventId: event.id,
            })));

        // 2. 독립적인 Private 할일을 SidebarTodo 형태로 변환
        const privateTodosForDate: SidebarTodo[] = privateTodos
            .filter(todo => todo.date.startsWith(selectedDateKey))
            .map(todo => ({
                ...todo,
                parentEventTitle: 'Private',
                parentEventColor: '#A0AEC0',
                eventId: 0,
                urlId: 0,
                authorId: todo.userId,
                orderNo: 0,
                url: todo.url ?? undefined,
                offsetMinutes: todo.offsetMinutes,
            }));

        // 3. Public과 Private 할일을 합쳐 사이드바 상태를 업데이트
        setSidebarTodos([...publicTodos, ...privateTodosForDate]);
    }, [events, privateTodos, selectedSidebarDate]);

    // 페이지 로드 시 캘린더 데이터 불러오기
    useEffect(() => {
        if (isNaN(projectId)) return;

        const fetchCalendarData = async () => {
            try {
                const json = await api.get(`/cal/${projectId}`);
                if (json.success && json.data) {
                    // API에서 받은 이벤트와 메모로 상태 초기화
                    setEvents(json.data.events || []);
                    // 메모 저장
                    setMemos(json.data.memos || []);
                    setPrivateTodos(json.data.privateTodos || []);
                } else {
                    console.error("캘린더 데이터가 없습니다.");
                }
            } catch (error) {
                console.error("캘린더 API 호출 실패:", error);
            }
        };

        fetchCalendarData();
    }, [projectId]);


    // 페이지 로드 시 프로젝트 정보를 가져오는 효과
    // 프로젝트 정보 조회
    useEffect(() => {
        if (isNaN(projectId)) return;

        const fetchProject = async () => {
            try {
                const json = await api.get(`/projects/${projectId}`);
                // api.get은 이미 accessToken을 Authorization 헤더에 붙여서 호출함
                if (json.success && json.data) {
                    setCurrentProject(json.data);
                } else {
                    throw new Error("프로젝트 데이터가 없습니다.");
                }
            } catch (error) {
                console.error("프로젝트 정보 로드 실패:", error);
                setCurrentProject({
                    id: projectId,
                    name: "프로젝트 이름 로드 실패",
                    ownerId: 0,
                    startDate: "",
                    endDate: "",
                    status: "In Progress",
                    description: "",
                    members: []
                });
            }
        };

        fetchProject();
    }, [projectId, isProjectSettingsModalOpen, isEventModalOpen]);

    //  [MOBILE WEEKVIEW] 모바일 뷰포트 감지 (클라이언트)
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    //  [MOBILE WEEKVIEW] viewMode가 'week'로 바뀌면 모바일에선 WeekViewMobile을 띄우기
    useEffect(() => {
        if (!isMobile) {
            setIsWeekMobileOpen(false);
            return;
        }
        if (viewMode === "week") {
            openWeekMobileForDate(selectedDate);
        } else {
            setIsWeekMobileOpen(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewMode, isMobile]);
    const shiftDays = (base: Date, delta: number) => {
        const d = new Date(base);
        d.setDate(d.getDate() + delta);
        return d;
    };

    //week 이전/ 다음 주 이동 핸들러
    const handlePrevMobileWeek = () => {
        const prev = shiftDays(weekMobileAnchor, -7);
        setWeekMobileAnchor(prev);
        setWeekMobileData(buildWeekViewMobileData(prev));
    };

    const handleNextMobileWeek = () => {
        const next = shiftDays(weekMobileAnchor, +7);
        setWeekMobileAnchor(next);
        setWeekMobileData(buildWeekViewMobileData(next));
    };


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
        setTodoToEditInEventModal(null); // To-do 수정 상태 초기화
        setIsEventModalOpen(true);
    };

    // 이벤트 생성/수정 모달 닫기
    const handleCloseEventModal = () => {
        setIsEventModalOpen(false);
        setEventToEdit(null);
        setTodoToEditInEventModal(null); // To-do 수정 상태도 함께 초기화
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
        setSelectedEventId(null);
        setEventToEdit(event);
        setIsEventModalOpen(true);
    };
    // EventDetailModal에서 To-do 수정을 위해 EventModal을 여는 핸들러
    const handleEditTodo = (todo: RealEventTodo) => {
        setSelectedEventId(null); // 상세 모달 닫기
        setEventToEdit(null); // 이벤트 수정 모드 해제
        setTodoToEditInEventModal(todo); // 수정할 To-do 설정
        setIsEventModalOpen(true); // 메인 모달 열기
    };

    // EventModal에서 'Save' 버튼 클릭 시 실행되는 함수
    const handleSaveItem = (itemData: ModalFormData, type: 'Event' | 'Todo' | 'Memo', id?: number) => {
        if (id) {

            // To-do 수정 로직을 추가합니다.
            if (type === 'Todo') {
                const newData = {
                    title: itemData.title,
                    description: itemData.description || "",
                    visibility: itemData.visibility,
                    url: itemData.url || "",
                };
                handleUpdateTodo(id, newData);
            } else if (type === 'Event') {
                // --- END: 수정된 부분 ---
                setEvents(prevEvents => prevEvents.map(event => {
                    if (event.id === id) {
                        return {
                            ...event, ...itemData,
                            description: itemData.content || itemData.description,
                            url: itemData.url
                        };
                    }
                    return event;
                }));
            }
            handleCloseEventModal(); // 수정 후 모달 닫기
            return;
        }

        // '생성' 로직 (id가 없는 경우)
        if (type === 'Event') {
            const newEvent: CalendarEvent = {
                id: nextId.current++,
                projectId: projectId,
                title: itemData.title,
                startAt: itemData.startAt,
                endAt: itemData.endAt,
                color: itemData.color || '#3b82f6',
                description: itemData.content || itemData.description,
                location: itemData.location,
                visibility: itemData.visibility,
                urlId: 0,
                offsetMinutes: itemData.offsetMinutes ?? null,
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
                url: itemData.url || ""
            };
            setMemos(prevMemos => [...prevMemos, newMemo]);
        } else if (type === 'Todo') {
            const visibility = itemData.visibility;
            if (visibility === 'PRIVATE') {
                const newPrivateTodo: PrivateTodo = {
                    id: nextId.current++,
                    projectId: projectId,
                    userId: user?.id || 0,
                    title: itemData.title,
                    description: itemData.description,
                    date: `${itemData.memoDate}T00:00:00`,
                    status: 'IN_PROGRESS',
                    type: 'PRIVATE',
                    url: itemData.url,
                    offsetMinutes: itemData.offsetMinutes,
                };
                setPrivateTodos(prev => [...prev, newPrivateTodo]);
            } else {
                if (!itemData.eventId) {
                    alert("Please select a parent event for the public todo.");
                    return;
                }

                const newTodoItem: EventTodo = {
                    id: nextId.current++,
                    eventId: itemData.eventId, // 부모 이벤트 ID 연결
                    title: itemData.title,
                    description: itemData.description,
                    status: 'IN_PROGRESS',
                    type: 'EVENT',
                    url: itemData.url,
                    authorId: user?.id || 0,
                    orderNo: 0,
                };

                // events 상태를 업데이트하여 선택된 이벤트에 새로운 할일을 추가
                setEvents(prevEvents =>
                    prevEvents.map(event => {
                        if (event.id === itemData.eventId) {
                            // 기존 todos 배열에 새 할일 추가
                            const updatedTodos = [...(event.todos || []), newTodoItem];
                            return {...event, todos: updatedTodos};
                        }
                        return event;
                    })
                );

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
                        todo.id === todoId ? {...todo, status: todo.status === 'DONE' ? 'IN_PROGRESS' : 'DONE'} : todo
                    )
                };
            })
        );
        // Private 할일 상태 업데이트
        setPrivateTodos(prevPrivateTodos =>
            prevPrivateTodos.map(todo =>
                todo.id === todoId ? {...todo, status: todo.status === 'DONE' ? 'IN_PROGRESS' : 'DONE'} : todo
            )
        );
    };

    const handleUpdateTodo = (todoId: number, newData:
        {
            title: string;
            description: string;
            visibility: 'PUBLIC' | 'PRIVATE';
            url: string;
            date?: string;
            offsetMinutes?: number | null;
        }) => {
        let originalTodo: (EventTodo & { parentEventId?: number }) | PrivateTodo | null = null;
        let originalType: 'EVENT' | 'PRIVATE' | null = null;
        let parentEvent: CalendarEvent | null = null;

        // 먼저 events 배열(Public To-do)에서 To-do를 찾음
        for (const event of events) {
            const foundTodo = event.todos?.find(t => t.id === todoId);
            if (foundTodo) {
                originalTodo = {...foundTodo, parentEventId: event.id};
                originalType = 'EVENT';
                parentEvent = event;
                break;
            }
        }

        // events 배열에 없으면 privateTodos 배열(Private To-do)에서 찾음
        if (!originalTodo) {
            const foundPrivateTodo = privateTodos.find(t => t.id === todoId);
            if (foundPrivateTodo) {
                originalTodo = foundPrivateTodo;
                originalType = 'PRIVATE';
            }
        }

        if (!originalTodo || !originalType) {
            console.error("업데이트할 To-do를 찾지 못했습니다.");
            return;
        }

        const newType = newData.visibility === 'PUBLIC' ? 'EVENT' : 'PRIVATE';

        // Case 1: 공개 상태 변경 없음
        if (originalType === newType) {
            if (newType === 'PRIVATE') {
                setPrivateTodos(prev => prev.map(todo =>
                    todo.id === todoId ? {
                        ...todo,
                        title: newData.title,
                        description: newData.description,
                        url: newData.url,
                        date: newData.date || todo.date,
                        offsetMinutes: newData.offsetMinutes,
                    } : todo
                ));
            } else { // EVENT (PUBLIC)
                setEvents(prev => prev.map(event => ({
                    ...event,
                    todos: (event.todos || []).map(todo =>
                        todo.id === todoId ? {
                            ...todo,
                            title: newData.title,
                            description: newData.description,
                            url: newData.url
                        } : todo
                    )
                })));
            }
        }
        // Case 2: PUBLIC -> PRIVATE 으로 변경
        else if (originalType === 'EVENT' && newType === 'PRIVATE') {
            const newPrivate: PrivateTodo = {
                id: originalTodo.id,
                projectId: projectId,
                userId: user?.id || 0,
                title: newData.title,
                description: newData.description,
                date: parentEvent!.startAt,
                status: originalTodo.status,
                type: 'PRIVATE',
                url: newData.url,
                offsetMinutes: newData.offsetMinutes,
            };
            setPrivateTodos(prev => [...prev, newPrivate]);

            // 기존 Public To-do는 삭제 만약 부모 이벤트가 To-do 래퍼였다면 함께 삭제
            setEvents(prev => prev
                .map(event => {
                    if (event.id === (originalTodo as EventTodo & { parentEventId: number }).parentEventId) {
                        return {...event, todos: event.todos?.filter(t => t.id !== todoId)};
                    }
                    return event;
                })
                .filter(event => !(event.title.startsWith('Todo:') && (!event.todos || event.todos.length === 0)))
            );
        }
        // Case 3: PRIVATE -> PUBLIC 으로 변경
        else if (originalType === 'PRIVATE' && newType === 'EVENT') {
            setPrivateTodos(prev => prev.filter(todo => todo.id !== todoId));

            const newPublicTodo: EventTodo = {
                id: originalTodo.id,
                eventId: Date.now(),
                title: newData.title,
                description: newData.description,
                status: originalTodo.status,
                type: 'EVENT',
                url: newData.url, // url 추가
                authorId: user?.id || 0,
                orderNo: 0,
            };

            const wrapperEvent: CalendarEvent = {
                id: newPublicTodo.eventId,
                projectId: projectId,
                title: `Todo: ${newData.title}`,
                startAt: (originalTodo as PrivateTodo).date,
                endAt: (originalTodo as PrivateTodo).date.replace('T00:00:00', 'T23:59:59'),
                color: 'transparent',
                todos: [newPublicTodo],
                description: null,
                location: null,
                visibility: 'PRIVATE',
                urlId: 0,
                offsetMinutes: 0,
                allDay: true,
                authorId: user?.id || 0,
            };
            setEvents(prev => [...prev, wrapperEvent]);
        }
    };

    // To-do 삭제 핸들러
    const handleDeleteTodo = async (projectId: number, todoId: number, eventId: number, type: 'EVENT' | 'PRIVATE') => {
        try {
            if (type === 'PRIVATE') {
                await api.delete(`/projects/${projectId}/todos/${todoId}?type=PRIVATE`);
                setPrivateTodos(prev => prev.filter(t => t.id !== todoId));
            } else { // 'EVENT' 타입
                await api.delete(`/projects/${projectId}/todos/${todoId}?type=EVENT&eventId=${eventId}`);
                setEvents(prevEvents =>
                    prevEvents.map(event => {
                        if (event.id === eventId && event.todos) {
                            return {
                                ...event,
                                todos: event.todos.filter(todo => todo.id !== todoId),
                            };
                        }
                        return event;
                    })
                );
            }

            // [추가] 삭제 성공 시, Todo 버전을 1 증가시켜서 변경 신호를 보냅니다.
            setTodoVersion(v => v + 1);

        } catch (err) {
            console.error("Todo 삭제 실패:", err);
            alert('삭제에 실패했습니다.');
        }
    };

    // 미니 캘린더 월 이동 함수
    function prevMiniMonth() {
        if (miniMonth === 0) {
            setMiniMonth(11);
            setMiniYear(y => y - 1);
        } else setMiniMonth(m => m - 1);
    }

    function nextMiniMonth() {
        if (miniMonth === 11) {
            setMiniMonth(0);
            setMiniYear(y => y + 1);
        } else setMiniMonth(m => m + 1);
    }

    // 메인 캘린더 월 이동  함수
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

        // 해당 주에 걸쳐있는 모든 이벤트를 찾음
        return events.filter(event => {
            const eventStart = new Date(event.startAt.split('T')[0]);
            const eventEnd = new Date(event.endAt.split('T')[0]);
            // 이벤트가 이 주의 시작일보다 일찍 시작하거나 이 주의 종료일보다 늦게 끝나더라도,
            // 이 주와 겹치면 포함
            return (eventStart <= weekEnd && eventEnd >= weekStart);
        });
    };

    // To-do 수정 모달을 여는 핸들러
// To-do 수정 모달을 여는 핸들러 (API 재호출 기능 추가)
    const handleOpenTodoEditModal = async (todoFromSidebar: SidebarTodo) => {
        // 1. Private To-do일 경우에만 상세 데이터를 다시 불러옵니다.
        // (Event To-do는 이미 SidebarLeft에서 올바른 데이터를 받고 있다고 가정)
        if (todoFromSidebar.type === 'PRIVATE') {
            try {
                // 2. 단일 To-do 상세 조회 API를 호출합니다.
                const res = await api.get(`/projects/${projectId}/todos/${todoFromSidebar.id}`);

                if (!res.success || !res.data) {
                    throw new Error(res.error?.message || "Failed to fetch To-do details.");
                }

                const fullTodoData = res.data; // API가 반환한 상세 To-do 데이터

                // 3. API 응답(상세 데이터)과 사이드바의 기존 데이터를 조합하여
                //    TodoEditModal이 필요로 하는 완전한 'SidebarTodo' 객체를 만듭니다.
                const completeTodoForModal: SidebarTodo = {
                    ...todoFromSidebar, // parentEventColor, parentEventTitle 등 기존 값 사용

                    // --- 🔽 API에서 새로 받은 정확한 데이터로 덮어쓰기 🔽 ---
                    id: fullTodoData.id,
                    title: fullTodoData.title,
                    description: fullTodoData.description,
                    status: fullTodoData.status,
                    type: 'PRIVATE',
                    date: fullTodoData.date,
                    url: fullTodoData.url,
                    authorId: fullTodoData.userId || todoFromSidebar.authorId,
                    orderNo: fullTodoData.orderNo,

                    // ✨ 리마인더 문제를 해결하는 핵심 코드
                    offsetMinutes: fullTodoData.offsetMinutes,
                };

                // 4. 완성된 객체로 모달을 엽니다.
                setTodoToEdit(completeTodoForModal);

            } catch (error) {
                console.error("Failed to fetch full todo details:", error);
                alert("To-do 상세 정보를 불러오는 데 실패했습니다.");
                setTodoToEdit(null); // 실패 시 모달을 열지 않음
            }
        } else {
            // 5. Event To-do는 기존 방식대로 즉시 모달을 엽니다.
            setTodoToEdit(todoFromSidebar);
        }
    };
    const buildWeekViewMobileData = (baseDate: Date) => {
        // 주 시작(일요일) 기준으로 7일 산출
        const start = new Date(baseDate);
        start.setHours(0, 0, 0, 0);
        const day = start.getDay(); // 0(일)~6(토)
        const sunday = new Date(start);
        sunday.setDate(start.getDate() - day); // 일요일로 이동

        const days = Array.from({length: 7}, (_, i) => {
            const d = new Date(sunday);
            d.setDate(sunday.getDate() + i);
            const y = d.getFullYear();
            const m = d.getMonth();
            const dd = d.getDate();
            const key = formatYMD(y, m, dd);
            const weekday = d.toLocaleDateString("en-US", {weekday: "short"}); // "Mon" 등

            // 해당 날짜와 겹치는 이벤트(하루라도 겹치면 포함)
            const dayEvents = events.filter((ev) => {
                const evStart = new Date(ev.startAt.split("T")[0]);
                const evEnd = new Date(ev.endAt.split("T")[0]);
                const cur = new Date(key);
                return evStart <= cur && evEnd >= cur;
            });

            // 해당 날짜의 public todos만 모아 표시 (기능 변경 없이 표시만)
            const dayTodos = events.flatMap((ev) => {
                const evDateKey = ev.startAt.split("T")[0];
                if (evDateKey !== key || !ev.todos) return [];
                return ev.todos.map((t) => ({id: t.id, title: t.title, status: t.status}));
            });

            return {
                date: String(dd),
                weekday,
                events: dayEvents,
                todos: dayTodos,
            };
        });

        // 예) "Sep Week 1, 2025" 식의 타이틀
        const monthLabel = sunday.toLocaleDateString("en-US", {month: "short"});
        const weekNum = Math.ceil((sunday.getDate() - 1) / 7) + 1;
        const yearLabel = sunday.getFullYear();
        const weekTitle = `${monthLabel} Week ${weekNum}, ${yearLabel}`;

        return {
            weekTitle,
            projectName: currentProject ? currentProject.name : "Project",
            days,
        };
    };

    //  [MOBILE WEEKVIEW] 특정 날짜 기준 주간 상세 열기
    const openWeekMobileForDate = (date: Date) => {
        setWeekMobileAnchor(date);
        const data = buildWeekViewMobileData(date);
        setWeekMobileData(data);
        setIsWeekMobileOpen(true);
    };
    const selectedEvent = events.find(event => event.id === selectedEventId);
    return (
        <div className="h-screen w-screen flex flex-col bg-white">
            {/*  --- 데스크톱 헤더 ---  */}
            <div className="hidden md:flex items-center justify-between px-6 py-3 bg-white border-b">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push("/dashboard")} className="p-1 rounded-full hover:bg-slate-100">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M15 18l-6-6 6-6" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round"
                                  strokeLinejoin="round"/>
                        </svg>
                    </button>
                    <h1 className="text-xl font-medium">{currentProject ? currentProject.name : "Project"}</h1>
                    <div className="flex items-center space-x-[-4px]">
                        {/*팀원 프로필 이미지*/}
                        {currentProject?.members.map((member, index) => (
                            <img
                                key={member.userId || index}
                                src={member.profileImageUrl || "https://placehold.co/100x100/A0BFFF/FFFFFF?text=User"}
                                title={member.name}
                                alt={member.name || 'Team member'}
                                className="w-6 h-6 rounded-full object-cover border-2 border-white shadow-sm transition transform hover:scale-110"
                                style={{zIndex: currentProject?.members.length - index}}
                            />
                        ))}
                    </div>
                </div>
                {isUserLoading ? (
                    <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>) : user && user.id ? (
                    <ProfileDropdown
                        user={{
                            name: user.name || "User",
                            email: user.email || "No email",
                            imageUrl: user.profileImageUrl || "https://placehold.co/100x100/A0BFFF/FFFFFF?text=User",
                        }}
                        onOpenSettings={handleOpenSettingsModal}
                        onLogout={logout}
                    />
                ) : (<div>
                    <button onClick={() => router.push("/")}>Login</button>
                </div>)}
            </div>

            {/*  --- 모바일 헤더 ---  */}
            <div className="md:hidden relative flex items-center justify-between px-4 py-3 bg-white border-b">
                {/* 햄버거 버튼 */}
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 z-10">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 6H20M4 12H20M4 18H20" stroke="#0f172a" strokeWidth="2" strokeLinecap="round"
                              strokeLinejoin="round"/>
                    </svg>
                </button>

                {/* 프로젝트 이름 (가운데 정렬) */}
                <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold whitespace-nowrap">
                    {currentProject ? currentProject.name : "Project"}
                </h1>

                {/* 프로필 드롭다운 (이미지만 표시) */}
                <div className="z-10">
                    {isUserLoading ? (
                        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>) : user && user.id ? (
                        <ProfileDropdown
                            user={{
                                // 이름과 이메일은 빈 값으로 전달하여 숨김 처리
                                name: "",
                                email: "",
                                imageUrl: user.profileImageUrl || "https://placehold.co/100x100/A0BFFF/FFFFFF?text=User",
                            }}
                            onOpenSettings={handleOpenSettingsModal}
                            onLogout={logout}
                        />
                    ) : (<div>
                        <button onClick={() => router.push("/")}>Login</button>
                    </div>)}
                </div>
            </div>
            {/* ---  모바일 TaskProgress 위치  --- */}
            {!(isMobile && viewMode === "week") && (
                <div className="px-4 pt-4 md:hidden">
                    <TaskProgress
                        todos={allProjectTodos}
                        projectStartDate={currentProject?.startDate ? new Date(currentProject.startDate) : undefined}
                        projectEndDate={currentProject?.endDate ? new Date(currentProject.endDate) : undefined}
                    />
                </div>
            )}
            {/* 메인 영역 */}
            <div className="flex flex-1 overflow-hidden">
                {/*  --- 반응형 왼쪽 사이드바 ---  */}
                {/* 사이드바 오버레이 (모바일에서 사이드바 열렸을 때) */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/30 z-20 md:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    ></div>
                )}
                <div
                    className={`fixed inset-y-0 left-0 z-30 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:relative md:translate-x-0 bg-white`}>
                    <SidebarLeft
                        projectId={currentProject?.id ?? 0} // 필수!
                        onClose={() => setIsSidebarOpen(false)} // 닫기 함수 전달
                        miniYear={miniYear}
                        miniMonth={miniMonth}
                        prevMiniMonth={prevMiniMonth}
                        nextMiniMonth={nextMiniMonth}
                        miniMatrix={miniMatrix}
                        selectedSidebarDate={selectedSidebarDate}
                        handleSidebarDateSelect={handleSidebarDateSelect}
                        sidebarTodos={sidebarTodos}
                        onGoToWeekView={() => setViewMode("week")}
                        onGoToMonthView={() => setViewMode("month")}
                        projectStartDate={currentProject?.startDate ? new Date(currentProject.startDate) : undefined}
                        projectEndDate={currentProject?.endDate ? new Date(currentProject.endDate) : undefined}
                        onOpenEventModal={handleOpenEventModal}
                        onOpenTeamModal={handleOpenTeamModal}
                        onOpenSettingsModal={handleOpenProjectSettingsModal}
                        user={(user && user.id) ? {
                            userId: user.id,
                            name: user.name ?? 'User',
                            email: user.email ?? '',
                            profileImageUrl: user.profileImageUrl
                        } : null}
                        //handleToggleTodoStatus={handleToggleTodoStatus}
                        todoVersion={todoVersion}
                        onEditTodo={handleOpenTodoEditModal}

                    />
                </div>

                {/* 메인 캘린더 영역 */}
                <main className="flex-1 p-2 md:p-5 overflow-auto">
                    {/* 메인 캘린더 헤더 */}
                    <div className="flex items-center justify-between mb-4">
                        {/* ← 왼쪽 블록: 항상 렌더. 모바일에서 week(또는 WeekViewMobile 열림)일 때만 invisible */}
                        <div
                            className={`flex items-center gap-1 md:gap-6 ${
                                isMobile && (viewMode === "week" || isWeekMobileOpen) ? "invisible" : ""
                            }`}
                        >
                            <button onClick={prevMonth}
                                    className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center text-slate-800 hover:text-slate-600 text-lg md:text-xl p-2 rounded-full hover:bg-slate-100">
                                &#x276E;
                            </button>
                            <h2 className="text-base md:text-lg font-semibold text-slate-800 text-center">
                                {viewMode === 'day'
                                    ? selectedDate.toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })
                                    : new Date(viewYear, viewMonth).toLocaleString('en-US', {
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                            </h2>
                            <button onClick={nextMonth}
                                    className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center text-slate-800 hover:text-slate-600 text-lg md:text-xl p-2 rounded-full hover:bg-slate-100">
                                &#x276F;
                            </button>
                        </div>

                        {/* → 오른쪽: 셀렉트 (그대로) */}
                        <div className="flex items-center gap-3">
                            <select
                                value={viewMode}
                                onChange={(e) => setViewMode(e.target.value as "day" | "week" | "month")}
                                className="border rounded px-3 py-1 text-sm"
                            >
                                <option value="month">Month</option>
                                <option value="week">Week</option>
                                <option value="day">Day</option>
                            </select>
                        </div>
                    </div>

                    {/*  [MOBILE WEEKVIEW] 모바일에서 WeekViewMobile 우선 표시 (week 선택 또는 이벤트 터치 시) */}
                    {isMobile && isWeekMobileOpen ? (
                        weekMobileData && (
                            <WeekViewMobile
                                weekTitle={weekMobileData.weekTitle}
                                projectName={weekMobileData.projectName}
                                days={weekMobileData.days}
                                onPrevWeek={handlePrevMobileWeek}
                                onNextWeek={handleNextMobileWeek}
                            />
                        )
                    ) : (
                        <>
                            {viewMode === "month" && (
                                <>
                                    <div className="grid grid-cols-7 text-xs text-slate-400 border-t border-b py-2">
                                        {weekdays.map((w) => (
                                            <div key={w} className="text-center">{w.substring(0, 1)}</div>))}
                                    </div>
                                    <div className="grid grid-cols-1 border-l border-gray-200">
                                        {matrix.map((week, weekIndex) => {
                                            const weekEvents = events.filter(event => {
                                                if (event.title.startsWith('Todo:')) {
                                                    return false;
                                                }
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
                                                <div key={weekIndex}
                                                     className="grid grid-cols-7 relative border-b border-gray-200">
                                                    {week.map((day, dayIndex) => {
                                                        if (!day) return <div key={`empty-${dayIndex}`}
                                                                              className="min-h-[80px] md:min-h-[120px] border-r border-gray-200 bg-gray-50"></div>;

                                                        const dateKey = formatYMD(viewYear, viewMonth, day);
                                                        const isToday = dateKey === formatYMD(today.getFullYear(), today.getMonth(), today.getDate());
                                                        const dayMemos = memos.filter(m => m.memoDate === dateKey);

                                                        return (
                                                            <div key={dateKey}
                                                                 className={`min-h-[80px] md:min-h-[120px] border-r border-gray-200 p-1 md:p-2 relative ${isToday ? 'bg-blue-50' : 'bg-white'}`}>
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-1">
                                                                        <div
                                                                            className={`text-xs md:text-sm font-medium cursor-pointer hover:text-blue-600 ${isToday ? 'text-blue-600 font-bold' : ''}`}
                                                                            onClick={() => handleMainDateClick(day)}>
                                                                            {day}
                                                                        </div>
                                                                        <div
                                                                            className="hidden md:flex items-center space-x-1">
                                                                            {dayMemos.map(memo => <div key={memo.id}
                                                                                                       onClick={() => setSelectedMemo(memo)}
                                                                                                       className="w-1.5 h-1.5 bg-red-500 rounded-full cursor-pointer"
                                                                                                       title={memo.content}/>)}
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleOpenEventModal(dateKey)}
                                                                        className="w-5 h-5 flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded-full text-lg">+
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}

                                                    <div className="absolute top-6 md:top-8 left-0 right-0 h-full">
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
                                                            const roundedClass =
                                                                (foundStart ? 'rounded-l ' : '') +
                                                                (endCol < 6 || eventEnd.toDateString() === new Date(viewYear, viewMonth, week[endCol]!).toDateString() ? 'rounded-r' : '');

                                                            return (
                                                                <div
                                                                    key={event.id}
                                                                    className={`absolute h-5 px-2 text-xs text-white cursor-pointer truncate ${roundedClass}`}
                                                                    // ✅ [MOBILE WEEKVIEW] 모바일에선 이벤트 탭 시 WeekViewMobile 열기, 데스크톱은 기존 상세 모달
                                                                    onClick={() => {
                                                                        if (isMobile) {
                                                                            const d = new Date(event.startAt);
                                                                            openWeekMobileForDate(d);
                                                                        } else {
                                                                            setSelectedEventId(event.id);
                                                                        }
                                                                    }}
                                                                    style={{
                                                                        backgroundColor: event.color,
                                                                        top: `${eventIndex * 22}px`,
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
                            {viewMode === "week" && <WeekView events={events}/>}
                            {viewMode === "day" && <DayView events={events} date={selectedDate}/>}
                        </>
                    )}
                </main>

                {/* --- 오른쪽 사이드바는 lg(1024px) 이상에서만 보이도록 수정 ---  */}
                <div className="hidden lg:block">
                    <SidebarRight onOpenTeamModal={handleOpenTeamModal}
                                  onOpenEventModal={() => handleOpenEventModal()}
                                  onOpenSettingsModal={handleOpenProjectSettingsModal}
                    />
                </div>
            </div>

            {/* 모달 렌더링 영역 */}
            {/* 모달 렌더링 영역 */}
            {selectedEvent && (
                <EventDetailModal
                    event={selectedEvent}
                    onClose={() => setSelectedEventId(null)}
                    onEdit={handleEditEvent}
                    onEditTodo={handleEditTodo}
                    members={currentProject?.members ?? []}
                    onDeleteTodo={handleDeleteTodo}
                    onToggleTodo={handleToggleTodoStatus}
                />
            )}

            {selectedMemo && <MemoDetailModal
                memo={selectedMemo}
                projectId={projectId}
                onClose={() => setSelectedMemo(null)}
                onEdit={(updatedMemo) => {
                    setMemos((prev) =>
                        prev.map((m) => (m.id === updatedMemo.id ? updatedMemo : m))
                    );
                }}
                onDelete={(id) => {
                    setMemos((prev) => prev.filter((m) => m.id !== id));
                    setSelectedMemo(null);
                }}
            />}

            {isEventModalOpen && (
                <EventModal
                    onClose={handleCloseEventModal}
                    onSave={handleSaveItem}
                    initialDate={modalInitialDate}
                    editEventId={eventToEdit?.id ?? null}
                    editTodo={todoToEditInEventModal}
                    projectId={projectId}
                    members={currentProject?.members ?? []}
                    events={events}
                />
            )}

            {isTeamModalOpen && (<TeamModal projectId={projectId} onClose={handleCloseTeamModal}/>)}
            <ProfileSettingsModal isOpen={isSettingsModalOpen} onClose={handleCloseSettingsModal}
                                  apiEndpoints={API_ENDPOINTS}/>


            {/*{isTeamModalOpen && (<TeamModal projectId={projectId} onClose={handleCloseTeamModal}/>)}*/}
            {/*<ProfileSettingsModal isOpen={isSettingsModalOpen} onClose={handleCloseSettingsModal} apiEndpoints={API_ENDPOINTS}/>*/}
            {isProjectSettingsModalOpen &&
                <SettingsModal onClose={handleCloseProjectSettingsModal} projectId={projectId} userId={user?.id || 0}/>}
            <ProfileSettingsModal isOpen={isSettingsModalOpen} onClose={handleCloseSettingsModal}
                                  apiEndpoints={API_ENDPOINTS}/>
            {todoToEdit && (
                <TodoEditModal
                    projectId={projectId}
                    todoToEdit={todoToEdit}
                    onClose={() => setTodoToEdit(null)}
                    onSave={handleUpdateTodo}
                    onDelete={handleDeleteTodo}
                    events={events}
                />
            )}

        </div>
    );
}