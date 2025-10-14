// src/components/modals/EditProjectModal.tsx

"use client";

import React, { FC, useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

// 폼 데이터 타입 정의
export interface ProjectFormData {
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
}

// 편집할 프로젝트 데이터 타입
interface ProjectToEdit {
    id: number;
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
}

interface EditProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdateProject: (data: ProjectFormData) => Promise<void>;
    projectToEdit: ProjectToEdit; // 편집할 데이터는 필수로 받음
}

const EditProjectModal: FC<EditProjectModalProps> = ({ isOpen, onClose, onUpdateProject, projectToEdit }) => {
    const [formData, setFormData] = useState<ProjectFormData>({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
    });

    // projectToEdit prop이 변경될 때마다 폼 데이터를 업데이트
    useEffect(() => {
        if (projectToEdit) {
            setFormData({
                name: projectToEdit.name,
                description: projectToEdit.description || '',
                startDate: projectToEdit.startDate,
                endDate: projectToEdit.endDate,
            });
        }
    }, [projectToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onUpdateProject(formData);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Project">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Project Name */}
                <div>
                    <label htmlFor="editProjectName" className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                    <input
                        type="text"
                        id="editProjectName"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>
                {/* Project Description */}
                <div>
                    <label htmlFor="editProjectDescription" className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                    <textarea
                        id="editProjectDescription"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                    />
                </div>
                {/* Start Date / End Date */}
                <div className="flex space-x-4">
                    <div className="flex-1">
                        <label htmlFor="editStartDate" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                            type="date"
                            id="editStartDate"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                            required
                        />
                    </div>
                    <div className="flex-1">
                        <label htmlFor="editEndDate" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                            type="date"
                            id="editEndDate"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                            required
                        />
                    </div>
                </div>
                {/* Save Button */}
                <div className="flex justify-center pt-4">
                    <Button type="submit" variant="primary" className="w-full max-w-xs px-8 py-3">
                        Save Changes
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default EditProjectModal;