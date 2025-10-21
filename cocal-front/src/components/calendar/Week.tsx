"use client";

import React, { useMemo } from "react";
import { CalendarEvent, DateMemo } from "./types";
import { formatYMD } from "./utils";
// Day 뷰로 이동하기 위한 props를 포함하여 인터페이스를 하나로 합칩니다.
interface WeekViewProps {
    events: CalendarEvent[];
    memos: DateMemo[];
    weekStartDate: Date; // 현재 보고 있는 주의 시작 날짜 (월요일)
    onNavigateToDay: (date: Date) => void; // Day 뷰로 전환하는 함수
    onSelectEvent: (event: CalendarEvent) => void;
    onSelectMemo: (memo: DateMemo) => void;
}

interface PositionedEvent {
    event: CalendarEvent;
    start: Date;
    end: Date;
    column: number;
    totalColumns: number;
}

// '... more' 버튼의 데이터 타입
interface MoreButton {
    id: string;
    count: number;
    top: number;
    date: Date;
}
// MAX_VISIBLE_EVENTS를 컴포넌트 스코프로 이동
const MAX_VISIBLE_EVENTS = 3; // 한 번에 보여줄 최대 이벤트 수

export default function WeekView({events, memos, weekStartDate, onNavigateToDay, onSelectEvent, onSelectMemo}: WeekViewProps) {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const today = useMemo(() => new Date(), []); // [추가] 오늘 날짜 확인용
    const hourSlotHeight = 48;
    const allDayEventHeight = 24;
//  이벤트를 "종일"과 "시간 지정"으로 분리
    const { allDayOrMultiDayEvents, timedEvents } = useMemo(() => {
        const allDayOrMultiDay: CalendarEvent[] = [];
        const timed: CalendarEvent[] = [];

        events.forEach(event => {
            const start = new Date(event.startAt);
            const end = new Date(event.endAt || event.startAt);
            const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

            if (event.allDay || durationHours >= 24) {
                allDayOrMultiDay.push(event);
            } else {
                timed.push(event);
            }
        });
        return { allDayOrMultiDayEvents: allDayOrMultiDay, timedEvents: timed };
    }, [events]);
    // "종일" 이벤트의 레이아웃을 계산
    const allDayLayout = useMemo(() => {
        const weekStart = new Date(weekStartDate);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const positionedEvents: { event: CalendarEvent; startDayIndex: number; span: number; topIndex: number; }[] = [];
        const rows: (boolean[])[] = [];

        allDayOrMultiDayEvents
            .sort((a, b) => (new Date(b.endAt).getTime() - new Date(b.startAt).getTime()) - (new Date(a.endAt).getTime() - new Date(a.startAt).getTime()))
            .forEach(event => {
                const eventStart = new Date(event.startAt);
                const eventEnd = new Date(event.endAt);

                const startDayIndex = (new Date(Math.max(eventStart.getTime(), weekStart.getTime())).getDay() + 6) % 7;
                const endDayIndex = (new Date(Math.min(eventEnd.getTime(), weekEnd.getTime())).getDay() + 6) % 7;
                const span = endDayIndex - startDayIndex + 1;

                let topIndex = 0;
                while (true) {
                    let isOccupied = false;
                    for (let i = startDayIndex; i <= endDayIndex; i++) {
                        if (rows[topIndex]?.[i]) {
                            isOccupied = true;
                            break;
                        }
                    }
                    if (!isOccupied) break;
                    topIndex++;
                }

                if (!rows[topIndex]) rows[topIndex] = [];
                for (let i = startDayIndex; i <= endDayIndex; i++) {
                    rows[topIndex][i] = true;
                }

                positionedEvents.push({ event, startDayIndex, span, topIndex });
            });

        return {positionedEvents, totalRows: rows.length};
    }, [allDayOrMultiDayEvents, weekStartDate]);

    // "시간 지정" 이벤트만으로 레이아웃 계산
    const dailyLayouts = useMemo(() => {
        // layouts 변수의 타입을 명시적으로 지정
        const layouts: {
            eventsToRender: PositionedEvent[];
            moreButtons: MoreButton[];
        }[] = Array.from({ length: 7 }, () => ({
            eventsToRender: [],
            moreButtons: [],
        }));

        // ... (이하 로직은 timedEvents를 사용하도록 수정)
        const weekEvents = timedEvents
            .map(event => ({
                event,
                start: new Date(event.startAt),
                end: new Date(event.endAt || event.startAt),
                column: -1,
                totalColumns: 1,
            }))
            .sort((a, b) => a.start.getTime() - b.start.getTime());

        const columns: Array<Array<typeof weekEvents[0]>> = [];
        weekEvents.forEach(pEvent => {
            let placed = false;
            for (let i = 0; i < columns.length; i++) {
                const col = columns[i];
                const lastEventInCol = col[col.length - 1];
                if (!lastEventInCol || pEvent.start >= lastEventInCol.end) {
                    col.push(pEvent);
                    pEvent.column = i;
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                pEvent.column = columns.length;
                columns.push([pEvent]);
            }
        });

        weekEvents.forEach(pEvent => {
            const overlappingEvents = weekEvents.filter(other =>
                pEvent.start < other.end && pEvent.end > other.start
            );
            const maxColumn = overlappingEvents.reduce((max, item) => Math.max(max, item.column), -1);
            pEvent.totalColumns = maxColumn + 1;
        });

        for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
            const currentDay = new Date(weekStartDate);
            currentDay.setDate(weekStartDate.getDate() + dayIdx);
            const dayStart = new Date(currentDay); dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(currentDay); dayEnd.setHours(23, 59, 59, 999);

            const eventsForThisDay = weekEvents.filter(pEvent =>
                pEvent.start <= dayEnd && pEvent.end >= dayStart
            );

            const moreEventsMap = new Map();

            layouts[dayIdx].eventsToRender = eventsForThisDay.filter(pEvent => {
                if (pEvent.column >= MAX_VISIBLE_EVENTS) {
                    const hourKey = Math.floor(Math.max(pEvent.start.getTime(), dayStart.getTime()) / (1000 * 60 * 60));
                    if (!moreEventsMap.has(hourKey)) {
                        const start = pEvent.start < dayStart ? dayStart : pEvent.start;
                        moreEventsMap.set(hourKey, { count: 0, start: start });
                    }
                    moreEventsMap.get(hourKey).count++;
                    return false;
                }
                return true;
            });

            moreEventsMap.forEach((value, key) => {
                layouts[dayIdx].moreButtons.push({
                    id: `more-${dayIdx}-${key}`,
                    count: value.count,
                    top: (value.start.getHours() + value.start.getMinutes() / 60) * hourSlotHeight,
                    date: currentDay,
                });
            });
        }
        return layouts;

    }, [timedEvents, weekStartDate]);


    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex border-b border-gray-200 bg-slate-50 text-sm font-medium">
                <div className="w-16 flex-shrink-0 p-2 text-right text-slate-400">Time</div>
                <div className="grid grid-cols-7 flex-1">
                    {days.map((day, idx) => {
                        // 현재 주의 시작일(월요일)로부터 idx(0~6)일 뒤의 날짜 계산
                        const currentDay = new Date(weekStartDate);
                        currentDay.setDate(weekStartDate.getDate() + idx);
                        const dateNum = currentDay.getDate();

                        // 오늘 날짜인지 확인
                        const isToday = today.getFullYear() === currentDay.getFullYear() &&
                            today.getMonth() === currentDay.getMonth() &&
                            today.getDate() === currentDay.getDate();
                        const dateKey = formatYMD(currentDay.getFullYear(), currentDay.getMonth(), currentDay.getDate());
                        const dayMemos = memos.filter(m => m.memoDate === dateKey);

                        return (
                            //flex-col로 변경하여 요일과 날짜를 세로로 배치
                            <div key={idx}
                                 className="p-2 text-center border-l border-gray-200 flex flex-col items-center gap-0.5">

                                {/* [수정] 요일과 메모 닷(dot)을 묶는 div 추가 */}
                                <div className="relative h-4">
                                    <span className={`text-xs ${
                                        isToday ? 'text-blue-600' : 'text-slate-700'
                                    }`}>
                                        {day}
                                    </span>

                                    {/* [이동] 메모 닷 렌더링 */}
                                    {dayMemos.length > 0 && (
                                        <div className="absolute left-full top-0 pl-1 flex space-x-0.5">
                                            {dayMemos.map(memo => (
                                                <div
                                                    key={memo.id}
                                                    onClick={() => onSelectMemo(memo)}
                                                    className="w-1.5 h-1.5 bg-red-500 rounded-full cursor-pointer"
                                                    title={memo.content}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* 날짜 번호 */}
                                <span className={`text-sm font-medium ${
                                    isToday
                                        ? 'text-blue-600 bg-blue-100 rounded-full w-6 h-6 flex items-center justify-center'
                                        : 'text-slate-700'
                                }`}>
                                    {dateNum}
                                </span>

                            </div>
                        );
                    })}
                </div>
            </div>
            {/* "종일" 이벤트 섹션 */}
            {allDayLayout.totalRows > 0 && (
                <div className="flex border-b border-gray-200">
                    <div className="w-16 flex-shrink-0 p-1 text-center text-xs text-slate-400 self-stretch"></div>
                    <div className="grid grid-cols-7 flex-1 relative border-l border-gray-200"
                         style={{minHeight: `${allDayLayout.totalRows * allDayEventHeight}px`}}>
                        {allDayLayout.positionedEvents.map(({event, startDayIndex, span, topIndex}) => (
                            <div
                                key={event.id}
                                onClick={() => onSelectEvent(event)}
                                className="absolute h-[22px] rounded p-1 text-xs text-white shadow overflow-hidden cursor-pointer"
                                style={{
                                    top: `${topIndex * allDayEventHeight + 1}px`,
                                    left: `calc(${(startDayIndex / 7) * 100}% + 1px)`,
                                    width: `calc(${(span / 7) * 100}% - 2px)`,
                                    backgroundColor: event.color || "#6366f1",
                                    zIndex: 10 + topIndex,
                                }}
                            >
                                <div className="font-medium truncate">{event.title}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <div className="flex">
                <div className="w-16 flex-shrink-0 flex flex-col text-xs text-slate-400">
                    {hours.map((h) => (
                        <div key={h} className="h-12 flex justify-end items-start pt-1 pr-2">
                            <span>
                                {h === 0 ? '12' : h > 12 ? h - 12 : h}
                                <span
                                    className="ml-0.5 text-[10px] border border-gray-200 rounded px-1 opacity-70 ">{h < 12 ? 'AM' : 'PM'}</span>
                            </span>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 flex-1 relative">
                    {days.map((_, dayIdx) => {
                        const currentDay = new Date(weekStartDate);
                        currentDay.setDate(weekStartDate.getDate() + dayIdx);
                        const dayStart = new Date(currentDay); dayStart.setHours(0, 0, 0, 0);
                        const dayEnd = new Date(currentDay); dayEnd.setHours(23, 59, 59, 999);

                        return (
                            <div key={dayIdx} className="relative border-l border-gray-200">
                                {hours.map((_, h) => (
                                    <div key={h} className="h-12 border-b border-gray-200" />
                                ))}

                                {dailyLayouts[dayIdx].eventsToRender.map(({ event, start, end, column, totalColumns }) => {
                                    const eventStart = new Date(start);
                                    const eventEnd = new Date(end);

                                    // 이벤트를 현재 날짜의 경계에 맞게 자름 (clamping)
                                    const displayStart = eventStart < dayStart ? dayStart : eventStart;
                                    const displayEnd = eventEnd > dayEnd ? dayEnd : eventEnd;

                                    const startHour = displayStart.getHours() + displayStart.getMinutes() / 60;
                                    let endHour = displayEnd.getHours() + displayEnd.getMinutes() / 60;

                                    // 이벤트가 자정(00:00)에 끝나면, 시각적으로는 24시까지 채워지도록 처리
                                    if (endHour === 0 && displayEnd.getTime() > displayStart.getTime()) {
                                        endHour = 24;
                                    }

                                    const top = startHour * hourSlotHeight;
                                    const height = Math.max((endHour - startHour) * hourSlotHeight, 20);

                                    if (height <= 0) return null; // 높이가 0 이하면 렌더링하지 않음

                                    const groupSize = Math.min(totalColumns, MAX_VISIBLE_EVENTS);
                                    const width = 100 / groupSize;
                                    const left = column * width;

                                    return (
                                    <div
                                        key={event.id}
                                        onClick={() => onSelectEvent(event)}
                                        className="absolute rounded p-1 text-xs text-white shadow overflow-hidden cursor-pointer"
                                        style={{
                                            top: `${top}px`,
                                            height: `${height}px`,
                                            left: `calc(${left}% + 2px)`,
                                            width: `calc(${width}% - 4px)`,
                                            backgroundColor: event.color || "#6366f1",
                                            zIndex: 10 + column,
                                        }}
                                    >
                                        <div className="font-medium truncate">{event.title}</div>
                                    </div>
                                );
                            })}

                            {dailyLayouts[dayIdx].moreButtons.map(button => (
                                <button
                                    key={button.id}
                                    onClick={() => onNavigateToDay(button.date)}
                                    className="absolute h-5 px-1 text-xs text-slate-600 font-semibold hover:underline z-20 text-left"
                                    style={{
                                        top: `${button.top}px`,
                                        left: '2px'
                                    }}
                                >
                                    +{button.count} more
                                </button>
                            ))}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

