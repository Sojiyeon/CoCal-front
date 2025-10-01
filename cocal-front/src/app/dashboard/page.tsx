"use client";

import React, { useState, FC } from 'react';
// lucide-react에서 필요한 아이콘들을 가져옵니다.
import { MoreVertical, Folder } from 'lucide-react';

// --- DUMMY DATA & TYPES ---

// 카테고리 타입 정의
type ProjectCategory = 'All' | 'In Progress' | 'Completed';

// 프로젝트 타입 정의
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
    imageUrl: 'https://placehold.co/40x40/50bda1/ffffff?text=U', // 임시 이미지
};

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
}

const categories: ProjectCategory[] = ['All', 'In Progress', 'Completed'];

const ProjectCategoryFilter: FC<ProjectCategoryFilterProps> = ({ selectedCategory, onSelectCategory }) => {
    return (
        // 카테고리 탭 (All, In Progress, Completed)
        <div className="flex space-x-8 border-b border-gray-200 mb-8">
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
    );
};

// --- ProjectCard Component ---
const ProjectCard: FC<{ project: Project }> = ({ project }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // 날짜 형식 YYYY-MM-DD를 YYYY.MM.DD로 변환
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
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="p-1 text-gray-400 hover:text-gray-700 transition relative z-20"
                >
                    <MoreVertical className="w-5 h-5" />
                </button>
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
                    className="absolute top-10 right-2 bg-gray-800 text-white rounded-lg shadow-xl z-30 w-28 overflow-hidden transform origin-top-right animate-fade-in"
                    onBlur={() => setIsDropdownOpen(false)} // 외부 포커스 아웃 시 닫기
                    onMouseLeave={() => setIsDropdownOpen(false)} // 마우스 아웃 시 닫기
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
const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        {/* 폴더 아이콘 (lucide-react Folder icon 사용) */}
        <Folder className="w-16 h-16 text-gray-300" strokeWidth={1} />
        <h3 className="mt-6 text-xl font-semibold text-gray-600">No projects found</h3>
        <p className="mt-1 text-gray-400">Create a new project</p>
    </div>
);


// --- Main Dashboard Page ---
const ProjectDashboardPage: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
    const [selectedCategory, setSelectedCategory] = useState<ProjectCategory>('All');

    // 프로젝트 생성 임시 핸들러 (모달 제외 요청 반영)
    const handleCreateButtonClick = () => {
        // 실제로는 여기에 모달을 띄우는 로직이 들어갑니다.
        console.log("Create Project button clicked. (Modal logic skipped as requested.)");

        // 임시로 새 프로젝트를 추가하는 예시 (더미 데이터가 필요 없어질 때까지)
        const newId = Date.now();
        const newProject: Project = {
            id: newId,
            name: `New Project ${projects.length + 1}`,
            startDate: '2025-10-01',
            endDate: '2026-03-30',
            status: 'In Progress',
            colorTags: ['#34D399'],
        };
        setProjects(prev => [...prev, newProject]);
    };

    // 프로젝트 필터링 로직
    const filteredProjects = projects.filter(project => {
        if (selectedCategory === 'All') return true;
        return project.status === selectedCategory;
    });

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* 상단 통합 헤더 영역 */}
            <header className="flex justify-between items-center py-5 px-8 border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
                <h1 className="text-2xl font-bold text-gray-800">My projects</h1>

                <div className="flex items-center space-x-4">
                    {/* Create 버튼 */}
                    <button
                        type="button"
                        className="px-6 py-2 bg-blue-700 hover:bg-blue-800 text-white font-medium rounded-lg shadow-md transition duration-200"
                        onClick={handleCreateButtonClick}
                    >
                        Create
                    </button>

                    {/* 유저 프로필 */}
                    <div className="flex items-center space-x-2 cursor-pointer p-1">
                        <img
                            src={DUMMY_USER.imageUrl}
                            alt={DUMMY_USER.name}
                            className="w-10 h-10 rounded-full object-cover shadow-inner ring-1 ring-gray-200"
                            onError={(e) => { e.currentTarget.src = 'https://placehold.co/40x40/cccccc/ffffff?text=U' }}
                        />
                        <div className="flex-col text-right text-xs hidden sm:block">
                            <span className="font-semibold text-gray-900 leading-none">{DUMMY_USER.name}</span>
                            <span className="text-gray-500 leading-none">{DUMMY_USER.email}</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* 메인 콘텐츠 영역 */}
            <main className="p-8 md:p-10 max-w-7xl mx-auto">
                {/* 카테고리 필터링 컴포넌트 */}
                <ProjectCategoryFilter
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                />

                {/* 프로젝트 목록 표시 */}
                {projects.length === 0 ? (
                    // 프로젝트가 하나도 없을 때
                    <EmptyState />
                ) : filteredProjects.length === 0 ? (
                    // 프로젝트는 있지만 필터링 결과가 없을 때
                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                        <Folder className="w-16 h-16 text-gray-300" strokeWidth={1} />
                        <h3 className="mt-6 text-xl font-semibold text-gray-600">No projects in &rdquo;{selectedCategory}&rdquo;</h3>
                        <p className="mt-1 text-gray-400">Try selecting a different category.</p>
                    </div>
                ) : (
                    // 프로젝트 목록
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredProjects.map(project => (
                            <ProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default ProjectDashboardPage;