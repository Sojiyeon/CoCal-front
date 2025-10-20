// src/components/modals/ProjectDescriptionModal.tsx
import React, { FC } from 'react';
import Modal from '../ui/Modal'; // 💡 뼈대 모달 컴포넌트 임포트

interface ProjectDescriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectName: string;
    description: string;
}

const ProjectDescriptionModal: FC<ProjectDescriptionModalProps> = ({
                                                                       isOpen,
                                                                       onClose,
                                                                       projectName,
                                                                       description,
                                                                   }) => {
    // 💡 뼈대 모달 컴포넌트 사용
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${projectName} - 프로젝트 설명`}
            maxWidth="max-w-md" // 너비를 'md'로 설정
        >
            {/* 모달 내용 (설명) */}
            <div className="max-h-80 overflow-y-auto text-gray-700 dark:text-dark-text-secondary">
                <p className="whitespace-pre-wrap leading-relaxed">{description || "작성된 설명이 없습니다."}</p>
            </div>
        </Modal>
    );
};

export default ProjectDescriptionModal;