"use client";

import React, { useState } from "react";
import Button from "../calendar/Button";
import WeekView from "./Week";
import DayView from "./Day";
import TaskProgress from "./TaskProgress";

import { CalendarEvent } from "./types";
import { getMonthMatrix, formatYMD, weekdays } from "./utils";
import { sampleEvents } from "./sampleData";

export default function CalendarUI() {
    const today = new Date("2025-09-23"); // 샘플

    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());
    const [miniYear, setMiniYear] = useState(today.getFullYear());
    const [miniMonth, setMiniMonth] = useState(today.getMonth());
    const [events] = useState<CalendarEvent[]>(sampleEvents);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [viewMode, setViewMode] = useState<"day" | "week" | "month">("month");

    const miniMatrix = getMonthMatrix(miniYear, miniMonth);
    const matrix = getMonthMatrix(viewYear, viewMonth);

    function prevMiniMonth() {
        if (miniMonth === 0) {
            setMiniMonth(11);
            setMiniYear((y) => y - 1);
        } else setMiniMonth((m) => m - 1);
    }
    function nextMiniMonth() {
        if (miniMonth === 11) {
            setMiniMonth(0);
            setMiniYear((y) => y + 1);
        } else setMiniMonth((m) => m + 1);
    }
    function prevMonth() {
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear((y) => y - 1);
        } else setViewMonth((m) => m - 1);
    }
    function nextMonth() {
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear((y) => y + 1);
        } else setViewMonth((m) => m + 1);
    }

    return (
        <div className="h-screen w-screen flex flex-col bg-white">
            {/* 상단 바 */}
            <div className="flex items-center justify-between px-6 py-3 bg-white border-b">
                <div className="flex items-center gap-3">
                    <button className="p-1 rounded-full hover:bg-slate-100">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M15 18l-6-6 6-6"
                                stroke="#0f172a"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                    <h1 className="text-xl font-medium">projects 1</h1>
                    <div className="w-2 h-2 rounded-full bg-emerald-400 ml-2" />
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-sm text-slate-500">
                        Name
                        <div className="text-xs text-slate-400">test123@gmail.com</div>
                    </div>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* 좌측 사이드바 */}
                <aside className="w-[260px] border-r p-4 overflow-auto">
                    <div className="mb-4">
                        <div className="w-full px-6 py-1.5 rounded-full border border-slate-300 text-sm font-medium text-slate-800 text-center">
                            To do
                        </div>
                    </div>

                    {/* 미니 달력 */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between">
                            <button onClick={prevMiniMonth} className="text-xs">&#x276E;</button>
                            <div className="text-sm font-medium">
                                {new Date(miniYear, miniMonth).toLocaleString("en-US", {
                                    month: "long",
                                    year: "numeric",
                                })}
                            </div>
                            <button onClick={nextMiniMonth} className="text-xs">&#x276F;</button>
                        </div>

                        <div className="mt-3 grid grid-cols-7 gap-1 text-[12px] text-slate-500">
                            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                                <div key={i} className="text-center">{d}</div>
                            ))}
                        </div>

                        <div className="mt-2 grid grid-cols-7 gap-1 text-sm">
                            {miniMatrix.map((week, ri) =>
                                week.map((day, ci) => {
                                    const isToday =
                                        day &&
                                        miniYear === today.getFullYear() &&
                                        miniMonth === today.getMonth() &&
                                        day === today.getDate();
                                    return (
                                        <div
                                            key={`${ri}-${ci}`}
                                            className={`h-7 flex items-center justify-center rounded ${isToday ? "bg-slate-800 text-white" : "text-slate-500"}`}
                                        >
                                            {day ?? ""}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* To do 리스트 (샘플) */}
                    <div className="mb-6">
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
                                <div className="flex-1 line-through text-slate-400">
                                    Reply to messages
                                </div>
                            </div>
                        </div>
                    </div>

                    <TaskProgress />
                </aside>

                {/* 메인 달력 */}
                <main className="flex-1 p-6 overflow-auto">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-6">
                            <button onClick={prevMonth} className="text-slate-800 hover:text-slate-600 text-xl">
                                &#x276E;
                            </button>
                            <h2 className="text-lg font-semibold text-slate-800">
                                {new Date(viewYear, viewMonth).toLocaleString("en-US", {
                                    month: "long",
                                    year: "numeric",
                                })}
                            </h2>
                            <button onClick={nextMonth} className="text-slate-800 hover:text-slate-600 text-xl">
                                &#x276F;
                            </button>
                        </div>

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
                            <Button variant="outline">Today</Button>
                        </div>
                    </div>

                    {/* 달력 뷰 */}
                    {viewMode === "month" && (
                        <>
                            <div className="grid grid-cols-7 text-xs text-slate-400 border-t border-b py-2">
                                {weekdays.map((w) => (
                                    <div key={w} className="text-center">{w}</div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-2 mt-3">
                                {matrix.map((week, ri) => (
                                    <React.Fragment key={ri}>
                                        {week.map((day, ci) => {
                                            const dateKey = day ? formatYMD(viewYear, viewMonth, day) : "";
                                            const dayEvents = events.filter((e) => e.start_date === dateKey);
                                            const isToday =
                                                dateKey === formatYMD(today.getFullYear(), today.getMonth(), today.getDate());

                                            return (
                                                <div
                                                    key={ci}
                                                    className={`min-h-[92px] border rounded p-2 bg-white ${isToday ? "ring-2 ring-slate-300" : ""}`}
                                                >
                                                    <div className="text-sm font-medium">{day ?? ""}</div>
                                                    <div className="mt-2 space-y-2">
                                                        {dayEvents.slice(0, 2).map((ev) => (
                                                            <div
                                                                key={ev.id}
                                                                className={`px-2 py-1 rounded text-xs ${ev.color ?? "bg-slate-200"} cursor-pointer`}
                                                                onClick={() => setSelectedEvent(ev)}
                                                            >
                                                                <div className="truncate">{ev.title}</div>
                                                            </div>
                                                        ))}
                                                        {dayEvents.length > 2 && (
                                                            <div className="text-[12px] text-slate-400">
                                                                +{dayEvents.length - 2} more
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                            </div>
                        </>
                    )}

                    {viewMode === "week" && <WeekView events={events} />}
                    {viewMode === "day" && <DayView events={events} />}
                </main>
            </div>

            {/* 이벤트 모달 */}
            {selectedEvent && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-lg p-6 w-[420px]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">{selectedEvent.title}</h3>
                            <button onClick={() => setSelectedEvent(null)} className="text-slate-400">✕</button>
                        </div>
                        <div className="text-sm text-slate-600">
                            {selectedEvent.description ?? "이벤트 설명이 없습니다."}
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="px-4 py-2 border rounded"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
