// 일정/할일/메모 추가 모달창
// src/components/modals/CreateEventModal.tsx
/*
"use client";

import { useState } from 'react';
import BaseModal from './BaseModal';

export default function CreateEventModal({ isOpen, onClose, selectedDate }) {
    const [type, setType] = useState('schedule'); // 'schedule', 'todo', 'memo'
    const [content, setContent] = useState('');

    const handleSave = () => {
        // TODO: API로 일정/할일/메모 저장
        console.log(`선택 날짜: ${selectedDate}, 타입: ${type}, 내용: ${content}`);
        onClose();
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={`${selectedDate}에 추가하기`}>
    <div className="p-4">
    <div className="flex space-x-2 mb-4">
    <button onClick={() => setType('schedule')} className={`p-2 border rounded ${type === 'schedule' && 'bg-blue-500 text-white'}`}>일정</button>
    <button onClick={() => setType('todo')} className={`p-2 border rounded ${type === 'todo' && 'bg-blue-500 text-white'}`}>할일</button>
    <button onClick={() => setType('memo')} className={`p-2 border rounded ${type === 'memo' && 'bg-blue-500 text-white'}`}>메모</button>
    </div>
    <textarea
    value={content}
    onChange={(e) => setContent(e.target.value)}
    placeholder="내용을 입력하세요..."
    className="w-full p-2 border rounded h-32"
    />
    <button onClick={handleSave} className="mt-4 w-full bg-blue-500 text-white p-2 rounded">
        저장
        </button>
        </div>
        </BaseModal>
);
}
*/