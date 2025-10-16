"use client";

import React, { useEffect, useState } from "react";
import {Project, ProjectMember} from "@/components/calendar/types";
import {getProject, editProject} from "@/api/projectApi";

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
}

export function SettingsModal({ projectId, onClose }: Props) {
    const [settings, setSettings] = useState<SettingsData>({
        id: 0,
        name: "",
        startDate: "",
        endDate: "",
    });
    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
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
            } catch (err: unknown) {
                console.error('프로젝트 정보 로드 실패:', err);
            } finally {
                setIsLoading(false);
            }
        })();
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

    // 입력 필드 변경 핸들러
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-[600px] text-slate-800 flex gap-8">
                {/* 사이드 메뉴 */}
                <div className="w-1/4">
                    <h2 className="text-lg font-bold mb-4">Settings</h2>
                    <div className="space-y-2">
                        <div className="bg-slate-100 p-2 rounded-md text-sm  text-slate-800">Project Settings</div>
                    </div>
                </div>

                {/* 메인 컨텐츠 */}
                <div className="w-3/4">
                    {isLoading ? (
                        <div>Loading...</div>
                    ) : (
                        <>
                            {/* 프로젝트 설정 섹션 */}
                            <div className="bg-slate-50 p-4 rounded-lg mb-6">
                                <h3 className="font-semibold mb-4 flex items-center gap-2">
                                    {settings.name}
                                    <div className="flex items-center space-x-[-4px]">
                                        {members.map((member, index) => (
                                            <img
                                                key={member.userId || index}
                                                src={member.profileImageUrl || "https://placehold.co/100x100/A0BFFF/FFFFFF?text=User"}
                                                title={member.name}
                                                alt={member.name || 'Team member'}
                                                className="w-6 h-6 rounded-full object-cover border-2 border-white shadow-sm transition transform hover:scale-110"
                                                style={{zIndex: members.length - index}}
                                            />
                                        ))}
                                    </div>
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Project
                                            Name</label>
                                        <input type="text" name="name" value={settings.name}
                                               onChange={handleInputChange}
                                               className="w-full border rounded-md px-3 py-2 text-sm"/>
                                    </div>

                                    <div className="flex gap-3">
                                        <div className="flex-1">
                                            <label className="block text-xs font-medium text-slate-500 mb-1">Start
                                                Date</label>
                                            <input type="date" name="startDate" value={settings.startDate}
                                                   onChange={handleInputChange}
                                                   className="w-full border rounded-md px-3 py-2 text-sm"/>
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs font-medium text-slate-500 mb-1">End
                                                Date</label>
                                            <input type="date" name="endDate" value={settings.endDate}
                                                   onChange={handleInputChange}
                                                   className="w-full border rounded-md px-3 py-2 text-sm"/>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify space-x-3 mt-4">
                                {/*취소 버튼*/}
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-6 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-semibold hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                {/*저장 버튼*/}
                                <button
                                    onClick={handleSave}
                                    disabled={isLoading}
                                    className="flex-1 px-6 py-2 bg-slate-800 text-white rounded-md text-sm font-semibold hover:bg-slate-900 disabled:bg-slate-400"
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