"use client";

import React, { useEffect, useState } from "react";


type DefaultView = 'MONTH' | 'WEEK' | 'DAY';

// 모달이 사용할 데이터의 형태 정의
interface SettingsData {
    projectName: string;
    startDate: string;
    endDate: string;
    defaultView: DefaultView;
}

interface Props {
    projectId: number;
    userId: number;
    onClose: () => void;
}

export function SettingsModal({ projectId, userId, onClose }: Props) {
    const [settings, setSettings] = useState<SettingsData>({
        projectName: "",
        startDate: "",
        endDate: "",
        defaultView: "MONTH",
    });
    const [isLoading, setIsLoading] = useState(false);


    useEffect(() => {
        setIsLoading(true);

        Promise.all([
            // 1. 프로젝트 정보 불러오기
            Promise.resolve({ id: projectId, name: "Project1", start_date: "2025-09-20", end_date: "2025-10-23" }),
            // 2. 사용자 정보 불러오기
            Promise.resolve({ id: userId, default_view: "MONTH" })
        ]).then(([projectData, userData]) => {
            setSettings({
                projectName: projectData.name,
                startDate: projectData.start_date,
                endDate: projectData.end_date,
                defaultView: userData.default_view.toUpperCase() as DefaultView,
            });
            setIsLoading(false);
        });
    }, [projectId, userId]);

    // 입력 필드 변경 핸들러
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    // 기본 보기 변경 핸들러
    const handleViewChange = (view: DefaultView) => {
        setSettings(prev => ({ ...prev, defaultView: view }));
    };

    // 저장 핸들러
    const handleSave = () => {
        setIsLoading(true);

        console.log("Saving data:", settings);

        Promise.all([
            // 1. 프로젝트 정보 업데이트
            Promise.resolve({ success: true, table: 'projects' }),
            // 2. 사용자 기본 보기 업데이트
            Promise.resolve({ success: true, table: 'users' })
        ]).then(() => {
            alert("Settings saved successfully!");
            setIsLoading(false);
            onClose();
        });
    };

    const ViewOption = ({ view, children }: { view: DefaultView; children: React.ReactNode }) => (
        <div
            onClick={() => handleViewChange(view)}
            className={`px-4 py-2 rounded-lg cursor-pointer text-sm font-medium ${
                settings.defaultView === view
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-700 hover:bg-slate-100"
            }`}
        >
            {children}
        </div>
    );

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-[600px] text-slate-800 flex gap-8">
                {/* 사이드 메뉴 */}
                <div className="w-1/4">
                    <h2 className="text-lg font-bold mb-4">Settings</h2>
                    <div className="space-y-2">
                        <div className="bg-slate-100 p-2 rounded-md text-sm font-semibold text-slate-800">Project Settings</div>
                        <div className="p-2 rounded-md text-sm font-semibold text-slate-500">Default View</div>
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
                                    {settings.projectName}
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Project Name</label>
                                        <input type="text" name="projectName" value={settings.projectName} onChange={handleInputChange} className="w-full border rounded-md px-3 py-2 text-sm"/>
                                    </div>

                                    <div className="flex gap-3">
                                        <div className="flex-1">
                                            <label className="block text-xs font-medium text-slate-500 mb-1">Start Date</label>
                                            <input type="date" name="startDate" value={settings.startDate} onChange={handleInputChange} className="w-full border rounded-md px-3 py-2 text-sm"/>
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs font-medium text-slate-500 mb-1">End Date</label>
                                            <input type="date" name="endDate" value={settings.endDate} onChange={handleInputChange} className="w-full border rounded-md px-3 py-2 text-sm"/>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 기본 보기 설정 섹션 */}
                            <div className="bg-slate-50 p-4 rounded-lg mb-6">
                                <div className="flex justify-around">
                                    <ViewOption view="DAY">Day</ViewOption>
                                    <ViewOption view="WEEK">Week</ViewOption>
                                    <ViewOption view="MONTH">Month</ViewOption>
                                </div>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={isLoading}
                                className="w-full px-6 py-2 bg-slate-800 text-white rounded-md text-sm font-semibold hover:bg-slate-900 disabled:bg-slate-400"
                            >
                                {isLoading ? "Saving..." : "Save"}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}