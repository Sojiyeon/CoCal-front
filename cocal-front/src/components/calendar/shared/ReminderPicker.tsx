// ReminderPicker.tsx

"use client";

import React from "react";
import clsx from "clsx";
// ▼▼▼ 로컬 정의 대신 utils 파일에서 import 합니다 ▼▼▼
import { ReminderValue, REMINDER_OPTIONS } from "../utils/reminderUtils";

export interface ReminderPickerProps {
    value: ReminderValue;
    onChange: (val: ReminderValue) => void;
    className?: string;
    label?: string;
    disabled?: boolean;
}

// ▼▼▼ REMINDER_OPTIONS 배열은 utils 파일로 옮겼으므로 여기서 삭제합니다. ▼▼▼
/*
const REMINDER_OPTIONS: { label: string; value: ReminderValue }[] = [ ... ];
*/
// ▲▲▲ 여기까지 삭제 ▲▲▲

export function ReminderPicker({
                                   value,
                                   onChange,
                                   className,
                                   label = "Reminder",
                                   disabled,
                               }: ReminderPickerProps) {
    // ... (함수 내 나머지 코드는 수정할 필요 없습니다)
    return (
        <div
            className={clsx(
                "w-full border rounded-md px-3 py-2 text-sm flex items-center justify-between",
                className
            )}
        >
            <span className="text-slate-600">{label}</span>
            <select
                value={value === null ? "null" : String(value)}
                onChange={(e) => {
                    const v = e.target.value;
                    onChange(v === "null" ? null : Number(v));
                }}
                disabled={disabled}
                className="ml-2 border rounded px-2 py-1 text-sm text-slate-700 bg-white"
                aria-label="Reminder"
            >
                {REMINDER_OPTIONS.map((opt) => (
                    <option key={String(opt.value)} value={opt.value === null ? "null" : String(opt.value)}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}