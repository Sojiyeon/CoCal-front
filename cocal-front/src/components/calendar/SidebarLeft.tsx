"use client";

import React, { useState } from "react";
import TaskProgress from "./TaskProgress";
import { SidebarTodo, UserSummary } from "./types";

// 오늘 날짜를 저장하는 상수
const today = new Date();
// 컴포넌트가 받을 props의 타입을 정의
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
}

export default function SidebarLeft({
                                        miniYear,
                                        miniMonth,
                                        prevMiniMonth,
                                        nextMiniMonth,
                                        miniMatrix,
                                        selectedSidebarDate,
                                        handleSidebarDateSelect,
                                        sidebarTodos,
                                        user,
                                        handleToggleTodoStatus,
                                        onEditTodo,
                                    }: SidebarLeftProps) {

    const [todoFilter, setTodoFilter] = useState('ALL');

    // 렌더링 직전에 선택된 필터에 따라 sidebarTodos를 필터링
    const filteredSidebarTodos = sidebarTodos.filter(todo => {
        if (todoFilter === 'ALL') return true;
        // 'PUBLIC' 필터는 'EVENT' 타입의 할일을 보여줌
        return todo.type === (todoFilter === 'PUBLIC' ? 'EVENT' : todoFilter);
    });

    return (
        <aside className="w-[260px] border-r p-4 overflow-auto">
            <div className="mb-4">
                <div
                    className="w-full px-6 py-1.5 rounded-full border border-slate-300 text-sm font-medium text-slate-800 text-center">To
                    do
                </div>
            </div>

            {/* 1. 미니 캘린더  섹션 */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <button onClick={prevMiniMonth} className="text-xs">&#x276E;</button>
                    <div
                        className="text-sm font-medium">{new Date(miniYear, miniMonth).toLocaleString("en-US", {
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
                            onClick={() => day && handleSidebarDateSelect(day)}
                            className={`h-7 flex items-center justify-center rounded cursor-pointer ${isTodayDate ? "bg-slate-800 text-white" : isSelected ? "bg-slate-200 text-slate-800" : "text-slate-500 hover:bg-slate-100"}`}
                        >
                            {day ?? ""}
                        </div>
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
                    {filteredSidebarTodos.length > 0 ? (filteredSidebarTodos.map((todo) => {


                        return (
                            <div key={todo.id}
                                 className={`flex items-center gap-3 p-1 rounded-md ${todo.status === "DONE" ? "opacity-50" : ""}`}
                                 onDoubleClick={() => onEditTodo(todo)}
                            >
                                <div className="w-2 h-7 rounded" style={{ backgroundColor: todo.parentEventColor }}></div>

                                <div className="flex-1 min-w-0">

                                        <>
                                            <div
                                                className={`font-medium truncate ${todo.status === "DONE" ? "line-through text-slate-400" : ""}`}>{todo.title}</div>
                                            <div className="text-xs text-slate-400 truncate">
                                                {todo.type === 'PRIVATE'
                                                    ? (todo.description || 'No description')
                                                    : `${user?.name || 'Unassigned'} - ${todo.description || ''}`
                                                }
                                            </div>
                                        </>

                                </div>


                                    <button onClick={() => handleToggleTodoStatus(todo.id)}
                                            className="w-5 h-5 border-2 rounded-full flex-shrink-0 flex items-center justify-center cursor-pointer">
                                        {todo.status === "DONE" && (
                                            <div className="w-2.5 h-2.5 bg-slate-400 rounded-full"></div>)}
                                    </button>

                            </div>
                        );
                    })) : (
                        <p className="text-xs text-slate-400 text-center py-4">No to-dos for the selected date.</p>
                    )}
                </div>
            </div>
            <TaskProgress todos={sidebarTodos}/>
        </aside>
    );
}