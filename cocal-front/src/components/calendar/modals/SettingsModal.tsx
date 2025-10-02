"use client";

import React from "react";

interface Props {
    onClose: () => void;
}

export function SettingsModal({ onClose }: Props) { // <--- SettingsModal로 수정
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-[500px]">
                <h2 className="text-lg font-semibold mb-4">Settings</h2> {/* <--- 제목 수정 */}

                {/* 여기에 설정 관련 UI를 추가하면 됩니다. */}
                <p className="text-sm text-slate-600 mb-4">
                    Settings for the project will be displayed here.
                </p>

                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-100 rounded-md">
                        Close
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}