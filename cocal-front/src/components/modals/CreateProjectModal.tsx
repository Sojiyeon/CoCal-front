// 프로젝트 생성 모달창
"use client";

import React, { FC, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

// 프로젝트 생성 데이터 타입 정의
export interface ProjectFormData {
    name: string;
    description: string;
    startDate: string;
    endDate: string;
}

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    userName: string;
    onCreateProject: (data: ProjectFormData) => Promise<void>;
}

const CreateProjectModal: FC<CreateProjectModalProps> = ({ isOpen, onClose, userName, onCreateProject }) => {
    const [formData, setFormData] = useState<ProjectFormData>({
        name: '',
        description: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.startDate || !formData.endDate) {
            console.error('All fields are required.');
            return;
        }
        await onCreateProject(formData);
        onClose();
        setFormData({ name: '', description: '', startDate: new Date().toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0] }); // 폼 초기화
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Project">
            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Project Name */}
                <div>
                    <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                    <input
                        type="text"
                        id="projectName"
                        name="name"
                        placeholder="Design mockup for project"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150"
                        required
                    />
                </div>
                {/* Project Description */}
                <div>
                    <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                    <textarea
                        id="projectDescription"
                        name="description"
                        placeholder="프로젝트의 목표, 주요 요구사항 등을 간략하게 설명해 주세요."
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 resize-y"
                    />
                </div>
                {/* Client Name */}
                <div>
                    <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">Project Creator</label>
                    <input
                        type="text"
                        id="clientName"
                        name="client"
                        value={userName} // 상위 컴포넌트에서 받은 사용자 이름 사용
                        readOnly
                        className="w-full px-4 py-3 border border-gray-300 bg-gray-50 rounded-lg text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">This project will be created under your name.</p>
                </div>
                {/* Start Date / End Date */}
                <div className="flex space-x-4">
                    <div className="flex-1">
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                            type="date"
                            id="startDate"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150"
                            required
                        />
                    </div>
                    <div className="flex-1">
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                            type="date"
                            id="endDate"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150"
                            required
                        />
                    </div>
                </div>
                {/* Create Button */}
                <div className="flex justify-center pt-4">
                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full max-w-xs px-8 py-3"
                    >
                        Create
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
export default CreateProjectModal;
