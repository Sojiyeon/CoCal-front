"use client";

import React from "react";

interface Props {
    onClose: () => void;
}

export function TeamModal({ onClose }: Props) {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-[400px]">
                <h2 className="text-lg font-semibold mb-4">Add Team Member</h2>
                <input
                    type="email"
                    placeholder="Enter email"
                    className="w-full border rounded-md px-3 py-2 mb-4"
                />
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-100 rounded-md">
                        Cancel
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md">
                        Invite
                    </button>
                </div>
            </div>
        </div>
    );
}
