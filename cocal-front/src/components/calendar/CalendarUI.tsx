"use client";

// [수정] 사용하지 않는 FC를 import 목록에서 제거합니다.
import React, { useState, useEffect } from "react";
import WeekView from "./Week";
import DayView from "./Day";
import TaskProgress from "./TaskProgress";
import SidebarRight from "./SidebarRight";
import { EventDetailModal } from "./modals/EventDetailModal";
import ProfileDropdown from "./ProfileDropdown";
import ProfileSettingsModal from "./modals/ProfileSettingModal";

import { CalendarEvent, EventTodo } from "./types";
import { getMonthMatrix, formatYMD, weekdays } from "./utils";
import { sampleEvents } from "./sampleData";

// --- 타입 및 상수 정의 ---
interface Project {
    name: string;
}
interface SidebarTodo extends EventTodo {
    parentEventTitle: string;
    parentEventColor: string;
}

const today = new Date();

const DUMMY_USER = {
    name: 'Name',
    email: 'name123@gmail.com',
    imageUrl: 'https://placehold.co/96x96/50bda1/ffffff?text=COLA',
};

const isDevelopment = process.env.NODE_ENV === 'development';
const BASE_URL = isDevelopment ? 'http://localhost:3000/api' : 'https://cocal-server.onrender.com/api';
const API_ENDPOINTS = {
    UPDATE_USER_NAME: `${BASE_URL}/users/edit-name`,
    UPDATE_USER_PASSWORD: `${BASE_URL}/users/edit-pwd`,
    UPDATE_USER_PHOTO: `${BASE_URL}/users/edit-photo`,
};
const API_LOGOUT_ENDPOINT = `${BASE_URL}/auth/logout`;


export default function CalendarUI() {
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());
    const [miniYear, setMiniYear] = useState(today.getFullYear());
    const [miniMonth, setMiniMonth] = useState(today.getMonth());

    const [events, setEvents] = useState<CalendarEvent[]>(sampleEvents);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [viewMode, setViewMode] = useState<"day" | "week" | "month">("month");
    const [currentProject, setCurrentProject] = useState<Project | null>(null);

    const [sidebarTodos, setSidebarTodos] = useState<SidebarTodo[]>([]);
    const [selectedSidebarDate, setSelectedSidebarDate] = useState(today);

    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    useEffect(() => {
        const selectedDateKey = formatYMD(selectedSidebarDate.getFullYear(), selectedSidebarDate.getMonth(), selectedSidebarDate.getDate());
        const selectedDaysEvents = events.filter(e => e.start_at.startsWith(selectedDateKey));

        const allTodos: SidebarTodo[] = selectedDaysEvents.flatMap(event =>
            (event.todos || []).map(todo => ({ ...todo, parentEventTitle: event.title, parentEventColor: event.color }))
        );
        setSidebarTodos(allTodos);
    }, [events, selectedSidebarDate]);

    useEffect(() => {
        setTimeout(() => {
            const fetchedProjectData = { name: "My Real Project" };
            setCurrentProject(fetchedProjectData);
        }, 1000);
    }, []);

    const miniMatrix = getMonthMatrix(miniYear, miniMonth);
    const matrix = getMonthMatrix(viewYear, viewMonth);

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

    const handleOpenSettingsModal = () => setIsSettingsModalOpen(true);
    const handleCloseSettingsModal = () => setIsSettingsModalOpen(false);

    const handleLogout = async () => {
        const refreshToken = localStorage.getItem('refreshToken');

        try {
            if (refreshToken) {
                console.log('Requesting logout from server...');
                await fetch(API_LOGOUT_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken }),
                });
            }
        } catch (error) {
            console.error("Logout API call failed, proceeding with client cleanup:", error);
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            alert("You have been logged out.");
            window.location.href = '/';
        }
    };

    function prevMiniMonth() {
        if (miniMonth === 0) {
            setMiniMonth(11); setMiniYear(y => y - 1);
        } else setMiniMonth(m => m - 1);
    }
    function nextMiniMonth() {
        if (miniMonth === 11) {
            setMiniMonth(0); setMiniYear(y => y + 1);
        } else setMiniMonth(m => m + 1);
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

    return (
        <div className="h-screen w-screen flex flex-col bg-white">
            <div className="flex items-center justify-between px-6 py-3 bg-white border-b">
                <div className="flex items-center gap-3">
                    <button className="p-1 rounded-full hover:bg-slate-100">
                        <svg width="18" height="18" viewBox="0 0 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                    <h1 className="text-xl font-medium">
                        {currentProject ? currentProject.name : "Loading..."}
                    </h1>
                    <div className="w-2 h-2 rounded-full bg-emerald-400 ml-2" />
                </div>
                <ProfileDropdown
                    user={DUMMY_USER}
                    onOpenSettings={handleOpenSettingsModal}
                    onLogout={handleLogout}
                />
            </div>

            <div className="flex flex-1 overflow-hidden">
                <aside className="w-[260px] border-r p-4 overflow-auto">
                    <div className="mb-4"><div className="w-full px-6 py-1.5 rounded-full border border-slate-300 text-sm font-medium text-slate-800 text-center">To do</div></div>
                    <div className="mb-6">
                        <div className="flex items-center justify-between"><button onClick={prevMiniMonth} className="text-xs">&#x276E;</button><div className="text-sm font-medium">{new Date(miniYear, miniMonth).toLocaleString("en-US", { month: "long", year: "numeric" })}</div><button onClick={nextMiniMonth} className="text-xs">&#x276F;</button></div>
                        <div className="mt-3 grid grid-cols-7 gap-1 text-[12px] text-slate-500">{["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (<div key={i} className="text-center">{d}</div>))}</div>
                        <div className="mt-2 grid grid-cols-7 gap-1 text-sm">{miniMatrix.map((week, ri) => week.map((day, ci) => {
                            const isToday = day && miniYear === today.getFullYear() && miniMonth === today.getMonth() && day === today.getDate();
                            const isSelected = day && miniYear === selectedSidebarDate.getFullYear() && miniMonth === selectedSidebarDate.getMonth() && day === selectedSidebarDate.getDate();
                            return (<div key={`${ri}-${ci}`} onClick={() => day && setSelectedSidebarDate(new Date(miniYear, miniMonth, day))} className={`h-7 flex items-center justify-center rounded cursor-pointer ${isToday ? "bg-slate-800 text-white" : isSelected ? "bg-slate-200 text-slate-800" : "text-slate-500 hover:bg-slate-100"}`}>{day ?? ""}</div>);
                        }))}</div>
                    </div>
                    <div className="mb-6"><h3 className="text-sm font-medium mb-2">To do</h3><div className="space-y-3 text-sm">{sidebarTodos.length > 0 ? (sidebarTodos.map(todo => (<div key={todo.id} className={`flex items-center gap-3 ${todo.status === 'DONE' ? 'opacity-50' : ''}`}><div className={`w-2 h-7 rounded ${todo.parentEventColor.startsWith('bg-') ? todo.parentEventColor : ''}`} style={{ backgroundColor: !todo.parentEventColor.startsWith('bg-') ? todo.parentEventColor : undefined }}></div><div className="flex-1"><div className={`font-medium ${todo.status === 'DONE' ? 'line-through text-slate-400' : ''}`}>{todo.title}</div><div className="text-xs text-slate-400">{todo.parentEventTitle}</div></div><button onClick={() => handleToggleTodoStatus(todo.id)} className="w-5 h-5 border-2 rounded-full flex items-center justify-center cursor-pointer">{todo.status === 'DONE' && <div className="w-2.5 h-2.5 bg-slate-400 rounded-full"></div>}</button></div>))) : (<p className="text-xs text-slate-400 text-center py-4">No to-dos for the selected date.</p>)}</div></div>
                    <TaskProgress />
                </aside>

                <main className="flex-1 p-6 overflow-auto">
                    <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-6"><button onClick={prevMonth} className="text-slate-800 hover:text-slate-600 text-xl">&#x276E;</button><h2 className="text-lg font-semibold text-slate-800">{new Date(viewYear, viewMonth).toLocaleString("en-US", { month: "long", year: "numeric" })}</h2><button onClick={nextMonth} className="text-slate-800 hover:text-slate-600 text-xl">&#x276F;</button></div><div className="flex items-center gap-3"><select value={viewMode} onChange={(e) => setViewMode(e.target.value as "day" | "week" | "month")} className="border rounded px-3 py-1 text-sm"><option value="month">Month</option><option value="week">Week</option><option value="day">Day</option></select></div></div>
                    {viewMode === "month" && (<><div className="grid grid-cols-7 text-xs text-slate-400 border-t border-b py-2">{weekdays.map((w) => (<div key={w} className="text-center">{w}</div>))}</div><div className="grid grid-cols-7 gap-2 mt-3">{matrix.map((week, ri) => (<React.Fragment key={ri}>{week.map((day, ci) => {
                        const dateKey = day ? formatYMD(viewYear, viewMonth, day) : "";
                        const dayEvents = dateKey ? events.filter((e) => e.start_at.startsWith(dateKey)) : [];
                        const isToday = dateKey === formatYMD(today.getFullYear(), today.getMonth(), today.getDate());
                        return (<div key={ci} className={`min-h-[92px] border rounded p-2 bg-white ${isToday ? "ring-2 ring-slate-300" : ""}`}><div className="text-sm font-medium">{day ?? ""}</div><div className="mt-2 space-y-2">{dayEvents.slice(0, 2).map((ev) => (<div key={ev.id} className={`px-2 py-1 rounded text-xs ${ev.color ?? "bg-slate-200"} cursor-pointer`} onClick={() => setSelectedEvent(ev)}><div className="truncate">{ev.title}</div></div>))}{dayEvents.length > 2 && (<div className="text-[12px] text-slate-400">+{dayEvents.length - 2} more</div>)}</div></div>);
                    })}</React.Fragment>))}</div></>)}
                    {viewMode === "week" && <WeekView events={events} />}
                    {viewMode === "day" && <DayView events={events} />}
                </main>

                <SidebarRight />
            </div>

            {selectedEvent && (
                <EventDetailModal
                    event={selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                    onToggleTodo={handleToggleTodoStatus}
                />
            )}

            <ProfileSettingsModal
                isOpen={isSettingsModalOpen}
                onClose={handleCloseSettingsModal}
                currentUser={DUMMY_USER}
                apiEndpoints={API_ENDPOINTS}
            />
        </div>
    );
}

