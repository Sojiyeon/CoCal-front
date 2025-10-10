"use client";

import React, { useState, useEffect } from "react";
import { CalendarEvent, ModalFormData } from "../types";

type ActiveTab = "Event" | "Todo" | "Memo";

interface Props {
    onClose: () => void;
    onSave: (itemData: ModalFormData, type: ActiveTab) => void;
    initialDate?: string | null;
    editEvent: CalendarEvent | null;
    projectId: number;
}

export function EventModal({ onClose, onSave, initialDate, projectId }: Props) {
    const [activeTab, setActiveTab] = useState<ActiveTab>("Event");
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        url: "",
        start_at: "",
        end_at: "",
        location: "",
        visibility: "PUBLIC" as "PUBLIC" | "PRIVATE",
        memo_date: "",
        content: "",
        category: "Project 1",
    });

    useEffect(() => {
        const date = initialDate ? new Date(initialDate) : new Date();
        const startDateTime = new Date(
            date.getTime() - date.getTimezoneOffset() * 60000
        )
            .toISOString()
            .slice(0, 16);
        date.setHours(date.getHours() + 1);
        const endDateTime = new Date(
            date.getTime() - date.getTimezoneOffset() * 60000
        )
            .toISOString()
            .slice(0, 16);
        const justDate = startDateTime.split("T")[0];

        setFormData((prev) => ({
            ...prev,
            start_at: startDateTime,
            end_at: endDateTime,
            memo_date: justDate,
        }));
    }, [initialDate]);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleVisibilityChange = (visibility: "PUBLIC" | "PRIVATE") => {
        setFormData((prev) => ({ ...prev, visibility }));
    };

    const handleSave = async () => {
        setIsLoading(true);

        // [수정] Unused parameter 경고 해결을 위해 projectId를 사용합니다.
        console.log(`Saving item for project ID: ${projectId}`);

        // ===============================================================
        // ▼▼▼ API 호출 로직 주석 처리 ▼▼▼
        // ===============================================================
        /*
        try {
            if (activeTab === "Event") {
                // ... API 호출 시 projectId 사용
                const response = await fetch(`/api/projects/${projectId}/events`, ...);
            }
            if (activeTab === "Memo") {
                // ... API 호출 시 projectId 사용
                const response = await fetch(`/api/projects/${projectId}/memos`, ...);
            }
        } catch (error) {
            console.error("❌ Error while saving:", error);
        }
        */
        // ===============================================================

        console.warn(`개발 모드: ${activeTab} 저장을 시뮬레이션합니다. API 호출은 주석 처리되었습니다.`);
        onSave(formData, activeTab);

        setIsLoading(false);
        onClose();
    };

    const TabButton = ({ tabName }: { tabName: ActiveTab }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-3 py-1 text-xs font-semibold rounded ${
                activeTab === tabName
                    ? "bg-slate-200 text-slate-800"
                    : "bg-white text-slate-500 hover:bg-slate-100"
            }`}
        >
            {tabName}
        </button>
    );

    const renderForm = () => {
        switch (activeTab) {
            case "Event":
                return (
                    <div className="space-y-4">
                        <input
                            type="text"
                            name="title"
                            placeholder="Event Title"
                            value={formData.title}
                            onChange={handleInputChange}
                            className="w-full text-lg font-semibold border-b pb-1 focus:outline-none focus:border-blue-500"
                        />
                        <input
                            type="text"
                            name="location"
                            placeholder="Location or Description"
                            value={formData.location}
                            onChange={handleInputChange}
                            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <div className="flex gap-2 items-center">
                            <input
                                type="datetime-local"
                                name="start_at"
                                value={formData.start_at}
                                onChange={handleInputChange}
                                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <span>-</span>
                            <input
                                type="datetime-local"
                                name="end_at"
                                value={formData.end_at}
                                onChange={handleInputChange}
                                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <div className="w-full border rounded-md px-3 py-2 text-sm text-slate-400 flex justify-between items-center">
                            <span>Repeat</span> <span>&gt;</span>
                        </div>
                        <div className="w-full border rounded-md px-3 py-2 text-sm text-slate-400 flex justify-between items-center">
                            <span>Reminder</span> <span>15min ago</span>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-600">
                                Visibility
                            </label>
                            <div className="flex gap-4 mt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="visibility"
                                        value="PUBLIC"
                                        checked={formData.visibility === "PUBLIC"}
                                        onChange={() => handleVisibilityChange("PUBLIC")}
                                        className="form-radio h-4 w-4 text-blue-600"
                                    />
                                    <span className="text-sm">Public</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="visibility"
                                        value="PRIVATE"
                                        checked={formData.visibility === "PRIVATE"}
                                        onChange={() => handleVisibilityChange("PRIVATE")}
                                        className="form-radio h-4 w-4 text-blue-600"
                                    />
                                    <span className="text-sm">Private</span>
                                </label>
                            </div>
                        </div>
                        <div className="w-full border rounded-md px-3 py-2 text-sm text-slate-400">
                            Invitees
                        </div>
                        <div className="w-full border rounded-md px-3 py-2 text-sm flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-blue-500"></div>
                            <span>Color</span>
                        </div>
                    </div>
                );
            case "Todo":
                return (
                    <div className="space-y-4">
                        <input
                            type="text"
                            name="title"
                            placeholder="Title"
                            value={formData.title}
                            onChange={handleInputChange}
                            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <textarea
                            name="description"
                            placeholder="Description..."
                            value={formData.description}
                            onChange={handleInputChange}
                            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            rows={3}
                        />
                        <div className="w-full border rounded-md px-3 py-2 text-sm text-slate-400 flex justify-between items-center">
                            <span>Category</span> <span>{formData.category}</span>
                        </div>
                        <div className="w-full border rounded-md px-3 py-2 text-sm text-slate-400 flex justify-between items-center">
                            <span>Repeat</span> <span>&gt;</span>
                        </div>
                        <div className="w-full border rounded-md px-3 py-2 text-sm text-slate-400 flex justify-between items-center">
                            <span>Reminder</span> <span>🔔</span>
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                name="url"
                                placeholder="Add URL..."
                                value={formData.url}
                                onChange={handleInputChange}
                                className="w-full border rounded-md pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">
                🔗
              </span>
                        </div>
                    </div>
                );
            case "Memo":
                return (
                    <div className="space-y-4">
                        <div className="flex gap-2 items-center">
                            <input
                                type="text"
                                name="title"
                                placeholder="Title"
                                value={formData.title}
                                onChange={handleInputChange}
                                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <input
                                type="date"
                                name="memo_date"
                                value={formData.memo_date}
                                onChange={handleInputChange}
                                className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                name="url"
                                placeholder="URL"
                                value={formData.url}
                                onChange={handleInputChange}
                                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <button className="absolute right-2 top-1/2 -translate-y-1/2 text-lg font-bold">
                                +
                            </button>
                        </div>
                        <textarea
                            name="content"
                            placeholder="Write your memo here..."
                            value={formData.content}
                            onChange={handleInputChange}
                            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            rows={6}
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-[500px]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-slate-800">Add</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 text-2xl"
                    >
                        ×
                    </button>
                </div>
                <div className="flex items-center gap-2 mb-6 border-b pb-2">
                    <TabButton tabName="Event" />
                    <TabButton tabName="Todo" />
                    <TabButton tabName="Memo" />
                </div>
                <div>{renderForm()}</div>
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="w-full px-6 py-2.5 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-900 disabled:bg-slate-400"
                    >
                        {isLoading ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
}

