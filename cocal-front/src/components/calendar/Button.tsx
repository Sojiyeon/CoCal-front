"use client";
import React from "react";
import clsx from "clsx";

type ButtonProps = {
    children: React.ReactNode;
    onClickAction?: () => void;
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
            onClick={onClickAction}
            className={clsx(
                "px-6 py-1.5 rounded-full text-sm font-medium transition-colors",
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
