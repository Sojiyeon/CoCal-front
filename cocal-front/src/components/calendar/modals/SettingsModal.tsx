"use client";

import React, { useEffect, useState } from "react";
import {Project, ProjectMember} from "@/components/calendar/types";
import {getProject, editProject, deleteProject, leaveProject} from "@/api/projectApi";
import {useRouter} from "next/navigation";

// 모달이 사용할 데이터의 형태 정의
interface SettingsData {
    id: number;
    name: string;
    startDate: string;
    endDate: string;

}

interface Props {
    projectId: number;
    onClose: () => void;
    userId: number;
}

export function SettingsModal({ projectId, onClose }: Props) {
    const router = useRouter();
    const [settings, setSettings] = useState<SettingsData>({
        id: 0,
        name: "",
        startDate: "",
        endDate: "",
    });
    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOwner, setIsOwner] = useState<boolean>(false);
    
    // 프로젝트 정보 로드
    useEffect(() => {
        (async () => {
            try {
                setIsLoading(true);
                const currentProject:Project = await getProject(projectId);
                // settings에 필요한 필드만 추출
                setSettings({
                    id: currentProject.id,
                    name: currentProject.name,
                    startDate: currentProject.startDate,
                    endDate: currentProject.endDate,
                });
                setMembers(currentProject.members || []);
                // 로그인한 유저의 id 찾기
                const stored = localStorage.getItem("userProfile");
                if (stored) {
                    const parsed = JSON.parse(stored);
                    setIsOwner(currentProject.ownerId === parsed.id);
                }
            } catch (err: unknown) {
                console.error('프로젝트 정보 로드 실패:', err);
            } finally {
                setIsLoading(false);
            }
        })();
    }, [projectId]);

    useEffect(() => {
        try {

        } catch (err: unknown) {
            console.error("Failed to parse userProfile from localStorage:", err);
        }
    }, [projectId]);

    // 수정 핸들러
    const handleSave = async () => {
        setIsLoading(true);
        try {
            const updated: Project = await editProject(settings.id, settings);
            console.log('프로젝트 수정 성공:', updated);
            onClose(); // 수정 완료 후 모달 닫기
        } catch (error: unknown) {
            window.alert('프로젝트 수정 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 프로젝트 나가기 핸들러
    const handleLeaveOrDelete = async () => {
        setIsLoading(false);
        try {
            // 오너면 프로젝트 삭제
            if (isOwner) {
                if (confirm("Are you sure you want to delete this project?")) {
                    console.log("삭제 진행");
                    const msg = await deleteProject(projectId);
                    if (msg) alert("Success!");
                    router.push("/dashboard");
                } else {
                    console.log("취소됨");
                }
            } else { // 멤버면 프로젝트 나가기
                if (confirm("Are you sure you want to leave this project?")) {
                    console.log("삭제 진행");
                    const msg = await leaveProject(projectId);
                    if (msg) alert("Success!");
                    router.push("/dashboard");
                } else {
                    console.log("취소됨");
                }
            }
        } catch (err: unknown) {
            console.error('프로젝트 정보 로드 실패:', err);
            window.alert('Failed');
        }
    }

    // 입력 필드 변경 핸들러
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
            <div
                className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-4 md:p-6 w-full max-w-2xl text-slate-800 dark:text-gray-200 flex flex-col md:flex-row gap-4 md:gap-8">
                {/* 사이드 메뉴 */}
                <div className="w-full md:w-1/4 flex flex-col">
                    <h2 className="hidden md:block text-lg font-bold mb-2 md:mb-4">Settings</h2>
                    <div className="md:hidden flex items-center justify-between">
                        <h2 className="text-lg font-bold ml-2">Project Settings</h2>
                        <button
                            onClick={handleLeaveOrDelete}
                            className="flex items-center mr-2 text-red-600 hover:text-red-700 font-medium stroke-3"
                        >
                            {isOwner ? (
                                // 오너용 (프로젝트 삭제)
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.75"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="lucide lucide-trash2-icon lucide-trash-2"
                                >
                                    <path d="M10 11v6" />
                                    <path d="M14 11v6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                    <path d="M3 6h18" />
                                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                            ) : (
                                // 멤버용 (프로젝트 나가기)
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.75"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="lucide lucide-door-open-icon lucide-door-open"
                                >
                                    <path d="M11 20H2" />
                                    <path d="M11 4.562v16.157a1 1 0 0 0 1.242.97L19 20V5.562a2 2 0 0 0-1.515-1.94l-4-1A2 2 0 0 0 11 4.561z" />
                                    <path d="M11 4H8a2 2 0 0 0-2 2v14" />
                                    <path d="M14 12h.01" />
                                    <path d="M22 20h-3" />
                                </svg>
                            )}
                        </button>
                    </div>
                    <div className="space-y-2">
                        <div className="hidden md:block bg-slate-100 dark:bg-neutral-700 p-2 rounded-md text-sm text-slate-800 dark:text-slate-300">Project Settings</div>
                    </div>
                    {/*데스크탑일 때 버튼*/}
                    <button
                        onClick={handleLeaveOrDelete}
                        className="hidden md:block mt-auto flex items-center mt-6 text-red-600 hover:text-red-700 font-medium stroke-3"
                    >
                        {isOwner ? (
                            // 오너용 (프로젝트 삭제)
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.75"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-trash2-icon lucide-trash-2"
                            >
                                <path d="M10 11v6" />
                                <path d="M14 11v6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                <path d="M3 6h18" />
                                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                        ) : (
                            // 멤버용 (프로젝트 나가기)
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.75"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-door-open-icon lucide-door-open"
                            >
                                <path d="M11 20H2" />
                                <path d="M11 4.562v16.157a1 1 0 0 0 1.242.97L19 20V5.562a2 2 0 0 0-1.515-1.94l-4-1A2 2 0 0 0 11 4.561z" />
                                <path d="M11 4H8a2 2 0 0 0-2 2v14" />
                                <path d="M14 12h.01" />
                                <path d="M22 20h-3" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* 메인 컨텐츠 */}
                <div className="w-full md:w-3/4">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-48">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
                        </div>
                    ) : (
                        <>
                        {/* 프로젝트 설정 섹션 */}
                            <div className={`bg-slate-50 dark:bg-neutral-800 p-4 rounded-lg mb-6 ${
                                isOwner
                                    ? "bg-white dark:bg-neutral-800" // 편집 가능
                                    : "bg-gray-100 text-gray-500 pointer-events-none cursor-not-allowed" // 읽기 전용
                            }`}>
                                <h3 className="font-semibold mb-4 flex items-center gap-2 flex-wrap dark:text-slate-100">
                                    <span className="truncate">{settings.name}</span>
                                    <div className="flex items-center space-x-[-8px] ml-auto">
                                        {members.map((member, index) => (
                                            <img
                                                key={member.userId || index}
                                                src={member.profileImageUrl || "https://placehold.co/100x100/A0BFFF/FFFFFF?text=User"}
                                                title={member.name}
                                                alt={member.name || 'Team member'}
                                                className="w-6 h-6 rounded-full object-cover border-2 border-white dark:border-neutral-600 shadow-sm transition transform hover:scale-110"
                                                style={{zIndex: members.length - index}}
                                            />
                                        ))}
                                    </div>
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-300 mb-1">Project
                                            Name</label>
                                        <input type="text" name="name" value={settings.name}
                                               onChange={handleInputChange}
                                               className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-slate-500 focus:border-slate-500 dark:border-neutral-600 dark:text-neutral-300 outline-none"/>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="flex-1">
                                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-300 mb-1">Start
                                                Date</label>
                                            <input type="date" name="startDate" value={settings.startDate}
                                                   onChange={handleInputChange}
                                                   className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-slate-500 focus:border-slate-500 dark:border-neutral-600 dark:text-neutral-300 outline-none"/>
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-300 mb-1">End
                                                Date</label>
                                            <input type="date" name="endDate" value={settings.endDate}
                                                   onChange={handleInputChange}
                                                   className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-slate-500 focus:border-slate-500 dark:border-neutral-600 dark:text-neutral-300 outline-none"/>
                                        </div>
                                    </div>
                                </div>
                            </div>


                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 gap-3">
                                {/*취소 버튼*/}
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-6 py-2 bg-gray-200 dark:bg-neutral-700/45 text-gray-700 dark:text-slate-200 rounded-md text-sm font-semibold hover:bg-gray-300 dark:hover:bg-gray-300/20"
                                >
                                    Cancel
                                </button>
                                {/*저장 버튼*/}
                                <button
                                    onClick={handleSave}
                                    disabled={isLoading}
                                    className={`flex-1 px-6 py-2 bg-slate-800 text-white rounded-md text-sm font-semibold hover:bg-slate-900 disabled:bg-slate-400 ${
                                        isOwner
                                            ? "" // 편집 가능
                                            : "bg-gray-100 text-gray-500 pointer-events-none cursor-not-allowed" // 읽기 전용
                                    }`}
                                >
                                    {isLoading ? "Saving..." : "Save"}
                                </button>
                            </div>

                        </>
                    )}
                </div>
            </div>
        </div>
    );
}