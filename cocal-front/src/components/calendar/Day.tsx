"use client";

import React from "react";
import { CalendarEvent } from "./types";

interface DayViewProps {
    events: CalendarEvent[];
    date?: Date;
}

export default function DayView({ events, date = new Date() }: DayViewProps) {
    const hours = Array.from({ length: 16 }, (_, i) => i + 8);

    const dayEvents = events.filter((e) => {

        const start = new Date(e.startAt);
        return (
            start.getFullYear() === date.getFullYear() &&
            start.getMonth() === date.getMonth() &&
            start.getDate() === date.getDate()
        );
    });

    const renderEvents = () => {
        return dayEvents.map((event) => {

            const start = new Date(event.startAt);
            const end = new Date(event.endAt || event.startAt);

            const startHour = start.getHours() + start.getMinutes() / 60;
            const endHour = end.getHours() + end.getMinutes() / 60;

            const top = (startHour - 8) * 64;
            const height = (endHour - startHour) * 64;

            return (
                <div
                    key={event.id}
                    className="absolute left-1 right-1 rounded p-2 text-xs text-white shadow"
                    style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        backgroundColor: event.color || "#6366f1",
                    }}
                >
                    <div className="font-medium">{event.title}</div>
                    {event.description && (
                        <div className="text-[11px] opacity-80">{event.description}</div>
                    )}
                </div>
            );
        });
    };

    return (
        <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-2 border-b bg-slate-50 text-sm font-medium">
                <div className="p-2 text-right text-slate-400">시간</div>
                <div className="p-2 text-center">
                    {date.toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        weekday: "short",
                    })}
                </div>
            </div>

            <div className="flex">
                <div className="flex flex-col border-r text-xs text-slate-400">
                    {hours.map((h) => (
                        <div key={h} className="h-16 px-1 text-right">
                            {h < 12 ? `${h} AM` : h === 12 ? `12 PM` : `${h - 12} PM`}
                        </div>
                    ))}
                </div>

                <div className="relative flex-1 border-l">
                    {hours.map((_, h) => (
                        <div key={h} className="h-16 border-b" />
                    ))}

                    {renderEvents()}
                </div>
            </div>
        </div>
    );
}