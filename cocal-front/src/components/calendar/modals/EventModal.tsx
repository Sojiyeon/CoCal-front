"use client";

import React, { useState } from "react";
// 추가된 타입을 import 합니다.
import { CalendarEvent, PrivateTodo, DateMemo } from "../types";

type ActiveTab = 'Event' | 'Todo' | 'Memo';

interface Props {
    onClose: () => void;
    // 수정을 위해 각 타입의 데이터를 받을 수 있도록 props 확장
    event?: CalendarEvent | null;
    todo?: PrivateTodo | null;
    memo?: DateMemo | null;
}

// CalendarEvent 타입의 필드를 폼 데이터로 변환합니다.
const eventToFormData = (event: CalendarEvent | null) => {
    if (!event) { // 새 이벤트 생성 시 기본값
        const now = new Date();
        const start = now.toISOString().substring(0, 16);
        now.setHours(now.getHours() + 1);
        const end = now.toISOString().substring(0, 16);
        return { title: "", location: "", start_at: start, end_at: end, visibility: 'PUBLIC' as 'PUBLIC' | 'PRIVATE', color: "#6366f1", description: "" };
    }
    // 기존 이벤트 수정 시
    return { title: event.title, location: event.location || "", start_at: event.start_at.substring(0, 16), end_at: event.end_at.substring(0, 16), visibility: event.visibility, color: event.color, description: event.description || "" };
};

// 할일 탭 데이터의 기본 형태
const initialTodoFormData = {
    title: "",
    description: "",
    url: "",
    category: "Project 1", // 예시값
};

// Memo 데이터의 기본 형태
const initialMemoFormData = {
    title: "",
    memo_date: new Date().toISOString().split('T')[0], // 오늘 날짜 (YYYY-MM-DD)
    url: "",
    content: ""
};

export function EventModal({ onClose, event = null, todo = null, memo = null }: Props) {
    const [activeTab, setActiveTab] = useState<ActiveTab>('Event');
    const [isLoading, setIsLoading] = useState(false);

    // 각 탭의 폼 데이터를 별도의 상태로 분리하여 관리
    const [eventFormData, setEventFormData] = useState(eventToFormData(event));
    const [todoFormData, setTodoFormData] = useState(initialTodoFormData);
    const [memoFormData, setMemoFormData] = useState(initialMemoFormData);

    // 입력 필드 변경 핸들러 (활성 탭에 따라 다른 상태 업데이트)
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (activeTab === 'Event') {
            setEventFormData(prev => ({ ...prev, [name]: value }));
        } else if (activeTab === 'Todo') {
            setTodoFormData(prev => ({ ...prev, [name]: value }));
        } else if (activeTab === 'Memo') {
            setMemoFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleVisibilityChange = (visibility: 'PUBLIC' | 'PRIVATE') => {
        setEventFormData(prev => ({ ...prev, visibility }));
    };

    const handleSave = () => {
        setIsLoading(true);
        let dataToSave;
        if (activeTab === 'Event') {
            dataToSave = eventFormData;
            // [API-연동] if (event) { PATCH /api/events/{event.id} } else { POST /api/events }
        } else if (activeTab === 'Todo') {
            dataToSave = todoFormData;
            // [API-연동] POST /api/private_todos
        } else { // Memo
            dataToSave = memoFormData;
            // [API-연동] POST /api/date_memos
        }

        console.log(`Saving ${activeTab}:`, dataToSave);
        setTimeout(() => {
            alert(`${activeTab} has been saved.`);
            setIsLoading(false);
            onClose();
        }, 1000);
    };

    const handleDelete = () => {
        if (confirm("Are you sure you want to delete this?")) {
            setIsLoading(true);
            // [API-연동] 활성 탭에 따라 다른 삭제 API 호출
            console.log(`Deleting ${activeTab}:`, event?.id || todo?.id || memo?.id);
            setTimeout(() => {
                alert("Item has been deleted.");
                setIsLoading(false);
                onClose();
            }, 1000);
        }
    };

    const TabButton = ({ tabName }: { tabName: ActiveTab }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-3 py-1 text-xs font-semibold rounded ${
                activeTab === tabName
                    ? "bg-slate-200 text-slate-800"
                    : "bg-white text-slate-500 hover:bg-slate-100"
            }`}
        >
            {tabName}
        </button>
    );

    const renderForm = () => {
        switch (activeTab) {
            case 'Event':
                return (
                    <div className="space-y-4">
                        <input type="text" name="title" placeholder="Event Title" value={eventFormData.title} onChange={handleInputChange} className="w-full text-lg font-semibold border-b pb-1 focus:outline-none focus:border-blue-500" />
                        <input type="text" name="location" placeholder="Location or Description" value={eventFormData.location} onChange={handleInputChange} className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        <div className="flex gap-2 items-center">
                            <input type="datetime-local" name="start_at" value={eventFormData.start_at} onChange={handleInputChange} className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                            <span>-</span>
                            <input type="datetime-local" name="end_at" value={eventFormData.end_at} onChange={handleInputChange} className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </div>
                        <div className="w-full border rounded-md px-3 py-2 text-sm text-slate-400 flex justify-between items-center"><span>Repeat</span> <span>&gt;</span></div>
                        <div className="w-full border rounded-md px-3 py-2 text-sm text-slate-400 flex justify-between items-center"><span>Reminder</span> <span>15min ago</span></div>
                        <div>
                            <label className="text-sm font-medium text-slate-600">Visibility</label>
                            <div className="flex gap-4 mt-2">
                                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="visibility" value="PUBLIC" checked={eventFormData.visibility === 'PUBLIC'} onChange={() => handleVisibilityChange('PUBLIC')} className="form-radio h-4 w-4 text-blue-600"/><span className="text-sm">Public</span></label>
                                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="visibility" value="PRIVATE" checked={eventFormData.visibility === 'PRIVATE'} onChange={() => handleVisibilityChange('PRIVATE')} className="form-radio h-4 w-4 text-blue-600"/><span className="text-sm">Private</span></label>
                            </div>
                        </div>
                        <div className="w-full border rounded-md px-3 py-2 text-sm text-slate-400">Invitees</div>
                        <div className="w-full border rounded-md px-3 py-2 text-sm flex items-center gap-2"><div className="w-5 h-5 rounded-full" style={{backgroundColor: eventFormData.color}}></div><span>Color</span></div>
                    </div>
                );
            case 'Todo':
                return (
                    <div className="space-y-4">
                        <input type="text" name="title" placeholder="Title" value={todoFormData.title} onChange={handleInputChange} className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        <textarea name="description" placeholder="Description..." value={todoFormData.description} onChange={handleInputChange} className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" rows={3} />
                        <div className="w-full border rounded-md px-3 py-2 text-sm text-slate-400 flex justify-between items-center"><span>Category</span> <span>{todoFormData.category}</span></div>
                        <div className="w-full border rounded-md px-3 py-2 text-sm text-slate-400 flex justify-between items-center"><span>Repeat</span> <span>&gt;</span></div>
                        <div className="w-full border rounded-md px-3 py-2 text-sm text-slate-400 flex justify-between items-center"><span>Reminder</span> <span>🔔</span></div>
                        <div className="relative"><input type="text" name="url" placeholder="Add URL..." value={todoFormData.url} onChange={handleInputChange} className="w-full border rounded-md pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" /><span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">🔗</span></div>
                    </div>
                );
            case 'Memo':
                return (
                    <div className="space-y-4">
                        <div className="flex gap-2 items-center">
                            <input
                                type="text" name="title" placeholder="Title"
                                value={memoFormData.title} onChange={handleInputChange}
                                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <input
                                type="date" name="memo_date"
                                value={memoFormData.memo_date} onChange={handleInputChange}
                                className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <div className="relative">
                            <input
                                type="text" name="url" placeholder="URL"
                                value={memoFormData.url} onChange={handleInputChange}
                                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <button className="absolute right-2 top-1/2 -translate-y-1/2 text-lg font-bold">+</button>
                        </div>
                        <textarea
                            name="content" placeholder="Write your memo here..."
                            value={memoFormData.content} onChange={handleInputChange}
                            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            rows={6}
                        />
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-[500px]">
                {/* 헤더 */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-slate-800">Add</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
                </div>

                {/* 탭 버튼 */}
                <div className="flex items-center gap-2 mb-6 border-b pb-2">
                    <TabButton tabName="Event" />
                    <TabButton tabName="Todo" />
                    <TabButton tabName="Memo" />
                </div>

                {/* 폼 영역 */}
                <div>{renderForm()}</div>

                {/* 푸터: 저장 및 삭제 버튼 */}
                <div className="mt-6 flex items-center gap-2">
                    <button
                        onClick={handleSave} disabled={isLoading}
                        className="flex-1 px-6 py-2.5 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-900 disabled:bg-slate-400"
                    >
                        {isLoading ? 'Saving...' : 'Save'}
                    </button>
                    {/* 수정 모드일 때만 삭제 버튼 표시 (모든 탭에서 공유 가능) */}
                    {(event || todo || memo) && (
                        <button
                            onClick={handleDelete} disabled={isLoading}
                            className="px-6 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:bg-red-300"
                        >
                            Delete
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

