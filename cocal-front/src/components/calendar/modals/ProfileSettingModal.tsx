"use client";

import React from 'react';

// 이 모달이 받는 props의 타입을 정의합니다.
interface ProfileSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: {
        name: string;
        email: string;
        imageUrl: string;
    };
    apiEndpoints: {
        UPDATE_USER_NAME: string;
        UPDATE_USER_PASSWORD: string;
        UPDATE_USER_PHOTO: string;
    };
}

const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
                                                                       isOpen,
                                                                       onClose,
                                                                       currentUser,
                                                                       apiEndpoints,
                                                                   }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                <h2 className="text-xl font-bold mb-4">Profile Settings</h2>

                <div className="space-y-4">
                    <p><span className="font-semibold">Name:</span> {currentUser.name}</p>
                    <p><span className="font-semibold">Email:</span> {currentUser.email}</p>
                    <p className="text-xs text-gray-500">Name API: {apiEndpoints.UPDATE_USER_NAME}</p>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 rounded-md text-sm font-medium hover:bg-gray-300"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileSettingsModal;
