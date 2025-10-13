"use client";

import React, { useState, FC, useRef, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Folder, MoreVertical, Moon, Settings, LogOut } from 'lucide-react';
import CreateProjectModal, { ProjectFormData } from '@/components/modals/CreateProjectModal';
import ProfileSettingsModal, { useUser, UserProvider } from '@/components/modals/ProfileSettingModal';
import { fetchWithAuth } from '@/utils/authService';

const API_BASE_URL = 'https://cocal-server.onrender.com';
const API_PROJECTS_ENDPOINT = `${API_BASE_URL}/api/projects`;
const API_ME_ENDPOINT= `${API_BASE_URL}/api/users/me`;

const API_ENDPOINTS = {
    UPDATE_USER_NAME: `${API_BASE_URL}/api/users/edit-name`,
    UPDATE_USER_PASSWORD: `${API_BASE_URL}/api/users/edit-pwd`,
    UPDATE_USER_PHOTO: `${API_BASE_URL}/api/users/profile-image`,
    DELETE_USER_PHOTO: `${API_BASE_URL}/api/users/profile-image`,
};

// --- DUMMY DATA & TYPES ---

type ProjectCategory = 'All' | 'In Progress' | 'Completed';

interface TeamMemberForCard {
    id: number;
    name: string;
    imageUrl: string;
}

interface Project {
    id: number;
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
    status: 'In Progress' | 'Completed';
    members: TeamMemberForCard[];
}

interface CurrentUser {
    id: number | null;
    name: string;
    email: string;
    imageUrl: string;
}

// 사용자 정보의 기본값
const DEFAULT_USER: CurrentUser = {
    id: null,
    name: 'Guest',
    email: 'guest@example.com',
    imageUrl: 'https://placehold.co/100x100/A0BFFF/FFFFFF?text=U', // 임시 이미지
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
    // currentUser: CurrentUser;
    apiEndpoints: ExpectedApiEndpoints;
}

// ProfileSettingsModal의 prop 타입 오류 방지를 위해 임시 타입 정의 사용
const ProfileSettingsModalTyped: FC<ProfileSettingsModalProps> = ProfileSettingsModal;

// 초기 더미 프로젝트 데이터
const INITIAL_PROJECTS: Project[] = [
    { id: 1, name: 'Project name', startDate: '2025-09-22', endDate: '2025-12-31', status: 'In Progress', members: [
            { id: 101, name: 'Alice', imageUrl: 'https://placehold.co/100x100/4F46E5/FFFFFF?text=A' },
            { id: 104, name: 'Dave', imageUrl: 'https://placehold.co/100x100/EF4444/FFFFFF?text=D' },
        ]  },
    { id: 2, name: 'Project name2', startDate: '2025-08-22', endDate: '2025-12-31', status: 'In Progress', members: [
            { id: 103, name: 'Charlie', imageUrl: 'https://placehold.co/100x100/F59E0B/FFFFFF?text=C' },
        ]  },
    { id: 3, name: 'Project name3', startDate: '2025-09-22', endDate: '2025-12-31', status: 'Completed', members: [
            { id: 102, name: 'Bob', imageUrl: 'https://placehold.co/100x100/10B981/FFFFFF?text=B' },
            { id: 103, name: 'Charlie', imageUrl: 'https://placehold.co/100x100/F59E0B/FFFFFF?text=C' },
            { id: 104, name: 'Dave', imageUrl: 'https://placehold.co/100x100/EF4444/FFFFFF?text=D' },
        ]  },
    { id: 4, name: 'Project name4', startDate: '2025-09-22', endDate: '2025-12-31', status: 'In Progress', members: [
            { id: 103, name: 'Charlie', imageUrl: 'https://placehold.co/100x100/F59E0B/FFFFFF?text=C' },
            { id: 104, name: 'Dave', imageUrl: 'https://placehold.co/100x100/EF4444/FFFFFF?text=D' },
        ]  },
    { id: 5, name: 'Project name5', startDate: '2025-08-22', endDate: '2025-10-15', status: 'Completed', members: [
            { id: 102, name: 'Bob', imageUrl: 'https://placehold.co/100x100/10B981/FFFFFF?text=B' },
        ]  },
];


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
                className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg shadow-md transition duration-200"
                onClick={onOpenCreateModal}
            >
                Create
            </button>
        </div>
    );
};


// --- ProjectCard Component (생략) ---
const ProjectCard: FC<{ project: Project }> = ({ project }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 날짜 형식 YYYY.MM.DD로 변환
    const formatDates = (start: string, end: string) => {
        const format = (dateStr: string) => dateStr.replace(/-/g, '.');
        return `${format(start)} - ${format(end)}`;
    }

    // 드롭다운 메뉴 항목
    const dropdownItems = [
        { label: 'Edit', action: () => console.log('Edit clicked for', project.name) },
        { label: 'Delete', action: () => console.log('Delete clicked for', project.name), isDestructive: true },
    ];

    const members = Array.isArray(project.members) ? project.members : [];
    const MAX_VISIBLE_MEMBERS = 5; // 최대 5명 표시
    const visibleMembers = members.slice(0, MAX_VISIBLE_MEMBERS);
    const extraMembersCount = members.length - MAX_VISIBLE_MEMBERS;

    return (
        <div className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition duration-200 relative border border-gray-100">
            <div className="flex justify-between items-start">
                <div className="flex flex-col">
                    <h3 className="font-semibold text-gray-900 line-clamp-1">{project.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                        {formatDates(project.startDate, project.endDate)}
                    </p>
                </div>
                {/* 드롭다운 메뉴 버튼 */}
                <div ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="p-1 text-gray-400 hover:text-gray-700 transition relative z-20"
                    >
                        <MoreVertical className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex items-center space-x-[-8px] mt-4">
                    {visibleMembers.map((member, index) => (
                        // 이미지 스택 효과를 위해 z-index와 negative margin 사용
                        <img
                            key={member.id || index}
                            src={member.imageUrl}
                            alt={member.name || 'Team member'}
                            // Tailwind CSS: w-7 h-7, rounded-full, border-2 border-white
                            className="w-7 h-7 rounded-full object-cover border-2 border-white shadow-sm transition transform hover:scale-110"
                            style={{ zIndex: visibleMembers.length - index }}
                        />
                    ))}
                    {extraMembersCount > 0 && (
                        <div className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white shadow-sm flex items-center justify-center text-xs font-medium text-gray-600 z-10">
                            +{extraMembersCount}
                        </div>
                    )}
                </div>
            </div>

            {/* 드롭다운 메뉴 (Edit/Delete) */}
            {isDropdownOpen && (
                <div
                    className="absolute top-10 right-2 bg-gray-800 text-white rounded-lg shadow-xl z-30 w-28 overflow-hidden transform origin-top-right transition-all duration-150 ease-out"
                    style={{ zIndex: 50 }}
                >
                    {dropdownItems.map(item => (
                        <button
                            key={item.label}
                            className={`w-full text-left px-3 py-2 text-sm transition 
                ${item.isDestructive ? 'text-red-400 hover:bg-gray-700/50' : 'hover:bg-gray-700'}`}
                            onClick={() => { item.action(); setIsDropdownOpen(false); }}
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
const API_LOGOUT_ENDPOINT = `${API_BASE_URL}/api/auth/logout`;
const calculateProjectStatus = (startDateStr: string, endDateStr: string): 'In Progress' | 'Completed' => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDateStr);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDateStr);
    end.setHours(0, 0, 0, 0);

    if (end.getTime() < today.getTime()) {
        return 'Completed';
    }
    // 'In Progress' 또는 'Completed'만 반환하므로 타입이 안전해집니다.
    return 'In Progress';
};

    const ProjectDashboardPage: React.FC = () => {
    const router = useRouter();
    const { user, isLoading: isLoadingUser, logout } = useUser();
    const [isLoadingProjects, setIsLoadingProjects] = useState(false);
    const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
    const [selectedCategory, setSelectedCategory] = useState<ProjectCategory>('All');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    const handleLogout = useCallback(async () => {
        await logout();
        router.push('/');
    }, [logout, router]);

    const fetchProjects = useCallback(async () => {
        setIsLoadingProjects(true);
        try {
            console.log(`API 호출: ${API_PROJECTS_ENDPOINT}로 프로젝트 목록 조회 요청`);
            const response = await fetchWithAuth(API_PROJECTS_ENDPOINT, {
                method: 'GET',
            });
            if (response.ok) {
                const result = await response.json();
                const rawData = result.data;
                const projectsData: Project[] = Array.isArray(rawData) ? rawData.map((item: Project) => ({ // 💡 타입 수정 반영
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    startDate: item.startDate,
                    endDate: item.endDate,
                    status: calculateProjectStatus(item.startDate, item.endDate),
                    members: Array.isArray(item.members) ? item.members : [], // 멤버 기본값 설정
                })) : [];
                setProjects(projectsData);
                console.log('프로젝트 목록 조회 성공:', projectsData.length, '개');
            } else if (response.status === 401) {
                console.error("AccessToken 및 RefreshToken 만료. 로그아웃 처리 필요.");
                handleLogout(); // 로그아웃 처리
            } else {
                console.error('프로젝트 목록 로드 실패:', response.status);
            }
        } catch (error) {
            console.error("프로젝트 목록 로드 중 네트워크 오류:", error);
        } finally {
            setIsLoadingProjects(false);
        }
    }, [handleLogout]);
/*
    const fetchUserProfile = async (token: string) => {
        setIsLoadingUser(true);
        try {
            console.log(`API 호출: ${API_ME_ENDPOINT}로 사용자 정보 요청`);
            const response = await fetchWithAuth(API_ME_ENDPOINT, {
                                method: 'GET',
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            if (response.ok) {
                                const result = await response.json();
                                const userData = result.data;

                                const userProfile: CurrentUser = {
                                    id: userData.id || null,
                                    name: userData.name || DEFAULT_USER.name,
                                    email: userData.email || DEFAULT_USER.email,
                                    imageUrl: userData.profileImageUrl || DEFAULT_USER.imageUrl
                                };
                                setCurrentUser(userProfile);
                                console.log('서버에서 사용자 프로필 로드 성공:', userProfile);
                                localStorage.setItem('userProfile', JSON.stringify(userProfile));
                            } else {
                                console.error('사용자 정보 로드 실패:', response.status);
                                if (response.status === 401) {
                                    console.log("토큰 만료/유효하지 않음. 자동 로그아웃 처리.");
                                    localStorage.removeItem('accessToken');
                                    localStorage.removeItem('refreshToken');
                                    // window.location.href = '/'; // 실제 앱에서는 리디렉션
                                }
                            }
                        } catch (error) {
                            console.error("사용자 정보 로드 네트워크 오류:", error);
                        } finally {
                            setIsLoadingUser(false);
                        }
                    };
                */
/*
    useEffect(() => {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            fetchUserProfile(accessToken);
        } else {
            const profileString = localStorage.getItem('userProfile');
            if (profileString) {
                try {
                    const profile = JSON.parse(profileString);
                    // 로드된 정보를 상태에 설정
                    setCurrentUser({
                        id: profile.id || null,
                        name: profile.name || 'User',
                        email: profile.email || 'No Email',
                        imageUrl: profile.imageUrl || DEFAULT_USER.imageUrl
                    });
                } catch (e) {
                    console.error("사용자 프로필 JSON 파싱 오류:", e);
                }
            }
            setIsLoadingUser(false);
        }
    }, []);
*/
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
                const serverProject = result.data;
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
                const calculatedStatus = calculateProjectStatus(serverProject.startDate || data.startDate, serverProject.endDate || data.endDate);
                const createdProject: Project = {
                    id: serverProject.id,
                    name: serverProject.name || data.name,
                    startDate: serverProject.startDate || data.startDate,
                    endDate: serverProject.endDate || data.endDate,
                    status: calculatedStatus,
                    members: Array.isArray(serverProject.members)
                        ? serverProject.members
                        : [defaultMember], // 서버가 멤버를 반환하지 않으면 생성자(본인) 추가
                };
                // 클라이언트 상태에 즉시 추가 (새로고침 없이 목록에 표시)
                setProjects(prev => [createdProject, ...prev]);
                console.log('프로젝트 생성 성공 및 상태 업데이트 완료:', createdProject.name);
            } else if (response.status === 401) {
                console.error("인증 실패. 로그아웃 처리 필요.");
                handleLogout();
            } else {
                console.error('프로젝트 생성 실패:', response.status, await response.text());
                // 생성 실패 시 사용자에게 알림 (옵션)
                alert("프로젝트 생성에 실패했습니다. 다시 시도해 주세요.");
            }
        } catch (error) {
            console.error("프로젝트 생성 중 네트워크 오류:", error);
            alert("네트워크 연결에 문제가 발생했습니다.");
        }
    };

    // 프로젝트 필터링 로직
    const filteredProjects = projects.filter(project => {
        if (selectedCategory === 'All') return true;
        return project.status === selectedCategory;
    });
    const handleOpenSettingsModal = () => setIsSettingsModalOpen(true);
    const handleCloseSettingsModal = () => setIsSettingsModalOpen(false);


        /*
            const handleLogout = async () => {
                const refreshToken = localStorage.getItem('refreshToken');

                try {
                    if (refreshToken) {
                        console.log('서버에 로그아웃 요청 중...');
                        await fetch(API_LOGOUT_ENDPOINT, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ refreshToken }),
                        });
                    }
                } catch (error) {
                    console.error("로그아웃 API 호출 실패 (클라이언트 정리 진행):", error);
                } finally {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('userProfile');

                    setCurrentUser(DEFAULT_USER);
                    // alert("로그아웃되었습니다."); // alert 대신 console.log 사용
                    console.log("로그아웃되었습니다.");
                    window.location.href = '/';
                }
            };
        */
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
                {projects.length === 0 ? (
                    <EmptyState selectedCategory={selectedCategory} />
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredProjects.map(project => (
                            // [추가] 캘린더 연동
                            <Link href={`/calendar/${project.id}`} key={project.id}>
                                <ProjectCard project={project} />
                            </Link>
                        ))}
                        {/*이전 코드 주석처리*/}
                        {/*{filteredProjects.map(project => (*/}
                        {/*    <ProjectCard key={project.id} project={project} />*/}
                        {/*))}*/}
                    </div>
                )}
            </main>

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
                // currentUser={currentUser}
                apiEndpoints={API_ENDPOINTS}
            />
        </div>
    );
};

export default ProjectDashboardPage;
