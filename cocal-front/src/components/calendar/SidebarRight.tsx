"use client";

import React from "react";

//  컴포넌트가 실제로 사용하는 props 타입
interface SidebarRightProps {
    onOpenEventModal: () => void;
    onOpenTeamModal: () => void;
    onOpenSettingsModal: () => void;
}

export default function SidebarRight({
                                         onOpenTeamModal,
                                         onOpenEventModal,
                                         onOpenSettingsModal,
                                     }: SidebarRightProps) {

    return (
        <div className="w-[92px] border-l border-slate-200 dark:border-slate-700 p-4 flex flex-col gap-4 bg-white dark:bg-neutral-900 h-full">

            <h2 className="text-lg font-semibold text-slate-800 mb-2 hidden lg:block"></h2>

            <button
                className="px-4 py-2 hover:bg-slate-200 dark:hover:bg-slate-100/10 text-slate-800 dark:text-slate-300 text-sm text-center"
                onClick={onOpenTeamModal}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                     className="lucide lucide-user-round-plus-icon lucide-user-round-plus">
                    <path d="M2 21a8 8 0 0 1 13.292-6"/>
                    <circle cx="10" cy="8" r="5"/>
                    <path d="M19 16v6"/>
                    <path d="M22 19h-6"/>
                </svg>
            </button>

            <button
                className="px-4 py-2 hover:bg-slate-200 dark:hover:bg-slate-100/10 text-slate-800 dark:text-slate-300 text-sm text-center"
                onClick={onOpenEventModal}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                     className="lucide lucide-calendar-plus-icon lucide-calendar-plus">
                    <path d="M16 19h6"/><path d="M16 2v4"/>
                    <path d="M19 16v6"/><path d="M21 12.598V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8.5"/>
                    <path d="M3 10h18"/><path d="M8 2v4"/>
                </svg>
            </button>

            <button
                className="px-4 py-2 hover:bg-slate-200 dark:hover:bg-slate-100/10 text-slate-800 dark:text-slate-300 text-sm text-center"
                onClick={onOpenSettingsModal}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                     className="lucide lucide-settings-icon lucide-settings">
                    <path
                        d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/>
                    <circle cx="12" cy="12" r="3"/>
                </svg>
            </button>

        </div>
    );
}