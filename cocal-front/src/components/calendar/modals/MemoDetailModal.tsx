// components/calendar/modals/MemoDetailModal.tsx

"use client";

import React from "react";
import { DateMemo } from "../types"; // types.ts에서 DateMemo 타입을 가져옵니다.

interface Props {
    memo: DateMemo;
    onClose: () => void;
}

export function MemoDetailModal({ memo, onClose }: Props) {
    // author 배열의 첫 번째 사용자를 작성자로 간주합니다.
    const author = memo.author?.[0];

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
            <div className="bg-white rounded-2xl shadow-lg w-[400px] p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-slate-800">메모 상세</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
                </div>

                <div className="space-y-4 text-sm">
                    <div className="flex">
                        <span className="w-20 text-slate-500">작성자</span>
                        <span className="text-slate-800 font-medium">{author?.name || '알 수 없음'}</span>
                    </div>
                    <div className="flex">
                        <span className="w-20 text-slate-500">작성일</span>
                        <span className="text-slate-800">{new Date(memo.createdAt).toLocaleDateString('ko-KR')}</span>
                    </div>
                    <div className="flex items-start">
                        <span className="w-20 text-slate-500 pt-1">내용</span>
                        <div className="flex-1 text-slate-800 bg-slate-50 p-3 rounded-md min-h-[100px]">
                            {memo.content}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}