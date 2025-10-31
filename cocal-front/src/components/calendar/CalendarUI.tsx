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
import { ProfileDropdown } from "@/components/dashboard/Dashboard";
import { NotificationAndInviteIcons } from "@/components/dashboard/Dashboard"
import ProfileSettingsModal from '@/components/modals/ProfileSettingModal';
import {SettingsModal} from "./modals/SettingsModal";
import {EventModal} from "./modals/EventModal";
import {TeamModal} from "./modals/TeamModal";
import {MemoDetailModal} from "./modals/MemoDetailModal";
import {TodoEditModal} from "./modals/TodoEditModal";
import WeekViewMobile from "./WeekViewMobile";
import DefaultViewModal from '@/components/modals/DefaultViewModal';
import { updateDefaultView } from '@/api/defaultviewApi';
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
import {deleteTodo, TodoUpdatePayload} from "@/api/todoApi";


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
    const {user, logout, isLoading: isUserLoading, fetchUserProfile} = useUser();
    // 고유 ID 생성을 위한 ref 카운터 추가
    // 초기값을 Date.now()로 설정하여 페이지를 새로고침해도 겹칠 확률을 줄이기 위함
    const nextId = useRef(Date.now());
    const router = useRouter();
    const params = useParams();

    const projectIdParam = Array.isArray(params?.projectId) ? params.projectId[0] : params?.projectId;
    const projectId = projectIdParam ? Number(projectIdParam) : NaN;
    const [isChanged, setIsChanged] = useState(false); // 변경 여부 상태(이름,프로필사진)

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
    const [isDefaultViewModalOpen, setIsDefaultViewModalOpen] = useState(false);
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
            fullDate: string; // fullDate 타입 추가
            weekday: string;
            events: CalendarEvent[];
            todos: []; // todos는 항상 빈 배열
            memos: DateMemo[];
        }[];
    } | null>(null);
    // Todo 데이터의 버전을 관리할 상태 추가
    const [todoVersion, setTodoVersion] = useState(0);

    useEffect(() => {
        if (isMobile && isWeekMobileOpen) {
            setWeekMobileData(buildWeekViewMobileData(weekMobileAnchor));
        }
    }, [events, privateTodos, memos, currentProject, isMobile, isWeekMobileOpen, weekMobileAnchor]);
    // --- useEffect 훅 ---
    // 이름, 프로필이 변경된 경우 유저 정보 재조회
    useEffect(() => {
        // 모달이 닫히고, 이름, 프로필이 변경된 경우만 재조회
        if (!isSettingsModalOpen && isChanged) {
            const token = localStorage.getItem("accessToken");
            if (token) {
                console.log("유저 정보 변경 감지됨 → 유저 정보 다시 조회 중...");
                fetchUserProfile(token);
                setIsChanged(false); // 한 번만 실행되도록 초기화
            }
        }
    }, [isSettingsModalOpen, isChanged, fetchUserProfile]);
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
                // defaultView 설정
                const storedProfile = localStorage.getItem("userProfile");
                if (storedProfile) {
                    const parsed = JSON.parse(storedProfile);
                    // 1. defaultView가 null일 경우 "month"를 기본값으로 사용
                    const defaultView = parsed.defaultView ?? "month";

                    // 2. 유효한 값인지 한번 더 확인 (선택 사항이지만 더 안전함)
                    if (["month", "week", "day"].includes(defaultView)) {
                        setViewMode(defaultView);
                    } else {
                        setViewMode("month"); // 혹시 이상한 값이 들어있다면 "month"로 초기화
                    }
                    console.log("defaultView", defaultView);
                    console.log('ViewMode', defaultView);
                }
                // 1. 캘린더의 기본 데이터 (이벤트, 메모, 개인 할일)를 가져옵니다.
                const json = await api.get(`/cal/${projectId}`);

                if (!json.success || !json.data) {
                    console.error("캘린더 데이터가 없습니다.");
                    setEvents([]);
                    setMemos([]);
                    setPrivateTodos([]);
                    return;
                }

                // 2. 기본 데이터를 상태에 우선 설정 (메모, 개인 할일)
                const initialEvents: CalendarEvent[] = json.data.events || [];
                setMemos(json.data.memos || []);
                setPrivateTodos(json.data.privateTodos || []);

                // 3. 각 이벤트의 상세 할일(Todo) 목록을 가져오는 Promise 배열 생성
                const todoFetchPromises = initialEvents.map(event => {
                    return api.get(`/projects/${projectId}/events/${event.id}/todos`)
                        .then(todoJson => {
                            if (todoJson.success && todoJson.data && todoJson.data.items) {
                                // API 응답(items)을 프론트엔드 타입(EventTodo)으로 변환
                                const mappedTodos: EventTodo[] = todoJson.data.items.map((item: {
                                    id: number;
                                    eventId: number;
                                    title: string;
                                    description: string | null;
                                    status: "IN_PROGRESS" | "DONE";
                                }) => ({ // <--- 'any' 타입 수정
                                    id: item.id,
                                    eventId: item.eventId,
                                    title: item.title,
                                    description: item.description,
                                    status: item.status,
                                    type: 'EVENT', // 이 API는 이벤트 할일만 반환하므로 'EVENT'로 지정
                                    authorId: 0,   // API 응답에 없어 기본값 처리 (필요시 수정)
                                    orderNo: 0,  // API 응답에 없어 기본값 처리 (필요시 수정)
                                    url: null,     // API 응답에 없어 기본값 처리 (필요시 수정)
                                }));
                                return { eventId: event.id, todos: mappedTodos };
                            }
                            // 할일이 없거나 API 실패 시
                            return { eventId: event.id, todos: [] };
                        })
                        .catch(err => {
                            console.error(`Event ${event.id}의 Todo 로드 실패:`, err);
                            return { eventId: event.id, todos: [] }; // 개별 실패 처리
                        });
                });

                // 4.  모든 할일 목록 조회가 완료될 때까지 대기
                const todoResults = await Promise.all(todoFetchPromises);

                // 5. 조회된 할일 목록을 기존 이벤트 객체에 병합
                //    (빠른 조회를 위해 Map 사용)
                const todoMap = new Map<number, EventTodo[]>();
                todoResults.forEach(result => {
                    todoMap.set(result.eventId, result.todos);
                });

                const enrichedEvents = initialEvents.map(event => ({
                    ...event,
                    todos: todoMap.get(event.id) || [], // 조회된 todos를 주입
                }));

                // 6.  할일 목록이 포함된 완전한 events 배열로 상태 업데이트
                setEvents(enrichedEvents);

            } catch (error) {
                console.error("캘린더 API 호출 실패:", error);
                // 실패 시에도 비어있는 배열로 초기화
                setEvents([]);
                setMemos([]);
                setPrivateTodos([]);
            }
        };

        fetchCalendarData();
    }, [projectId]); // 의존성 배열은 그대로 [projectId]


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
    }, [viewMode, isMobile,selectedDate]);
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
    // WeekView에 전달할 weekStartDate 계산
    const getMonday = (d: Date) => {
        d = new Date(d);
        const day = d.getDay(),
            diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
        return new Date(d.setDate(diff));
    }
    const weekStartDate = getMonday(selectedDate);

    //  WeekView에서 Day 뷰로 전환하는 핸들러
    const handleNavigateToDay = (date: Date) => {
        setSelectedDate(date);
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
    // Default View 모달 열기/닫기
    const handleOpenDefaultViewModal = () => setIsDefaultViewModalOpen(true);

    // Default View 저장 핸들러

    const handleUpdateDefaultView = async (newView: 'DAY' | 'WEEK' | 'MONTH') => {
        // 1. API 호출
        await updateDefaultView(newView);

        // 2. 유저 정보 새로고침
        const token = localStorage.getItem("accessToken");
        if (token) {
            fetchUserProfile(token);
        }

        setViewMode(newView.toLowerCase() as "day" | "week" | "month");

    };
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
            // Todo 생성이 완료되었으므로, todoVersion을 증가시켜
            // SidebarLeft가 데이터를 새로고침하도록 신호를 보냅니다.
            setTodoVersion(v => v + 1);
        }
    };

    // 사이드바의 할일 완료 상태(체크박스)를 변경하는 함수
    const handleToggleTodoStatus = async (todoId: number) => {

        let todoToUpdate: (EventTodo | PrivateTodo | null) = null;
        let originalType: ('EVENT' | 'PRIVATE' | null) = null;
        let originalStatus: ('IN_PROGRESS' | 'DONE' | null) = null;

        // 1. 상태(State)에서 토글할 Todo 객체를 찾습니다. (Public 또는 Private)
        for (const event of events) {
            const todo = event.todos?.find(t => t.id === todoId);
            if (todo) {
                todoToUpdate = todo;
                originalType = 'EVENT';
                originalStatus = todo.status;
                break;
            }
        }
        if (!todoToUpdate) {
            const todo = privateTodos.find(t => t.id === todoId);
            if (todo) {
                todoToUpdate = todo;
                originalType = 'PRIVATE';
                originalStatus = todo.status;
            }
        }

        // 1-1. Todo를 찾지 못하면 함수 종료
        if (!todoToUpdate || !originalType || !originalStatus) {
            console.error("handleToggleTodoStatus: 토글할 Todo를 찾지 못했습니다. ID:", todoId);
            return;
        }

        const newStatus = originalStatus === 'DONE' ? 'IN_PROGRESS' : 'DONE';
        const todo = todoToUpdate; // 편의를 위한 변수명 변경

        // 2. [Optimistic Update] UI를 즉시 새로운 상태로 업데이트합니다.
        if (originalType === 'EVENT') {
            setEvents(prevEvents =>
                prevEvents.map(event => {
                    if (!event.todos || !event.todos.some(t => t.id === todoId)) return event;
                    return {
                        ...event,
                        todos: event.todos.map(t =>
                            t.id === todoId ? {...t, status: newStatus} : t
                        )
                    };
                })
            );
        } else { // 'PRIVATE'
            setPrivateTodos(prevPrivateTodos =>
                prevPrivateTodos.map(t =>
                    t.id === todoId ? {...t, status: newStatus} : t
                )
            );
        }

        // 3. API에 전송할 Payload를 생성합니다. (handleUpdateTodo 로직 참조)
        //    (주의: 'any' 캐스팅은 EventTodo 타입에 offsetMinutes가 없어 임시방편으로 사용)
        const payload: TodoUpdatePayload = {
            title: todo.title,
            description: todo.description || "",
            url: todo.url || "",
            status: newStatus, // <-- 변경된 상태
            type: originalType,
            projectId: projectId,
            visibility: originalType === 'EVENT' ? 'PUBLIC' : 'PRIVATE',
            date: originalType === 'PRIVATE' ? (todo as PrivateTodo).date : undefined,
            eventId: originalType === 'EVENT' ? (todo as EventTodo).eventId : undefined,
            offsetMinutes: originalType === 'PRIVATE' ? (todo as PrivateTodo).offsetMinutes ?? null : null,
        };

        // 4. API를 호출하여 서버에 변경 사항을 저장합니다.
        try {
            await api.put(`/projects/${projectId}/todos/${todoId}`, payload);
            // 성공: Optimistic Update가 확정되었습니다.
            setTodoVersion(v => v + 1); // 사이드바 등 다른 컴포넌트에 갱신 알림

        } catch (error) {
            console.error("Todo 상태 업데이트 API 호출 실패:", error);
            alert("할 일 상태 변경에 실패했습니다. 페이지를 새로고침합니다.");

            // 5. [Rollback] API 호출 실패 시, UI를 원래 상태로 되돌립니다.
            if (originalType === 'EVENT') {
                setEvents(prevEvents =>
                    prevEvents.map(event => {
                        if (!event.todos || !event.todos.some(t => t.id === todoId)) return event;
                        return {
                            ...event,
                            todos: event.todos.map(t =>
                                t.id === todoId ? {...t, status: originalStatus} : t // 원래 상태로 복구
                            )
                        };
                    })
                );
            } else { // 'PRIVATE'
                setPrivateTodos(prevPrivateTodos =>
                    prevPrivateTodos.map(t =>
                        t.id === todoId ? {...t, status: originalStatus} : t // 원래 상태로 복구
                    )
                );
            }
        }
    };
    // todo 수정
    const handleUpdateTodo = async (todoId: number, newData:
        {
            title: string;
            description: string;
            visibility: 'PUBLIC' | 'PRIVATE';
            url: string;
            date?: string;
            offsetMinutes?: number | null;
            eventId?: number | null;
        }) => {

        if (!todoToEdit || todoToEdit.id !== todoId) {
            console.error("수정할 Todo 상태(todoToEdit)가 잘못되었습니다.");
            return;
        }

        const originalType = todoToEdit.type;
        const requestedVisibility = newData.visibility;

        const isTypeChangeAttempted =
            (originalType === 'EVENT' && requestedVisibility === 'PRIVATE') ||
            (originalType === 'PRIVATE' && requestedVisibility === 'PUBLIC');

        if (isTypeChangeAttempted) {
            alert("타입 변경은 현재 지원되지 않습니다. 내용을 수정한 후 다시 저장해주세요.");
            return;
        }

        // 기존 any 제거, TodoUpdatePayload 기반 payload 구성
        const payload: TodoUpdatePayload = {
            title: newData.title,
            description: newData.description,
            url: newData.url,
            status: todoToEdit.status,
            type: originalType,      // type은 변경하지 않음
            projectId: projectId,
            offsetMinutes: newData.offsetMinutes,
            visibility: newData.visibility,
            date: originalType === 'PRIVATE'
                ? newData.date ? new Date(newData.date).toISOString() : todoToEdit.date
                : undefined,
            eventId: originalType === 'EVENT' ? newData.eventId ?? todoToEdit.eventId : undefined,
        };


        if (originalType === 'PRIVATE') {
            payload.date = newData.date ? new Date(newData.date).toISOString() : todoToEdit.date;
        } else { // 'EVENT'
            // 모달에서 받은 새로운 eventId를 payload에 담습니다.
            payload.eventId = newData.eventId ?? 0;
        }

        try {
            await api.put(`/projects/${projectId}/todos/${todoId}`, payload);

            if (originalType === 'PRIVATE') {
                setPrivateTodos(prev =>
                    prev.map(todo =>
                        todo.id === todoId
                            ? {
                                ...todo,
                                title: newData.title,
                                description: newData.description,
                                url: newData.url,
                                date: payload.date || todo.date,          // ✅ 항상 string
                                offsetMinutes: newData.offsetMinutes ?? todo.offsetMinutes,
                            }
                            : todo
                    )
                );
            } else { // 'EVENT'
                // eventId가 변경되었을 경우를 처리하는 로직
                const oldEventId = todoToEdit.eventId;
                const newEventId = newData.eventId;

                setEvents(prevEvents => {
                    let updatedEvents = [...prevEvents];
                    let todoItem: EventTodo | undefined;

                    // 1. 기존 이벤트에서 투두를 찾아서 제거합니다.
                    updatedEvents = updatedEvents.map(event => {
                        if (event.id === oldEventId) {
                            const foundTodo = (event.todos || []).find(t => t.id === todoId);
                            if (foundTodo) {
                                todoItem = { ...foundTodo, ...newData, eventId: newEventId! }; // 업데이트될 투두 정보 저장
                            }
                            return {
                                ...event,
                                todos: (event.todos || []).filter(t => t.id !== todoId)
                            };
                        }
                        return event;
                    });

                    // 2. 새로운 이벤트에 업데이트된 투두를 추가합니다.
                    if (todoItem && newEventId) {
                        updatedEvents = updatedEvents.map(event => {
                            if (event.id === newEventId) {
                                return {
                                    ...event,
                                    todos: [...(event.todos || []), todoItem!]
                                };
                            }
                            return event;
                        });
                    }

                    return updatedEvents;
                });
            }

            setTodoVersion(v => v + 1);

        } catch (error) {
            console.error("Todo 업데이트 API 호출 실패:", error);
            alert("Todo 저장에 실패했습니다. 다시 시도해 주세요.");
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
    const handleDeleteEvent = async (projectId: number, eventId: number) => {
        try {
            // 1. API를 호출하여 서버에서 이벤트를 삭제합니다.
            // (API 엔드포인트는 실제 명세에 맞게 확인해주세요. /projects/projectId/events/eventId로 가정했습니다.)
            await api.delete(`/projects/${projectId}/events/${eventId}`);

            // 2. API 호출 성공 시, 프론트엔드 상태(events)에서도 해당 이벤트를 제거합니다.
            setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));

            // 3. 이벤트 상세 모달을 닫습니다.
            setSelectedEventId(null);

            // 4. (선택 사항) 이벤트가 삭제되면 연결된 To-do도 사라지므로,
            // 사이드바 목록을 갱신하기 위해 todoVersion을 업데이트합니다.
            setTodoVersion(v => v + 1);

        } catch (err) {
            console.error("이벤트 삭제 실패:", err);
            alert('이벤트 삭제에 실패했습니다.');
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
    // --- [추가] 뷰 모드에 따라 탐색을 처리하는 새로운 통합 핸들러 ---
    const handlePrev = () => {
        if (viewMode === 'month') {
            prevMonth();
        } else if (viewMode === 'week') {
            const newDate = new Date(selectedDate);
            newDate.setDate(newDate.getDate() - 7);
            setSelectedDate(newDate);
        } else { // 'day'
            const newDate = new Date(selectedDate);
            newDate.setDate(newDate.getDate() - 1);
            setSelectedDate(newDate);
        }
    };

    const handleNext = () => {
        if (viewMode === 'month') {
            nextMonth();
        } else if (viewMode === 'week') {
            const newDate = new Date(selectedDate);
            newDate.setDate(newDate.getDate() + 7);
            setSelectedDate(newDate);
        } else { // 'day'
            const newDate = new Date(selectedDate);
            newDate.setDate(newDate.getDate() + 1);
            setSelectedDate(newDate);
        }
    };
    // --- 렌더링 ---
    let weekHeaderTitle = '';
    if (viewMode === 'week') {
        const monday = weekStartDate;
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        const year = monday.getFullYear();

        // 모바일과 데스크톱의 날짜 형식을 분기합니다.
        if (isMobile) {
            // --- 모바일용: <Month Week #, Year> (예: October Week 3, 2025) ---

            // 1. 월 (Month) - 영어
            const monthLabelEn = monday.toLocaleDateString('en-US', { month: 'long' }); // "October"

            // 2. 주 (Week Number) - 기존 계산 로직 활용
            const firstDayOfMonth = new Date(monday.getFullYear(), monday.getMonth(), 1);
            const firstMonday = getMonday(firstDayOfMonth); // 해당 월의 첫번째 월요일
            const weekNum = Math.floor((monday.getTime() - firstMonday.getTime()) / (1000 * 60 * 60 * 24 * 7)) + 1;
            const weekNumLabel = `Week ${weekNum}`; // "Week 3"

            // 3. 년 (Year) - 바깥쪽에 이미 정의된 'year' 변수 사용 (e.g., 2025)

            // 4. 조합 (쉼표 추가)
            weekHeaderTitle = `${monthLabelEn} ${weekNumLabel}, ${year}`;

        } else {
            // --- 데스크톱용: (예: October 2025 or October - November 2025) ---
            const startMonth = monday.toLocaleDateString('en-US', { month: 'long' });
            const endMonth = sunday.toLocaleDateString('en-US', { month: 'long' });
            const monthLabel = startMonth === endMonth ? startMonth : `${startMonth} - ${endMonth}`;

            // 기존 로직 유지
            weekHeaderTitle = `${monthLabel} ${year}`;
        }
    }

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
            const key = formatYMD(y, m, dd); // "YYYY-MM-DD"
            const weekday = d.toLocaleString("en-US", {weekday: "short"}); // "Mon" 등

            // 해당 날짜와 겹치는 이벤트(하루라도 겹치면 포함)
            const dayEvents = events.filter((ev) => {
                const evStart = new Date(ev.startAt.split("T")[0]);
                const evEnd = new Date(ev.endAt.split("T")[0]);
                const cur = new Date(key);
                return evStart <= cur && evEnd >= cur;
            });

            const dayMemos = memos.filter(m => m.memoDate === key);
            // const privateTodosForDate = privateTodos.filter(...)

            const dayTodos: [] = [];

            return {
                date: String(dd), // 표시용 날짜 (ex: "1")
                fullDate: key,
                weekday,
                events: dayEvents,
                todos: dayTodos,
                memos: dayMemos,
            };
        });
        // 예) "Sep Week 1, 2025" 식의 타이틀
        const monthLabel = sunday.toLocaleString("en-US", {month: "short"});
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

    const handleSelectEvent = (event: CalendarEvent) => {
        setSelectedEventId(event.id);
    };
    const selectedEvent = events.find(event => event.id === selectedEventId);
    //  주간 뷰에 표시할 이벤트를 미리 필터링합니다.
    const weekEvents = useMemo(() => {
        if (viewMode !== 'week') return [];

        const weekStart = new Date(weekStartDate);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStartDate);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        return events.filter(event => {
            const eventStart = new Date(event.startAt);
            const eventEnd = new Date(event.endAt);
            return eventStart <= weekEnd && eventEnd >= weekStart;
        });
    }, [events, weekStartDate, viewMode]);
    const truncateText = (text: string, maxLength: number) => {
        if (text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength) + "...";
    };
    return (
        <div className="h-screen w-full md:w-screen flex flex-col bg-white dark:bg-neutral-900 overflow-hidden">
            {/*  --- 데스크톱 헤더 ---  */}
            <div
                className="hidden md:flex items-center justify-between  px-6 py-3 border-b border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-900 sticky shadow-md z-35">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push("/dashboard")}
                            className="p-1 rounded-full hover:bg-slate-100 dark:text-white dark:hover:bg-gray-700/70">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                                  strokeLinejoin="round"/>
                        </svg>
                    </button>
                    <h1 className="text-lg font-semibold text-slate-800 truncate dark:text-white">
                        {currentProject ? currentProject.name : "Project"}
                    </h1>
                    <div className="flex items-center space-x-[-4px]">
                        {/*팀원 프로필 이미지*/}
                        {currentProject?.members.map((member, index) => (
                            <img
                                key={member.userId || index}
                                src={member.profileImageUrl || "https://placehold.co/100x100/A0BFFF/FFFFFF?text=User"}
                                title={member.name}
                                alt={member.name || 'Team member'}
                                className="w-6 h-6 rounded-full object-cover border-2 border-white shadow-sm transition transform hover:scale-110 dark:border-neutral-600"
                                style={{zIndex: currentProject?.members.length - index}}
                            />
                        ))}
                    </div>
                </div>
                {isUserLoading ? (
                    <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
                ) : user && user.id ? (
                    <div className="flex items-center justify-end space-x-4">
                        <NotificationAndInviteIcons
                            userId={user.id}
                            handleLogout={logout}
                        />
                        <ProfileDropdown
                            onOpenSettings={handleOpenSettingsModal}
                            onOpenDefaultView={handleOpenDefaultViewModal}
                            onLogout={logout}
                        />
                    </div>
                ) : (
                    <div>
                        <button onClick={() => router.push("/")}>Login</button>
                    </div>
                )}
            </div>

            {/*  --- 모바일 헤더 ---  */}
            <div
                className="md:hidden relative flex items-center justify-between px-4 py-3 bg-white border-gray-200 dark:bg-neutral-900 border-b dark:border-neutral-600 top-0 shadow-md">
                {/* 햄버거 버튼 */}
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 z-10">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                         className="text-gray-900 dark:text-neutral-300">
                        <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                              strokeLinejoin="round"/>
                    </svg>
                </button>

                {/* 헤더 가운데 */}
                <div className="ml-auto mr-3">
                    {user && (
                        <NotificationAndInviteIcons
                            userId={user.id!}
                            handleLogout={logout}
                        />
                    )}
                </div>

                {/* 프로필 드롭다운 (이미지만 표시) */}
                <div className="z-20">
                    {isUserLoading ? (
                        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>) : user && user.id ? (
                        <ProfileDropdown
                            onOpenSettings={handleOpenSettingsModal}
                            onOpenDefaultView={handleOpenDefaultViewModal}
                            onLogout={logout}
                        />
                    ) : (<div>
                        <button onClick={() => router.push("/")}>Login</button>
                    </div>)}
                </div>
            </div>
            {/* ---  모바일 TaskProgress 위치  --- */}
            <div className="px-4 pt-4 md:hidden">
                <TaskProgress
                    todos={allProjectTodos}
                    projectStartDate={currentProject?.startDate ? new Date(currentProject.startDate) : undefined}
                    projectEndDate={currentProject?.endDate ? new Date(currentProject.endDate) : undefined}
                    projectName={currentProject?.name}
                />
            </div>

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

                {/* 메인 캘린더  영역 */}

                <main className="flex-1 overflow-auto scrollbar-hide px-4 py-2 md:p-5 min-w-0">
                    {/* 메인 캘린더 헤더 */}
                    <div className="flex items-center justify-between mb-4">
                        {/* ← 왼쪽 블록: 항상 렌더. 모바일에서 week(또는 WeekViewMobile 열림)일 때만 invisible */}
                        <div
                            className={`flex items-center gap-1 md:gap-6`}
                        >
                            <button onClick={handlePrev}
                                    className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center text-slate-800 dark:text-neutral-300 hover:text-slate-600 dark:hover:text-slate-400  text-lg md:text-xl p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-100/5">
                                &#x276E;
                            </button>
                            <h2 className="text-base md:text-lg font-semibold text-slate-800 text-center dark:text-gray-300">
                                {viewMode === 'day'
                                    ? selectedDate.toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })
                                    : viewMode === 'week'
                                        ? weekHeaderTitle
                                        : new Date(viewYear, viewMonth).toLocaleString('en-US', {
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                            </h2>
                            <button onClick={handleNext}
                                    className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center text-slate-800 dark:text-neutral-300 hover:text-slate-600 dark:hover:text-slate-400  text-lg md:text-xl p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-100/5">
                                &#x276F;
                            </button>
                        </div>

                        {/* → 오른쪽: 셀렉트 (그대로) */}
                        <div className="flex items-center gap-3">
                            <select
                                value={viewMode}
                                onChange={(e) => setViewMode(e.target.value as "day" | "week" | "month")}
                                className="border dark:border-neutral-700 dark:text-neutral-100 dark:bg-neutral-900 rounded px-3 py-1 text-sm"
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
                                projectId={projectId}
                                // weekTitle={weekMobileData.weekTitle}
                                // projectName={weekMobileData.projectName}
                                days={weekMobileData.days}
                                //onPrevWeek={handlePrevMobileWeek}
                                //onNextWeek={handleNextMobileWeek}
                                onToggleTodoStatus={handleToggleTodoStatus}
                                onTodoDataChanged={() => setTodoVersion(v => v + 1)}
                                onSelectMemo={setSelectedMemo}
                                onEditTodo={handleOpenTodoEditModal}

                            />
                        )
                    ) : (
                        <>
                            {viewMode === "month" && (
                                <>
                                    <div
                                        className="grid grid-cols-7 text-xs text-slate-400 border-t border-b py-2 dark:border-gray-600">
                                        {weekdays.map((w) => (
                                            <div key={w} className="text-center">{w.substring(0, 1)}</div>))}
                                    </div>
                                    <div className="grid grid-cols-1 border-l border-gray-200 dark:border-neutral-600">
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
                                                     className="grid grid-cols-7 relative border-b border-gray-200 dark:border-neutral-600">
                                                    {week.map((day, dayIndex) => {
                                                        if (!day) return <div key={`empty-${dayIndex}`}
                                                                              className="min-h-[80px] md:min-h-[120px] border-r border-gray-200 bg-gray-50 dark:bg-neutral-800 dark:border-neutral-600"></div>;

                                                        const dateKey = formatYMD(viewYear, viewMonth, day);
                                                        const isToday = dateKey === formatYMD(today.getFullYear(), today.getMonth(), today.getDate());
                                                        const dayMemos = memos.filter(m => m.memoDate === dateKey);

                                                        return (
                                                            <div key={dateKey}
                                                                 className={`min-h-[80px] md:min-h-[120px] border-r border-gray-200 dark:border-neutral-600 p-1 md:p-2 relative ${isToday ? 'bg-blue-50 dark:bg-blue-400/10' : 'bg-white dark:bg-neutral-900'}`}>
                                                                <div className="flex items-center justify-between">
                                                                    <div
                                                                        className="flex items-center gap-1 dark:text-white">
                                                                        <div
                                                                            className={`text-xs md:text-sm font-medium cursor-pointer hover:text-blue-600 ${isToday ? 'text-blue-600 font-bold' : ''}`}
                                                                            onClick={() => handleMainDateClick(day)}>
                                                                            {day}
                                                                        </div>
                                                                        <div
                                                                            className="md:hidden"> {/* md 사이즈 이상에서 숨깁니다. */}
                                                                            {dayMemos.length > 0 && (
                                                                                <div
                                                                                    className="w-1.5 h-1.5 bg-red-500 rounded-full"
                                                                                    // onClick 핸들러를 추가하지 않아 클릭되지 않습니다.
                                                                                />
                                                                            )}
                                                                        </div>
                                                                        <div
                                                                            className="hidden md:flex items-center space-x-1">
                                                                            {dayMemos.length > 0 && (
                                                                                <div
                                                                                    onClick={() => setSelectedMemo(dayMemos[0])}
                                                                                    className="w-1.5 h-1.5 bg-red-500 rounded-full cursor-pointer"
                                                                                    title={dayMemos[0].content}
                                                                                />
                                                                            )}
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
                                                        {(() => {
                                                            // --- 1. & 2. 이벤트 정보 처리 (span, cols 계산) ---
                                                            const processedEvents = weekEvents.map(event => {
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
                                                                if (!foundStart && week[0] && eventStart < new Date(viewYear, viewMonth, week[0])) {
                                                                    startCol = 0;
                                                                }
                                                                const lastDayInWeek = week.filter(d => d).pop();
                                                                if (lastDayInWeek && eventEnd > new Date(viewYear, viewMonth, lastDayInWeek)) {
                                                                    endCol = 6;
                                                                }

                                                                const span = endCol - startCol + 1;
                                                                const showTitle = foundStart || (week[0] && new Date(viewYear, viewMonth, week[0]) > eventStart);
                                                                const roundedClass =
                                                                    (foundStart ? 'rounded-l ' : '') +
                                                                    (endCol < 6 || eventEnd.toDateString() === new Date(viewYear, viewMonth, week[endCol]!).toDateString() ? 'rounded-r' : '');

                                                                return {
                                                                    event,
                                                                    span,
                                                                    startCol,
                                                                    endCol,
                                                                    showTitle,
                                                                    roundedClass,
                                                                    renderRowIndex: 0
                                                                };
                                                            });

                                                            // --- 3. 정렬: (1) 시작일(startCol) 오름차순, (2) 길이(span) 내림차순 ---
                                                            processedEvents.sort((a, b) => {
                                                                if (a.startCol !== b.startCol) {
                                                                    return a.startCol - b.startCol;
                                                                }
                                                                return b.span - a.span;
                                                            });

                                                            // --- 4. 레이아웃 알고리즘: 각 이벤트에 올바른 row 할당 ---
                                                            const rowBumper = [0, 0, 0, 0, 0, 0, 0]; // 요일별 다음 이벤트가 시작될 row

                                                            for (const event of processedEvents) {
                                                                let targetRow = 0;
                                                                for (let i = event.startCol; i <= event.endCol; i++) {
                                                                    targetRow = Math.max(targetRow, rowBumper[i]);
                                                                }
                                                                event.renderRowIndex = targetRow;

                                                                // 이벤트가 배치되었으므로, 해당 공간의 row 인덱스를 1 증가
                                                                for (let i = event.startCol; i <= event.endCol; i++) {
                                                                    rowBumper[i] = targetRow + 1;
                                                                }
                                                            }

                                                            // --- 5. 렌더링: 이벤트 + "+N more" 버튼 ---

                                                            // 모바일/데스크톱에 따라 최대 표시 줄 수 결정
                                                            const MAX_EVENT_ROWS_TO_SHOW = isMobile ? 2 : 3;

                                                            // 렌더링할 이벤트 필터링 (모바일: 0, 1번 줄 / 데스크톱: 0, 1, 2번 줄)
                                                            const eventsToRender = processedEvents.filter(event => event.renderRowIndex < MAX_EVENT_ROWS_TO_SHOW);

                                                            // "+N more" 버튼 계산
                                                            const moreButtons = [];
                                                            for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
                                                                const day = week[dayIndex];
                                                                if (!day) continue; // 빈 날짜 칸은 스킵

                                                                const totalEventsOnDay = rowBumper[dayIndex]; // 이 날짜의 총 이벤트 수

                                                                //  모바일/데스크톱 최대 줄 수를 초과하는 경우
                                                                if (totalEventsOnDay > MAX_EVENT_ROWS_TO_SHOW) {
                                                                    const eventsOnDay = processedEvents.filter(e => e.startCol <= dayIndex && e.endCol >= dayIndex);

                                                                    // 숨겨진 이벤트 수 계산 (최대 줄 수 이상인 이벤트)
                                                                    const hiddenCount = eventsOnDay.filter(e => e.renderRowIndex >= MAX_EVENT_ROWS_TO_SHOW).length;

                                                                    if (hiddenCount > 0) {
                                                                        moreButtons.push({
                                                                            day,
                                                                            dayIndex,
                                                                            count: hiddenCount
                                                                        });
                                                                    }
                                                                }
                                                            }

                                                            //  렌더링 부분을 <></> (Fragment)로 감싸고 2개의 map을 실행
                                                            return (
                                                                <>
                                                                    {/* 5a. 렌더링할 이벤트 */}
                                                                    {eventsToRender.map((processedEvent) => {
                                                                        const {
                                                                            event,
                                                                            span,
                                                                            startCol,
                                                                            showTitle,
                                                                            roundedClass,
                                                                            renderRowIndex
                                                                        } = processedEvent;
                                                                        return (
                                                                            <div
                                                                                key={event.id}
                                                                                className={`absolute h-5 px-2 text-xs text-white cursor-pointer truncate ${roundedClass}`}
                                                                                onClick={() => {
                                                                                    if (isMobile) {
                                                                                        const d = new Date(event.startAt);
                                                                                        openWeekMobileForDate(d);
                                                                                        setViewMode("week");
                                                                                    } else {
                                                                                        setSelectedEventId(event.id);
                                                                                    }
                                                                                }}
                                                                                style={{
                                                                                    backgroundColor: event.color,
                                                                                    top: `${renderRowIndex * 22}px`, // 0px, 22px, 44px
                                                                                    left: `calc(${(startCol / 7) * 100}% + 2px)`,
                                                                                    width: `calc(${(span / 7) * 100}% - 4px)`,
                                                                                }}
                                                                            >
                                                                                {showTitle && event.title}
                                                                            </div>
                                                                        );
                                                                    })}

                                                                    {/* 5b. "+N more" 버튼 렌더링 */}
                                                                    {moreButtons.map(({day, dayIndex, count}) => {

                                                                        //  "+N more" 클릭 핸들러 (모바일/데스크톱 분기)
                                                                        const handleMoreClick = () => {
                                                                            const clickedDate = new Date(viewYear, viewMonth, day);

                                                                            if (isMobile) {
                                                                                // 모바일에서는 WeekViewMobile을 엽니다.
                                                                                setSelectedDate(clickedDate);
                                                                                setViewMode("day");
                                                                            } else {
                                                                                // 데스크톱에서는 Week 뷰로 이동합니다.
                                                                                setSelectedDate(clickedDate);
                                                                                setViewMode("day");
                                                                            }
                                                                        };

                                                                        return (
                                                                            <div
                                                                                key={`more-${dayIndex}`}
                                                                                className="absolute h-5 px-2 text-xs text-slate-600 font-medium cursor-pointer truncate hover:bg-slate-100 rounded"
                                                                                onClick={handleMoreClick} // [수정] 클릭 핸들러 변경
                                                                                style={{
                                                                                    //  top 위치를 동적으로 설정
                                                                                    top: `${MAX_EVENT_ROWS_TO_SHOW * 22}px`, // 모바일: 44px, 데스크톱: 66px
                                                                                    left: `calc(${(dayIndex / 7) * 100}% + 2px)`,
                                                                                    width: `calc(${(1 / 7) * 100}% - 4px)`,
                                                                                }}
                                                                            >
                                                                                +{count} more
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                            {/* 2. 주간 뷰 (모바일/데스크톱 분기) */}
                            {viewMode === "week" && isMobile ? (
                                // 모바일 주간 뷰
                                weekMobileData && (
                                    <WeekViewMobile
                                        projectId={projectId}
                                        days={weekMobileData.days}
                                        onToggleTodoStatus={handleToggleTodoStatus}
                                        onTodoDataChanged={() => setTodoVersion(v => v + 1)}
                                        onSelectMemo={setSelectedMemo}
                                        onEditTodo={handleOpenTodoEditModal}
                                        // weekTitle, onPrevWeek, onNextWeek 등 자체 헤더 props 제거
                                    />
                                )
                            ) : viewMode === "week" && !isMobile ? (
                                // 데스크톱 주간 뷰
                                <WeekView
                                    events={weekEvents}
                                    weekStartDate={weekStartDate}
                                    onNavigateToDay={handleNavigateToDay}
                                    onSelectEvent={handleSelectEvent}
                                    memos={memos}
                                    onSelectMemo={setSelectedMemo}
                                    //onEditTodo={handleOpenTodoEditModal}
                                />
                            ) : null}

                            {/* 3. 일간 뷰 */}
                            {viewMode === "day" && (
                                <DayView
                                    events={events}
                                    date={selectedDate}
                                    onSelectEvent={handleSelectEvent}
                                    onToggleTodoStatus={handleToggleTodoStatus}
                                />
                            )}
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
                    onDeleteEvent={handleDeleteEvent}

                />
            )}
            {/* [수정] MemoDetailModal 호출부 */}
            {selectedMemo && (() => {
                // 1. 클릭된 날짜의 모든 메모를 찾습니다.
                const memosForDate = memos.filter(m => m.memoDate === selectedMemo.memoDate);
                // 2. 그 배열에서 클릭된 메모의 순서(index)를 찾습니다.
                const startIndex = memosForDate.findIndex(m => m.id === selectedMemo.id);

                return (
                    <MemoDetailModal
                        memos={memosForDate} // 1. 해당 날짜의 [모든] 메모 배열 전달
                        startIndex={startIndex !== -1 ? startIndex : 0} // 2. 클릭한 메모의 [순서] 전달
                        projectId={projectId}
                        onClose={() => setSelectedMemo(null)}
                        onEdit={(updatedMemo) => {
                            // 수정 시 메인 'memos' 상태 업데이트
                            setMemos((prev) =>
                                prev.map((m) => (m.id === updatedMemo.id ? updatedMemo : m))
                            );
                        }}
                        onDelete={(id) => {
                            // 삭제 시 메인 'memos' 상태 업데이트
                            const remainingMemos = memos.filter((m) => m.id !== id);
                            setMemos(remainingMemos);

                            // 3. 삭제 후 로직:
                            // 같은 날짜의 남은 메모가 있는지 확인
                            const remainingOnDate = remainingMemos.filter(m => m.memoDate === selectedMemo.memoDate);
                            if (remainingOnDate.length === 0) {
                                setSelectedMemo(null); // 남은 메모가 없으면 모달 닫기
                            } else {
                                // 남은 메모가 있으면, 0번째 메모를 보도록 상태 업데이트
                                // (삭제 시 모달이 닫히는 것을 방지)
                                setSelectedMemo(remainingOnDate[0]);
                            }
                        }}
                    />
                );
            })()}

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
            <ProfileSettingsModal
                isOpen={isSettingsModalOpen}
                onClose={handleCloseSettingsModal}
                apiEndpoints={API_ENDPOINTS}
                onChanged={() => setIsChanged(true)}
            />


            {/*{isTeamModalOpen && (<TeamModal projectId={projectId} onClose={handleCloseTeamModal}/>)}*/}
            {/*<ProfileSettingsModal isOpen={isSettingsModalOpen} onClose={handleCloseSettingsModal} apiEndpoints={API_ENDPOINTS}/>*/}
            {isProjectSettingsModalOpen &&
                <SettingsModal
                    onClose={handleCloseProjectSettingsModal}
                    projectId={projectId}
                    userId={user?.id || 0}
                />}

            <ProfileSettingsModal
                isOpen={isSettingsModalOpen}
                onClose={handleCloseSettingsModal}
                apiEndpoints={API_ENDPOINTS}
                onChanged={() => setIsChanged(true)}
            />

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
            <DefaultViewModal
                isOpen={isDefaultViewModalOpen}
                onClose={() => setIsDefaultViewModalOpen(false)}
                currentView={user?.defaultView || 'MONTH'}
                onSave={handleUpdateDefaultView}
            />
        </div>
    );
}
