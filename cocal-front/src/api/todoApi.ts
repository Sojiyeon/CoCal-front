// src/components/calendar/utils/todoApi.ts
import { api } from "@/components/calendar/utils/api";

export type TodoType = "PRIVATE" | "EVENT";

export interface TodoData {
    title: string;
    description?: string;
    url?: string;
    date: string; // ISO string
    offsetMinutes: number;
    type: TodoType;
    eventId?: number;
    projectId: number;
}

// ✅ Todo 생성
export const createTodo = async (projectId: number, data: TodoData) => {
    const res = await api.post(`/projects/${projectId}/todos`, data);
    return res.data;
};