"use client";

import React, { FC, useState, useRef } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { fetchWithAuth } from '@/utils/authService';
import { useUser } from '@/contexts/UserContext';

const API = process.env.NEXT_PUBLIC_API_URL!;
const API_ALL_LOGOUT_ENDPOINT = `${API}/api/auth/all-logout`;
const API_DELETE_ENDPOINTS = `${API}/api/users/delete`;

interface ApiEndpoints {
    UPDATE_USER_NAME: string;
    UPDATE_USER_PASSWORD: string;
    UPDATE_USER_PHOTO: string;
    DELETE_USER_PHOTO: string;
}

interface ProfileSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    apiEndpoints: ApiEndpoints;
    onChanged?: () => void;
}

interface InputFieldProps {
    label: string;
    value: string;
    onClick?: () => void;
    editable?: boolean;
}

const InputField: FC<InputFieldProps> = ({ label, value, onClick, editable = false }) => (
    <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-600 py-3 cursor-pointer">
        <div className="text-sm font-medium text-gray-500 w-1/4 dark:text-gray-400">{label}</div>
        <div className="flex items-center space-x-2 w-3/4 justify-end" onClick={onClick}>
            <span className={`text-sm text-gray-900 dark:text-white ${editable ? 'font-semibold' : ''}`}>
                {value || '정보 없음'}
            </span>
            {editable && <ChevronRight className="w-4 h-4 text-gray-400" />}
        </div>
    </div>
);

interface NameEditModalProps {
    currentName: string;
    onSave: (newName: string) => void;
    onCancel: () => void;
}

const NameEditModal: FC<NameEditModalProps> = ({ currentName, onSave, onCancel }) => {
    const [newName, setNewName] = useState(currentName);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newName.trim() && newName !== currentName) {
            onSave(newName.trim());
        } else {
            onCancel();
        }
    };

    return (
        <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-8">Edit Name</h2>

            <form onSubmit={handleSubmit} className="w-full space-y-6">
                <div>
                    <label htmlFor="newName" className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">New Name</label>
                    <input type="text" id="newName" value={newName}
                           onChange={(e) => setNewName(e.target.value)}
                           className="w-full px-4 py-3 dark:text-neutral-200 border border-gray-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150"
                           required
                    />
                </div>

                <div className="flex flex-col space-y-3 pt-2">
                    <button
                        type="submit"
                        className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow-md"
                    > Save </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="w-full py-3 border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-50/5 dark:hover:border-neutral-400 transition"
                    > Cancel </button>
                </div>
            </form>
        </div>
    );
};

interface PasswordEditModalProps {
    onSave: (currentPassword: string, newPassword: string) => void;
    onCancel: () => void;
}

const PasswordEditModal: FC<PasswordEditModalProps> = ({ onSave, onCancel }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (currentPassword && newPassword) {
            onSave(currentPassword, newPassword);
        }
    };

    return (
        <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-8 dark:text-white">Edit Password</h2>
            <form onSubmit={handleSubmit} className="w-full space-y-4">
                <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-400">Current Password</label>
                    <input
                        type="password"
                        id="currentPassword"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:text-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-400">New Password</label>
                    <input
                        type="password"
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:text-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150"
                        required
                    />
                </div>
                <div className="flex flex-col space-y-3 pt-4">
                    <button type="submit" className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow-md">
                        Save
                    </button>
                    <button type="button" onClick={onCancel} className="w-full py-3 border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-50/5 dark:hover:border-neutral-400 transition">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

// --- Main Modal Component ---
const ProfileSettingsModal: FC<ProfileSettingsModalProps> = ({ isOpen, onClose, apiEndpoints, onChanged }) => {
    const { user, setUser, logout, isLoading } = useUser();
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    // 모달 내용 내부에서 로딩 상태를 표시
    if (isLoading) {
        return (
            <div className="fixed inset-0 z-[500] flex items-center justify-center p-4"
                     style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} onClick={onClose}>
                <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 w-full max-w-md shadow-2xl relative">
                    <div className="flex justify-center items-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                        <p className="ml-4 text-gray-600">Loading user data...</p>
                    </div>
                </div>
            </div>
        );
    }

    const handlePhotoClick = () => {
        fileInputRef.current?.click();
    };
    const uploadProfilePhoto = async (file: File) => {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
            alert("인증 정보가 만료되었습니다. 다시 로그인해주세요.");
            logout();
            return;
        }
        const formData = new FormData();
        formData.append('image', file);

        try {
            console.log(`API 호출: ${apiEndpoints.UPDATE_USER_PHOTO}로 파일 [${file.name}] 전송`);

            const response = await fetchWithAuth(apiEndpoints.UPDATE_USER_PHOTO, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    // FormData를 사용할 때는 Content-Type을 설정하지 않음
                },
                body: formData,
            });
            if (response.ok) {
                const result = await response.json();
                const data = result.data || result;
                setUser(prev => ({
                    ...prev,
                    profileImageUrl: data.profileImageUrl || data.imageUrl || prev.profileImageUrl
                }));
                console.log('프로필 사진 업데이트 성공:', data);
                alert('프로필 사진이 성공적으로 변경되었습니다.');
                if (onChanged) onChanged();
            } else {
                const responseText = await response.text();
                let message = response.statusText;
                try {
                    const errorData = JSON.parse(responseText);
                    message = errorData.message || response.statusText;
                } catch (_e) {
                    console.error("비정상적인 응답:", responseText);
                }
                alert(`사진 업데이트 실패: ${message}`);
            }
        } catch (_error) {
            console.error("사진 업로드 네트워크 오류:", _error);
            alert("사진 업로드 중 네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            uploadProfilePhoto(file);
        }
        event.target.value = '';
    };
    const handleDeletePhoto = async () => {
        if (!window.confirm("프로필 이미지를 삭제하시겠습니까?")) return;

        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) { /* ... 인증 만료 처리 ... */
            return;
        }

        try {
            const response = await fetchWithAuth(apiEndpoints.DELETE_USER_PHOTO, {
                method: 'DELETE', // DELETE 메서드 사용
                headers: {
                    // 이 요청은 본문(body)이 없으므로 Content-Type이 필요 없습니다.
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (response.ok) {
                // 성공 시, user 상태에서 프로필 이미지 URL을 null로 업데이트
                setUser(prev => ({...prev, profileImageUrl: null}));
                alert('프로필 이미지가 삭제되었습니다.');
                if (onChanged) onChanged();
            } else {
                const errorData = await response.json();
                alert(`이미지 삭제 실패: ${errorData.message || '서버 오류'}`);
            }
        } catch (_error) {
            console.error("이미지 삭제 네트워크 오류:", _error);
            alert("이미지 삭제 중 네트워크 오류가 발생했습니다.");
        }
    };

    const handleNameUpdate = async (newName: string) => {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
            alert("인증 정보가 만료되었습니다. 다시 로그인해주세요.");
            setIsEditingName(false);
            onClose();
            logout();
            return;
        }

        try {
            console.log(`API 호출: ${apiEndpoints.UPDATE_USER_NAME}로 새 이름 [${newName}] 전송`);
            const response = await fetchWithAuth(apiEndpoints.UPDATE_USER_NAME, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}` },
                body: JSON.stringify({ name: newName }),
            });

            if (response.ok) {
                const result = await response.json();
                const data = result.data;
                setUser(prev => ({ ...prev, name: data.name }));
                console.log('이름 수정 성공:', data);
                alert("이름이 성공적으로 변경되었습니다.");
                if (onChanged) onChanged();
            } else {
                const errorData = await response.json();
                alert(`이름 수정 실패: ${errorData.message || response.statusText}`);
            }

        } catch (_error) {
            console.error("네트워크 오류 발생:", _error);
            alert("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        } finally {
            setIsEditingName(false); // 수정 모달 닫기
        }
    };

    const handlePasswordUpdate = async (currentPassword: string, newPassword: string) => {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
            alert("인증 정보가 만료되었습니다. 다시 로그인해주세요.");
            setIsEditingPassword(false);
            onClose();
            logout();
            return;
        }

        try {
            const response = await fetchWithAuth(apiEndpoints.UPDATE_USER_PASSWORD, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            if (response.ok) {
                const data = await response.json();
                console.log('비밀번호 변경 성공:', data.message);
                alert(data.message || '비밀번호가 성공적으로 변경되었습니다.');
            } else {
                const errorData = await response.json();
                console.error('비밀번호 변경 실패:', errorData);
                alert(`비밀번호 변경 실패: ${errorData.message || '현재 비밀번호가 일치하지 않거나 오류가 발생했습니다.'}`);
            }
        } catch (_error) {
            console.error("네트워크 오류:", _error);
            alert("네트워크 오류가 발생했습니다.");
        } finally {
            setIsEditingPassword(false); // 모달 닫기
        }
    };

    const handleAllLogout = async () => {
        const confirmLogout = window.confirm("모든 기기에서 로그아웃하시겠습니까? 다시 로그인해야 합니다.");
        if (!confirmLogout) {
            return;
        }

        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
            alert("인증 정보가 없습니다. 현재 기기에서 로그아웃합니다.");
            logout();
            return;
        }
        try {
            console.log(`API 호출: ${API_ALL_LOGOUT_ENDPOINT}로 모든 기기 로그아웃 요청`);

            // 이 요청은 AccessToken으로 해당 유저의 모든 Refresh Token을 무효화합니다.
            const response = await fetchWithAuth(API_ALL_LOGOUT_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                // 이 API는 refreshToken을 body로 요구하지 않는다고 가정하고 Authorization 헤더만 사용합니다.
            });

            if (response.ok) {
                alert("모든 기기에서 성공적으로 로그아웃되었습니다.");
            } else {
                const errorData = await response.json().catch(() => ({ message: '로그아웃 실패' }));
                console.error('모든 기기 로그아웃 실패:', response.status, errorData.message);
                alert(`로그아웃 실패: ${errorData.message || response.statusText}`);
            }

        } catch (_error) {
            console.error("모든 기기 로그아웃 중 네트워크 오류:", _error);
            alert("로그아웃 중 네트워크 오류가 발생했습니다.");
        } finally {
            // 서버 응답과 관계없이 클라이언트 측 토큰을 정리하고 리디렉션
            logout(); // UserContext의 logout 함수를 재사용하여 토큰 정리 및 상태 초기화
            window.location.href = '/'; // 홈 또는 로그인 페이지로 이동
        }
    };

    const handleDeleteAccount = async () => {
        const confirmDelete = window.confirm("정말 계정을 삭제하시겠습니까?");
        if (!confirmDelete) {
            console.log("계정 삭제가 취소되었습니다.");
            return;
        }

        console.log(`계정 삭제 API 호출: ${API_DELETE_ENDPOINTS}`);
        const accessToken = localStorage.getItem('accessToken');

        if (!accessToken) {
            console.error("AccessToken이 없어 계정 삭제를 진행할 수 없습니다.");
            return;
        }
        try {
            const response = await fetchWithAuth(API_DELETE_ENDPOINTS, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (response.ok) {
                console.log("계정이 성공적으로 삭제되었습니다.");
            } else {
                const errorData = await response.json().catch(() => ({ message: '삭제 실패' }));
                console.error('계정 삭제 실패:', response.status, errorData.message);
            }
        } catch (_error) {
            console.error("계정 삭제 네트워크 오류:", _error);
        } finally {
            window.location.href = '/'; }
    };

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4"
             style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} onClick={onClose}>

            <div
                className="bg-white dark:bg-neutral-900 rounded-3xl p-8 w-full max-w-md shadow-2xl relative transform transition-all duration-300 scale-100"
                onClick={e => e.stopPropagation()} // 모달 배경 클릭 방지
            >
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-50/5 transition"
                >
                    <X className="w-6 h-6" />
                </button>

                {isEditingName ? (
                    <NameEditModal
                        currentName={user.name || ''}
                        onSave={handleNameUpdate}
                        onCancel={() => setIsEditingName(false)}
                    />
                ) : isEditingPassword ? (
                    <PasswordEditModal
                        onSave={handlePasswordUpdate}
                        onCancel={() => setIsEditingPassword(false)} />
                ) : (
                    <div className="flex flex-col items-center">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 dark:text-white">Profile Settings</h2>
                        <img
                            src={user.profileImageUrl || 'https://placehold.co/100x100/A0BFFF/FFFFFF?text=User'}
                            alt="Profile"
                            className="w-24 h-24 rounded-full object-cover mb-2 border-4 border-gray-100 dark:border-neutral-700  shadow-md"
                        />
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*" // 이미지 파일만 허용
                            style={{ display: 'none' }} // 화면에서 숨김
                        />
                        <div className="flex items-center space-x-4 mt-6 mb-8">
                            <button
                                onClick={handlePhotoClick}
                                className="text-sm text-blue-600 dark:text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 font-medium transition"
                            >
                                Change Photo
                            </button>
                            {user.profileImageUrl && (
                                <button
                                    onClick={handleDeletePhoto}
                                    className="text-sm text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium transition"
                                >
                                    Delete Photo
                                </button>
                            )}
                        </div>
                        <div className="w-full space-y-2">
                            {/* 이름 수정 필드 */}
                            <InputField
                                label="Name"
                                value={user.name || ''}
                                editable={true}
                                onClick={() => setIsEditingName(true)}
                            />

                            {/* 이메일 (읽기 전용) */}
                            <InputField
                                label="Email"
                                value={user.email || ''}
                            />

                            {/* 비밀번호 수정 필드 */}
                            <InputField
                                label="Password"
                                value="********"
                                editable={true}
                                onClick={() => setIsEditingPassword(true)}
                            />
                        </div>

                        {/* 모든 기기 로그아웃 버튼 추가 */}
                        <button
                            onClick={handleAllLogout}
                            className="mt-8 w-full py-3 border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-50/5 dark:hover:border-neutral-400 transition"
                        >
                            Logout from All Devices
                        </button>

                        {/* 계정 삭제 버튼 */}
                        <button
                            onClick={handleDeleteAccount}
                            className="mt-3 w-full py-3 border border-red-400 text-red-500 font-semibold rounded-lg hover:bg-red-50 dark:hover:bg-red-50/5 transition"
                        >
                            Delete Account
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};


// 외부에서 import 되어 사용될 주 컴포넌트를 export
export default ProfileSettingsModal;