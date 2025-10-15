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
    projectStartDate: Date |undefined;
    projectEndDate: Date | undefined;
    user: UserSummary | null;
    handleToggleTodoStatus: (id: number) => void;
    onUpdateTodo: (id: number, newTitle: string) => void; // 할 일 내용(title) 수정 함수
    onDeleteTodo: (id: number, type: 'EVENT' | 'PRIVATE') => void; // 할 일 삭제 함수
}

export default function     SidebarLeft({
                                        miniYear,
                                        miniMonth,
                                        prevMiniMonth,
                                        nextMiniMonth,
                                        miniMatrix,
                                        selectedSidebarDate,
                                        handleSidebarDateSelect,
                                        sidebarTodos,
                                        projectStartDate,
                                        projectEndDate,
                                        user,
                                        handleToggleTodoStatus,
                                        onUpdateTodo,
                                        onDeleteTodo,
                                    }: SidebarLeftProps) {

    const [todoFilter, setTodoFilter] = useState('ALL');
    // 현재 수정 중인 To-do의 id와 새로운 제목을 관리하는 상태
    const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
    //  수정 중인 To-do의 제목을 관리하는 상태
    const [editingTodoTitle, setEditingTodoTitle] = useState('');
    //  더블클릭 시 '수정 모드'로 전환하는 핸들러
    const handleEditStart = (todo: SidebarTodo) => {
        setEditingTodoId(todo.id);
        setEditingTodoTitle(todo.title);
    };

    //  '수정 모드'에서 Enter 키를 누르면 저장하는 핸들러
    const handleEditSave = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            if (editingTodoId && editingTodoTitle.trim() !== '') {
                onUpdateTodo(editingTodoId, editingTodoTitle.trim());
            }
            setEditingTodoId(null); // '수정 모드' 종료
        }
    };

    // [추가] '수정 모드'에서 포커스를 잃으면(다른 곳 클릭) 취소하는 핸들러
    const handleEditCancel = () => {
        setEditingTodoId(null);
    };
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

            {/* 1. 미니 캘린더 섹션 */}
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
                        const isEditing = editingTodoId === todo.id;

                        return (
                            <div key={todo.id}
                                 className={`flex items-center gap-3 p-1 rounded-md ${isEditing ? 'bg-slate-100' : ''} ${todo.status === "DONE" && !isEditing ? "opacity-50" : ""}`}
                                 onDoubleClick={() => !isEditing && handleEditStart(todo)}
                            >
                                <div className="w-2 h-7 rounded" style={{ backgroundColor: todo.parentEventColor }}></div>

                                <div className="flex-1 min-w-0">
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editingTodoTitle}
                                            onChange={(e) => setEditingTodoTitle(e.target.value)}
                                            onKeyDown={handleEditSave}
                                            onBlur={handleEditCancel}
                                            autoFocus
                                            className="w-full text-sm bg-transparent border-b border-slate-400 focus:outline-none"
                                        />
                                    ) : (
                                        <>
                                            <div className={`font-medium truncate ${todo.status === "DONE" ? "line-through text-slate-400" : ""}`}>{todo.title}</div>
                                            <div className="text-xs text-slate-400 truncate">
                                                {todo.type === 'PRIVATE'
                                                    ? (todo.description || 'No description')
                                                    : `${user?.name || 'Unassigned'} - ${todo.description || ''}`
                                                }
                                            </div>
                                        </>
                                    )}
                                </div>

                                {isEditing ? (
                                    <button onClick={() => onDeleteTodo(todo.id, todo.type)}
                                            className="p-1 text-gray-400 hover:text-red-600">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                    </button>
                                ) : (
                                    <button onClick={() => handleToggleTodoStatus(todo.id)}
                                            className="w-5 h-5 border-2 rounded-full flex-shrink-0 flex items-center justify-center cursor-pointer">
                                        {todo.status === "DONE" && (<div className="w-2.5 h-2.5 bg-slate-400 rounded-full"></div>)}
                                    </button>
                                )}
                            </div>
                        );
                    })) : (
                        <p className="text-xs text-slate-400 text-center py-4">No to-dos for the selected date.</p>
                    )}
                </div>
            </div>
            <TaskProgress todos={sidebarTodos} projectStartDate={projectStartDate} projectEndDate={projectEndDate}/>
        </aside>
    );
}