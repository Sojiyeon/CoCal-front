"use client";

import React, { useState, useEffect, useRef  } from "react";
import { CalendarEvent, ModalFormData, ProjectMember,  } from "../types";
import { HexColorPicker } from "react-colorful";
import {createMemo} from "@/api/memoApi";
import {InviteesList} from "../shared/InviteesList";
import { ReminderPicker } from "../shared/ReminderPicker";
import {createTodo} from "@/api/todoApi";

type ActiveTab = "Event" | "Todo" | "Memo";

type EventForm = {
    title: string;
    description: string;
    url: string;
    startAt: string;
    endAt: string;
    location: string;
    visibility: 'PUBLIC' | 'PRIVATE';
    memoDate: string;
    content: string;
    color: string;
    category: string;
    offsetMinutes: number | null;
    eventId?: number | null;
};
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

interface EventFormData {
    title: string;
    description: string;
    url: string;
    startAt: string;
    endAt: string;
    location: string;
    visibility: "PUBLIC" | "PRIVATE";
    memoDate: string;
    content: string;
    color: string;
}

interface TodoFormData {
    title: string;
    description: string;
    url: string;
    type: "EVENT" | "PRIVATE";
    date: string;
    offsetMinutes: number | null;
    projectId: number;
    eventId?: number | null; // 이벤트에 종속될 경우
}

interface MemoFormData {
    title: string;
    memoDate: string;
    content: string;
    url: string;
}

function ColorPaletteSelector({ selectedColor, onColorChange }: ColorPaletteProps) {
    const [isPaletteOpen, setIsPaletteOpen] = useState(false);
    //버튼 요소에 접근하기 위한  ref
    const buttonRef = useRef<HTMLButtonElement>(null);
    // 팔레트의 위치를 저장할 상태
    const [paletteStyle, setPaletteStyle] = useState({});
    const handleColorSelect = (color: string) => {
        onColorChange(color);
    };
    // 팔레트를 열고 닫는 토글 함수
    const togglePalette = () => {
        setIsPaletteOpen(!isPaletteOpen);
    };

    return (
        <div className="relative w-full">
            <button
                type="button"
                ref={buttonRef}
                onClick={togglePalette}
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

                        {/*  컬러 피커 (컬러 서클) 영역 */}
                        <div>
                            <HexColorPicker
                                color={selectedColor}
                                onChange={handleColorSelect}
                                style={{width: '250px'}}
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
    members?: ProjectMember[];
    events?: CalendarEvent[];
}

export function EventModal({onClose, onSave, editEvent, initialDate, projectId, members = [], events = [] }: Props) {
    const [activeTab, setActiveTab] = useState<ActiveTab>("Event");
    const [isLoading, setIsLoading] = useState(false);

  
    const [formData, setFormData] = useState<
        EventForm & EventFormData & Partial<TodoFormData> & Partial<MemoFormData>
    >({
        title: "",
        description: "",
        url: "",
        startAt: "",
        endAt: "",
        location: "",
        visibility: "PUBLIC",
        memoDate: "",
        content: "",
        color: "#3b82f6",
        category: "Project 1",
        offsetMinutes: 15,
       // eventId: null,

        //color: "",
        // Todo 전용
        type: "PRIVATE",
       // offsetMinutes: 15,
        date: "",
        projectId: projectId,
        eventId: undefined, // 아직 연결된 이벤트 없으면 undefined
    });

    useEffect(() => {
        // '수정 모드'일 경우 (editEvent prop이 있을 때)
        if (editEvent) {
            setFormData({
                title: editEvent.title,
                description: editEvent.description || "",
                url: editEvent.url || "",
                startAt: editEvent.startAt.slice(0, 16),
                endAt: editEvent.endAt.slice(0, 16),
                location: editEvent.location || "",
                visibility: editEvent.visibility,
                memoDate: editEvent.startAt.split("T")[0],
                content: editEvent.description || "", // 이벤트 수정 시에는 사용하지 않음
                color: editEvent.color,
                category: "Project 1", // 실제 데이터 구조에 맞게 수정 필요
                offsetMinutes:
                    typeof (editEvent as any).offsetMinutes === "number"
                        ? (editEvent as any).offsetMinutes
                        : 15,
            });
            // 수정 시에는 'Event' 탭이 기본으로 선택되도록 강제
            setActiveTab("Event");
        } else {
            // '생성 모드'일 경우 (editEvent prop이 없을 때) - 기존 로직
            const date = initialDate ? new Date(initialDate) : new Date();
            const startDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16);
            date.setHours(date.getHours() + 1);
            const endDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16);
            const justDate = startDateTime.split("T")[0];

            setFormData((prev) => ({
                ...prev,
                startAt: startDateTime,
                endAt: endDateTime,
                memoDate: justDate,
                // reminderMinutes는 기본 15 유지
            }));
        }
    }, [initialDate, editEvent]);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };
    //  색상 변경을 처리하는 함수
    const handleColorChange = (newColor: string) => {
        setFormData(prev => ({ ...prev, color: newColor }));
    };
    const handleVisibilityChange = (visibility: "PUBLIC" | "PRIVATE") => {
        setFormData((prev) => ({ ...prev, visibility }));
    };
    // todo type 정의
    const handleTypeChange = (type: "EVENT" | "PRIVATE") => {
        setFormData((prev) => ({ ...prev, type }));
    };

    // 생성 시 db에 저장
    const handleSave = async () => {
        setIsLoading(true);
        try {
            if (activeTab === "Memo") {
                const memoData: MemoFormData = {
                    title: formData.title,
                    content: formData.content,
                    url: formData.url,
                    memoDate: formData.memoDate,
                };
                // projectId를 props에서 가져와 사용
                const response = await createMemo(projectId, memoData);
                // 부모 컴포넌트로 새 메모 전달
                onSave(response, activeTab);
            } else if (activeTab === "Todo") {
                const todoData: TodoFormData = {
                    title: formData.title,
                    description: formData.description,
                    url: formData.url,
                    type: formData.type!, // 반드시 EVENT 또는 PRIVATE
                    date: formData.startAt, // Todo 날짜
                    offsetMinutes: formData.offsetMinutes!, // undefined 방지
                    projectId,
                    eventId: formData.eventId // 이벤트 종속
                };
                const response = await createTodo(projectId, todoData);
                onSave(response, activeTab);
            } else {
                onSave(formData, activeTab, editEvent ? editEvent.id : undefined);
            }
            onClose();
        } catch (err) {
            alert("저장 중 오류 발생");
        } finally {
            setIsLoading(false);
        }
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
                        {/* 이벤트 탭에 메모를 입력할 수 있는 textarea 추가 */}
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

                        <ReminderPicker
                            value={formData.offsetMinutes}
                            onChange={(val) => setFormData((prev) => ({ ...prev, offsetMinutes: val }))}
                            label="Reminder"
                        />
                        <input
                            type="text"
                            name="url"
                            placeholder="URL"
                            value={formData.url}
                            onChange={handleInputChange}
                            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />

                        <div className="w-full border rounded-md p-3">
                            {/* 제목 라벨 */}
                            <p className="text-xs font-semibold text-slate-500 mb-2">Invitees</p>

                            {/*  팀원 목록  */}
                            <InviteesList members={members}/>
                        </div>

                        <ColorPaletteSelector
                            selectedColor={formData.color}
                            onColorChange={handleColorChange}
                        />


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
                        <div>
                            <label className="text-sm font-medium text-slate-600">Visibility</label>
                            <div className="flex gap-4 mt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio" name="type" value="EVENT"
                                        checked={formData.type === "EVENT"}
                                        onChange={() => handleTypeChange("EVENT")}
                                        className="form-radio h-4 w-4 text-blue-600"
                                    />
                                    <span className="text-sm">Public</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio" name="type" value="PRIVATE"
                                        checked={formData.type === "PRIVATE"}
                                        onChange={() => handleTypeChange("PRIVATE")}
                                        className="form-radio h-4 w-4 text-blue-600"
                                    />
                                    <span className="text-sm">Private</span>
                                </label>
                            </div>
                        </div>

                        {/* Public일 때만 카테고리(이벤트) 선택창 표시 */}
                        {formData.visibility === 'PUBLIC' && (
                            <div>
                                <label htmlFor="parentEvent" className="text-sm font-medium text-slate-600">Category (Event)</label>
                                <select
                                    id="parentEvent"
                                    name="eventId"
                                    value={formData.eventId ?? ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, eventId: e.target.value ? Number(e.target.value) : null }))}
                                    className="w-full mt-2 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="">-- Select an event --</option>
                                    {/* '할일:'로 시작하는 래퍼 이벤트는 제외하고 진짜 이벤트만 표시 */}
                                    {events.filter(event => !event.title.startsWith('Todo:')).map(event => (
                                        <option key={event.id} value={event.id}>
                                            {event.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Private일 때만 ReminderPicker 표시 */}
                        {formData.visibility === 'PRIVATE' && (
                            <ReminderPicker
                                value={formData.offsetMinutes}
                                onChange={(val) => setFormData((prev) => ({ ...prev, offsetMinutes: val }))}
                                label="Reminder"
                            />
                        )}
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

