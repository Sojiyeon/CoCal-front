"use client";

import React from "react";

// [추가] 부모 컴포넌트로부터 모달을 여는 함수들을 props로 받도록 인터페이스를 정의합니다.
interface Props {
    onOpenTeamModal: () => void;
    onOpenEventModal: () => void;
    onOpenSettingsModal: () => void;
}

export default function SidebarRight({ onOpenTeamModal, onOpenEventModal, onOpenSettingsModal }: Props) {
    // [설명] 이제 이 컴포넌트는 모달의 열림 상태를 직접 관리하지 않습니다.
    return (
        <div className="w-23 border-l border-slate-200 p-4 flex flex-col gap-4 bg-white">
            <h2 className="text-lg font-semibold text-slate-800 mb-2"></h2>

            <button
                className="px-4 py-2 hover:bg-slate-200 text-slate-800 text-sm text-left"
                onClick={onOpenTeamModal} // [수정] props로 받은 함수를 호출합니다.
            >
                ➕
            </button>

            <button
                className="px-4 py-2 hover:bg-slate-200 text-slate-800 text-sm text-left"
                onClick={onOpenEventModal} // [수정] props로 받은 함수를 호출합니다.
            >
                📅
            </button>

            <button
                className="px-4 py-2 hover:bg-slate-200 text-slate-800 text-sm text-left"
                onClick={onOpenSettingsModal} // [수정] props로 받은 함수를 호출합니다.
            >
                ⚙️
            </button>
            {/* [설명] 모달을 직접 렌더링하는 코드는 부모 컴포넌트(CalendarUI)로 이동했습니다. */}
        </div>
    );
}

