"use client";

import React, { useState, useEffect, FC } from 'react';

// 타입을 명확하게 정의합니다.
interface User {
    name: string;
    email: string;
    imageUrl: string;
}

interface ApiEndpoints {
    UPDATE_USER_NAME: string;
    UPDATE_USER_PASSWORD: string;
    UPDATE_USER_PHOTO: string;
}

interface ProfileSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    // [수정] currentUser prop을 옵셔널로 변경하여 로딩 상태를 처리합니다.
    currentUser: User | null;
    apiEndpoints: ApiEndpoints;
    // [추가] 프로필 정보를 다시 불러오는 함수를 props로 받습니다.
    refetchProfile: () => void;
}

const ProfileSettingsModal: FC<ProfileSettingsModalProps> = ({
                                                                 isOpen,
                                                                 onClose,
                                                                 currentUser,
                                                                 apiEndpoints,
                                                                 refetchProfile,
                                                             }) => {
    // 모달 내부에서 사용할 상태를 추가합니다.
    const [name, setName] = useState(currentUser?.name || '');
    const [isEditing, setIsEditing] = useState(false);

    // currentUser prop이 변경될 때마다 내부 상태를 업데이트합니다.
    useEffect(() => {
        if (currentUser) {
            setName(currentUser.name);
        }
    }, [currentUser]);

    if (!isOpen) return null;

    // 이름 변경 저장 핸들러
    const handleSaveName = async () => {
        // [API-연동] Access Token을 헤더에 담아 이름 변경 API를 호출합니다.
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
            alert("로그인이 필요합니다.");
            return;
        }

        try {
            const response = await fetch(apiEndpoints.UPDATE_USER_NAME, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`, // 인증 토큰 추가
                },
                body: JSON.stringify({ name }),
            });

            if (response.ok) {
                alert("이름이 변경되었습니다.");
                setIsEditing(false);
                refetchProfile(); // 부모 컴포넌트의 프로필 정보를 다시 불러옵니다.
            } else {
                const errorData = await response.json();
                alert(`이름 변경 실패: ${errorData.message}`);
            }
        } catch (error) {
            console.error("이름 변경 중 네트워크 오류 발생:", error);
            alert("이름 변경 중 오류가 발생했습니다.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Profile Settings</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
                </div>

                {/* 프로필 정보 표시 및 수정 */}
                {!currentUser ? (
                    <div>Loading profile...</div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                            <img src={currentUser.imageUrl} alt="Profile" className="w-16 h-16 rounded-full"/>
                            <div>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="text-lg font-semibold border-b focus:outline-none focus:border-blue-500"
                                    />
                                ) : (
                                    <p className="text-lg font-semibold">{currentUser.name}</p>
                                )}
                                <p className="text-sm text-gray-500">{currentUser.email}</p>
                            </div>
                        </div>

                        {isEditing ? (
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setIsEditing(false)} className="text-sm text-gray-600">Cancel</button>
                                <button onClick={handleSaveName} className="text-sm text-blue-600 font-semibold">Save</button>
                            </div>
                        ) : (
                            <button onClick={() => setIsEditing(true)} className="text-sm text-blue-600">Edit Name</button>
                        )}
                    </div>
                )}

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

