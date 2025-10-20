"use client";

import React, {useEffect, useState} from "react";
import TaskProgress from "./TaskProgress";
import { SidebarTodo, UserSummary } from "./types";
import {api} from "@/components/calendar/utils/api";

// 오늘 날짜를 저장하는 상수
const today = new Date();

//  CalendarUI로부터 더 많은 함수를 받기 위해 props 타입을 확장합니다.
// Public 할 일 (이벤트 할 일)의 최종 API 응답 타입
interface ApiEventTodo {
    id: number;
    title: string;
    description: string;
    status: 'DONE' | 'IN_PROGRESS';
    eventId: number;
    eventTitle: string;
    eventColor: string;
    url?: string; // url 필드 추가
    offsetMinutes?: number | null;
    orderNo?: number;
}

// Private 할 일 (개인 할 일)의 API 응답 타입 (기존과 동일)
interface ApiPrivateTodo {
    date: string;
    id: number;
    title: string;
    description: string;
    status: 'DONE' | 'IN_PROGRESS';
    url?: string; // url 필드 추가
    //offsetMinutes?: number;
    orderNo?: number;
    offsetMinutes?: number | null;
}

// ✨ FIX: CalendarUI로부터 더 많은 함수를 받기 위해 props 타입을 확장합니다.
interface SidebarLeftProps {
    miniYear: number;
    miniMonth: number;
    prevMiniMonth: () => void;
    nextMiniMonth: () => void;
    miniMatrix: (number | null)[][];
    selectedSidebarDate: Date;
    handleSidebarDateSelect: (day: number) => void;
    sidebarTodos: SidebarTodo[];
    user: UserSummary | null;
    //handleToggleTodoStatus: (id: number) => void;
    onEditTodo: (todo: SidebarTodo) => void;
    onClose: () => void;
    // --- 모바일 기능 통합을 위해 추가된 props ---
    onOpenEventModal: () => void;
    onOpenTeamModal: () => void;
    onOpenSettingsModal: () => void;
    projectStartDate?: Date;
    projectEndDate?: Date;
    onGoToWeekView: () => void;
    onGoToMonthView: () => void;
    // [추가]
    todoVersion: number;
}
const AddIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
        <line x1="12" y1="14" x2="12" y2="20"></line>
        <line x1="9" y1="17" x2="15" y2="17"></line>
    </svg>
);

const ShareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="8.5" cy="7" r="4"></circle>
        <line x1="20" y1="8" x2="20" y2="14"></line>
        <line x1="17" y1="11" x2="23" y2="11"></line>
    </svg>
);

const SettingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
);
const ListIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6"></line>
        <line x1="8" y1="12" x2="21" y2="12"></line>
        <line x1="8" y1="18" x2="21" y2="18"></line>
        <line x1="3" y1="6" x2="3.01" y2="6"></line>
        <line x1="3" y1="12" x2="3.01" y2="12"></line>
        <line x1="3" y1="18" x2="3.01" y2="18"></line>
    </svg>
);

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);

// --- ActionButton 컴포넌트 수정 ---
const ActionButton = ({ icon: Icon, text, onClick }: { icon: React.ElementType; text: string; onClick: () => void }) => (
    <button
        onClick={onClick}
        className="flex items-center w-full text-left p-3 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors duration-150"
    >
        <span className="mr-4 text-gray-600">
            <Icon />
        </span>
        <span className="font-medium">{text}</span>
    </button>
);

//  모바일 기능 목록을 위한 버튼 컴포넌트를 정의합니다.
// const ActionButton = ({ icon, text, onClick }: { icon: string; text: string; onClick: () => void }) => (
//     <button onClick={onClick} className="flex items-center w-full p-3 text-left text-slate-700 hover:bg-slate-100 rounded-lg">
//         <span className="text-2xl w-8 mr-4 text-center">{icon}</span>
//         <span className="font-medium">{text}</span>
//     </button>
// );

export default function SidebarLeft({
    projectId,
    user,
    miniYear,
    miniMonth,
    prevMiniMonth,
    nextMiniMonth,
    miniMatrix,
    selectedSidebarDate,
    handleSidebarDateSelect,
    onEditTodo,
    onClose,
    onOpenEventModal,
    onOpenTeamModal,
    onOpenSettingsModal,
    projectStartDate,
    projectEndDate,
    onGoToMonthView,
    onGoToWeekView,
    // [추가]
    todoVersion
    }: { projectId: number; user: UserSummary | null } & SidebarLeftProps) {
    const [sidebarTodos, setSidebarTodos] = useState<SidebarTodo[]>([]);
    const [todoFilter, setTodoFilter] = useState('ALL');
    // ✨ FIX: 모바일에서 '기능' 뷰와 '캘린더' 뷰를 전환하기 위한 상태
    //const [mobileView, setMobileView] = useState<'actions' | 'calendar'>('actions');

    // 자동으로 컴포넌트 로드
   /* useEffect(() => {
        // projectId가 유효한 숫자일 때만 실행하도록 조건을 추가합니다.
        if (projectId) {
            handleDateClick(today.getDate());
        }
    }, [projectId]); */// projectId가 변경될 때마다 이 효과를 다시 확인합니다.

    // --- 핵심 3: 데이터 로딩 함수 (eventId를 정확히 매핑) ---
    const handleDateClick = async (day: number) => {
        // 부모 컴포넌트에도 날짜가 변경되었음을 알림
        //handleSidebarDateSelect(day);

        const selectedDate = new Date(miniYear, miniMonth, day);
        const formattedDate = `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}-${selectedDate.getDate().toString().padStart(2, '0')}`;

       /* const eventDataResponse = await api.get(`/projects/${projectId}/events/todos?date=${formattedDate}`);

        // --- 🛠️ 디버깅 코드 추가 ---
        console.log("✅ [1단계] Axios가 받은 순수 응답:", eventDataResponse);
        console.log("✅ [2단계] 응답 내부의 data.items:", eventDataResponse?.data?.items);*/

        try {
            const eventData = await api.get(`/projects/${projectId}/events/todos?date=${formattedDate}`);
            const privateData = await api.get(`/projects/${projectId}/todos?date=${formattedDate}`);

            const eventItems: ApiEventTodo[] = eventData?.data?.items || [];
            const privateItems: ApiPrivateTodo[] = privateData?.data?.items || [];

            //console.log('📬 [탐정 1] 서버로부터 받은 Event Todos (원본):', eventItems);

            const combinedTodos: SidebarTodo[] = [
                ...eventItems.map((item) => ({
                    id: item.id,
                    eventId: item.eventId, // <-- **이벤트 ID를 API 응답값으로 정확히 설정**
                    title: item.title,
                    description: item.description,
                    status: item.status,
                    type: "EVENT" as const,
                    parentEventColor: item.eventColor,
                    parentEventTitle: item.eventTitle,
                    date: formattedDate,
                    url: item.url,
                    authorId: user?.userId || 0, // 필요시 서버 응답에 맞춰 수정

                    // --- ✅ API에서 직접 받은 데이터 사용으로 변경 --

                    // 나머지 필드는 여전히 API가 제공하지 않으므로 기본값 유지
                    urlId: 0,
                    offsetMinutes: item.offsetMinutes ?? null, // 서버에서 받은 값 사용
                    orderNo: item.orderNo || 0,             // 서버에서 받은 값 사용
                })),
                ...privateItems.map((item) => ({
                    id: item.id,
                    title: item.title,
                    description: item.description,
                    status: item.status,
                    type: "PRIVATE" as const,
                    parentEventColor: "#A0AEC0",
                    parentEventTitle: 'Private',
                    eventId: 0,
                    date: formattedDate,
                    url: item.url,
                    authorId: user?.userId || 0,
                    offsetMinutes: item.offsetMinutes ?? null, // 서버에서 받은 값 사용
                    orderNo: item.orderNo || 0,
                    urlId: 0,
                })),
            ];

            setSidebarTodos(combinedTodos); // 자체 상태를 업데이트
        } catch (error) {
            console.error("사이드바 To-do API 요청 실패:", error);
            setSidebarTodos([]);
        }
    };

    // 날짜가 변경되거나 '삭제 신호(todoVersion)'가 올 때마다 데이터를 다시 불러오는
    // 새로운 useEffect를 추가합니다.
    useEffect(() => {
        if (projectId) {
            // 현재 선택된 날짜(selectedSidebarDate)를 기준으로 데이터를 다시 불러옵니다.
            // handleDateClick은 날짜를 prop(selectedSidebarDate)에서 가져오지 않고
            // miniYear, miniMonth에서 가져오므로, selectedSidebarDate의 day를 전달합니다.
            handleDateClick(selectedSidebarDate.getDate());
        }
        // 의존성 배열에 selectedSidebarDate와 todoVersion을 추가합니다.
    }, [projectId, selectedSidebarDate, todoVersion]);

    // --- 핵심 4: 상태 업데이트 함수 (서버에 완전한 데이터를 전송) ---
    const handleToggleTodoStatus = async (todoToToggle: SidebarTodo) => {
        const newStatus = todoToToggle.status === "DONE" ? "IN_PROGRESS" : "DONE";

        // 낙관적 UI 업데이트: 서버 응답을 기다리지 않고 UI를 먼저 변경
        setSidebarTodos(currentTodos =>
            currentTodos.map(t =>
                t.id === todoToToggle.id ? { ...t, status: newStatus } : t
            )
        );

        try {
            // 서버에 보낼 전체 페이로드 생성
            const payload = {
                title: todoToToggle.title,
                description: todoToToggle.description,
                status: newStatus,
                url: todoToToggle.url,
                //eventId: todoToToggle.eventId || null,
                offsetMinutes: todoToToggle.offsetMinutes, // <-- 이 줄 추가
                orderNo: todoToToggle.orderNo,
            };

            // 변경 후 (날짜를 YYYY-MM-DD로 정규화해서 보냄)
            // 날짜 변환 함수 수정
            const normalizeToDateTime = (isoOrYmd: string) => {
                // "YYYY-MM-DD" 또는 ISO 모두 대응
                const d = new Date(isoOrYmd);
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${y}-${m}-${day}T00:00:00`;
            };


            if (todoToToggle.type === "PRIVATE") {
                await api.put(`/projects/${projectId}/todos/${todoToToggle.id}`, {
                    ...payload,
                    type: "PRIVATE",
                    date: normalizeToDateTime(todoToToggle.date),
                });
            } else { // EVENT
                const finalPayload = {
                    ...payload,
                    type: "EVENT",
                    eventId: todoToToggle.eventId,
                    authorId: user?.userId || 0,
                };
                console.log('📤 [탐정 2] 서버로 보내는 최종 데이터:', finalPayload);
                // ----------------------------------------------------

                await api.put(`/projects/${projectId}/todos/${todoToToggle.id}`, finalPayload);
            }
        } catch (error) {
            console.error("Todo 상태 업데이트 실패:", error);

            alert("상태 업데이트에 실패했습니다. 다시 시도해 주세요.");
            // 실패 시 UI를 원래 상태로 되돌림
            setSidebarTodos(currentTodos =>
                currentTodos.map(t =>
                    t.id === todoToToggle.id ? { ...t, status: todoToToggle.status } : t
                )
            );
        }
    };

    const filteredSidebarTodos = sidebarTodos.filter(todo => {
        if (todoFilter === 'ALL') return true;
        return todo.type === (todoFilter === 'PUBLIC' ? 'EVENT' : todoFilter);
    });

    return (
        <aside className="w-[280px] border-r p-4 overflow-auto h-full bg-white">
            {/* --- 모바일 전용 UI --- */}
            <div className="md:hidden">
                <div className="flex justify-between items-center mb-4">

                    <button onClick={onClose} className="p-2">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18M6 6L18 18" stroke="#334155" strokeWidth="2" strokeLinecap="round"
                                  strokeLinejoin="round"/>
                        </svg>
                    </button>
                </div>
                {/* 모바일 뷰 전환 탭 */}
                <div className="flex justify-center items-center bg-slate-100 rounded-lg p-1 mb-6">
                    <button
                        onClick={onGoToMonthView}
                        className={`flex-1 p-2 rounded-md flex justify-center items-center text-slate-500`}
                        aria-label="Month View"
                    >
                        <CalendarIcon/>
                    </button>
                    <button
                        onClick={onGoToWeekView}
                        className={`flex-1 p-2 rounded-md flex justify-center items-center text-slate-500`}
                        aria-label="Week View"
                    >
                        <ListIcon/>
                    </button>
                </div>

                {/* '기능 목록' 뷰 */}
                <div className="space-y-2">
                    <ActionButton icon={AddIcon} text="Add Event / Todo / Memo" onClick={onOpenEventModal}/>
                    <ActionButton icon={ShareIcon} text="Share Calendar" onClick={onOpenTeamModal}/>
                    <ActionButton icon={SettingsIcon} text="Settings" onClick={onOpenSettingsModal}/>
                </div>

            </div>

            {/* --- 기존 UI (데스크톱에서는 항상 보이고, 모바일에서는 '캘린더' 뷰일 때만 보임) --- */}
            <div className="hidden md:block">
                <div className="mb-4">
                    <div
                        className="w-full px-6 py-1.5 rounded-full border border-slate-300 text-lg font-bold text-slate-800 text-center">
                        To do
                    </div>
                </div>
                {/* 1. 미니 캘린더 섹션 */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <button onClick={prevMiniMonth} className="text-xs">&#x276E;</button>
                        <div className="text-sm font-medium">{new Date(miniYear, miniMonth).toLocaleString("en-US", {
                            month: "long",
                            year: "numeric"
                        })}</div>
                        <button onClick={nextMiniMonth} className="text-xs">&#x276F;</button>
                    </div>
                    <div
                        className="mt-3 grid grid-cols-7 gap-1 text-[12px] text-slate-500">{["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                        <div key={i} className="text-center">{d}</div>))}</div>
                    <div
                        className="mt-2 grid grid-cols-7 gap-1 text-sm">{miniMatrix.map((week, ri) => week.map((day, ci) => {
                        const isTodayDate = day && miniYear === today.getFullYear() && miniMonth === today.getMonth() && day === today.getDate();
                        const isSelected = day && miniYear === selectedSidebarDate.getFullYear() && miniMonth === selectedSidebarDate.getMonth() && day === selectedSidebarDate.getDate();
                        return (
                            <div
                                key={`${ri}-${ci}`}
                                // onClick 핸들러가 내부 handleDateClick 대신
                                // 부모의 handleSidebarDateSelect를 호출하도록 변경합니다.
                                onClick={() => day && handleSidebarDateSelect(day)}
                                className={`h-7 flex items-center justify-center rounded cursor-pointer ${isTodayDate ? "bg-slate-800 text-white" : isSelected ? "bg-slate-200 text-slate-800" : "text-slate-500 hover:bg-slate-100"}`}
                            >{day ?? ""}</div>
                        );
                    }))}</div>
                </div>

                {/* 2. To-do 목록 섹션 */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium">To do</h3>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setTodoFilter('ALL')}
                                    className={`px-2 py-0.5 text-xs rounded-full ${todoFilter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}>All
                            </button>
                            <button onClick={() => setTodoFilter('PUBLIC')}
                                    className={`px-2 py-0.5 text-xs rounded-full ${todoFilter === 'PUBLIC' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}>Public
                            </button>
                            <button onClick={() => setTodoFilter('PRIVATE')}
                                    className={`px-2 py-0.5 text-xs rounded-full ${todoFilter === 'PRIVATE' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}>Private
                            </button>
                        </div>
                    </div>
                    <div className="space-y-3 text-sm">
                        {filteredSidebarTodos.length > 0 ? (filteredSidebarTodos.map((todo) => (
                            <div key={`${todo.type}-${todo.id}`}
                                 className={`flex items-center gap-3 p-1 rounded-md ${todo.status === "DONE" ? "opacity-50" : ""}`}>
                                <div className="w-2 h-7 rounded" style={{backgroundColor: todo.parentEventColor}}></div>
                                <div className="flex-1 min-w-0 cursor-pointer" onDoubleClick={() => onEditTodo(todo)}>
                                    <div
                                        className={`font-medium truncate ${todo.status === "DONE" ? "line-through text-slate-400" : ""}`}>{todo.title}</div>

                                    <div className="text-xs text-slate-400 truncate">
                                        {todo.type === 'PRIVATE' ? (todo.description || 'No description') : `${user?.name || 'Unassigned'} - ${todo.description || ''}`}
                                    </div>

                                </div>
                                <button onClick={() => handleToggleTodoStatus(todo)}
                                        className="w-5 h-5 border-2 rounded-full flex-shrink-0 flex items-center justify-center cursor-pointer">
                                    {todo.status === "DONE" && (
                                        <div className="w-2.5 h-2.5 bg-slate-400 rounded-full"></div>)}
                                </button>
                            </div>
                        ))) : (<p className="text-xs text-slate-400 text-center py-4">No to-dos for this date.</p>)}
                    </div>
                </div>
                <div className="hidden md:block">
                    <TaskProgress
                        todos={sidebarTodos}
                        projectStartDate={projectStartDate}
                        projectEndDate={projectEndDate}
                    />
                </div>
            </div>
        </aside>
    );
}

