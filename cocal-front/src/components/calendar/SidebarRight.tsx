"use client";

import React from "react";


interface Props {
    onOpenTeamModal: () => void;
    onOpenEventModal: () => void;
    onOpenSettingsModal: () => void;
}

export default function SidebarRight({ onOpenTeamModal, onOpenEventModal, onOpenSettingsModal }: Props) {

    return (
        <div className="w-23 border-l border-slate-200 p-4 flex flex-col gap-4 bg-white">
            <h2 className="text-lg font-semibold text-slate-800 mb-2"></h2>

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

