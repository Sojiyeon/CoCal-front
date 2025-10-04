"use client";

import React, { useState, FC, useRef, useEffect, useMemo } from 'react';
import { Moon, Settings, LogOut } from 'lucide-react';

// 컴포넌트가 받을 props 타입을 정의합니다.
interface ProfileDropdownProps {
    user: {
        name: string;
        email: string;
        imageUrl: string;
    };
    onOpenSettings: () => void;
    onLogout: () => void;
}

const ProfileDropdown: FC<ProfileDropdownProps> = ({ user, onOpenSettings, onLogout }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // 드롭다운 외부를 클릭하면 닫히도록 하는 로직입니다.
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // 드롭다운 메뉴 아이템 목록입니다.
    const menuItems = useMemo(() => [
        {
            label: 'Dark Mode',
            icon: Moon,
            action: () => console.log('Dark Mode toggled'),
            isToggle: true,
            isToggled: false
        },
        {
            label: 'Profile Settings',
            icon: Settings,
            action: () => {
                onOpenSettings();
                setIsOpen(false);
            }
        },
        {
            label: 'Logout',
            icon: LogOut,
            action: onLogout,
            isDestructive: true
        },
    ], [onOpenSettings, onLogout]);

    return (
        <div className="relative z-50" ref={dropdownRef}>
            {/* 프로필 이미지와 이름을 표시하는 부분입니다. 클릭하면 드롭다운이 열립니다. */}
            <div
                className="flex items-center space-x-2 cursor-pointer p-1"
                onClick={() => setIsOpen(!isOpen)}
            >
                <img
                    src={user.imageUrl.replace('96x96', '40x40')}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover shadow-inner ring-1 ring-gray-200"
                    onError={(e) => { e.currentTarget.src = 'https://placehold.co/40x40/cccccc/ffffff?text=U' }}
                />
                <div className="flex flex-col text-xs">
                    <span className="font-semibold text-gray-900 block">
                        {user.name}
                    </span>
                    <span className="text-gray-500 block">
                        {user.email}
                    </span>
                </div>
            </div>

            {/* 드롭다운 메뉴 */}
            {isOpen && (
                <div
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl z-40 p-2 border border-gray-100"
                    role="menu"
                >
                    {menuItems.map((item, index) => (
                        <div
                            key={index}
                            onClick={() => { item.action(); if (!item.isToggle) setIsOpen(false); }}
                            className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg cursor-pointer transition duration-150 
                                ${item.isDestructive ? 'text-red-500 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'}
                            `}
                            role="menuitem"
                        >
                            <div className='flex items-center space-x-2'>
                                {item.icon && <item.icon className="w-5 h-5" />}
                                <span className='font-medium'>{item.label}</span>
                            </div>
                            {item.isToggle && (
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={item.isToggled} className="sr-only peer" readOnly />
                                    <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProfileDropdown;
