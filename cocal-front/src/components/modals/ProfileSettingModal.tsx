"use client";

import React, { FC, useState, createContext, useContext, useEffect, useRef } from 'react';
import { X, ChevronRight } from 'lucide-react';

// UserProvider 관련 타입 및 Context (Dashboard 파일에서 사용하지 않으므로 그대로 유지)
interface User {
    id: number | null;
    email: string | null;
    name: string | null;
    profileImageUrl: string | null;
}

interface UserContextType {
    user: User;
    setUser: React.Dispatch<React.SetStateAction<User>>;
    isLoading: boolean;
    fetchUserProfile: (token: string) => Promise<void>;
    logout: () => void;
}

const API_ME_ENDPOINT = '/api/users/me';
const API_LOGOUT_ENDPOINT = '/api/auth/logout';
const initialUser: User = { id: null, email: null, name: null, profileImageUrl: null };
const UserContext = createContext<UserContextType | undefined>(undefined);

const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};

// UserProvider 컴포넌트 (모달 테스트를 위해 필요)
export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User>(initialUser);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUserProfile = async (token: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(API_ME_ENDPOINT, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setUser(prev => ({ ...prev, name: data.name, email: data.email, profileImageUrl: data.profileImageUrl, id: data.id }));
                console.log('이름 수정 성공:', data);
            } else {
                const errorData = await response.json();
                alert(`이름 수정 실패: ${errorData.message || response.statusText}`); // alert 제거
            }
        } catch (error) {
            alert("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요."); // alert 제거
        } finally {
            setIsLoading(false); // 로딩 종료
        }
    };

    const logout = async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
            try {
                await fetch(API_LOGOUT_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken }),
                });
            } catch (error) {
                // 오류가 발생해도 클라이언트 측 정리는 계속 진행
            }
        }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(initialUser);
        // window.location.href = '/login'; // 실제 앱에서는 로그인 페이지로 리디렉션
    };

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            fetchUserProfile(token);
        } else {
            setUser({
                id: 123,
                email: 'name123@gmail.com',
                name: 'Name',
                profileImageUrl: 'https://placehold.co/96x96/50bda1/ffffff?text=COLA'
            });
            setIsLoading(false);
        }
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser, isLoading, fetchUserProfile, logout }}>
            {children}
        </UserContext.Provider>
    );
};

interface ApiEndpoints {
    UPDATE_USER_NAME: string;
    UPDATE_USER_PASSWORD: string;
    UPDATE_USER_PHOTO: string;
}

interface ProfileSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    apiEndpoints: ApiEndpoints;
}

interface InputFieldProps {
    label: string;
    value: string;
    onClick?: () => void;
    editable?: boolean;
}

const InputField: FC<InputFieldProps> = ({ label, value, onClick, editable = false }) => (
    <div className="flex items-center justify-between border-b border-gray-100 py-3 cursor-pointer">
        <div className="text-sm font-medium text-gray-500 w-1/4">{label}</div>
        <div className="flex items-center space-x-2 w-3/4 justify-end" onClick={onClick}>
            <span className={`text-sm text-gray-900 ${editable ? 'font-semibold' : ''}`}>
                {value}
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
            <h2 className="text-2xl font-bold text-gray-800 mb-8">Edit Name</h2>

            <form onSubmit={handleSubmit} className="w-full space-y-6">
                <div>
                    <label htmlFor="newName" className="block text-sm font-medium text-gray-700 mb-1">New Name</label>
                    <input type="text" id="newName" value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150"
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
                        className="w-full py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
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
            <h2 className="text-2xl font-bold text-gray-800 mb-8">Edit Password</h2>
            <form onSubmit={handleSubmit} className="w-full space-y-4">
                <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <input
                        type="password"
                        id="currentPassword"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input
                        type="password"
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150"
                        required
                    />
                </div>
                <div className="flex flex-col space-y-3 pt-4">
                    <button type="submit" className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow-md">
                        Save
                    </button>
                    <button type="button" onClick={onCancel} className="w-full py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

const ProfileSettingsModal: FC<ProfileSettingsModalProps> = ({ isOpen, onClose, apiEndpoints }) => {
    const { user, setUser, logout, isLoading } = useUser();
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    // 모달 내용 내부에서 로딩 상태를 표시
    if (isLoading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                 style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative">
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
        formData.append('profileImageUrl', file);

        try {
            console.log(`API 호출: ${apiEndpoints.UPDATE_USER_PHOTO}로 파일 [${file.name}] 전송`);

            const response = await fetch(apiEndpoints.UPDATE_USER_PHOTO, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: formData,
            });
            if (response.ok) {
                const data = await response.json();

                setUser(prev => ({
                    ...prev,
                    profileImageUrl: data.profileImageUrl || data.imageUrl
                }));
                console.log('프로필 사진 업데이트 성공:', data);
                alert('프로필 사진이 성공적으로 변경되었습니다.');

            } else {
                const responseText = await response.text();
                let message = response.statusText;
                try {
                    const errorData = JSON.parse(responseText);
                    message = errorData.message || response.statusText;
                } catch (e) {
                    console.error("비정상적인 응답:", responseText);
                }
                alert(`사진 업데이트 실패: ${message}`);
            }
        } catch (error) {
            console.error("사진 업로드 네트워크 오류:", error);
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

    const handleNameUpdate = async (newName: string) => {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
            alert("인증 정보가 만료되었습니다. 다시 로그인해주세요."); // alert 제거
            setIsEditingName(false);
            onClose();
            logout();
            return;
        }

        try {
            console.log(`API 호출: ${apiEndpoints.UPDATE_USER_NAME}로 새 이름 [${newName}] 전송`);
            const response = await fetch(apiEndpoints.UPDATE_USER_NAME, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}` },
                body: JSON.stringify({ name: newName }),
            });

            if (response.ok) {
                const data = await response.json(); // 서버에서 업데이트된 정보를 받을 수 있음
                setUser(prev => ({ ...prev, name: data.name }));
                console.log('이름 수정 성공:', data);
            } else {
                const errorData = await response.json();
                alert(`이름 수정 실패: ${errorData.message || response.statusText}`); // alert 제거
            }

        } catch (error) {
            console.error("네트워크 오류 발생:", error);
            // alert("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요."); // alert 제거
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
            const response = await fetch(apiEndpoints.UPDATE_USER_PASSWORD, {
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
        } catch (error) {
            console.error("네트워크 오류:", error);
            alert("네트워크 오류가 발생했습니다.");
        } finally {
            setIsEditingPassword(false); // 모달 닫기
        }
    };

    const handleDeleteAccount = () => {
        console.log('계정 삭제 요청');
        // 실제로는 사용자에게 경고 모달을 띄우고 삭제를 진행해야 합니다.
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} onClick={onClose}>

            <div
                className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative transform transition-all duration-300 scale-100"
                onClick={e => e.stopPropagation()} // 모달 배경 클릭 방지
            >
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 p-2 rounded-full text-gray-500 hover:bg-gray-100 transition"
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
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Profile Settings</h2>
                        <img
                            src={user.profileImageUrl || 'https://placehold.co/100x100/A0BFFF/FFFFFF?text=User'}
                            alt="Profile"
                            className="w-24 h-24 rounded-full object-cover mb-6 border-4 border-gray-100 shadow-md"
                        />
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*" // 이미지 파일만 허용
                            style={{ display: 'none' }} // 화면에서 숨김
                        />
                        <button
                            onClick={handlePhotoClick}
                            className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium transition"
                        > Change Photo
                        </button>
                        <div className="w-full space-y-2">
                            {/* 이름 수정 필드 */}
                            <InputField
                                label="Name"
                                value={user.name || '정보 없음'}
                                editable={true}
                                onClick={() => setIsEditingName(true)}
                            />

                            {/* 이메일 (읽기 전용) */}
                            <InputField
                                label="Email"
                                value={user.email || '정보 없음'}
                            />

                            {/* 비밀번호 수정 필드 */}
                            <InputField
                                label="Password"
                                value="********"
                                editable={true}
                                onClick={() => setIsEditingPassword(true)}
                            />
                        </div>

                        {/* 계정 삭제 버튼 */}
                        <button
                            onClick={handleDeleteAccount}
                            className="mt-8 w-full py-3 border border-red-400 text-red-500 font-semibold rounded-lg hover:bg-red-50 transition"
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
