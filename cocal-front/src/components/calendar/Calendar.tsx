// // src/components/calendar/Calendar.tsx
// "use client"; // 클라이언트 컴포넌트로 지정
//
// import { useState } from 'react';
// import Calendar from 'react-calendar';
// import 'react-calendar/dist/Calendar.css'; // 스타일 import
//
// type ValuePiece = Date | null;
// type Value = ValuePiece | [ValuePiece, ValuePiece];
//
// export default function MyCalendar() {
//     const [value, onChange] = useState<Value>(new Date());
//
//     return (
//         <div>
//             <h1 className="text-2xl font-bold mb-4">공동 캘린더</h1>
//             <Calendar onChange={onChange} value={value} />
//         </div>
//     );
// }
"use client";


import React, { useState } from "react";

/**
 * CalendarUI.tsx
 * - Single-file React + TypeScript component for Next.js (App Router compatible)
 * - Uses Tailwind CSS for styling (assumes Tailwind is set up in the project)
 * - Mock data included. Replace services/api calls with real endpoints.
 */

type CalendarEvent = {
    id: string;
    title: string;
    date: string; // yyyy-mm-dd
    color?: string;
    project?: string;
};

const sampleEvents: CalendarEvent[] = [
    { id: "1", title: "프로젝트 1", date: "2025-09-24", color: "bg-gray-300", project: "프로젝트 1" },
    { id: "2", title: "여기 누르면 이벤트 내용이 나온다", date: "2025-09-16", color: "bg-gray-200" },
    { id: "3", title: "여기 누르면 카드 모달로 보여", date: "2025-09-16", color: "bg-gray-200" },
];

const weekdays = ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"];

function getMonthMatrix(year: number, monthIndex: number) {
    // monthIndex: 0-11
    const first = new Date(year, monthIndex, 1);
    const last = new Date(year, monthIndex + 1, 0);
    const firstDay = (first.getDay() + 6) % 7; // convert Sun=0 -> Mon=0
    const daysInMonth = last.getDate();

    const rows: (number | null)[][] = [];
    let currentDay = 1 - firstDay;
    while (currentDay <= daysInMonth) {
        const week: (number | null)[] = [];
        for (let i = 0; i < 7; i++) {
            if (currentDay < 1 || currentDay > daysInMonth) week.push(null);
            else week.push(currentDay);
            currentDay++;
        }
        rows.push(week);
    }
    return rows;
}

export default function CalendarUI() {
    const today = new Date("2025-09-23"); // fixed for mock; replace with new Date() in prod
    const [viewYear, setViewYear] = useState<number>(today.getFullYear());
    const [viewMonth, setViewMonth] = useState<number>(today.getMonth());
    const [events] = useState<CalendarEvent[]>(sampleEvents);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const matrix = getMonthMatrix(viewYear, viewMonth);

    function formatYMD(year: number, month: number, day: number) {
        const m = String(month + 1).padStart(2, "0");
        const d = String(day).padStart(2, "0");
        return `${year}-${m}-${d}`;
    }

    function prevMonth(){
        if(viewMonth === 0){ setViewMonth(11); setViewYear(y => y-1); }
        else setViewMonth(m => m-1);
    }
    function nextMonth(){
        if(viewMonth === 11){ setViewMonth(0); setViewYear(y => y+1); }
        else setViewMonth(m => m+1);
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-[1280px] mx-auto border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                {/* Top bar */}
                <div className="flex items-center justify-between px-6 py-3 bg-white border-b">
                    <div className="flex items-center gap-3">
                        <button className="p-1 rounded-full hover:bg-slate-100">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                        <h1 className="text-xl font-medium">projects 1</h1>
                        <div className="w-2 h-2 rounded-full bg-emerald-400 ml-2" />
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-sm text-slate-500">Name
                            <div className="text-xs text-slate-400">test123@gmail.com</div>
                        </div>
                        <img src="" alt="avatar" className="w-8 h-8 rounded-full object-cover"/>
                    </div>
                </div>

                <div className="flex">
                    {/* Left narrow sidebar */}
                    <aside className="w-[260px] border-r p-4">
                        {/* Mini calendar */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-medium">September 2025</div>
                                <button className="text-xs text-slate-500">Month ▾</button>
                            </div>

                            <div className="mt-3 grid grid-cols-7 gap-1 text-[12px] text-slate-500">
                                {Array.from({length:7}).map((_,i)=>(
                                    <div key={i} className="text-center">{['S','M','T','W','T','F','S'][i]}</div>
                                ))}
                            </div>

{/*
                            <div className="mt-2 grid grid-cols-7 gap-1 text-sm">
                                {Array.from({length:35}).map((_,i)=>{
                                    const day = i - 1; // quick placeholder layout
                                    const isToday = i===22; // highlight 23rd
                                    return (
                                        <div key={i} className={`h-7 flex items-center justify-center rounded ${isToday? 'bg-slate-800 text-white':'text-slate-500'}`}>{i-0>0? i-0: ''}</div>
                                    )
                                })}
                            </div>
*/}
                        </div>

                        {/* To do list */}
                        <div>
                            <h3 className="text-sm font-medium mb-2">To do</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-7 bg-pink-400 rounded" />
                                    <div className="flex-1">
                                        <div className="font-medium">Review calendar</div>
                                        <div className="text-xs text-slate-400">Yoga</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 opacity-50">
                                    <div className="w-2 h-7 bg-pink-400 rounded" />
                                    <div className="flex-1 line-through text-slate-400">Reply to messages</div>
                                </div>
                                <div className="flex items-center gap-3 opacity-50">
                                    <div className="w-2 h-7 bg-pink-400 rounded" />
                                    <div className="flex-1 line-through text-slate-400">Backup files</div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <div className="text-xs text-slate-400">IN PROGRESS</div>
                                <div className="mt-2 flex items-end gap-4">
                                    <div className="text-2xl font-bold">12</div>
                                    <div className="text-sm text-slate-500">Completed</div>
                                </div>
                                <div className="mt-2 text-sm text-slate-700">5 To do</div>
                            </div>
                        </div>

                    </aside>

                    {/* Main calendar area */}
                    <main className="flex-1 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <button onClick={prevMonth} className="p-2 rounded hover:bg-slate-100">◀</button>
                                <h2 className="text-2xl font-semibold">September 2025</h2>
                                <button onClick={nextMonth} className="p-2 rounded hover:bg-slate-100">▶</button>
                            </div>

                            <div className="flex items-center gap-3">
                                <button className="border px-3 py-1 rounded text-sm">Month</button>
                                <button className="border px-3 py-1 rounded text-sm">Today</button>
                            </div>
                        </div>

                        {/* Weekdays header */}
                        <div className="grid grid-cols-7 text-xs text-slate-400 border-t border-b py-2">
                            {weekdays.map((w) => (
                                <div key={w} className="text-center">{w}</div>
                            ))}
                        </div>

                        {/* Month grid */}
                        <div className="grid grid-cols-7 gap-2 mt-3">
                            {matrix.map((week,ri)=> (
                                <React.Fragment key={ri}>
                                    {week.map((day,ci)=>{
                                        const dateKey = day ? formatYMD(viewYear, viewMonth, day) : "";
                                        const dayEvents = events.filter(e => e.date === dateKey);
                                        const isToday = dateKey === formatYMD(today.getFullYear(), today.getMonth(), today.getDate());

                                        return (
                                            <div key={ci} className={`min-h-[92px] border rounded p-2 bg-white ${isToday? 'ring-2 ring-slate-300':''}`}>
                                                <div className="flex items-start justify-between">
                                                    <div className="text-sm font-medium">{day ?? ''}</div>
                                                    {day && <div className="text-xs text-slate-400">{day===1? '1 새해 첫날':''}</div>}
                                                </div>

                                                <div className="mt-2 space-y-2">
                                                    {dayEvents.slice(0,2).map(ev => (
                                                        <div key={ev.id} className={`px-2 py-1 rounded text-xs ${ev.color ?? 'bg-slate-200'}`} onClick={() => setSelectedDate(ev.id)}>
                                                            <div className="truncate">{ev.title}</div>
                                                            {ev.project && <div className="text-[10px] text-slate-500">◯ {ev.project}</div>}
                                                        </div>
                                                    ))}
                                                    {dayEvents.length > 2 && (
                                                        <div className="text-[12px] text-slate-400">+{dayEvents.length - 2} more</div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                        </div>
                    </main>

                    {/* Right skinny toolbar */}
                    <div className="w-[56px] border-l flex flex-col items-center py-4 gap-4">
                        <button className="p-2 rounded hover:bg-slate-100">👥</button>
                        <button className="p-2 rounded hover:bg-slate-100">⚙️</button>
                        <button className="p-2 rounded hover:bg-slate-100">📁</button>
                    </div>
                </div>
            </div>

            {/* Simple modal preview when event selected (mock) */}
            {selectedDate && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-lg p-6 w-[420px]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Event detail</h3>
                            <button onClick={() => setSelectedDate(null)} className="text-slate-400">✕</button>
                        </div>
                        <div className="text-sm text-slate-600">(모의 데이터) 이벤트 내용이 여기 표시됩니다.</div>
                        <div className="mt-4 flex justify-end">
                            <button onClick={() => setSelectedDate(null)} className="px-4 py-2 border rounded">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

