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
        <div className="w-[92px] border-l border-slate-200 p-4 flex flex-col gap-4 bg-white h-full">

            <h2 className="text-lg font-semibold text-slate-800 mb-2 hidden lg:block"></h2>

            <button
                className="px-4 py-2 hover:bg-slate-200 text-slate-800 text-sm text-left"
                onClick={onOpenTeamModal}
            >
                ➕
            </button>

            <button
                className="px-4 py-2 hover:bg-slate-200 text-slate-800 text-sm text-left"
                onClick={onOpenEventModal}
            >
                📅
            </button>

            <button
                className="px-4 py-2 hover:bg-slate-200 text-slate-800 text-sm text-left"
                onClick={onOpenSettingsModal}
            >
                ⚙️
            </button>

        </div>
    );
}