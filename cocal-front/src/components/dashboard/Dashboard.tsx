"use client";

import React, { useState, FC, useRef, useEffect, useMemo } from 'react';
import { Folder, MoreVertical, Moon, Settings, LogOut } from 'lucide-react';
import CreateProjectModal, { ProjectFormData } from '../../components/modals/CreateProjectModal';
import ProfileSettingsModal from '../../components/modals/ProfileSettingModal';

const API_ME_ENDPOINT= `${process.env.NEXT_PUBLIC_API_URL}/api/users/me`;
    const API_ENDPOINTS = {
    UPDATE_USER_NAME: `${process.env.NEXT_PUBLIC_API_URL}/api/users/edit-name`,
    UPDATE_USER_PASSWORD: `${process.env.NEXT_PUBLIC_API_URL}/api/users/edit-pwd`,
    UPDATE_USER_PHOTO: `${process.env.NEXT_PUBLIC_API_URL}/api/users/profile-image`,
};

// --- DUMMY DATA & TYPES ---

type ProjectCategory = 'All' | 'In Progress' | 'Completed';

interface Project {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
    status: 'In Progress' | 'Completed';
    colorTags: string[]; // 색상 태그
}

// 임시 유저 정보
const DUMMY_USER = {
    name: 'Name',
    email: 'name123@gmail.com',
    imageUrl: 'https://placehold.co/96x96/50bda1/ffffff?text=COLA', // 임시 이미지
};

const DEFAULT_USER: CurrentUser = {
    id: null,
    name: 'Guest',
    email: 'guest@example.com',
    imageUrl: 'https://placehold.co/96x96/50bda1/ffffff?text=COLA', // 임시 이미지
};

interface CurrentUser {
    id: number | null;
    name: string;
    email: string;
    imageUrl: string; // 프로필 이미지 URL
}

interface ExpectedApiEndpoints {
    UPDATE_USER_NAME: string;
    UPDATE_USER_PASSWORD: string;
    UPDATE_USER_PHOTO: string;
}
interface ProfileSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: typeof DUMMY_USER;
    apiEndpoints: ExpectedApiEndpoints;
}

const ProfileSettingsModalTyped: FC<ProfileSettingsModalProps> = ProfileSettingsModal;

// 초기 더미 프로젝트 데이터
const INITIAL_PROJECTS: Project[] = [
    { id: 1, name: 'Project name', startDate: '2025-09-22', endDate: '2025-12-31', status: 'In Progress', colorTags: ['#6EE7B7', '#93C5FD'] },
    { id: 2, name: 'Project name2', startDate: '2025-08-22', endDate: '2025-12-31', status: 'In Progress', colorTags: ['#FCA5A5', '#FDBA74', '#A78BFA'] },
    { id: 3, name: 'Project name3', startDate: '2025-09-22', endDate: '2025-12-31', status: 'Completed', colorTags: ['#A78BFA', '#FBCFE8'] },
    { id: 4, name: 'Project name4', startDate: '2025-09-22', endDate: '2025-12-31', status: 'In Progress', colorTags: ['#6EE7B7'] },
    { id: 5, name: 'Project name5', startDate: '2025-08-22', endDate: '2025-10-15', status: 'Completed', colorTags: ['#A78BFA', '#93C5FD'] },
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
                                                                   onOpenCreateModal // 추가된 prop
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
            </div>

            {/* 색상 태그 */}
            <div className="flex space-x-1.5 mt-4">
                {project.colorTags.slice(0, 3).map((color, index) => (
                    <div
                        key={index}
                        className="w-4 h-4 rounded-full border border-white shadow-sm"
                        style={{ backgroundColor: color }}
                        title={`Tag ${index + 1}`}
                    />
                ))}
                {project.colorTags.length > 3 && (
                    <span className="text-xs text-gray-500 pt-[2px]">{`+${project.colorTags.length - 3}`}</span>
                )}
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
    user: typeof DUMMY_USER;
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
                onOpenSettings(); // 모달 열기 함수 호출
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
                {/* ... (이미지 및 이름/이메일 구조 유지) ... */}
                <img
                    src={user.imageUrl.replace('96x96', '40x40')}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover shadow-inner ring-1 ring-gray-200"
                    onError={(e) => { e.currentTarget.src = 'https://placehold.co/40x40/cccccc/ffffff?text=COLA' }}
                />
                <div className="flex flex-col text-xs hidden sm:block">
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
const API_LOGOUT_ENDPOINT = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`;
const ProjectDashboardPage: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<CurrentUser>(DEFAULT_USER);
    const [isLoadingUser, setIsLoadingUser] = useState(true);
    const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
    const [selectedCategory, setSelectedCategory] = useState<ProjectCategory>('All');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    const fetchUserProfile = async (token: string) => {
        setIsLoadingUser(true);
        try {
            console.log(`API 호출: ${API_ME_ENDPOINT}로 사용자 정보 요청`);
            const response = await fetch(API_ME_ENDPOINT, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                const userProfile: CurrentUser = {
                    id: data.id || null,
                    name: data.name || DEFAULT_USER.name,
                    email: data.email || DEFAULT_USER.email,
                    imageUrl: data.profileImageUrl || DEFAULT_USER.imageUrl // profileImageUrl 또는 imageUrl
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
                    window.location.href = '/';
                }
            }
        } catch (error) {
            console.error("사용자 정보 로드 네트워크 오류:", error);
        } finally {
            setIsLoadingUser(false);
        }
    };

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

    // 프로젝트 생성 핸들러
    const handleCreateProject = (data: ProjectFormData) => {
        console.log("Creating project with data:", data);

        const newProject: Project = {
            id: Date.now(),
            name: data.name,
            startDate: data.startDate,
            endDate: data.endDate,
            status: 'In Progress',
            colorTags: ['#34D399'],
        };
        setProjects(prev => [newProject, ...prev]);
    };

    // 프로젝트 필터링 로직
    const filteredProjects = projects.filter(project => {
        if (selectedCategory === 'All') return true;
        return project.status === selectedCategory;
    });
    const handleOpenSettingsModal = () => setIsSettingsModalOpen(true);
    const handleCloseSettingsModal = () => setIsSettingsModalOpen(false);

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
            alert("로그아웃되었습니다.");
            window.location.href = '/';
        }
    };

    if (isLoadingUser) {
        return (
            <div className="min-h-screen bg-gray-50 font-sans flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
                    <p className="mt-4 text-gray-700 font-medium">Loading user profile...</p>
                </div>
            </div>
        );
    }
    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* 상단 통합 헤더 영역 */}
            <header className="flex justify-between items-center py-5 px-8 border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
                <h1 className="text-2xl font-bold text-gray-800">My projects</h1>

                <div className="flex items-center space-x-4"> {/* 유저 프로필 */}
                    <ProfileDropdown
                        user={currentUser}
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
                            <ProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                )}
            </main>

            {/* 모달 렌더링 */}
            <CreateProjectModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreateProject={handleCreateProject}
            />

            <ProfileSettingsModalTyped
                isOpen={isSettingsModalOpen}
                onClose={handleCloseSettingsModal}
                currentUser={currentUser}
                apiEndpoints={API_ENDPOINTS}
            />
        </div>
    );
};

export default ProjectDashboardPage;