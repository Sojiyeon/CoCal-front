"use client";

import React, { useState, FC, useRef, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Folder, MoreVertical, Moon, Settings, LogOut, Plus } from 'lucide-react';
import CreateProjectModal, { ProjectFormData } from '@/components/modals/CreateProjectModal';
import EditProjectModal from '@/components/modals/EditProjectModal';
import ProfileSettingsModal from '@/components/modals/ProfileSettingModal';
import { useUser } from '@/contexts/UserContext';
import { fetchWithAuth } from '@/utils/authService';

const API_BASE_URL = 'https://cocal-server.onrender.com';
const API_PROJECTS_ENDPOINT = `${API_BASE_URL}/api/projects`;

const API_ENDPOINTS = {
    UPDATE_USER_NAME: `${API_BASE_URL}/api/users/edit-name`,
    UPDATE_USER_PASSWORD: `${API_BASE_URL}/api/users/edit-pwd`,
    UPDATE_USER_PHOTO: `${API_BASE_URL}/api/users/profile-image`,
    DELETE_USER_PHOTO: `${API_BASE_URL}/api/users/profile-image`,
};

// --- DUMMY DATA & TYPES ---

// UI에 표시 및 필터링에 사용할 상태 타입
type ProjectCategory = 'All' | 'In Progress' | 'Completed';
// 서버에서 내려주는 상태 타입
type ServerProjectStatus = 'IN_PROGRESS' | 'COMPLETED';

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
interface ServerProjectItem {
    id: number;
    name: string;
    description: string | null;
    startDate: string;
    endDate: string;
    ownerId: number;
    members: ServerMember[]; // 타입 안정성 확보
    status: ServerProjectStatus; // 서버 응답에 status 포함
}

interface Project {
    id: number;
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
    status: ServerProjectStatus; // 서버 상태 그대로 저장
    members: TeamMemberForCard[];
    ownerId: number;
}

interface CurrentUser {
    id: number | null;
    name: string;
    email: string;
    imageUrl: string;
    profileImageUrl?: string;
}

// 사용자 정보의 기본값
const DEFAULT_USER: CurrentUser = {
    id: null,
    name: 'Guest',
    email: 'guest@example.com',
    imageUrl: 'https://placehold.co/100x100/A0BFFF/FFFFFF?text=Guset', // 임시 이미지
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
}

// ProfileSettingsModal의 prop 타입 오류 방지를 위해 임시 타입 정의 사용
const ProfileSettingsModalTyped: FC<ProfileSettingsModalProps> = ProfileSettingsModal;

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
    onToggleDropdown: (active: boolean) => void;
    // UI에서 사용할 status를 prop으로 받습니다.
    status: 'In Progress' | 'Completed';
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
            <div className="flex space-x-8 border-b border-gray-200">
                {categories.map(category => (
                    <button
                        key={category}
                        onClick={() => onSelectCategory(category)}
                        className={`py-2 text-lg font-medium transition duration-200 
                ${selectedCategory === category
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
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

const ProjectCard: FC<ProjectCardProps> = ({ project, currentUserId, onEdit, onDelete, isDropdownActive, onToggleDropdown, status }) => {
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
        <div className={`bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition duration-200 relative border border-gray-100 ${cardZIndex}`}>
            {/* 상단 (이름, 날짜, 드롭다운 버튼) */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col flex-grow min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{project.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">
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
                                className="p-1 text-gray-400 hover:text-gray-700 transition relative z-20"
                            >
                                <MoreVertical className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (  isMember && project.description ? (
                        <p className="text-xs text-gray-600 line-clamp-2 mt-1 w-24 text-right">
                            {project.description}
                        </p>
                    ) : null )}
                </div>
            </div>

            {/* 상태 태그 표시 (status prop 사용) */}
            <div className="mb-4">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full 
                    ${status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`
                }>
                    {status}
                </span>
            </div>

            <div className="flex items-center space-x-[-4px] pt-2 border-t border-gray-100">
                {visibleMembers.map((member, index) => (
                    <img
                        key={member.id || index}
                        src={member.imageUrl}
                        title={member.name}
                        alt={member.name || 'Team member'}
                        className="w-6 h-6 rounded-full object-cover border-2 border-white shadow-sm transition transform hover:scale-110"
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
                    style={{ zIndex: 100 }}
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
    user: CurrentUser;
    onOpenSettings: () => void;
    onLogout: () => void;
}

const ProfileDropdown: FC<ProfileDropdownProps> = ({ user, onOpenSettings, onLogout }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

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
            {/* 프로필 표시 영역 (클릭 트리거) */}
            <div
                className="flex items-center space-x-2 cursor-pointer p-1"
                onClick={() => setIsOpen(!isOpen)}
            >
                <img
                    src={user.imageUrl.replace('96x96', '40x40')}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover shadow-inner ring-1 ring-gray-200"
                    onError={(e) => { e.currentTarget.src = 'https://placehold.co/100x100/A0BFFF/FFFFFF?text=User' }}
                />
                <div className="flex-col text-xs hidden sm:block">
                    <span className="font-semibold text-gray-900 block">
                        {user.name}
                    </span>
                    <span className="text-gray-500 block">
                        {user.email}
                    </span>
                </div>
            </div>

            {isOpen && (
                <div
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl z-40 p-2 border border-gray-100 transform origin-top-right transition-all duration-150 ease-out"
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

                            {/* 토글 스위치 (Dark Mode) */}
                            {item.isToggle && (
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={item.isToggled} className="sr-only peer" readOnly />
                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Main Dashboard Page ---
/*
const calculateProjectStatus = (startDateStr: string, endDateStr: string): 'In Progress' | 'Completed' => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDateStr);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDateStr);
    end.setHours(0, 0, 0, 0);

    // IN_PROGRESS가 서버에서는 현재 날짜가 시작일과 종료일 사이일 때를 의미한다고 가정
    if (end.getTime() < today.getTime()) {
        return 'Completed';
    }
    return 'In Progress';
};
*/
const ProjectDashboardPage: React.FC = () => {
    const router = useRouter();
    const { user, isLoading: isLoadingUser, logout } = useUser();
    const [isLoadingProjects, setIsLoadingProjects] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<ProjectCategory>('All');
    const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);
    // --- 모달 상태 관리 ---
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    const handleLogout = useCallback(async () => {
        await logout();
        router.push('/');
    }, [logout, router]);

    const fetchProjects = useCallback(async () => {
        // ... (API 호출 및 응답 처리 로직은 그대로 유지)
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
                    members: Array.isArray(item.members) ?
                        item.members.map((member: ServerMember): TeamMemberForCard => ({
                            id: member.userId,
                            name: member.name,
                            imageUrl: member.profileImageUrl || 'default_url',
                        })) : [],
                }));
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
                    imageUrl: user.profileImageUrl || DEFAULT_USER.imageUrl,
                };

                const createdProject: Project = {
                    id: serverProject.id,
                    name: serverProject.name || data.name,
                    description: serverProject.description || data.description,
                    startDate: serverProject.startDate || data.startDate,
                    endDate: serverProject.endDate || data.endDate,
                    ownerId: serverProject.ownerId || user.id || 0,
                    status: serverProject.status as ServerProjectStatus,
                    members: Array.isArray(serverProject.members)
                        ? serverProject.members.map((m: ServerMember): TeamMemberForCard => ({
                            id: m.userId,
                            name: m.name,
                            imageUrl: m.profileImageUrl || DEFAULT_USER.imageUrl
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
                        // 서버 응답의 날짜를 사용하여 상태 재계산
                        /*
                        status: calculateProjectStatus(
                            updatedServerProject.startDate || data.startDate,
                            updatedServerProject.endDate || data.endDate
                        ),
*/
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

    const handleToggleDropdown = (projectId: number, active: boolean) => {
        // 이미 열려 있는 드롭다운이 있다면 닫고, 현재 드롭다운을 열거나 닫습니다.
        setActiveDropdownId(active ? projectId : null);
    };

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
        return projects.filter(project => {
            if (selectedCategory === 'All') {
                return true;
            }
            // 서버 상태를 UI 상태로 변환하여 현재 선택된 카테고리(activeCategory)와 비교
            return mapServerStatusToUI(project.status) === selectedCategory;
        });
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
    const displayUser: CurrentUser = {
        id: user.id,
        name: user.name || DEFAULT_USER.name,
        email: user.email || DEFAULT_USER.email,
        imageUrl: user.profileImageUrl || DEFAULT_USER.imageUrl,
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* 상단 통합 헤더 영역 */}
            <header className="flex justify-between items-center py-5 px-8 border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
                <h1 className="text-2xl font-bold text-gray-800">My projects</h1>

                <div className="flex items-center space-x-4"> {/* 유저 프로필 */}
                    <ProfileDropdown
                        user={displayUser}
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
                                    onToggleDropdown={(active) => handleToggleDropdown(project.id, active)}
                                    status={mapServerStatusToUI(project.status)}
                            />
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* 모바일용 Floating Action Button (FAB) 추가 */}
            <button
                onClick={() => setIsCreateModalOpen(true)}
                className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white rounded-full p-4 shadow-xl transition duration-200 hover:bg-blue-700 active:bg-blue-800 md:hidden"
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
        </div>
    );
};

export default ProjectDashboardPage;