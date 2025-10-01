"use client";
// Next.js에서 이 컴포넌트가 클라이언트 컴포넌트임을 명시 (브라우저에서 실행됨)

import React from "react";
import clsx from "clsx";
// 여러 CSS 클래스들을 조건부로 합쳐주는 라이브러리 (Tailwind와 자주 사용)

type ButtonProps = {
    children: React.ReactNode;
    onClickAction?: () => void; // ✅ 이름 변경
    variant?: "default" | "outline";
    className?: string;
};

export default function Button({
                                   children,
                                   onClickAction,
                                   variant = "default",
                                   className,
                               }: ButtonProps) {
    return (
        <button
            onClick={onClickAction} // ✅ 여기서도 같이 변경
            className={clsx(
                "px-3 py-1.5 rounded text-sm font-medium transition-colors",
                variant === "default"
                    ? "bg-slate-800 text-white hover:bg-slate-700"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-100",
                className
            )}
        >
            {children}
        </button>
    );
}

