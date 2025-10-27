// src/components/calendar/modals/TodoEditModal.tsx

"use client";

import React, { useState, useEffect } from "react";
import { SidebarTodo, CalendarEvent } from "../types";
import { ReminderPicker } from "../shared/ReminderPicker";
import { getReminderLabel } from "../utils/reminderUtils";
interface Props {
    onClose: () => void;
    onSave: (id: number, data: {
        title: string;
        description: string;
        visibility: 'PUBLIC' | 'PRIVATE';
        url: string;
        date?: string;
        offsetMinutes?: number | null;
        eventId?: number | null;
    }) => void;

    todoToEdit: SidebarTodo;
    onDelete: (projectId: number, todoId: number, eventId: number, type: 'EVENT' | 'PRIVATE') => void;
    projectId: number;
    events: CalendarEvent[];
}

// 상세 정보 행을 위한 헬퍼 컴포넌트 (EventDetailModal에서 가져옴)
const DetailRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex text-sm">
        <div className="w-28 text-slate-500 flex-shrink-0 font-semibold">{label}</div>
        <div className="text-slate-800 break-words min-w-0">{children}</div>
    </div>
);

export function TodoEditModal({ onClose, onSave, onDelete, todoToEdit, projectId,events = [] }: Props) {
    // --- 🔽 [STEP 1] 모드 전환을 위한 상태 추가 🔽 ---
    const [isEditing, setIsEditing] = useState(false);

    // 수정 폼을 위한 상태는 그대로 유지
    const [isLoading, setIsLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PRIVATE');
    const [date, setDate] = useState("");
    const [offsetMinutes, setOffsetMinutes] = useState<number | null>(null);
    const [url, setUrl] = useState("");
    const [selectedEventId, setSelectedEventId] = useState<number | undefined>(undefined);
    const EditIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
    );
    const TrashIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18"></path>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
    );
    useEffect(() => {
        if (todoToEdit) {
            setTitle(todoToEdit.title);
            setDescription(todoToEdit.description || "");
            setVisibility(todoToEdit.type === 'EVENT' ? 'PUBLIC' : 'PRIVATE');
            setUrl(todoToEdit.url || "");
            setSelectedEventId(todoToEdit.eventId);
            // --- 👇 4. 상태 초기화 로직 추가 ---
            // datetime-local input은 'YYYY-MM-DDTHH:mm' 형식을 기대하므로 변환해줍니다.
            if (todoToEdit.date) {
                const initialDate = new Date(todoToEdit.date);
                // 'datetime-local' input은 'YYYY-MM-DDTHH:mm' 형식을 사용합니다.
                const formattedDateTime = new Date(initialDate.getTime() - (initialDate.getTimezoneOffset() * 60000))
                    .toISOString()
                    .slice(0, 16); // 10 -> 16으로 변경
                setDate(formattedDateTime);
            }
            setOffsetMinutes(todoToEdit.offsetMinutes ?? null);
        }
    }, [todoToEdit]);

    const handleSave = () => {
        if (title.trim() === '') {
            alert('Title cannot be empty.');
            return;
        }

        // Public일 때 eventId가 선택되었는지 확인
        if (visibility === 'PUBLIC' && (selectedEventId === undefined || selectedEventId === null)) {
            alert('Please select a parent event for the public todo.');
            return; // 저장 중단
        }
        setIsLoading(true);
        onSave(todoToEdit.id, {
            title: title.trim(),
            description: description.trim(),
            visibility: visibility,
            url: url.trim(),
            // Private일 때만 날짜와 리마인더 정보를 전달
            date: visibility === 'PRIVATE' ? date : undefined,
            offsetMinutes: visibility === 'PRIVATE' ? offsetMinutes : null,
            // Public일 때만 eventId를 전달
            eventId: visibility === 'PUBLIC' ? selectedEventId : null,
        });
        setIsLoading(false);
        onClose();
    };

    const handleDelete = () => {
        if (window.confirm("정말 삭제하시겠습니까?")) {
            // 인자 순서를 (projectId, todoId, eventId, type)으로 정확하게 전달합니다.
            onDelete(projectId, todoToEdit.id, todoToEdit.eventId, todoToEdit.type);
            onClose();
        }
    }
    // --- 🔽 [STEP 2] 렌더링할 JSX를 isEditing 상태에 따라 분기 🔽 ---
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
                {/* --- 헤더 --- */}
                <div className="p-4 border-b flex justify-between items-start">

                    {/* [유지] 왼쪽 상단: 타이틀 및 카테고리 */}
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-10 rounded-full"
                             style={{backgroundColor: todoToEdit.parentEventColor}}></div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">
                                {isEditing ? "Edit To-do" : todoToEdit.title}
                            </h2>
                            {/* 상세 보기 모드일 때만 카테고리 표시 */}
                            {!isEditing && (
                                <p className="text-xs text-slate-500">{todoToEdit.parentEventTitle}</p>
                            )}
                        </div>
                    </div>

                    {/* 오른쪽 상단: 아이콘 버튼 (Edit, Delete, Close) */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {/* 상세 보기 모드일 때만 'Edit' 아이콘 표시 */}
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-1 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors duration-150"
                                aria-label="Edit To-do"
                            >
                                <EditIcon/>
                            </button>
                        )}

                        {/* 상세 보기 모드일 때만 'Delete' 아이콘 표시 */}
                        {!isEditing && (
                            <button
                                onClick={handleDelete}
                                className="p-1 rounded-md text-slate-500 hover:bg-slate-100 hover:text-red-600 transition-colors duration-150"
                                aria-label="Delete To-do"
                            >
                                <TrashIcon/>
                            </button>
                        )}

                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
                    </div>
                </div>
                {/* --- 컨텐츠 (상세 정보 또는 수정 폼) --- */}
                <div className="p-6 space-y-4">
                    {isEditing ? (
                        /* --- 수정 모드 UI (기존 폼) --- */
                        <>
                            <input
                                type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="To-do Title"
                            />
                            <textarea
                                value={description} onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Description..."
                            />
                            <div>
                                <label className="text-sm font-medium text-slate-600">Visibility</label>
                                <div className="flex gap-4 mt-2">
                                    <label className="flex items-center gap-2 cursor-default">
                                        <input
                                            type="radio"
                                            name="visibility"
                                            value="PUBLIC"
                                            checked={visibility === "PUBLIC"}
                                            disabled
                                            className="form-radio h-4 w-4 text-blue-600 cursor-not-allowed"
                                        />
                                        <span className="text-sm text-gray-500">Public</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-default">
                                        <input
                                            type="radio"
                                            name="visibility"
                                            value="PRIVATE"
                                            checked={visibility === "PRIVATE"}
                                            disabled
                                            className="form-radio h-4 w-4 text-blue-600 cursor-not-allowed"
                                        />
                                        <span className="text-sm text-gray-500">Private</span>
                                    </label>
                                </div>
                            </div>
                            {visibility === 'PUBLIC' ? (
                                // Public (Event) Todo일 때: Category 드롭다운
                                <div className="space-y-2 pt-2">
                                    <label htmlFor="parentEvent" className="text-sm font-medium text-slate-600">
                                        Category (Event)
                                    </label>
                                    <select
                                        id="parentEvent"
                                        name="eventId"
                                        value={selectedEventId ?? ''} // state 사용
                                        onChange={(e) =>
                                            setSelectedEventId(e.target.value ? Number(e.target.value) : undefined) // state 업데이트
                                        }
                                        className="w-full mt-2 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="">-- Select an event --</option>
                                        {events
                                            .filter(event => !event.title.startsWith('Todo:')) // EventModal 참고
                                            .map(event => (
                                                <option key={event.id} value={event.id}>
                                                    {event.title}
                                                </option>
                                            ))}
                                    </select>
                                    <p className="text-xs text-slate-500">
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4 pt-2">
                                    <input
                                        type="datetime-local"
                                        name="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    <ReminderPicker
                                        value={offsetMinutes}
                                        onChange={(val) => setOffsetMinutes(val === null ? null : Number(val))}
                                        label="Reminder"
                                    />
                                </div>
                            )}

                            <div className="relative">
                                <input
                                    type="text" name="url" placeholder="Add URL..." value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    className="w-full border rounded-md pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">🔗</span>
                            </div>
                        </>
                    ) : (
                        /* --- 상세 보기 모드 UI --- */
                        <>

                            <DetailRow label="Title">{todoToEdit.title}</DetailRow>
                            <DetailRow label="Description">{todoToEdit.description ||
                                <span className="text-slate-400">No description</span>}</DetailRow>
                            {todoToEdit.type === 'EVENT' ? (
                                // Public Todo일 경우 Category 표시
                                <DetailRow label="Category">{todoToEdit.parentEventTitle}</DetailRow>
                            ) : (
                                // Private Todo일 경우 Date와 Reminder 표시
                                <>
                                    <DetailRow label="Date">
                                        {todoToEdit.date
                                            ? new Date(todoToEdit.date).toLocaleString('ko-KR', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: 'numeric', // 시간 추가 (예: '오후 3시')
                                                minute: '2-digit', // 분 추가 (예: '05분')
                                                hour12: true // 12시간제로 표시 (true가 기본값이지만 명시)

                                            })
                                            : <span className="text-slate-400">No URL</span>
                                        }
                                    </DetailRow>
                                    <DetailRow label="Reminder">
                                        {getReminderLabel(todoToEdit.offsetMinutes ?? null)}
                                    </DetailRow>
                                </>
                            )}

                            <DetailRow
                                label="Visibility">{todoToEdit.type === 'EVENT' ? 'Public' : 'Private'}</DetailRow>
                            <DetailRow label="URL">
                                {todoToEdit.url ? (
                                    <a href={todoToEdit.url} target="_blank" rel="noopener noreferrer"
                                       className="text-blue-600 hover:underline truncate">
                                        {todoToEdit.url}
                                    </a>
                                ) : (
                                    <span className="text-slate-400">No URL</span>
                                )}
                            </DetailRow>
                        </>
                    )}
                </div>

                {/* --- 푸터 (버튼) --- */}
                <div className="p-4 bg-slate-50 rounded-b-xl flex justify-end items-center gap-4">
                    {/* 삭제 버튼은 헤더로 옮겨졌으므로 여기서는 제거 */}
                    {/* 수정 모드일 때만 'Save' 버튼 표시 */}
                    {isEditing && (
                        <button
                            onClick={handleSave} disabled={isLoading}
                            className="px-6 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-900"
                        >
                            {isLoading ? "Saving..." : "Save"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}