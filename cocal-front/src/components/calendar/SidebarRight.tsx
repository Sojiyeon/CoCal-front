"use client";

import React, { useState } from "react";
import { TeamModal } from "./modals/TeamModal";
import { EventModal } from "./modals/EventModal";
import { SettingsModal } from "./modals/SettingsModal";

export default function SidebarRight() {
    const [openModal, setOpenModal] = useState<null | "team" | "event" | "settings">(null);

    return (
        <div className="w-23 border-l border-slate-200 p-4 flex flex-col gap-4 bg-white">
            <h2 className="text-lg font-semibold text-slate-800 mb-2"></h2>

            <button
                className="px-4 py-2 hover:bg-slate-200 text-slate-800 text-sm text-left"
                onClick={() => setOpenModal("team")}
            >
                ➕
            </button>

            <button
                className="px-4 py-2 hover:bg-slate-200 text-slate-800 text-sm text-left"
                onClick={() => setOpenModal("event")}
            >
                📅
            </button>

            <button
                className="px-4 py-2 hover:bg-slate-200 text-slate-800 text-sm text-left"
                onClick={() => setOpenModal("settings")}
            >
                ⚙️
            </button>

            {/* 모달 */}
            {openModal === "team" && <TeamModal onClose={() => setOpenModal(null)} />}
            {openModal === "event" && <EventModal onClose={() => setOpenModal(null)} />}
            {openModal === "settings" && <SettingsModal onClose={() => setOpenModal(null)} />}
        </div>
    );
}
