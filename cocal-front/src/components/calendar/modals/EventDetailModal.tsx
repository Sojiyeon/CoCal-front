"use client";

import React, { useState } from "react";
import { CalendarEvent } from "../types";

type ActiveTab = 'Event' | 'Memo';

interface Props {
    event: CalendarEvent;
    onClose: () => void;
    onEdit: (event: CalendarEvent) => void;
}

export function EventDetailModal({ event, onClose, onEdit }: Props) {
    const [activeTab, setActiveTab] = useState<ActiveTab>('Event');

    const TabButton = ({ tabName }: { tabName: ActiveTab }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-1.5 text-sm font-semibold rounded-full ${
                activeTab === tabName
                    ? "bg-slate-100 text-slate-800"
                    : "text-slate-500 hover:bg-slate-50"
            }`}
        >
            {tabName}
        </button>
    );

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const EventContent = () => (
        <div className="space-y-4 text-sm">
            <div className="flex items-center">
                <span className="w-24 text-slate-500">Time</span>
                <span className="text-slate-800 font-medium">{`${formatTime(event.startAt)} - ${formatTime(event.endAt)}`}</span>
            </div>
            <div className="flex items-center">
                <span className="w-24 text-slate-500">Team</span>
                <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-red-200 border-2 border-white"></div>
                    <div className="w-6 h-6 rounded-full bg-green-200 border-2 border-white"></div>
                    <div className="w-6 h-6 rounded-full bg-blue-200 border-2 border-white"></div>
                </div>
            </div>
            <div className="flex items-center">
                <span className="w-24 text-slate-500">Location</span>
                <span className="text-slate-800">{event.location || 'Not specified'}</span>
            </div>
            <div className="flex items-center"><span className="w-24 text-slate-500">Repeat</span><span>-</span></div>
            <div className="flex items-center"><span className="w-24 text-slate-500">Reminder</span><span>-</span></div>
            <div className="flex items-start"><span className="w-24 text-slate-500 pt-1">Memo</span><div className="flex-1 text-slate-800 bg-slate-50 p-2 rounded-md text-xs">메모 예시입니다.</div></div>
            <div className="flex items-center"><span className="w-24 text-slate-500">URL</span><a href="#" className="text-blue-600 truncate">naver.com</a></div>
        </div>
    );

    const MemoContent = () => (
        !event.memo || event.memo.length === 0
            ? <div className="text-sm text-slate-400 text-center py-8">작성된 메모가 없습니다.</div>
            : <div className="space-y-3">
                {event.memo.map(memo => (
                    <div key={memo.id} className="bg-slate-50 p-3 rounded-lg">
                        {/*<div className="font-semibold text-sm text-slate-800">{memo.title}</div>*/}
                        <div className="text-xs text-slate-600 mt-2">
                            {memo.content || '-'}
                        </div>
                    </div>
                ))}
            </div>
    );

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
            <div className="bg-white rounded-2xl shadow-lg w-[400px]">
                <div className="p-4 border-b">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className={`w-2.5 h-10 rounded-full`} style={{ backgroundColor: event.color }}></div>
                            <h2 className="text-xl font-bold text-slate-800">{event.title}</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => onEdit(event)} className="text-xs font-semibold text-slate-500 hover:text-slate-800">Edit</button>
                            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                        <TabButton tabName="Event" />
                        <TabButton tabName="Memo" />
                    </div>
                </div>
                <div className="p-4">
                    {activeTab === 'Event' ? <EventContent /> : <MemoContent />}
                </div>
            </div>
        </div>
    );
}