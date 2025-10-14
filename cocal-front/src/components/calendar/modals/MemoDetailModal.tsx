// components/calendar/modals/MemoDetailModal.tsx

"use client";

import React, { useState, useEffect  }  from "react";
import { DateMemo } from "../types";
import { Pencil, Trash2 } from "lucide-react"; // 아이콘 추가

interface Props {
    memo: DateMemo;
    onClose: () => void;
    onEdit: (memo: DateMemo) => void;   // 수정 핸들러
    onDelete: (id: number) => void;     // 삭제 핸들러
}

export function MemoDetailModal({ memo, onClose, onEdit, onDelete }: Props) {

    const author = memo.author?.[0];
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(memo.content);
    const [editUrl, setEditUrl] = useState(memo.url || "");

    // 메모가 바뀔 때마다 수정창 내용 동기화
    useEffect(() => {
        setEditContent(memo.content);
        setEditUrl(memo.url || "");
    }, [memo]);

    const handleEditClick = () => setIsEditing(true);
    const handleSaveEdit = () => {
        const updatedMemo = { ...memo, content: editContent, url: editUrl };
        onEdit(updatedMemo);  // 부모에게 즉시 반영
        setIsEditing(false);
        //내부 상태도 즉시 반영
        setEditContent(editContent);
        setEditUrl(editUrl);
        setIsEditing(false);
    };

    const handleDeleteClick = () => {
        if (confirm("이 메모를 삭제하시겠습니까?")) {
            onDelete(memo.id);
            onClose();
        }
    };
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
            <div className="bg-white rounded-2xl shadow-lg w-[400px] p-6">
                {/* 상단 헤더 */}
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-2">
                        <h2 className="text-lg font-bold text-slate-800">메모 상세</h2>
                        {/* 작성일 표시 */}
                        <span className="text-xs text-slate-400">
                            {new Date(memo.createdAt).toLocaleDateString("ko-KR")}
                        </span>
                    </div>

                    {/* 수정 / 삭제 / 닫기 버튼 */}
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleEditClick}
                            className="text-slate-400 hover:text-blue-500"
                            title="수정"
                        >
                            <Pencil size={18} />
                        </button>
                        <button
                            onClick={handleDeleteClick}
                            className="text-slate-400 hover:text-red-500"
                            title="삭제"
                        >
                            <Trash2 size={18} />
                        </button>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 text-xl"
                            title="닫기"
                        >
                            ×
                        </button>
                    </div>
                </div>

                {/* 메모 내용 */}
                <div className="space-y-4 text-sm">
                    <div className="flex">
                        <span className="w-20 text-slate-500">작성자</span>
                        <span className="text-slate-800 font-medium">{author?.name || "알 수 없음"}</span>
                    </div>
                    {/* URL 표시 */}
                    <div className="flex items-start">
                        <span className="w-20 text-slate-500 pt-1">URL</span>
                        <div className="flex-1 text-slate-800 break-all">
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editUrl}
                                    onChange={(e) => setEditUrl(e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-400"
                                    placeholder="https://example.com"
                                />
                            ) : editUrl ? (
                                <a
                                    href={editUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                >
                                    {editUrl}
                                </a>
                            ) : (
                                <span className="text-slate-400">URL 없음</span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-start">
                        <span className="w-20 text-slate-500 pt-1">내용</span>
                        <div className="flex-1">
                            {isEditing ? (
                                <>
                                    <textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="w-full h-[120px] p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-400 text-slate-800"
                                    />
                                    <div className="flex justify-end space-x-2 mt-2">
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="px-3 py-1 text-sm rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300"
                                        >
                                            취소
                                        </button>
                                        <button
                                            onClick={handleSaveEdit}
                                            className="px-3 py-1 text-sm rounded-md bg-blue-500 text-white hover:bg-blue-600"
                                        >
                                            저장
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-slate-800 bg-slate-50 p-3 rounded-md min-h-[100px] whitespace-pre-wrap">
                                    {editContent }
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}