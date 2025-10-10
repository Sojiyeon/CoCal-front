"use client";

import React, { useState } from "react";
import { CalendarEvent } from "../types";

type ActiveTab = 'Event' | 'To do';

interface Props {
    event: CalendarEvent;
    onClose: () => void;
    onToggleTodo: (todoId: number) => void;
    // [추가] 수정을 시작하기 위해 부모에게 알리는 함수를 props로 받습니다.
    onEdit: (event: CalendarEvent) => void;
}

export function EventDetailModal({ event, onClose, onToggleTodo, onEdit }: Props) {
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

    const TodoContent = () => (
        !event.todos || event.todos.length === 0
            ? <div className="text-sm text-slate-400 text-center py-8">No associated to-dos.</div>
            : <div className="space-y-4">
                {event.todos.map(todo => (
                    <div key={todo.id} className={`bg-slate-50 p-3 rounded-lg ${todo.status === 'DONE' ? 'opacity-60' : ''}`}>
                        <div className="flex justify-between items-center">
                            <span className={`font-semibold text-sm ${todo.status === 'DONE' ? 'line-through text-slate-500' : ''}`}>{todo.title}</span>
                            <input
                                type="checkbox"
                                className="form-checkbox h-4 w-4 text-blue-600 rounded cursor-pointer"
                                checked={todo.status === 'DONE'}
                                onChange={() => onToggleTodo(todo.id)}
                            />
                        </div>
                        <div className="text-xs text-slate-400 mt-2 space-y-1">
                            <div><span className="font-medium">Memo:</span> {todo.description || '-'}</div>
                            {/*<div><span className="font-medium">Category:</span> {projectName || '-'}</div>*/}
                            <div><span className="font-medium">Category:</span> {event.title || '-'}</div>
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
                            <div className={`w-2.5 h-10 rounded-full ${!event.color.startsWith('bg-') ? '' : event.color}`} style={{ backgroundColor: event.color.startsWith('bg-') ? undefined : event.color }}></div>
                            <h2 className="text-xl font-bold text-slate-800">{event.title}</h2>
                        </div>
                        {/* [추가] 수정 버튼을 추가합니다. */}
                        <div className="flex items-center gap-2">
                            <button onClick={() => onEdit(event)} className="text-xs font-semibold text-slate-500 hover:text-slate-800">Edit</button>
                            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                        <TabButton tabName="Event" />
                        <TabButton tabName="To do" />
                    </div>
                </div>
                <div className="p-4">
                    {activeTab === 'Event' ? <EventContent /> : <TodoContent />}
                </div>
            </div>
        </div>
    );
}

