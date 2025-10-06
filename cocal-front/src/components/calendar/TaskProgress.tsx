"use client";

import React, { useMemo } from "react";
// `EventTodo` 타입을 사용하여 props의 형태를 정의합니다.
import { EventTodo } from "./types";

// 컴포넌트가 받을 props의 타입을 정의합니다.
interface TaskProgressProps {
    todos: EventTodo[];
}

export default function TaskProgress({ todos }: TaskProgressProps) {
    // todos prop이 변경될 때만 통계를 다시 계산하도록 useMemo를 사용합니다.
    const stats = useMemo(() => {
        const all = todos.length;
        const completed = todos.filter(t => t.status === 'DONE').length;
        const todo = all - completed;
        const percent = all > 0 ? Math.round((completed / all) * 100) : 0;

        return { completed, todo, all, percent };
    }, [todos]); // todos 배열이 바뀔 때만 이 함수가 다시 실행됩니다.

    return (
        <div className="p-6 max-w-md mx-auto">
            {/* 제목 + 완료율 배지 */}
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-gray-600 font-semibold text-sm">IN PROGRESS</h2>
                <span className="border border-blue-900 rounded-full px-2 py-0.5 text-blue-900 font-semibold text-xs">
                    {stats.percent}%
                </span>
            </div>

            {/* 진행률 & 통계 묶음 */}
            <div className="w-[120%] relative left-[-10%]">
                {/* 진행률 바 */}
                <div className="bg-gray-200 rounded-full h-2 mb-4">
                    <div
                        className="bg-blue-900 h-2 rounded-full"
                        style={{ width: `${stats.percent}%` }}
                    ></div>
                </div>

                {/* 완료 / 해야할 것 / 전체 개수 */}
                <div className="flex">
                    <div className="flex-1 text-left">
                        <p className="text-1xl font-bold">{stats.completed}</p>
                        <p className="text-gray-600">Completed</p>
                    </div>
                    <div className="flex-1 text-center">
                        <p className="text-1xl font-bold">{stats.todo}</p>
                        <p className="text-gray-600">To do</p>
                    </div>
                    <div className="flex-1 text-right">
                        <p className="text-1xl font-bold">{stats.all}</p>
                        <p className="text-gray-400">All</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
