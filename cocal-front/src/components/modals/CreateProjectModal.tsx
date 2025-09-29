// 프로젝트 생성 모달창
// src/components/modals/CreateProjectModal.tsx
/*
"use client";


import { useState } from 'react';
import BaseModal from './BaseModal';

export default function CreateProjectModal({ isOpen, onClose }) {
    const [projectName, setProjectName] = useState('');

    const handleCreate = () => {
        // TODO: API로 프로젝트 생성 요청
        console.log(`프로젝트 생성: ${projectName}`);
        onClose();
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title="새 프로젝트 생성">
            <div className="p-4">
                <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="프로젝트 이름"
                    className="w-full p-2 border rounded"
                />
                <button onClick={handleCreate} className="mt-4 w-full bg-blue-500 text-white p-2 rounded">
                    생성
                </button>
            </div>
        </BaseModal>
    );
}
*/