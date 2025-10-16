"use client";

import type { ProjectMember } from "../types";

export const InviteesList = ({ members }: { members: ProjectMember[] }) => {  // ← export 추가
    const FALLBACK = "https://placehold.co/100x100/A0BFFF/FFFFFF?text=User";
    const getInitial = (name?: string | null) =>
        (name?.trim()?.[0] ?? "U").toUpperCase();

    if (!members?.length) return <p className="text-sm text-slate-400">No invitees</p>;

    return (
        <ul className="divide-y">
            {members.map((m) => {
                const src =
                    m.profileImageUrl?.replace?.("96x96", "40x40") ??
                    m.profileImageUrl ??
                    "";
                return (
                    <li key={m.userId} className="flex items-center gap-3 py-2">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 ring-1 ring-white flex items-center justify-center text-[11px] font-semibold text-slate-700">
                            {src ? (
                                <img
                                    src={src}
                                    alt={m.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).src = FALLBACK;
                                    }}
                                />
                            ) : (
                                <span>{getInitial(m.name)}</span>
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{m.name}</p>
                            <a
                                href={m.email ? `mailto:${m.email}` : undefined}
                                className="text-xs text-slate-500 truncate block"
                                title={m.email ?? ""}
                            >
                                {m.email ?? "-"}
                            </a>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
};
