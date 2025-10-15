"use client";

import React, { useState } from "react";
import TaskProgress from "./TaskProgress";
import { SidebarTodo, UserSummary } from "./types";
import {api} from "@/components/calendar/utils/api";

// 오늘 날짜를 저장하는 상수
const today = new Date();

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
    handleToggleTodoStatus: (id: number) => void;
    onEditTodo: (todo: SidebarTodo) => void;
    onClose: () => void;
    // --- 모바일 기능 통합을 위해 추가된 props ---
    onOpenEventModal: () => void;
    onOpenTeamModal: () => void;
    onOpenSettingsModal: () => void;
    projectStartDate?: Date;
    projectEndDate?: Date;
}

// ✨ FIX: 모바일 기능 목록을 위한 버튼 컴포넌트를 정의합니다.
const ActionButton = ({ icon, text, onClick }: { icon: string; text: string; onClick: () => void }) => (
    <button onClick={onClick} className="flex items-center w-full p-3 text-left text-slate-700 hover:bg-slate-100 rounded-lg">
        <span className="text-2xl w-8 mr-4 text-center">{icon}</span>
        <span className="font-medium">{text}</span>
    </button>
);


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
    handleToggleTodoStatus,
    onEditTodo,
    onClose,
    onOpenEventModal,
    onOpenTeamModal,
    onOpenSettingsModal,
    projectStartDate,
    projectEndDate
    }: { projectId: number; user: UserSummary | null } & SidebarLeftProps) {
    const [sidebarTodos, setSidebarTodos] = useState<SidebarTodo[]>([]);
    const [todoFilter, setTodoFilter] = useState('ALL');
    const [mobileView, setMobileView] = useState<'actions' | 'calendar'>('actions');


    const handleDateClick = async (day: number) => {
        // 선택 날짜 업데이트
        handleSidebarDateSelect(day);
        const selectedDate = new Date(miniYear, miniMonth, day);
        // YYYY-MM-DD 형식, 로컬 시간 기준
        const formattedDate = `${selectedDate.getFullYear()}-${(selectedDate.getMonth()+1).toString().padStart(2,'0')}-${selectedDate.getDate().toString().padStart(2,'0')}`;


        try {
            // 이벤트 TODO 가져오기
            const eventData = await api.get(
                `/projects/${projectId}/events/todos?date=${formattedDate}`
            );

            // 개인 TODO 가져오기
            const privateData = await api.get(
                `/projects/${projectId}/todos?date=${formattedDate}`
            );

            // 안전하게 items 접근 (API가 빈 배열 반환 가능)
            const eventItems = eventData?.data?.items || [];
            const privateItems = privateData?.data?.items || [];

            // combined
            const combinedTodos: SidebarTodo[] = [
                ...eventItems.map((item: any) => ({
                    id: item.id,
                    title: item.title,
                    type: "EVENT",
                    status: item.status,
                    parentEventColor: item.eventColor,
                    description: item.description,
                })),
                ...privateItems.map((item: any) => ({
                    id: item.id,
                    title: item.title,
                    type: "PRIVATE",
                    status: item.status,
                    parentEventColor: "#ccc",
                    description: item.description,
                })),
            ];
            console.log(combinedTodos)

            // 상태 업데이트
            setSidebarTodos(combinedTodos);
        } catch (error) {
            console.error("API 요청 실패:", error);
            // 실패 시 빈 배열로 초기화
            setSidebarTodos([]);
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
                            <path d="M18 6L6 18M6 6L18 18" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                </div>
                {/* 모바일 뷰 전환 탭 */}
                <div className="flex justify-center items-center bg-slate-100 rounded-lg p-1 mb-6">
                    <button onClick={() => setMobileView('actions')} className={`flex-1 p-2 text-sm font-semibold rounded-md ${mobileView === 'actions' ? 'bg-white shadow-sm' : ''}`}>
                        Actions
                    </button>
                    <button onClick={() => setMobileView('calendar')} className={`flex-1 p-2 text-sm font-semibold rounded-md ${mobileView === 'calendar' ? 'bg-white shadow-sm' : ''}`}>
                        Calendar
                    </button>
                </div>

                {/* '기능 목록' 뷰 */}
                {mobileView === 'actions' && (
                    <div className="space-y-2">
                        <ActionButton icon="➕" text="Add Event / Todo" onClick={onOpenEventModal} />
                        <ActionButton icon="🤝" text="Invite Member" onClick={onOpenTeamModal} />
                        <ActionButton icon="⚙️" text="Project Settings" onClick={onOpenSettingsModal} />
                    </div>
                )}
            </div>

            {/* --- 기존 UI (데스크톱에서는 항상 보이고, 모바일에서는 '캘린더' 뷰일 때만 보임) --- */}
            <div className={`${mobileView === 'calendar' ? 'block' : 'hidden'} md:block`}>
                <div className="mb-4 hidden md:block">
                    <div
                        className="w-full px-6 py-1.5 rounded-full border border-slate-300 text-sm font-medium text-slate-800 text-center">
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
                                onClick={() => day && handleDateClick(day)}
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
                            <div key={todo.id}
                                 className={`flex items-center gap-3 p-1 rounded-md ${todo.status === "DONE" ? "opacity-50" : ""}`}>
                                <div className="w-2 h-7 rounded" style={{backgroundColor: todo.parentEventColor}}></div>
                                <div className="flex-1 min-w-0 cursor-pointer" onDoubleClick={() => onEditTodo(todo)}>
                                    <div
                                        className={`font-medium truncate ${todo.status === "DONE" ? "line-through text-slate-400" : ""}`}>{todo.title}</div>
                                    <div className="text-xs text-slate-400 truncate">
                                        {todo.type === 'PRIVATE' ? (todo.description || 'No description') : `${user?.name || 'Unassigned'} - ${todo.description || ''}`}
                                    </div>
                                </div>
                                <button onClick={() => handleToggleTodoStatus(todo.id)}
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

