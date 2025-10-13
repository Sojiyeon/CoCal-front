"use client";

import React from "react";
import { CalendarEvent } from "./types";

interface WeekViewProps {
    events: CalendarEvent[];
}

export default function WeekView({ events }: WeekViewProps) {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const hours = Array.from({ length: 16 }, (_, i) => i + 8);

    const renderEvents = (dayIdx: number) => {
        const dayEvents = events.filter((e) => {

            const start = new Date(e.startAt);
            return start.getDay() === (dayIdx + 1) % 7;
        });

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
                    className="absolute left-1 right-1 rounded p-1 text-xs text-white shadow"
                    style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        backgroundColor: event.color || "#6366f1",
                    }}
                >
                    <div className="font-medium">{event.title}</div>
                    {event.description && (
                        <div className="text-[10px] opacity-80">{event.description}</div>
                    )}
                </div>
            );
        });
    };

    return (
        <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-8 border-b bg-slate-50 text-sm font-medium">
                <div className="p-2 text-right text-slate-400">시간</div>
                {days.map((day, idx) => (
                    <div key={idx} className="p-2 text-center">
                        {day}
                    </div>
                ))}
            </div>

            <div className="flex">
                <div className="flex flex-col border-r text-xs text-slate-400">
                    {hours.map((h) => (
                        <div key={h} className="h-16 px-1 text-right">
                            {h} AM
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 flex-1 relative">
                    {days.map((_, dayIdx) => (
                        <div key={dayIdx} className="relative border-l">
                            {hours.map((_, h) => (
                                <div key={h} className="h-16 border-b" />
                            ))}

                            {renderEvents(dayIdx)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}