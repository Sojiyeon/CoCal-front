// 프로젝트 선택 화면
// src/app/(main)/projects/page.tsx
/*
"use client";

import { useState } from 'react';
import useModal from '@/hooks/useModal';
import CreateProjectModal from '@/components/modals/CreateProjectModal';

export default function ProjectsPage() {
    const [projects, setProjects] = useState([]); // TODO: API로 프로젝트 목록 가져오기
    const { isModalOpen, openModal, closeModal } = useModal();

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">프로젝트 선택</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                    // TODO: 프로젝트 목록 UI
                ))}
            </div>
            <button onClick={openModal} className="mt-6 bg-green-500 text-white p-2 rounded">
                새 프로젝트 생성
            </button>
            <CreateProjectModal isOpen={isModalOpen} onClose={closeModal} />
        </div>
    );
}
*/