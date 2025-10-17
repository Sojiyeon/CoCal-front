"use client";

import type { ProjectMember } from "../types";
import {useEffect, useState} from "react";

type Props = {
    members: ProjectMember[];
    onSelectAction?: (userId: number) => void;
    selectedIds?: number[];
};

export const InviteesList: React.FC<Props> = ({ members, onSelectAction, selectedIds = [] }) => {
    // 현재 로그인한 사용자id 상태
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    // 프로필 이미지 없을 경우 사용하는 img
    const FALLBACK = "https://placehold.co/100x100/A0BFFF/FFFFFF?text=User";
    const getInitial = (name?: string | null) => (name?.trim()?.[0] ?? "U").toUpperCase();

    // --- 현재 사용자 ID 불러오기 ---
    useEffect(() => {
        try {
            const stored = localStorage.getItem("userProfile");
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed?.id) setCurrentUserId(parsed.id);
            }
        } catch (err: unknown) {
            console.error("Failed to parse userProfile from localStorage:", err);
        }
    }, []);

    // --- 현재 사용자 제외 ---
    const visibleMembers = members.filter((m) => m.userId !== currentUserId);

    if (!visibleMembers.length) return <p className="text-sm text-slate-400">No invitees</p>;

    return (
        <ul className="divide-y">
            {visibleMembers.map((m) => {
                const src = m.profileImageUrl?.replace?.("96x96", "40x40") ?? m.profileImageUrl ?? "";
                const isSelected = selectedIds.includes(m.userId);

                return (
                    <li key={m.userId} className="py-1">
                        <button
                            type="button"
                            onClick={() => onSelectAction?.(m.userId)} // 클릭 시 userId 전달
                            className={[
                                "w-full flex items-center gap-3 px-2 py-2 rounded-md transition",
                                "hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300",
                                isSelected ? "bg-slate-100 ring-1 ring-slate-300" : "",
                            ].join(" ")}
                        >
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 ring-1 ring-white flex items-center justify-center text-[11px] font-semibold text-slate-700 shrink-0">
                                {src ? (
                                    <img
                                        src={src}
                                        alt={m.name ?? "member"}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.currentTarget as HTMLImageElement).src = FALLBACK;
                                        }}
                                    />
                                ) : (
                                    <span>{getInitial(m.name)}</span>
                                )}
                            </div>

                            <div className="min-w-0 text-left">
                                <p className="text-sm font-medium text-slate-800 truncate">{m.name}</p>
                                <a className="text-xs text-slate-500 truncate block" title={m.email ?? ""}>
                                    {m.email ?? "-"}
                                </a>
                            </div>

                            {isSelected && (
                                <span className="ml-auto text-[11px] text-slate-600">✓</span>
                            )}
                        </button>
                    </li>
                );
            })}
        </ul>
    );
};