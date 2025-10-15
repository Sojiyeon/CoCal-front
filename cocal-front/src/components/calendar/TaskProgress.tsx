"use client";

import React, { useMemo } from "react";

import { EventTodo } from "./types";


interface TaskProgressProps {
    todos: EventTodo[];
    projectStartDate?: Date | undefined;
    projectEndDate?: Date | undefined;
}

export default function TaskProgress({ todos, projectStartDate, projectEndDate }: TaskProgressProps) {

    const stats = useMemo(() => {
        const all = todos.length;
        const completed = todos.filter(t => t.status === 'DONE').length;
        const todo = all - completed;

        const now = new Date();
        let timePercent = 0;
        // 프로젝트 기간 퍼센트 계산
        if (projectStartDate && projectEndDate) {
            const total = projectEndDate.getTime() - projectStartDate.getTime();
            const elapsed = now.getTime() - projectStartDate.getTime();

            if (total > 0) {
                timePercent = Math.min(Math.max((elapsed / total) * 100, 0), 100);
            }
        }
        return {
            completed,
            todo,
            all,
            percent: Math.round(timePercent)
        };
    }, [todos, projectStartDate, projectEndDate]);

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
                {/*  데스크톱에서만 하단 여백(mb-4)이 적용되도록 수정 */}
                <div className="bg-gray-200 rounded-full h-2 md:mb-4">
                    <div
                        className="bg-blue-900 h-2 rounded-full"
                        style={{ width: `${stats.percent}%` }}
                    ></div>
                </div>

                {/* 완료 / 해야할 것 / 전체 개수 */}
                {/* 모바일에서는 숨기고(hidden), 데스크톱에서는 보이도록(md:flex) 수정 */}
                <div className="hidden md:flex">
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