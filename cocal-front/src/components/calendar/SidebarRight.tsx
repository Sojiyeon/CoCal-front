"use client";

import React, { useState } from "react";
import { TeamModal } from "./modals/TeamModal";
import { EventModal } from "./modals/EventModal";
import { SettingsModal } from "./modals/SettingsModal";

// 1. 나중에는 이 컴포넌트가 props로 실제 projectId와 userId를 받아와야 합니다.
// 예시: interface SidebarRightProps { projectId: number; userId: number; }
export default function SidebarRight(/* { projectId, userId }: SidebarRightProps */) {
    const [openModal, setOpenModal] = useState<null | "team" | "event" | "settings">(null);

    // 2. 실제 ID를 props로 받기 전까지 사용할 임시 ID들입니다.
    const MOCK_PROJECT_ID = 1;
    const MOCK_USER_ID = 1; // SettingsModal에 필요하므로 userId도 추가합니다.

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
            {openModal === "team" && <TeamModal projectId={MOCK_PROJECT_ID} onClose={() => setOpenModal(null)} />}
            {openModal === "event" && <EventModal onClose={() => setOpenModal(null)} />}

            {/* 3. SettingsModal을 호출할 때 projectId와 userId를 넘겨줍니다. */}
            {openModal === "settings" && <SettingsModal projectId={MOCK_PROJECT_ID} userId={MOCK_USER_ID} onClose={() => setOpenModal(null)} />}
        </div>
    );
}