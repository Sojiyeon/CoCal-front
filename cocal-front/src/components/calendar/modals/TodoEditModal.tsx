// src/components/calendar/modals/TodoEditModal.tsx

"use client";

import React, { useState, useEffect } from "react";
import { SidebarTodo } from "../types";
import { ReminderPicker } from "../shared/ReminderPicker";
import { getReminderLabel } from "../utils/reminderUtils";
interface Props {
    onClose: () => void;
    onSave: (id: number, data: { title: string; description: string; visibility: 'PUBLIC' | 'PRIVATE'; url: string; date?: string; offsetMinutes?: number | null; }) => void;
    onDelete: (projectId:number, todoId: number, eventId:number,  type: 'EVENT' | 'PRIVATE') => void;
    todoToEdit: SidebarTodo;
    projectId: number;
}

// 상세 정보 행을 위한 헬퍼 컴포넌트 (EventDetailModal에서 가져옴)
const DetailRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex text-sm">
        <div className="w-28 text-slate-500 flex-shrink-0 font-semibold">{label}</div>
        <div className="text-slate-800 break-words min-w-0">{children}</div>
    </div>
);

export function TodoEditModal({ onClose, onSave, onDelete, todoToEdit, projectId }: Props) {
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

    useEffect(() => {
        if (todoToEdit) {
            setTitle(todoToEdit.title);
            setDescription(todoToEdit.description || "");
            setVisibility(todoToEdit.type === 'EVENT' ? 'PUBLIC' : 'PRIVATE');
            setUrl(todoToEdit.url || "");

            // --- 👇 4. 상태 초기화 로직 추가 ---
            // datetime-local input은 'YYYY-MM-DDTHH:mm' 형식을 기대하므로 변환해줍니다.
            if (todoToEdit.date) {
                const initialDate = new Date(todoToEdit.date);
                const formattedDate = new Date(initialDate.getTime() - (initialDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
                setDate(formattedDate);
            }
            setOffsetMinutes(todoToEdit.offsetMinutes ?? null);
        }
    }, [todoToEdit]);

    const handleSave = () => {
        if (title.trim() === '') {
            alert('Title cannot be empty.');
            return;
        }
        setIsLoading(true);
        onSave(todoToEdit.id, {
            title: title.trim(),
            description: description.trim(),
            visibility: visibility,
            url: url.trim(),
            date: date,
            offsetMinutes: offsetMinutes,
        });
        setIsLoading(false);
        onClose();
    };

    const handleDelete = () => {
        // Public Todo는 부모 이벤트가 있을 수 있으므로, Todo 자체의 ID로 삭제를 요청해야 합니다.
        // Private Todo는 ID가 고유하므로 그대로 사용합니다.
        onDelete(projectId, todoToEdit.eventId, todoToEdit.id, todoToEdit.type);
        onClose();
    }

    // --- 🔽 [STEP 2] 렌더링할 JSX를 isEditing 상태에 따라 분기 🔽 ---
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
                {/* --- 헤더 --- */}
                <div className="p-4 border-b flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-10 rounded-full" style={{backgroundColor: todoToEdit.parentEventColor}}></div>
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
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {/* 상세 보기 모드일 때만 'Edit' 버튼 표시 */}
                        {!isEditing && (
                            <button onClick={() => setIsEditing(true)} className="text-xs font-semibold text-slate-500 hover:text-slate-800">
                                Edit
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
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio" name="visibility" value="PUBLIC" checked={visibility === "PUBLIC"}
                                            onChange={() => setVisibility("PUBLIC")} className="form-radio h-4 w-4 text-blue-600"
                                        />
                                        <span className="text-sm">Public</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio" name="visibility" value="PRIVATE" checked={visibility === "PRIVATE"}
                                            onChange={() => setVisibility("PRIVATE")} className="form-radio h-4 w-4 text-blue-600"
                                        />
                                        <span className="text-sm">Private</span>
                                    </label>
                                </div>
                            </div>
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
                            <DetailRow label="Description">{todoToEdit.description || <span className="text-slate-400">No description</span>}</DetailRow>
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

                                            })
                                            : <span className="text-slate-400">Not set</span>
                                        }
                                    </DetailRow>
                                    <DetailRow label="Reminder">
                                        {getReminderLabel(todoToEdit.offsetMinutes ?? null)}
                                    </DetailRow>
                                </>
                            )}

                            <DetailRow label="Visibility">{todoToEdit.type === 'EVENT' ? 'Public' : 'Private'}</DetailRow>
                            <DetailRow label="URL">
                                {todoToEdit.url ? (
                                    <a href={todoToEdit.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                                        {todoToEdit.url}
                                    </a>
                                ) : (
                                    <span className="text-slate-400">Not set</span>
                                )}
                            </DetailRow>
                        </>
                    )}
                </div>

                {/* --- 푸터 (버튼) --- */}
                <div className="p-4 bg-slate-50 rounded-b-xl flex justify-end items-center gap-4">
                    <button onClick={handleDelete} className="text-sm text-red-600 hover:underline">
                        Delete
                    </button>
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