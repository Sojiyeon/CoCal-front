// 프로젝트 생성 모달창
"use client";

import React, { FC, useState } from 'react';
// BaseModal은 같은 modals 디렉토리에 있습니다.
import Modal from '../ui/Modal';
// Button은 상위 디렉토리(components)의 ui 폴더에 있습니다.
import Button from '../ui/Button';

// 프로젝트 생성 데이터 타입 정의
export interface ProjectFormData {
    name: string;
    client: string;
    startDate: string;
    endDate: string;
}

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateProject: (data: ProjectFormData) => void;
}

// 파일명은 CreateEventModal.tsx이지만, 내용은 프로젝트 생성 폼입니다.
const CreateEventModal: FC<CreateEventModalProps> = ({ isOpen, onClose, onCreateProject }) => {
    const [formData, setFormData] = useState<ProjectFormData>({
        name: '',
        client: '',
        startDate: '',
        endDate: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.client || !formData.startDate || !formData.endDate) {
            console.error('All fields are required.');
            return;
        }
        onCreateProject(formData);
        onClose();
        setFormData({ name: '', client: '', startDate: '', endDate: '' }); // 폼 초기화
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

                {/* Client Name */}
                <div>
                    <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                    <input
                        type="text"
                        id="clientName"
                        name="client"
                        placeholder="Client Name"
                        value={formData.client}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150"
                        required
                    />
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

export default CreateEventModal;
