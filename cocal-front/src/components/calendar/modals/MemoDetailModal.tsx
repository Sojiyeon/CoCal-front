"use client";

import React, { useState, useEffect } from "react";
import { DateMemo } from "../types";
import { Pencil, Trash2 } from "lucide-react";
import { deleteMemo, updateMemo } from "@/api/memoApi";

// 상단 import들 아래쪽에 추가
const ChevronLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
         viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
         className="dark:text-slate-200">
        <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
);

const ChevronRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
         viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
         className="dark:text-slate-200">
        <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
);


interface Props {
    memos: DateMemo[];             // 여러 메모
    startIndex: number;            // 처음 보여줄 메모 인덱스
    projectId: number;
    onClose: () => void;
    onEdit: (memo: DateMemo) => void;
    onDelete: (id: number) => void;
}

export function MemoDetailModal({ memos, startIndex, projectId, onClose, onEdit, onDelete }: Props) {
    const [currentIndex, setCurrentIndex] = useState(startIndex);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const currentMemo = memos[currentIndex];
    const author = currentMemo.author?.[0];

    const [editTitle, setEditTitle] = useState(currentMemo.title || "");
    const [editContent, setEditContent] = useState(currentMemo.content || "");
    const [editDate, setEditDate] = useState(currentMemo.memoDate || "");
    const [editUrl, setEditUrl] = useState(currentMemo.url || "");

    // 메모 전환 시 수정창 초기화
    useEffect(() => {
        setIsEditing(false);
        setEditTitle(currentMemo.title || "");
        setEditContent(currentMemo.content || "");
        setEditUrl(currentMemo.url || "");
        setEditDate(currentMemo.memoDate || "");
    }, [currentMemo]);

    const handleSaveEdit = async () => {
        if (!currentMemo.id) return;
        try {
            setIsLoading(true);
            const updatedData = {
                title: editTitle,
                content: editContent,
                url: editUrl,
                memoDate: editDate
            };
            const updatedMemo = await updateMemo(projectId, currentMemo.id, updatedData);
            onEdit(updatedMemo);
            setIsEditing(false);
        } catch (err) {
            alert("Failed to edit edit memo");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteClick = async () => {
        if (!currentMemo.id) return;
        const confirmDelete = confirm("Are you sure you want to delete this note?");
        if (!confirmDelete) return;

        try {
            setIsLoading(true);
            await deleteMemo(projectId, currentMemo.id);
            onDelete(currentMemo.id);

            // 삭제 후 다음/이전 메모로 이동
            if (currentIndex > 0) {
                setCurrentIndex(currentIndex - 1);
            } else if (memos.length > 1 && currentIndex < memos.length - 1) {
                setCurrentIndex(0);
            } else {
                onClose();
            }
        } catch (err) {
            alert("Failed to delete memo");
        } finally {
            setIsLoading(false);
        }
    };

    const goToPrev = () => {
        if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
    };

    const goToNext = () => {
        if (currentIndex < memos.length - 1) setCurrentIndex(currentIndex + 1);
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
            <div className="bg-white rounded-2xl shadow-lg w-[400px] p-6 dark:bg-neutral-950">
                {/* 상단 헤더 */}
                <div className="flex justify-between items-center mb-4">
                    {/* 메모 제목 */}
                    {isEditing ? (
                        <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="flex-1 text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-300 dark:border-neutral-700 focus:outline-none focus:border-blue-400"
                            placeholder="Enter a title"
                        />
                    ) : (
                        <div className="flex items-center space-x-2">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                                {currentMemo.title || "Untitle"}
                            </h2>
                            <span className="text-xs text-slate-400">
                                {new Date(currentMemo.createdAt).toLocaleDateString("ko-KR")}
                            </span>
                        </div>
                    )}

                    <div className="flex items-center space-x-2">
                        <button onClick={() => setIsEditing(true)} className="text-slate-400 hover:text-blue-500 dark:hover:text-blue-400">
                            <Pencil size={18} />
                        </button>
                        <button onClick={handleDeleteClick} className="text-slate-400 hover:text-red-500" disabled={isLoading}>
                            <Trash2 size={18} />
                        </button>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">
                            ×
                        </button>
                    </div>
                </div>

                {/* 본문 */}
                <div className="space-y-4 text-sm pt-3">
                    <div className="flex">
                        <span className="w-20 text-slate-500 dark:text-slate-400">작성자</span>
                        <span className="text-slate-800 font-medium dark:text-slate-200">{author?.name || "Unknown user"}</span>
                    </div>

                    {/* 날짜 */}
                    <div className="flex items-start">
                        <span className="w-20 text-slate-500 pt-1 dark:text-slate-400">날짜</span>
                        <div className="flex-1">
                            {isEditing ? (
                                <input
                                    type="date"
                                    value={editDate}
                                    onChange={(e) => setEditDate(e.target.value)}
                                    className="border border-slate-300 rounded-md p-2 w-full focus:ring-2 focus:ring-blue-400 dark:text-slate-200 dark:border-neutral-700"
                                />
                            ) : (
                                <span className="text-slate-800 dark:text-slate-200">
                                    {currentMemo.memoDate || "No Date"}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* URL */}
                    <div className="flex items-start">
                        <span className="w-20 text-slate-500 dark:text-slate-400 pt-1">URL</span>
                        <div className="flex-1 text-slate-800 break-all dark:text-slate-200">
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editUrl}
                                    onChange={(e) => setEditUrl(e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-400 dark:text-slate-200 dark:border-neutral-700"
                                    placeholder="https://example.com"
                                />
                            ) : currentMemo.url ? (
                                <a href={currentMemo.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    {currentMemo.url}
                                </a>
                            ) : (
                                <span className="text-slate-400">No URL</span>
                            )}
                        </div>
                    </div>

                    {/* 내용 */}
                    <div className="flex items-start">
                        <span className="w-20 text-slate-500 dark:text-slate-400 pt-1">내용</span>
                        <div className="flex-1">
                            {isEditing ? (
                                <>
                                    <textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="w-full h-[120px] p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-400 text-slate-800 dark:border-neutral-700 dark:text-slate-200"
                                    />
                                    <div className="flex justify-end space-x-2 mt-2">
                                        <button onClick={() => setIsEditing(false)} className="px-3 py-1 text-sm rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300 dark:text-slate-200 dark:bg-neutral-800 dark:hover:bg-slate-500/50">
                                            Cancel
                                        </button>
                                        <button onClick={handleSaveEdit} className="px-3 py-1 text-sm rounded-md bg-blue-500 text-white hover:bg-blue-600">
                                            Save
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-slate-800 bg-slate-50 p-3 rounded-md min-h-[100px] whitespace-pre-wrap dark:bg-neutral-900 dark:text-slate-200">
                                    {currentMemo.content || "No content"}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 화살표 네비게이션 */}
                    { !isEditing && memos.length > 1 && (
                        <div className="flex justify-center items-center space-x-2">
                            <button
                                onClick={goToPrev}
                                disabled={currentIndex === 0}
                                className="p-1 rounded-full hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-100/10"
                            >
                                <ChevronLeftIcon />
                            </button>

                            <span className="text-xs font-mono dark:text-slate-200">{currentIndex + 1} / {memos.length}</span>

                            <button
                                onClick={goToNext}
                                disabled={currentIndex === memos.length - 1}
                                className="p-1 rounded-full hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-100/20"
                            >
                                <ChevronRightIcon />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
