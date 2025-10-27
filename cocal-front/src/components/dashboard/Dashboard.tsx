"use client";

import React, { useState, FC, useRef, useEffect, useMemo, useCallback } from 'react';
import Image from "next/image";
import { Folder, MoreVertical, Moon, Settings, LogOut, Plus, Bell, Mail, X, Check, XCircle, Dog, Cat } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider';
import { fetchWithAuth } from '@/utils/authService';
import CreateProjectModal, { ProjectFormData } from '@/components/modals/CreateProjectModal';
import EditProjectModal from '@/components/modals/EditProjectModal';
import ProfileSettingsModal from '@/components/modals/ProfileSettingModal';
import ProjectDescriptionModal from '@/components/modals/ProjectDescriptionModal';
import {inviteAation} from "@/api/inviteApi";
import useNotificationStream from "@/hooks/useNotificationStream";
import { NotificationItem } from "@/types/notification";
import Toast from "@/components/common/Toast";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;
const API_PROJECTS_ENDPOINT = `${API_BASE_URL}/api/projects`;

const API_ENDPOINTS = {
    UPDATE_USER_NAME: `${API_BASE_URL}/api/users/edit-name`,
    UPDATE_USER_PASSWORD: `${API_BASE_URL}/api/users/edit-pwd`,
    UPDATE_USER_PHOTO: `${API_BASE_URL}/api/users/profile-image`,
    DELETE_USER_PHOTO: `${API_BASE_URL}/api/users/profile-image`,
    FETCH_UNREAD_NOTIFICATIONS_BY_USER: (userId: number) => `${API_BASE_URL}/api/notifications/unread/${userId}`,
    // --- 알림읽기---
    MARK_NOTIFICATION_AS_READ: (notificationId: number) => `${API_BASE_URL}/api/notifications/read/${notificationId}`,  // 단일
    MARK_ALL_NOTIFICATIONS_AS_READ: `${API_BASE_URL}/api/notifications/all-read`,   // 전체
    FETCH_PROJECT_INVITES_ME: `${API_BASE_URL}/api/team/invites/me`,
};

// --- DUMMY DATA & TYPES ---

// UI에 표시 및 필터링에 사용할 상태 타입
type ProjectCategory = 'All' | 'In Progress' | 'Completed';
// 서버에서 내려주는 상태 타입
type ServerProjectStatus = 'IN_PROGRESS' | 'COMPLETED';
type MemberStatus = 'ACTIVE' | 'LEFT' | 'KICKED';

interface TeamMemberForCard {
    id: number;
    name: string;
    imageUrl: string;
}
// any에러때문에만듦
interface ServerMember {
    userId: number; // 서버 타입과 일치하도록 number로 가정
    name: string;
    profileImageUrl: string | null | undefined;
}
export interface ServerProjectItem {
    id: number;
    name: string;
    description: string | null;
    startDate: string;
    endDate: string;
    ownerId: number;
    status: ServerProjectStatus;
    members: ServerMember[]; // 타입 안정성 확보
    memberStatus: MemberStatus; // 서버 응답에 status 포함
}

export interface Project {
    id: number;
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
    ownerId: number;
    status: ServerProjectStatus; // 서버 상태 그대로 저장
    members: TeamMemberForCard[];
    memberStatus: MemberStatus;
}

interface CurrentUser {
    id: number | null;
    name: string;
    email: string;
    profileImageUrl: string;
}

// 사용자 정보의 기본값
const DEFAULT_USER: CurrentUser = {
    id: null,
    name: 'Guest',
    email: 'guest@example.com',
    profileImageUrl: 'https://placehold.co/100x100/A0BFFF/FFFFFF?text=User', // 임시 이미지
};

interface ExpectedApiEndpoints {
    UPDATE_USER_NAME: string;
    UPDATE_USER_PASSWORD: string;
    UPDATE_USER_PHOTO: string;
    DELETE_USER_PHOTO: string;
}

interface ProfileSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    apiEndpoints: ExpectedApiEndpoints;
    onChanged?: () => void;
}

// ProfileSettingsModal의 prop 타입 오류 방지를 위해 임시 타입 정의 사용
const ProfileSettingsModalTyped: FC<ProfileSettingsModalProps> = ProfileSettingsModal;

type NotificationType = 'INVITE' | 'PRIVATE_TODO' | 'EVENT';

interface ProjectInviteItem {
    id: number;
    projectId: number;
    projectName: string;
    email: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    createdAt: string;
    expiresAt: string;
    inviterEmail: string;
}

interface ProjectInviteResponse {
    content: ProjectInviteItem[];
    totalElements: number;
    // ... other pageable info
}

// --- 헬퍼 함수: 서버 상태를 UI 표시용으로 변환 ---
const mapServerStatusToUI = (serverStatus: ServerProjectStatus): 'In Progress' | 'Completed' => {
    switch (serverStatus) {
        case 'IN_PROGRESS':
            return 'In Progress';
        case 'COMPLETED':
            return 'Completed';
        default:
            console.warn("Unexpected project status received:", serverStatus);
            return 'In Progress';
    }
};

// --- ProjectCard Component (생략) ---
interface ProjectCardProps {
    project: Project;
    currentUserId: number | null;
    onEdit: (project: Project) => void;
    onDelete: (projectId: number) => void;
    isDropdownActive: boolean;
    onToggleDropdown: (isActive: boolean) => void;
    // UI에서 사용할 status를 prop으로 받습니다.
    status: ProjectCategory;
    onShowDescription: (project: Project) => void;
}

// --- ProjectCategoryFilter Component (Inline) ---
interface ProjectCategoryFilterProps {
    selectedCategory: ProjectCategory;
    onSelectCategory: (category: ProjectCategory) => void;
    onOpenCreateModal: () => void;
}

const categories: ProjectCategory[] = ['All', 'In Progress', 'Completed'];

const ProjectCategoryFilter: FC<ProjectCategoryFilterProps> = ({
                                                                   selectedCategory,
                                                                   onSelectCategory,
                                                                   onOpenCreateModal
                                                               }) => {
    return (
        <div className="flex justify-between items-center mb-8">
            {/* 카테고리 탭 */}
            <div className="flex space-x-8 border-b border-gray-200 dark:border-neutral-700">
                {categories.map(category => (
                    <button
                        key={category}
                        onClick={() => onSelectCategory(category)}
                        className={`py-2 text-lg font-medium transition duration-200
                ${selectedCategory === category
                            ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-300 dark:border-blue-300'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                    >
                        {category === 'All' ? 'All' : category === 'In Progress' ? 'In Progress' : 'Completed'}
                    </button>
                ))}
            </div>

            <button
                type="button"
                className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg shadow-md transition duration-200 hidden md:block"
                onClick={onOpenCreateModal}
            >
                Create
            </button>
        </div>
    );
};

const ProjectCard: FC<ProjectCardProps> = ({ project, currentUserId, onEdit, onDelete, isDropdownActive, onToggleDropdown, status, onShowDescription }) => {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const isOwner = project.ownerId === currentUserId;
    const isMember = project.members.some(member => member.id === currentUserId);

    // 날짜 형식 YYYY.MM.DD로 변환
    const formatDates = (start: string, end: string) => {
        const format = (dateStr: string) => dateStr.replace(/-/g, '.');
        return `${format(start)} - ${format(end)}`;
    }

    // 드롭다운 메뉴 항목
    const dropdownItems = [
        { label: 'Edit', action: () => onEdit(project), isDestructive: false },
        { label: 'Delete', action: () => onDelete(project.id), isDestructive: true },
    ];

    const members = Array.isArray(project.members) ? project.members : [];
    const MAX_VISIBLE_MEMBERS = 5; // 최대 5명 표시
    const visibleMembers = members.slice(0, MAX_VISIBLE_MEMBERS);
    const extraMembersCount = members.length - MAX_VISIBLE_MEMBERS;
    const cardZIndex = isDropdownActive ? 'z-50' : 'z-10';

    return (
        <div className={`bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-md dark:shadow-lg  hover:shadow-lg transition duration-200 relative border border-gray-100 dark:border-neutral-700 ${cardZIndex}`}>
            {/* 상단 (이름, 날짜, 드롭다운 버튼) */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col flex-grow min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">{project.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                        {formatDates(project.startDate, project.endDate)}
                    </p>
                </div>
                {/* 드롭다운 메뉴 버튼 */}
                <div className="flex-shrink-0 relative">
                    {isOwner ? (
                        <div ref={dropdownRef}>
                            <button
                                onClick={(e: React.MouseEvent) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onToggleDropdown(!isDropdownActive);
                                }}
                                className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition relative z-20"
                            >
                                <MoreVertical className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (  isMember && project.description ? (
                        <div ref={dropdownRef}> {/* useRef 재활용 */}
                            <button
                                onClick={(e: React.MouseEvent) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onShowDescription(project);
                                }}
                                className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition relative z-20"
                                title="프로젝트 설명 보기"
                            >
                                <MoreVertical className="w-5 h-5" />
                            </button>
                        </div>
                    ) : null )}
                </div>
            </div>

            {/* 상태 태그 표시 (status prop 사용) */}
            <div className="mb-4">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                    ${status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'}`
                }>
                    {status}
                </span>
            </div>

            <div className="flex items-center space-x-[-4px] pt-2 border-t border-gray-100 dark:border-neutral-700">
                {visibleMembers.map((member, index) => (
                    <img
                        key={member.id || index}
                        src={member.imageUrl}
                        title={member.name}
                        alt={member.name || 'Team member'}
                        width={24}
                        height={24}
                        className="w-6 h-6 rounded-full object-cover border-2 border-white dark:border-neutral-700 shadow-sm transition transform hover:scale-110"
                        style={{ zIndex: visibleMembers.length - index }}
                    />
                ))}
                {extraMembersCount > 0 && (
                    <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white shadow-sm flex items-center justify-center text-xs font-medium text-gray-600 z-10">
                        +{extraMembersCount}
                    </div>
                )}
            </div>
            {/* 드롭다운 메뉴 (Edit/Delete) */}
            {isDropdownActive && isOwner && (
                <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-10 right-2 bg-gray-800 text-white rounded-lg shadow-2xl z-[100] w-28 overflow-hidden transform origin-top-right transition-all duration-150 ease-out border border-gray-700"
                    style={{zIndex: 100}}
                >
                    {dropdownItems.map(item => (
                        <button
                            key={item.label}
                            className={`w-full text-left px-3 py-2 text-sm transition
                            ${item.isDestructive ? 'text-red-400 hover:bg-gray-700/50' : 'hover:bg-gray-700'}`}
                            onClick={(e: React.MouseEvent) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log(`[Step 1] ${item.label} 버튼 클릭 성공! ID: ${project.id}`);
                                item.action();
                                onToggleDropdown(false);
                            }}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Empty State Component (Inline) ---
const EmptyState: FC<{ selectedCategory: ProjectCategory }> = ({ selectedCategory }) => (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <Folder className="w-16 h-16 text-gray-300" strokeWidth={1} />
        <h3 className="mt-6 text-xl font-semibold text-gray-600">
            {selectedCategory === 'All' ? 'No projects found' : `No projects in "${selectedCategory}"`}
        </h3>
        <p className="mt-1 text-gray-400">
            {selectedCategory === 'All' ? 'Create a new project' : 'Try selecting a different category.'}
        </p>
    </div>
);

interface ProfileDropdownProps {
    onOpenSettings: () => void;
    onLogout: () => void;
}

export const ProfileDropdown: FC<ProfileDropdownProps> = ({ onOpenSettings, onLogout }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState<CurrentUser | null>(null);
    const { isDarkMode, toggleTheme } = useTheme();
    const dropdownRef = useRef<HTMLDivElement>(null);

    // localStorage에서 유저 정보 불러오기
    useEffect(() => {
        const stored = localStorage.getItem("userProfile");
        if (stored) {
            try {
                const parsed: CurrentUser = JSON.parse(stored);
                setUser(parsed);
                // console.log("불러온 유저:", parsed);
            } catch (e) {
                console.error("userProfile 파싱 실패:", e);
            }
        }
    }, [isOpen, onOpenSettings]);

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

    const menuItems = useMemo(() => [
        {
            label: 'Dark Mode',
            icon: Moon,
            action: toggleTheme,
            isToggle: true,
            isToggled: isDarkMode
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
    ], [onOpenSettings, onLogout, isDarkMode, toggleTheme]);

    // 아직 유저 정보가 없을 경우 (로딩 상태)
    if (!user) {
        return null;
    }

    return (
        <div className="relative z-50" ref={dropdownRef}>
            {/* 프로필 표시 영역 (클릭 트리거) */}
            <div
                className="flex items-center space-x-2 cursor-pointer p-1"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Image
                    src={user.profileImageUrl || DEFAULT_USER.profileImageUrl}
                    alt={user.name}
                    width={40}
                    height={40}
                    unoptimized
                    className="w-10 h-10 rounded-full object-cover shadow-inner ring-1 ring-gray-200 dark:ring-neutral-900"
                />
                <div className="flex-col text-xs hidden sm:block">
                    <span className="font-semibold text-gray-900 dark:text-white block">
                        {user.name}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 block">
                        {user.email}
                    </span>
                </div>
            </div>

            {isOpen && (
                <div
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-900 rounded-xl shadow-2xl z-40 p-2 border border-gray-100 dark:border-neutral-700 transform origin-top-right transition-all duration-150 ease-out"
                    role="menu"
                >
                    {menuItems.map((item, index) => (
                        <div
                            key={index}
                            onClick={() => {
                                if (item.isToggle) return; // 다크모드 라벨은 부모 클릭 무시
                                item.action();
                                setIsOpen(false);
                            }}
                            className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg cursor-pointer transition duration-150
                                ${item.isDestructive ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-300/10' : 'text-light-text-primary dark:text-white hover:bg-gray-50 dark:hover:bg-white/5'}
                            `}
                            role="menuitem"
                        >
                            <div className='flex items-center space-x-2'>
                                {item.icon && <item.icon className="w-5 h-5" />}
                                <span className='font-medium'>{item.label}</span>
                            </div>

                            {/* 토글 스위치 (Dark Mode) */}
                            {item.isToggle && (
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={isDarkMode} className="sr-only peer" onChange={toggleTheme} />
                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-neutral-900 after:border after:border-gray-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
// --- NotificationAndInviteIcons Component (새로 정의) ---
interface NotificationAndInviteIconsProps {
    userId: number;
    handleLogout: () => void;
}
export const NotificationAndInviteIcons: FC<NotificationAndInviteIconsProps> = ({ userId, handleLogout }) => {
    // 일반 알림 상태 (INVITE 타입 제외)
    const [unreadNotifications, setUnreadNotifications] = useState<NotificationItem[]>([]);
    const [showAllNotifications, setShowAllNotifications] = useState(false);
    const [showInviteNotifications, setShowInviteNotifications] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inviteDropdownRef = useRef<HTMLDivElement>(null);
    // 초대 목록 상태
    const [invites, setInvites] = useState<ProjectInviteItem[]>([]);
    // "Pending" 상태인 초대 목록 상태
    const pendingInvites:ProjectInviteItem[] = invites.filter((inv) => inv.status === "PENDING");
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [toast, setToast] = useState<string | null>(null);

    const router = useRouter();

    // Fetch General Notifications (Bell Icon)
    const fetchGeneralNotifications = useCallback(async () => {
        if (!userId) return;

        try {
            const endpoint = API_ENDPOINTS.FETCH_UNREAD_NOTIFICATIONS_BY_USER(userId);
            console.log(`API 호출: ${endpoint}로 읽지 않은 일반 알림 조회 요청`);
            const response = await fetchWithAuth(endpoint, {method: 'GET'});

            if (response.ok) {
                const result = await response.json();
                const notifications: NotificationItem[] = Array.isArray(result.data) ? result.data : [];
                // INVITE 타입은 별도로 처리되므로, 일반 알림 목록에서 필터링하여 제외합니다.
                const generalNotifications = notifications.filter(n => n.type !== 'INVITE');
                setUnreadNotifications(generalNotifications);
                console.log('읽지 않은 일반 알림 조회 성공:', generalNotifications.length, '개');
            } else if (response.status === 401) {
                handleLogout();
            } else {
                console.error('읽지 않은 일반 알림 로드 실패:', response.status);
            }
        } catch (_error) {
            console.error("일반 알림 목록 로드 중 오류:", _error);
            if (_error instanceof Error && _error.message.includes("SESSION_EXPIRED")) {
                await handleLogout();
            }
        }
    }, [userId, handleLogout]);

    // Fetch Project Invites (Mail Icon) - 전용 API 사용
    const fetchProjectInvites = useCallback(async () => {
        if (!userId) return;

        try {
            const endpoint = API_ENDPOINTS.FETCH_PROJECT_INVITES_ME;
            console.log(`API 호출: ${endpoint}로 프로젝트 초대 목록 조회 요청`);
            const response = await fetchWithAuth(endpoint, { method: 'GET' });

            if (response.ok) {
                const result = await response.json();
                const inviteData: ProjectInviteResponse = result.data;
                // totalElements를 사용하여 초대장 수를 계산합니다.
                // 초대 목록 상태에 저장
                const inviteList = inviteData.content || [];
                setInvites(inviteList);
                // totalElements를 사용하여 초대장 수를 계산
                const inviteCount = inviteData.totalElements || 0;
                console.log('읽지 않은 프로젝트 초대 조회 성공:', inviteCount, '개');
            } else if (response.status === 401) {
                handleLogout();
            } else {
                console.error('프로젝트 초대 로드 실패:', response.status);
            }
        } catch (_error) {
            console.error("프로젝트 초대 목록 로드 중 오류:", _error);
            if (_error instanceof Error && _error.message.includes("SESSION_EXPIRED")) {
                await handleLogout();
            }
        }
    }, [userId, handleLogout]);

    useEffect(() => {
        fetchGeneralNotifications();
        fetchProjectInvites();

        // 1분(60000ms)마다 알림 목록 갱신
        const intervalId = setInterval(() => {
            fetchGeneralNotifications();
            fetchProjectInvites();
        }, 60000);

        return () => clearInterval(intervalId);
    }, [fetchGeneralNotifications, fetchProjectInvites, notifications]);
    // 외부 클릭 감지 로직 (드롭다운을 닫기 위해 필요)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowAllNotifications(false);
            }
            if(inviteDropdownRef.current && !inviteDropdownRef.current.contains(event.target as Node)) {
                setShowInviteNotifications(false);
            }
        };
        if (showAllNotifications) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        if (showInviteNotifications) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showAllNotifications, showInviteNotifications]);

    // 알림 클릭 시 (읽음 처리 API 호출)
    const handleNotificationClick = async (notification: NotificationItem) => {
        console.log(`알림 클릭: ID ${notification.id}, 타입 ${notification.type}`);

        try {
            // 1. API 호출
            const endpoint = API_ENDPOINTS.MARK_NOTIFICATION_AS_READ(notification.id);
            console.log(`API 호출: ${endpoint}로 알림 읽음 처리 요청`);

            const response = await fetchWithAuth(endpoint, {
                method: 'POST', // @PostMapping과 일치
                headers: { 'Content-Type': 'application/json' },
                // @RequestBody가 없으므로 body는 보내지 않음 (정상)
            });

            if (response.ok) {
                console.log('알림 읽음 처리 성공 (ID:', notification.id, ')');

                // 2. UI에서 즉시 알림 제거
                setUnreadNotifications(prevNotifications =>
                    prevNotifications.filter(n => n.id !== notification.id)
                );
            } else if (response.status === 401) {
                console.error("알림 읽음 처리 중 인증 오류, 로그아웃 처리");
                handleLogout(); // 세션 만료 시 로그아웃
            } else {
                console.error('알림 읽음 처리 실패:', response.status);
            }

        } catch (_error) {
            console.error("알림 읽음 처리 중 네트워크 오류:", _error);
            if (_error instanceof Error && _error.message.includes("SESSION_EXPIRED")) {
                await handleLogout();
            }
        }

        // 4. 드롭다운 닫기
        setShowAllNotifications(false);
    };

    // 해당 알림의 프로젝트로 이동
    const handleMoveProject= (notification: NotificationItem) => {
        if(!notification.projectId) {
            alert("Project not found.");
            return
        }
        handleNotificationClick(notification);
        router.push(`/calendar/${notification.projectId}`);
    }

    // '모두 읽음' 처리 함수
    const handleMarkAllAsRead = async () => {
        // 읽을 알림이 없으면 함수 종료
        if (unreadNotifications.length === 0) return;

        console.log('API 호출: 모든 알림 읽음 처리 요청');

        try {
            const endpoint = API_ENDPOINTS.MARK_ALL_NOTIFICATIONS_AS_READ;
            const response = await fetchWithAuth(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                console.log('모든 알림 읽음 처리 성공');
                // 1. UI에서 즉시 모든 알림 제거
                setUnreadNotifications([]);
                // 2. 드롭다운 닫기
                setShowAllNotifications(false);
            } else if (response.status === 401) {
                console.error("모든 알림 읽음 처리 중 인증 오류, 로그아웃 처리");
                handleLogout();
            } else {
                console.error('모든 알림 읽음 처리 실패:', response.status);
            }

        } catch (_error) {
            console.error("모든 알림 읽음 처리 중 네트워크 오류:", _error);
            if (_error instanceof Error && _error.message.includes("SESSION_EXPIRED")) {
                await handleLogout();
            }
        }
    }; // <-- [수정] 여기서 함수가 닫혀야 합니다.

    // 초대 수락/거절 핸들러
    const handleInviteAction = async (inviteId: number, action: string)=> {
        if (!inviteId) {
            console.log("inviteId 없음");
            return
        };
        try {
            const msg = await inviteAation(inviteId, action);
            console.log("msg: ", msg);
            alert("Action successful.");
            await fetchProjectInvites();
        } catch (err:unknown) {
            console.error("프로젝트 수락/거절 실패:", err);
            alert("Failed");
        };
    };

    // 날짜 포맷 함수
    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleString("ko-KR", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

    // 날짜 포맷팅 헬퍼 함수
    const formatSentAt = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };


    // 실시간 알림을 위한 WebSocket 연결
    useNotificationStream(userId, (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setToast(notification.message);
        console.log("새 알림 상태 반영:", notification);
    });

    return (
        <div className="flex items-center space-x-3 sm:space-x-5">
            {/* 알람 오면 뜸*/}
            {toast && <Toast message={toast} onClose={() => setToast(null)} />}
            {/* 초대 보관함 아이콘 */}
            <div className="relative" ref={inviteDropdownRef}>
                <button
                    onClick={() => setShowInviteNotifications(prev => !prev)}
                    className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-gray-200 transition duration-150 rounded-full hover:bg-gray-100 dark:hover:bg-white/5"
                    aria-label="초대 보관함"
                >
                    <Mail className="w-6 h-6" />
                    {pendingInvites.length > 0 && ( // unreadInviteCount 상태 사용
                        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full min-w-[1.2rem]">
                            {pendingInvites.length}
                        </span>
                    )}
                </button>
                {showInviteNotifications && (
                    <div className="absolute right-0 mt-2 w-72 md:w-80 bg-white dark:bg-neutral-900 rounded-xl shadow-2xl z-[120] p-2 border border-gray-100 dark:border-neutral-700 transform origin-top-right transition-all duration-150 ease-out max-h-96 overflow-y-auto">
                        <div className="flex justify-between items-center px-3 py-2 border-b border-gray-100 dark:border-neutral-700 ">
                            <h4 className="text-sm font-semibold text-gray-800 dark:text-white">Invitations ({pendingInvites.length})</h4>
                            <button
                                onClick={() => setShowInviteNotifications(false)}
                                className="text-gray-400 hover:text-gray-600 dark:text-neutral-500 dark:hover:text-gray-300"
                                aria-label="닫기"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        {/* 비어 있을 때 */}
                        {pendingInvites.length === 0 ? (
                            <p className="p-3 text-sm text-gray-500 text-center inline-flex items-center justify-center gap-1">
                                Nothing here<Dog className="stroke-1"/>
                            </p>
                        ) : (
                            pendingInvites.map((invite, idx) => (
                                <div
                                    key={idx}
                                    className="px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition duration-150 border-b dark:border-neutral-700 last:border-b-0"
                                >
                                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                                        {invite.projectName}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
                                        초대한 사람: {invite.inviterEmail}
                                    </p>

                                    <div className="flex justify-between items-center mt-2">
                                        <div className="flex flex-col text-xs text-gray-500 dark:text-gray-400">
                                            <span>만료일: {formatDate(invite.expiresAt)}</span>
                                        </div>
                                        <div className="flex justify-end gap-1 mt-3">
                                            <button
                                                onClick={() => handleInviteAction(invite.id, "accept")}
                                                className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 px-2 py-1 rounded-md hover:bg-green-50 dark:hover:bg-green-900/30 transition"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleInviteAction(invite.id, "decline")}
                                                className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* 알림 아이콘 */}
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setShowAllNotifications(prev => !prev)}
                    className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition duration-150 rounded-full hover:bg-gray-100 dark:hover:bg-white/5"
                    aria-label="알림"
                >
                    <Bell className="w-6 h-6" />
                    {unreadNotifications.length > 0 && ( // unreadNotifications 상태 사용
                        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-blue-100 transform translate-x-1/2 -translate-y-1/2 bg-blue-600 rounded-full min-w-[1.2rem]">
                            {unreadNotifications.length}
                        </span>
                    )}
                </button>

                {/* 알림 드롭다운 메뉴 */}
                {showAllNotifications && (
                    <div className="absolute right-0 mt-2 w-72 md:w-80 bg-white dark:bg-neutral-900 rounded-xl shadow-2xl z-[120] p-2 border border-gray-100 dark:border-neutral-700 transform origin-top-right transition-all duration-150 ease-out max-h-96 overflow-y-auto">
                        <div className="flex justify-between items-center px-3 py-2 border-b border-gray-100 dark:border-neutral-700 ">
                            <h4 className="text-sm font-semibold text-gray-800 dark:text-white">New Notifications ({unreadNotifications.length})</h4>
                            <button
                                onClick={() => setShowAllNotifications(false)}
                                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                                aria-label="닫기"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        {unreadNotifications.length === 0 ? (
                            <p className="p-3 text-sm text-gray-500 text-center inline-flex items-center justify-center gap-1">
                                Nothing here<Cat className="stroke-1"/></p>
                        ) : (
                            unreadNotifications.map((n) => (
                                <div
                                    key={n.id}
                                    onClick={() => handleNotificationClick(n)}
                                    className="flex justify-between items-start px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition duration-150 border-b dark:border-neutral-700 last:border-b-0"
                                >
                                    {/* 왼쪽 텍스트 */}
                                    <div className="flex-1 space-y-1.5">
                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                                            {n.message}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                                            프로젝트: <span className="font-medium not-italic text-gray-700 dark:text-gray-300">{n.projectName}</span>
                                        </p>
                                        <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                                            {formatSentAt(n.sentAt)}
                                        </p>
                                    </div>

                                    {/* 오른쪽 버튼 */}
                                    <button
                                        className="ml-3 shrink-0 p-1 rounded-full transition duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 group"
                                        onClick={() => handleMoveProject(n)}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                             viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25"
                                             strokeLinecap="round" strokeLinejoin="round"
                                             className="lucide lucide-circle-arrow-right-icon lucide-circle-arrow-right">
                                            <circle cx="12" cy="12" r="10"/>
                                            <path d="m12 16 4-4-4-4"/>
                                            <path d="M8 12h8"/>
                                        </svg>
                                    </button>
                                </div>
                            ))
                        )}
                        {/* 더미 '모두 읽음' 버튼 */}
                        {/* [수정] '모두 읽음' 버튼 (API 연결 및 조건부 렌더링) */}
                        {unreadNotifications.length > 0 && (
                            <div className='p-2 border-t border-gray-100 dark:border-neutral-700 mt-1'>
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className='w-full text-center text-sm text-blue-600 hover:text-blue-700 py-1 rounded-md hover:bg-blue-50 dark:hover:bg-gray-800 transition'
                                >
                                    모든 알림 읽음으로 표시
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Main Dashboard Page ---
const ProjectDashboardPage: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isLoading: isLoadingUser, logout, fetchUserProfile } = useUser();
    const [isLoadingProjects, setIsLoadingProjects] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<ProjectCategory>('All');
    const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    // --- 모달 상태 관리 ---
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [descriptionModalProject, setDescriptionModalProject] = useState<Project | null>(null);
    const [isChanged, setIsChanged] = useState(false); // 이름 변경 여부 상태 추가

    // ProfileSettingsModal 닫힐 때 유저 정보 재조회
    useEffect(() => {
        // 모달이 닫히고, 이름, 프로필 실제로 변경된 경우만 재조회
        if (!isSettingsModalOpen && isChanged) {
            const token = localStorage.getItem("accessToken");
            if (token) {
                console.log("유저 정보 변경 감지됨 → 유저 정보 다시 조회 중...");
                fetchUserProfile(token);
                setIsChanged(false); // 한 번만 실행되도록 초기화
            }
        }
    }, [isSettingsModalOpen, isChanged, fetchUserProfile]);

    const handleLogout = useCallback(async () => {
        await logout();
        router.push('/');
    }, [logout, router]);

    const fetchProjects = useCallback(async () => {
        if (!user) return;
        setIsLoadingProjects(true);
        try {
            console.log(`API 호출: ${API_PROJECTS_ENDPOINT}로 프로젝트 목록 조회 요청`);
            const response = await fetchWithAuth(API_PROJECTS_ENDPOINT, { method: 'GET' });
            if (response.ok) {
                const result = await response.json();
                const rawData = (result.data as { content: ServerProjectItem[] | ServerProjectItem })?.content;
                const rawDataArray = Array.isArray(rawData) ? rawData : (rawData ? [rawData] : []);

                const projectsData: Project[] = rawDataArray.map((item: ServerProjectItem) => ({
                    id: item.id,
                    name: item.name,
                    description: item.description || undefined,
                    startDate: item.startDate,
                    endDate: item.endDate,
                    ownerId: item.ownerId,
                    status: item.status,
                    memberStatus: item.memberStatus,
                    members: Array.isArray(item.members) ?
                        item.members.map((member: ServerMember): TeamMemberForCard => ({
                            id: member.userId,
                            name: member.name,
                            // 'default_url' 대신 DEFAULT_USER.imageUrl을 사용
                            imageUrl: member.profileImageUrl || DEFAULT_USER.profileImageUrl,
                        })) : [],
                }));
                const activeProjects = projectsData.filter((project: Project) =>
                    project.memberStatus === 'ACTIVE'
                );
                setProjects(projectsData);
                console.log('프로젝트 목록 조회 성공:', projectsData.length, '개');
            } else if (response.status === 401) {
                console.error("AccessToken 및 RefreshToken 만료. 로그아웃 처리 필요.");
                handleLogout(); // 로그아웃 처리
            } else {
                console.error('프로젝트 목록 로드 실패:', response.status);
            }
        } catch (_error) {
            if (_error instanceof Error && _error.message === "SESSION_EXPIRED: Refresh token is invalid or missing. Must log out.") {
                console.error("세션 만료 감지. 강제 로그아웃 및 홈 리디렉션 처리.");
                await handleLogout(); // handleLogout이 router.push('/')를 포함하고 있습니다.
            } else {
                console.error("프로젝트 목록 로드 중 네트워크 오류 또는 알 수 없는 오류:", _error);
            }
        } finally {
            setIsLoadingProjects(false);
        }
    }, [handleLogout]);

    useEffect(() => {
        if (!isLoadingUser && user.id) {
            fetchProjects();
        }
    }, [isLoadingUser, user.id, fetchProjects]);
    // 프로젝트 생성 핸들러
    const handleCreateProject = async (data: ProjectFormData) => {
        const projectData = {
            id: Date.now(),
            name: data.name,
            description: data.description,
            startDate: data.startDate,
            endDate: data.endDate,
            // status: 'In Progress',
        };
        try {
            console.log('API 호출: 프로젝트 생성 (POST) 요청 중...');
            const response = await fetchWithAuth(API_PROJECTS_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(projectData),
            });
            if (response.ok) {
                const result = await response.json();
                const responseData: { content?: ServerProjectItem } | ServerProjectItem = result.data;
                const serverProject = (responseData as { content?: ServerProjectItem }).content || (responseData as ServerProjectItem);
                if (!serverProject || !serverProject.id) {
                    console.error("프로젝트 생성 성공 응답에 필수 ID 필드가 누락되었습니다.", serverProject);
                    alert("프로젝트 생성에는 성공했으나, 목록 조회 오류로 표시되지 않습니다. 새로고침해보세요.");
                    fetchProjects(); // 서버에 다시 요청하여 목록 동기화 시도
                    return;
                }
                const defaultMember: TeamMemberForCard = {
                    id: user.id || 0,
                    name: user.name || 'Owner',
                    imageUrl: user.profileImageUrl || DEFAULT_USER.profileImageUrl,
                };

                const createdProject: Project = {
                    id: serverProject.id,
                    name: serverProject.name || data.name,
                    description: serverProject.description || data.description,
                    startDate: serverProject.startDate || data.startDate,
                    endDate: serverProject.endDate || data.endDate,
                    ownerId: serverProject.ownerId || user.id || 0,
                    status: serverProject.status as ServerProjectStatus,
                    memberStatus: serverProject.memberStatus,
                    members: Array.isArray(serverProject.members)
                        ? serverProject.members.map((m: ServerMember): TeamMemberForCard => ({
                            id: m.userId,
                            name: m.name,
                            imageUrl: m.profileImageUrl || DEFAULT_USER.profileImageUrl
                        }))
                        : [defaultMember],
                };
                setProjects(prev => [createdProject, ...prev]);
                console.log('프로젝트 생성 성공 및 상태 업데이트 완료:', createdProject.name);
                setIsCreateModalOpen(false); // 생성 후 모달 닫기
            } else if (response.status === 401) {
                console.error("인증 실패. 로그아웃 처리 필요.");
                handleLogout();
            } else {
                console.error('프로젝트 생성 실패:', response.status, await response.text());
                // 생성 실패 시 사용자에게 알림 (옵션)
                alert("프로젝트 생성에 실패했습니다. 다시 시도해 주세요.");
            }
        } catch (error) {
            if (error instanceof Error && error.message === "SESSION_EXPIRED: Refresh token is invalid or missing. Must log out.") {
                console.error("세션 만료 감지. 강제 로그아웃 및 홈 리디렉션 처리.");
                await handleLogout();
            } else {
                console.error("프로젝트 생성 중 네트워크 오류 또는 알 수 없는 오류:", error);
                alert("네트워크 연결에 문제가 발생했습니다.");
            }
        }
    };

    const handleOpenEditModal = (project: Project) => {
        console.log(`[Step 2] 모달 열기 핸들러 시작. 프로젝트: ${project.name}`);
        setEditingProject(project); // 편집할 프로젝트 설정
        setIsEditModalOpen(true);   // 모달 열기
        console.log('[Step 3] setEditingProject 및 setIsEditModalOpen 호출 완료.');
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingProject(null); // 상태 초기화
        setActiveDropdownId(null);
    };

    // 프로젝트 업데이트 API 로직 수정
    const handleUpdateProject = async (data: ProjectFormData) => {
        if (!editingProject) return;

        try {
            console.log(`API 호출: ${API_PROJECTS_ENDPOINT}/${editingProject.id} 프로젝트 수정 (PUT) 요청 중...`);
            const response = await fetchWithAuth(`${API_PROJECTS_ENDPOINT}/${editingProject.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: data.name,
                    description: data.description,
                    startDate: data.startDate,
                    endDate: data.endDate,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                const updatedServerProject = result.data as ServerProjectItem;

                setProjects(prev => prev.map(p => {
                    if (p.id !== editingProject.id) return p;

                    // 서버 응답으로 받은 필드를 사용하여 프로젝트 상태 업데이트
                    const updatedProject: Project = {
                        ...p,
                        name: updatedServerProject.name || data.name,
                        description: updatedServerProject.description || data.description,
                        startDate: updatedServerProject.startDate || data.startDate,
                        endDate: updatedServerProject.endDate || data.endDate,
                        status: updatedServerProject.status as ServerProjectStatus,
                    };
                    return updatedProject;
                }));
                console.log('Project updated successfully.');
                handleCloseEditModal(); // 성공 시 모달 닫기
            } else {
                console.error('프로젝트 업데이트 실패:', response.status, await response.text());
                alert(`프로젝트 업데이트에 실패했습니다. (상태 코드: ${response.status})`);
            }
        } catch (_error) {
            console.error('프로젝트 업데이트 중 네트워크 오류:', _error);
            alert('네트워크 오류로 프로젝트를 업데이트할 수 없습니다.');
        }
    };

    const handleOpenDescriptionModal = useCallback((project: Project) => {
        setDescriptionModalProject(project);
    }, []);

    const handleCloseDescriptionModal = useCallback(() => {
        setDescriptionModalProject(null);
    }, []);

    const handleDeleteProject = async (projectId: number) => {
        if (window.confirm('정말로 이 프로젝트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            try {
                const response = await fetchWithAuth(`${API_PROJECTS_ENDPOINT}/${projectId}`, {
                    method: 'DELETE',
                });

                if (response.ok) { // 상태 업데이트: 목록에서 삭제된 프로젝트 제거
                    setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId));
                    console.log('프로젝트 삭제 성공:', projectId);
                } else {
                    console.error('프로젝트 삭제 실패:', response.status);
                    alert('프로젝트 삭제에 실패했습니다.');
                }
            } catch (error) {
                console.error('프로젝트 삭제 중 네트워크 오류:', error);
                alert('네트워크 오류로 프로젝트를 삭제할 수 없습니다.');
            } finally {
                setActiveDropdownId(null); // 드롭다운 닫기
            }
        }
    };

    // 초대 수락 감지
    useEffect(() => {
        const inviteAccepted = searchParams.get('inviteAccepted');

        // 쿼리 파라미터가 있고, user.id가 로드되었을 때만 실행
        if (inviteAccepted === 'true' && user.id) {
            console.log("Invite accepted: Forcing project list refresh.");
            fetchProjects();

            // 한 번 사용한 쿼리 파라미터를 제거하여 새로고침 루프를 방지
            router.replace('/dashboard', { scroll: false });
        }
        // user.id, fetchProjects, searchParams는 의존성 배열에 포함되어야 함
    }, [searchParams, user.id, fetchProjects, router]);

    // 외부 클릭 감지 로직 (드롭다운을 닫기 위해 필요)
    const projectGridRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // 프로젝트 그리드 영역 외부를 클릭하고, 활성화된 드롭다운이 있을 때
            if (projectGridRef.current && !projectGridRef.current.contains(event.target as Node) && activeDropdownId !== null) {
                setActiveDropdownId(null);
            }
        };

        if (activeDropdownId !== null) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeDropdownId]);

    // 프로젝트 필터링 로직을 useMemo로 구현
    const filteredProjects = useMemo(() => {
        const filtered = projects.filter(project => {
            if (selectedCategory === 'All') {
                return true;
            }
            // 서버 상태를 UI 상태로 변환하여 현재 선택된 카테고리(activeCategory)와 비교
            return mapServerStatusToUI(project.status) === selectedCategory;
        });
        // 2. 정렬 (추가된 로직: 'All'일 때만 적용, 진행 중 -> 완료 순)
        if (selectedCategory === 'All') {
            filtered.sort((a, b) => {
                const statusA = mapServerStatusToUI(a.status);
                const statusB = mapServerStatusToUI(b.status);

                // 'In Progress'를 'Completed'보다 앞에 두도록 정렬합니다.
                if (statusA === 'In Progress' && statusB === 'Completed') { return -1; }
                if (statusA === 'Completed' && statusB === 'In Progress') { return 1; }
                // 동일 상태일 경우 이름 순(선택 사항) 또는 다른 기준(예: 시작일)으로 정렬
                return 0;
                return new Date(a.startDate).getTime() - new Date(b.startDate).getTime(); // 시작일 오름차순 정렬
            });
        }
        return filtered;
    }, [projects, selectedCategory]);

    const handleOpenSettingsModal = () => setIsSettingsModalOpen(true);
    const handleCloseSettingsModal = () => setIsSettingsModalOpen(false);

    if (isLoadingUser || isLoadingProjects) {
        return (
            <div className="min-h-screen bg-gray-50 font-sans flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
                    <p className="mt-4 text-gray-700 font-medium">Loading user profile...</p>
                </div>
            </div>
        );
    }
    const currentUserName = user.name || 'Guest';
    const handleProjectLeft = () => {
        fetchProjects();
        setProjects(prev => prev.filter(p => p.id !== descriptionModalProject?.id));
    };

    return (
    <div className="min-h-screen transition-colors duration-300 font-sans bg-gray-50 dark:bg-neutral-900">
        {/* 상단 통합 헤더 영역 */}
        <header className="flex justify-between items-center py-3 px-8 border-b border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-900 sticky top-0 z-[110] shadow-md">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">My projects</h1>
                <div className="flex items-center space-x-4"> {/* 유저 프로필 */}
                    {/*초대함, 알림 아이콘*/}
                    {user.id && (
                        <NotificationAndInviteIcons
                            userId={user.id}
                            handleLogout={handleLogout}
                        />
                    )}

                    {/* 유저 프로필 */}
                    <ProfileDropdown
                        onOpenSettings={handleOpenSettingsModal}
                        onLogout={handleLogout}
                    />
                </div>
            </header>

            {/* 메인 콘텐츠 영역 */}
            <main className="p-8 md:p-10 max-w-7xl mx-auto">
                {/* 카테고리 필터링 컴포넌트 */}
                <ProjectCategoryFilter
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                    onOpenCreateModal={() => setIsCreateModalOpen(true)}
                />
                {/* 프로젝트 목록 표시 */}
                {isLoadingProjects ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-800"></div>
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <EmptyState selectedCategory={selectedCategory} />
                ) : (
                    <div ref={projectGridRef} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredProjects.map(project => (
                            <div key={project.id}
                                 onClick={() => activeDropdownId === null && router.push(`/calendar/${project.id}`)}
                                 className={activeDropdownId === null ? "cursor-pointer" : "cursor-default"}>
                                <ProjectCard
                                    project={project}
                                    currentUserId={user?.id || null}
                                    onEdit={handleOpenEditModal}
                                    onDelete={handleDeleteProject}
                                    isDropdownActive={activeDropdownId === project.id}
                                    onToggleDropdown={(isActive) => setActiveDropdownId(isActive ? project.id : null)}
                                    status={mapServerStatusToUI(project.status)}
                                    onShowDescription={handleOpenDescriptionModal}
                            />
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* 모바일용 Floating Action Button (FAB) 추가 */}
            <button
                onClick={() => setIsCreateModalOpen(true)}
                className="fixed bottom-6 right-6 z-50 bg-gray-800 hover:bg-gray-700 text-white rounded-full p-4 shadow-xl transition duration-200 active:bg-gray-800 md:hidden"
                aria-label="프로젝트 생성"
            > <Plus className="w-6 h-6" />
            </button>

            {/* 모달 렌더링 */}
            <CreateProjectModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                userName={currentUserName}
                onCreateProject={handleCreateProject}
            />
            <ProfileSettingsModalTyped
                isOpen={isSettingsModalOpen}
                onClose={handleCloseSettingsModal}
                apiEndpoints={API_ENDPOINTS}
                onChanged={() => setIsChanged(true)}
            />
            {/* editingProject가 null이 아닐 때만 렌더링 */}
            {editingProject && (
                <>
                {console.log('[Step 4] EditProjectModal 컴포넌트 렌더링 시작.', { isOpen: isEditModalOpen, project: editingProject.name })}
                <EditProjectModal
                    isOpen={isEditModalOpen}
                    onClose={handleCloseEditModal}
                    onUpdateProject={handleUpdateProject}
                    projectToEdit={editingProject}
                />
                </>
            )}
            {descriptionModalProject && (
                <ProjectDescriptionModal
                    isOpen={true}
                    onClose={handleCloseDescriptionModal}
                    projectName={descriptionModalProject.name}
                    description={descriptionModalProject.description || ''}
                    projectId={descriptionModalProject.id}
                    onProjectLeft={handleProjectLeft}
                />
            )}
        </div>
    );
};

export default ProjectDashboardPage;