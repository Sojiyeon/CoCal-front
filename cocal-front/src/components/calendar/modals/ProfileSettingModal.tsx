"use client";

import React, { FC, useState, useRef } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { fetchWithAuth } from '@/utils/authService';

// --- 타입 정의 ---
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
}

// --- 하위 컴포넌트들 ---
const InputField: FC<{ label: string; value: string; onClick?: () => void; editable?: boolean }> = ({ label, value, onClick, editable = false }) => (
    <div className="flex items-center justify-between border-b border-gray-100 py-3 cursor-pointer" onClick={onClick}>
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-900">{value || '정보 없음'}</span>
            {editable && <ChevronRight className="w-4 h-4 text-gray-400" />}
        </div>
    </div>
);

const NameEditModal: FC<{ currentName: string; onSave: (newName: string) => void; onCancel: () => void; }> = ({ currentName, onSave, onCancel }) => {
    const [newName, setNewName] = useState(currentName);
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newName.trim() && newName !== currentName) onSave(newName.trim());
        else onCancel();
    };
    return (
        <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-8">Edit Name</h2>
            <form onSubmit={handleSubmit} className="w-full space-y-6">
                <div>
                    <label htmlFor="newName" className="block text-sm font-medium text-gray-700 mb-1">New Name</label>
                    <input type="text" id="newName" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div className="flex flex-col space-y-3 pt-2">
                    <button type="submit" className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 shadow-md">Save</button>
                    <button type="button" onClick={onCancel} className="w-full py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50">Cancel</button>
                </div>
            </form>
        </div>
    );
};

const PasswordEditModal: FC<{ onSave: (current: string, newP: string) => void; onCancel: () => void; }> = ({ onSave, onCancel }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (currentPassword && newPassword) onSave(currentPassword, newPassword);
    };
    return (
        <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-8">Edit Password</h2>
            <form onSubmit={handleSubmit} className="w-full space-y-4">
                <div>
                    <label htmlFor="currentPassword">Current Password</label>
                    <input type="password" id="currentPassword" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" required />
                </div>
                <div>
                    <label htmlFor="newPassword">New Password</label>
                    <input type="password" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" required />
                </div>
                <div className="flex flex-col space-y-3 pt-4">
                    <button type="submit" className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 shadow-md">Save</button>
                    <button type="button" onClick={onCancel} className="w-full py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50">Cancel</button>
                </div>
            </form>
        </div>
    );
};

// --- 메인 모달 컴포넌트 ---
const ProfileSettingsModal: FC<ProfileSettingsModalProps> = ({ isOpen, onClose, apiEndpoints }) => {
    const { user, setUser, logout, isLoading } = useUser();
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const API_DELETE_ENDPOINT = process.env.NEXT_PUBLIC_API_URL!+`/api/users/delete`;

    if (!isOpen) return null;
    if (isLoading && !user.id) return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><div className="bg-white p-8 rounded-lg">Loading...</div></div>;

    const handlePhotoClick = () => fileInputRef.current?.click();

    //  이미지 업로드 로직
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
        if (file) void uploadProfilePhoto(file);
        event.target.value = ''; // 같은 파일 재선택을 위해 초기화
    };

    // [추가] 이미지 삭제 로직 (Dashboard 참고)
    const handleDeletePhoto = async () => {
        if (!window.confirm("프로필 이미지를 삭제하시겠습니까?")) return;

        try {
            const response = await fetchWithAuth(apiEndpoints.DELETE_USER_PHOTO, {
                method: 'DELETE',
            });
            if (response.ok) {
                setUser(prev => ({...prev, profileImageUrl: null}));
                alert('프로필 이미지가 삭제되었습니다.');
            } else {
                const errorData = await response.json();
                alert(`이미지 삭제 실패: ${errorData.message || '서버 오류'}`);
            }
        } catch (error) {
            console.error("이미지 삭제 네트워크 오류:", error);
            alert("이미지 삭제 중 네트워크 오류가 발생했습니다.");
        }
    };


    const handleNameUpdate = async (newName: string) => {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) { return; }
        try {
            const response = await fetchWithAuth(apiEndpoints.UPDATE_USER_NAME, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName })
            });
            if (response.ok) {
                const result = await response.json();
                setUser(prev => ({ ...prev, name: result.data.name }));
                alert("Name updated successfully.");
            } else {
                const errorData = await response.json();
                alert(`Failed to update name: ${errorData.message}`);
            }
        } catch (_err) { alert("A network error occurred."); }
        finally { setIsEditingName(false); }
    };

    const handlePasswordUpdate = async (currentPassword: string, newPassword: string) => {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) { return; }
        try {
            const response = await fetchWithAuth(apiEndpoints.UPDATE_USER_PASSWORD, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            if (response.ok) {
                alert('Password changed successfully.');
            } else {
                const errorData = await response.json();
                alert(`Password change failed: ${errorData.message}`);
            }
        } catch (_err) { alert("A network error occurred."); }
        finally { setIsEditingPassword(false); }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm("정말 계정을 삭제하시겠습니까?")) return;
        try {

            const response = await fetchWithAuth(API_DELETE_ENDPOINT, { method: 'DELETE' });
            if (response.ok) {
                alert("계정이 성공적으로 삭제되었습니다.");
                logout(); // UserContext의 logout 함수 사용
                window.location.href = '/'; // 홈페이지로 리디렉션
            } else {
                alert('계정 삭제에 실패했습니다.');
            }
        } catch (err) { alert("네트워크 오류가 발생했습니다."); }
    };


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-5 right-5 p-2 rounded-full text-gray-500 hover:bg-gray-100"><X className="w-6 h-6" /></button>
                {isEditingName ? (
                    <NameEditModal currentName={user.name || ''} onSave={handleNameUpdate} onCancel={() => setIsEditingName(false)} />
                ) : isEditingPassword ? (
                    <PasswordEditModal onSave={handlePasswordUpdate} onCancel={() => setIsEditingPassword(false)} />
                ) : (
                    <div className="flex flex-col items-center">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Profile Settings</h2>
                        <img src={user.profileImageUrl || 'https://placehold.co/100x100/A0BFFF/FFFFFF?text=User'} alt="Profile" className="w-24 h-24 rounded-full object-cover mb-3 border-4 border-gray-100" />
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />

                        <div className="flex items-center space-x-4 mb-6">
                            <button onClick={handlePhotoClick} className="text-sm text-blue-600 hover:text-blue-700 font-medium transition">
                                Change Photo
                            </button>
                            {user.profileImageUrl && (
                                <button onClick={handleDeletePhoto} className="text-sm text-red-500 hover:text-red-700 font-medium transition">
                                    Delete Photo
                                </button>
                            )}
                        </div>
                        <div className="w-full space-y-2">
                            <InputField label="Name" value={user.name || ''} editable={true} onClick={() => setIsEditingName(true)} />
                            <InputField label="Email" value={user.email || ''} />
                            <InputField label="Password" value="********" editable={true} onClick={() => setIsEditingPassword(true)} />
                        </div>
                        <button onClick={handleDeleteAccount} className="mt-8 w-full py-3 border border-red-400 text-red-500 font-semibold rounded-lg hover:bg-red-50">Delete Account</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileSettingsModal;

