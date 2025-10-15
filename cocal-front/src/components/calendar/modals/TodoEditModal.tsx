"use client";

import React, { useState, useEffect } from "react";
import { SidebarTodo } from "../types";

interface Props {
    onClose: () => void;
    onSave: (id: number, data: { title: string; description: string; visibility: 'PUBLIC' | 'PRIVATE'; url: string; }) => void;
    onDelete: (id: number, type: 'EVENT' | 'PRIVATE') => void;
    todoToEdit: SidebarTodo;
}

export function TodoEditModal({ onClose, onSave, onDelete, todoToEdit }: Props) {
    const [isLoading, setIsLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PRIVATE');
    const [url, setUrl] = useState("");


    useEffect(() => {
        if (todoToEdit) {
            setTitle(todoToEdit.title);
            setDescription(todoToEdit.description || "");
            // 'EVENT' 타입은 'PUBLIC'으로, 'PRIVATE' 타입은 'PRIVATE'으로 매핑합니다.
            setVisibility(todoToEdit.type === 'EVENT' ? 'PUBLIC' : 'PRIVATE');
            // 'url' 필드가 없을 수도 있으므로 안전하게 처리합니다.
            setUrl(todoToEdit.url || "");
        }
    }, [todoToEdit]);

    const handleSave = () => {
        if (title.trim() === '') {
            alert('Title cannot be empty.');
            return;
        }
        setIsLoading(true);
        // onSave 콜백에 모든 수정된 데이터를 객체 형태로  전달합니다.
        onSave(todoToEdit.id, {
            title: title.trim(),
            description: description.trim(),
            visibility: visibility,
            url: url.trim()
        });
        setIsLoading(false);
        onClose();
    };

    const handleDelete = () => {

        const idToDelete = todoToEdit.type === 'PRIVATE' ? todoToEdit.id : todoToEdit.eventId;
        onDelete(idToDelete, todoToEdit.type);
        onClose();
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-[500px]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-slate-800">Edit To-do</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
                </div>

                <div className="space-y-4">
                    {/* Title Input */}
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="To-do Title"
                    />
                    {/* Description Textarea */}
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Description..."
                    />

                    {/* Visibility Radio Buttons */}
                    <div>
                        <label className="text-sm font-medium text-slate-600">Visibility</label>
                        <div className="flex gap-4 mt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio" name="visibility" value="PUBLIC"
                                    checked={visibility === "PUBLIC"}
                                    onChange={() => setVisibility("PUBLIC")}
                                    className="form-radio h-4 w-4 text-blue-600"
                                />
                                <span className="text-sm">Public</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio" name="visibility" value="PRIVATE"
                                    checked={visibility === "PRIVATE"}
                                    onChange={() => setVisibility("PRIVATE")}
                                    className="form-radio h-4 w-4 text-blue-600"
                                />
                                <span className="text-sm">Private</span>
                            </label>
                        </div>
                    </div>

                    {/* URL Input */}
                    <div className="relative">
                        <input
                            type="text"
                            name="url"
                            placeholder="Add URL..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="w-full border rounded-md pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                           🔗
                        </span>
                    </div>

                </div>

                <div className="mt-6 flex justify-between items-center gap-4">
                    <button onClick={handleDelete} className="text-sm text-red-600 hover:underline">
                        Delete
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-6 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-900"
                    >
                        {isLoading ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
}
