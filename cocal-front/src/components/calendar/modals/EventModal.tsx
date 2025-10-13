"use client";

import React, { useState, useEffect, useRef  } from "react";
import { CalendarEvent, ModalFormData } from "../types";
import { HexColorPicker } from "react-colorful";
type ActiveTab = "Event" | "Todo" | "Memo";

const palettes = [
    ["#19183B", "#708993", "#A1C2BD", "#E7F2EF"],
    ["#F8FAFC", "#D9EAFD", "#BCCCDC", "#9AA6B2"],
    ["#FFEADD", "#FF6666", "#BF3131", "#7D0A0A"],
    ["#FCF9EA", "#BADFDB", "#FFA4A4", "#FFBDBD"],
    ["#F2EFE7", "#9ACBD0", "#48A6A7", "#006A71"],
];

interface ColorPaletteProps {
    selectedColor: string;
    onColorChange: (color: string) => void;
}

function ColorPaletteSelector({ selectedColor, onColorChange }: ColorPaletteProps) {
    const [isPaletteOpen, setIsPaletteOpen] = useState(false);
// [추가] 버튼 요소에 접근하기 위한 ref
    const buttonRef = useRef<HTMLButtonElement>(null);

    // [추가] 팔레트의 위치를 저장할 상태
    const [paletteStyle, setPaletteStyle] = useState({});
    const handleColorSelect = (color: string) => {
        onColorChange(color);
      //  setIsPaletteOpen(false);
    };
    // [추가] 팔레트를 열고 닫는 토글 함수
    const togglePalette = () => {
        if (!isPaletteOpen) {
            // 팔레트를 열 때, 버튼의 화면상 위치를 계산합니다.
            if (buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                setPaletteStyle({
                    position: 'fixed', // 위치 기준을 전체 화면으로 변경
                    top: `${rect.top}px`, // 버튼의 상단에 맞춤
                    left: `${rect.right + 8}px`, // 버튼의 오른쪽에 8px 간격을 두고 위치
                    zIndex: 100 // 다른 요소들 위에 보이도록 z-index를 높게 설정
                });
            }
        }
        setIsPaletteOpen(!isPaletteOpen);
    };
    return (
        <div className="relative w-full">
            <button
                type="button"
                onClick={() => setIsPaletteOpen(!isPaletteOpen)}
                className="w-full border rounded-md px-3 py-2 text-sm flex items-center gap-2 cursor-pointer hover:bg-slate-50"
            >
                <div
                    className="w-5 h-5 rounded-full border"
                    style={{ backgroundColor: selectedColor }}
                ></div>
                <span>Color</span>
            </button>
            {isPaletteOpen && (
                <div
                    className="w-auto bg-white border rounded-md shadow-lg p-3"
                    style={paletteStyle}
                >
                    {/* [수정] 팔레트와 컬러 피커를 가로로 배치하기 위해 flex 사용 */}
                    <div className="flex gap-4">
                        {/* 기존 팔레트 영역 */}
                        <div className="space-y-3">
                            {palettes.map((palette, paletteIndex) => (
                                <div key={paletteIndex} className="flex items-center gap-2">
                                    {palette.map((color) => (
                                        <button
                                            type="button"
                                            key={color}
                                            onClick={() => handleColorSelect(color)}
                                            className="w-6 h-6 rounded-full border hover:scale-110 transition-transform"
                                            style={{backgroundColor: color}}
                                            aria-label={`Select color ${color}`}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>

                        {/* [추가] 컬러 피커 (컬러 서클) 영역 */}
                        <div>
                            <HexColorPicker
                                color={selectedColor}
                                onChange={handleColorSelect}
                                style={{width: '250px'}} // 원하는 너비로 직접 지정 (예: 150px)
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

interface Props {
    onClose: () => void;
    onSave: (itemData: ModalFormData, type: ActiveTab, id?: number) => void;
    initialDate?: string | null;
    editEvent: CalendarEvent | null;
    projectId: number;
}

export function EventModal({onClose, onSave, editEvent, initialDate, projectId }: Props) {
    const [activeTab, setActiveTab] = useState<ActiveTab>("Event");
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        url: "",
        startAt: "",
        endAt: "",
        location: "",
        visibility: "PUBLIC" as "PUBLIC" | "PRIVATE",
        memoDate: "",
        content: "",
        color: "",
        category: "Project 1",
    });

    useEffect(() => {
        // [수정] '수정 모드'일 경우 (editEvent prop이 있을 때)
        if (editEvent) {
            // 폼 데이터를 수정할 이벤트의 정보로 채웁니다.
            setFormData({
                title: editEvent.title,
                description: editEvent.description || "",
                url: "", // 실제 데이터 구조에 맞게 수정 필요
                startAt: editEvent.startAt.slice(0, 16),
                endAt: editEvent.endAt.slice(0, 16),
                location: editEvent.location || "",
                visibility: editEvent.visibility,
                memoDate: editEvent.startAt.split("T")[0],
                content: editEvent.description || "", // 이벤트 수정 시에는 사용하지 않음
                color: editEvent.color,
                category: "Project 1", // 실제 데이터 구조에 맞게 수정 필요
            });
            // 수정 시에는 'Event' 탭이 기본으로 선택되도록 강제
            setActiveTab("Event");
        } else {
            // '생성 모드'일 경우 (editEvent prop이 없을 때) - 기존 로직
            const date = initialDate ? new Date(initialDate) : new Date();
            const startDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            date.setHours(date.getHours() + 1);
            const endDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            const justDate = startDateTime.split("T")[0];

            setFormData((prev) => ({
                ...prev,
                startAt: startDateTime,
                endAt: endDateTime,
                memoDate: justDate,
            }));
        }
    }, [initialDate, editEvent]);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };
    // [수정 4] 색상 변경을 처리하는 함수를 만듭니다.
    const handleColorChange = (newColor: string) => {
        setFormData(prev => ({ ...prev, color: newColor }));
    };
    const handleVisibilityChange = (visibility: "PUBLIC" | "PRIVATE") => {
        setFormData((prev) => ({ ...prev, visibility }));
    };

    const handleSave = async () => {
        setIsLoading(true);

        console.warn(`개발 모드: ${activeTab} 저장을 시뮬레이션합니다.`);

        // [핵심 수정] onSave 함수는 여기서 단 한 번만 호출되어야 합니다.
        // '수정 모드'일 경우 editEvent.id를, 아닐 경우 undefined를 전달합니다.
        onSave(formData, activeTab, editEvent ? editEvent.id : undefined);

        setIsLoading(false);
        onClose();
    };

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

    //     console.warn(`개발 모드: ${activeTab} 저장을 시뮬레이션합니다. API 호출은 주석 처리되었습니다.`);
    //     onSave(formData, activeTab);
    //
    //     setIsLoading(false);
    //     onClose();
    // };

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
                            placeholder="Title"
                            value={formData.title}
                            onChange={handleInputChange}
                            className="w-full text-lg font-semibold border-b pb-1 focus:outline-none focus:border-blue-500"
                        />

                        <input
                            type="text"
                            name="location"
                            placeholder="Location"
                            value={formData.location}
                            onChange={handleInputChange}
                            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        {/* [추가] 이벤트 탭에 메모를 입력할 수 있는 textarea 추가 */}
                        <textarea
                            name="content" // formData의 'content'와 연결
                            placeholder="Write a memo for this event..."
                            value={formData.content}
                            onChange={handleInputChange}
                            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            rows={4} // 원하는 높이로 조절
                        />
                        <div className="flex gap-2 items-center">
                            <input
                                type="datetime-local"
                                name="startAt"
                                value={formData.startAt}
                                onChange={handleInputChange}
                                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <span>-</span>
                            <input
                                type="datetime-local"
                                name="endAt"
                                value={formData.endAt}
                                onChange={handleInputChange}
                                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <div
                            className="w-full border rounded-md px-3 py-2 text-sm text-slate-400 flex justify-between items-center">
                            <span>Repeat</span> <span>&gt;</span>
                        </div>
                        <div
                            className="w-full border rounded-md px-3 py-2 text-sm text-slate-400 flex justify-between items-center">
                            <span>Reminder</span> <span>15min ago</span>
                        </div>

                        <input
                            type="text"
                            name="url"
                            placeholder="URL"
                            value={formData.url}
                            onChange={handleInputChange}
                            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
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

                        <ColorPaletteSelector
                            selectedColor={formData.color}
                            onColorChange={handleColorChange}
                        />

                        {/*<div className="w-full border rounded-md px-3 py-2 text-sm flex items-center gap-2">*/}
                        {/*    <div className="w-5 h-5 rounded-full bg-blue-500"></div>*/}
                        {/*    <span>Color</span>*/}
                        {/*</div>*/}
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
                                name="memoDate"
                                value={formData.memoDate}
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
                    <h2 className="text-lg font-bold text-slate-800">{editEvent ? "Edit Event" : "New"}</h2>

                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 text-2xl"
                    >
                        ×
                    </button>
                </div>
                <div className="flex items-center gap-2 mb-6 border-b pb-2">
                    <TabButton tabName="Event"/>
                    {!editEvent && <TabButton tabName="Todo"/>}
                    {!editEvent && <TabButton tabName="Memo"/>}
                </div>
                <div className="max-h-[70vh] overflow-y-auto overflow-x-hidden pr-3">
                    {renderForm()}
                </div>

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

