"use client";

import React, { FC, useState, useRef } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';

// --- 타입 정의 ---
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

    const API_DELETE_ENDPOINT = `https://cocal-server.onrender.com/api/users/delete`;

    if (!isOpen) return null;
    if (isLoading && !user.id) return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><div className="bg-white p-8 rounded-lg">Loading...</div></div>;

    const handlePhotoClick = () => fileInputRef.current?.click();

    const uploadProfilePhoto = async (file: File) => {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) { alert("Authentication expired. Please log in again."); void logout(); return; }
        const formData = new FormData();
        formData.append('profileImage', file);

        try {
            const response = await fetch(apiEndpoints.UPDATE_USER_PHOTO, { method: 'PUT', headers: { 'Authorization': `Bearer ${accessToken}` }, body: formData });
            if (response.ok) {
                const result = await response.json();
                setUser(prev => ({ ...prev, profileImageUrl: result.data.profileImageUrl || prev.profileImageUrl }));
                alert('Profile photo updated.');
            } else {
                const errorData = await response.json().catch(() => ({}));
                alert(`Photo update failed: ${errorData.message || 'An error occurred.'}`);
            }
        } catch (_err) { alert("An error occurred during photo upload."); }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) void uploadProfilePhoto(file);
        event.target.value = '';
    };

    const handleNameUpdate = async (newName: string) => {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) { return; }
        try {
            const response = await fetch(apiEndpoints.UPDATE_USER_NAME, {
                method: 'PUT', // [수정] 404 에러 해결을 위해 PATCH를 PUT으로 변경합니다.
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
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
            const response = await fetch(apiEndpoints.UPDATE_USER_PASSWORD, {
                method: 'PUT', // [수정] 404 에러 해결을 위해 PATCH를 PUT으로 변경합니다.
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
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
        if (!window.confirm("Are you sure? This action cannot be undone.")) return;
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) return;
        try {
            const response = await fetch(API_DELETE_ENDPOINT, { method: 'DELETE', headers: { 'Authorization': `Bearer ${accessToken}` } });
            if (response.ok) {
                alert("Account deleted successfully.");
                void logout();
            } else {
                alert('Failed to delete account.');
            }
        } catch (_err) { alert("A network error occurred."); }
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
                        <button onClick={handlePhotoClick} className="mb-6 text-sm text-blue-600 hover:text-blue-700 font-medium">Change Photo</button>
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

