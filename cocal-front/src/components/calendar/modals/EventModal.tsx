"use client";

import React, { useState, useEffect, useRef  } from "react";
import {CalendarEvent, ProjectMember, EventData, EventRequest, ModalFormData, EventTodo, RealEventTodo} from "../types";
import { HexColorPicker } from "react-colorful";
import {createMemo} from "@/api/memoApi";
import {InviteesList} from "../shared/InviteesList";
import { ReminderPicker } from "../shared/ReminderPicker";
import {createTodo, updateTodo, updateTodoRequest} from "@/api/todoApi";
import {getEvent, createEvent, updateEvent} from "@/api/eventApi";

export type ActiveTab = "Event" | "Todo" | "Memo";

const palettes = [
    ["#19183B", "#708993", "#A1C2BD", "#E7F2EF"],
    ["#F8FAFC", "#D9EAFD", "#BCCCDC", "#9AA6B2"],
    ["#FFEADD", "#FF6666", "#BF3131", "#7D0A0A"],
    ["#FCF9EA", "#BADFDB", "#FFA4A4", "#FFBDBD"],
    ["#F2EFE7", "#9ACBD0", "#48A6A7", "#006A71"],
];
type FormState = {
    // Event 공통
    title: string;
    description: string;
    url: string;
    urls: string[];
    startAt: string;
    endAt: string;
    location: string;
    visibility: "PUBLIC" | "PRIVATE";
    memoDate: string;
    content: string;
    color: string;
    category: string;
    memberUserIds: number[];

    // ReminderPicker와 호환 (null 가능)
    // offsetMinutes: number | null;
    offsetMinutes?: number | null;
    // Todo 관련
    type: "EVENT" | "PRIVATE";
    date: string;
    projectId: number;
    eventId?: number; // undefined로 관리
};

interface ColorPaletteProps {
    selectedColor: string;
    onColorChange: (color: string) => void;
}
// 컬러팔레트
function ColorPaletteSelector({ selectedColor, onColorChange }: ColorPaletteProps) {
    const [isPaletteOpen, setIsPaletteOpen] = useState(false);
    //버튼 요소에 접근하기 위한  ref
    const buttonRef = useRef<HTMLButtonElement>(null);
    // 팔레트의 위치를 저장할 상태
    const [paletteStyle] = useState({});
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
                className="w-full border rounded-md px-3 py-2 text-sm flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-50/5 dark:text-slate-300 dark:border-neutral-700"
            >
                <div
                    className="w-5 h-5 rounded-full border"
                    style={{ backgroundColor: selectedColor }}
                ></div>
                <span>Color</span>
            </button>
            {isPaletteOpen && (
                <div
                    className="w-auto bg-white border rounded-md shadow-lg p-3 dark:bg-neutral-950 dark:border-neutral-700"
                    style={paletteStyle}
                >

                    <div className="flex flex-col sm:flex-row gap-4">
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
                        <div className="w-full sm:w-[250px]">
                            <HexColorPicker
                                color={selectedColor}
                                onChange={handleColorSelect}
                                style={{width: '250px'}}
                                className="w-full"
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
    editEventId: number | null;
    editTodo?: RealEventTodo | null;
    projectId: number;
    members?: ProjectMember[];
    events?: CalendarEvent[];
}
// 모달창
export function EventModal({onClose, onSave, editEventId, editTodo, initialDate, projectId, members = [], events = [] }: Props) {
    const [activeTab, setActiveTab] = useState<ActiveTab>("Event");
    const [isLoading, setIsLoading] = useState(false);
    function pickOffsetMinutes(e: unknown): number {
        if (e && typeof e === "object" && "offsetMinutes" in e) {
            const v = (e as { offsetMinutes?: unknown }).offsetMinutes;
            return typeof v === "number" ? v : 15;
        }
        return 15;
    }

    // =====eventUrl관련=======
    // eventUrl 입력 핸들러
    const handleUrlChange = (index: number, value: string) => {
        setFormData((prev) => {
            const updated = [...prev.urls];
            updated[index] = value;
            return { ...prev, urls: updated };
        });
    };
    // eventUrl 필드 추가/삭제
    const addUrlField = () =>
        setFormData((prev) => ({ ...prev, urls: [...prev.urls, ""] }));
    const removeUrlField = (index: number) =>
        setFormData((prev) => ({
            ...prev,
            urls: prev.urls.filter((_, i) => i !== index),
        }));
    // ======================
    // =======멤버 선택 관련========
    // 선택된 멤버
    const [selectedSet, setSelectedSet] = useState<Set<number>>(new Set());
    // 멤버 선택 핸들러
    const handleSelect = (userId: number) => {
        setSelectedSet(prev => {
            const newSet = new Set(prev);
            if (newSet.has(userId)) {
                newSet.delete(userId);   // 이미 선택된 경우 해제
            } else {
                newSet.add(userId);      // 선택 추가
            }
            return newSet;
        });
    };
    // 이벤트 수정 시 이미 참여된 멤버 상태
    const [alreadyMember, setAlreadyMember] = useState<number[]>([]);
    // ===================


    const [formData, setFormData] = useState<FormState>({
        title: "",
        description: "",
        url: "",
        urls: [],
        startAt: "",
        endAt: "",
        location: "",
        visibility: "PUBLIC",
        memoDate: "",
        content: "",
        color: "#3b82f6",
        category: "Project 1",
        offsetMinutes: 15,        // FormState: number | null
        type: "PRIVATE",
        date: "",
        projectId,
        eventId: undefined,
        memberUserIds: [],
    });

    // 수정인지 생성인지 확인
    useEffect(() => {
        console.log("editEventId: ", editEventId);
        // '수정 모드'일 경우 (editEventId prop이 있을 때) 이벤트 정보 조회
        // 1. Todo 수정 모드 (최우선으로 확인)
        if (editTodo) {
            setActiveTab("Todo"); // 탭을 'Todo'로 강제 전환
            if (editTodo.eventId) {editTodo.type="EVENT";} // eventId가 있으면 type=EVENT로 설정


            const todoDate = (editTodo as RealEventTodo & { date?: string }).date;
            let localDateForInput = "";

            if (todoDate) { // 날짜가 존재하면 (UTC ISO 문자열로 가정)
                const dateObj = new Date(todoDate);
                // KST (local)의 YYYY-MM-DDTHH:mm 형식으로 변환
                localDateForInput = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000)
                    .toISOString()
                    .slice(0, 16);
            }
            setFormData(prev => ({
                ...prev,
                title: editTodo.title,
                description: editTodo.description || "",
                url: editTodo.url || "",
                type: editTodo.type,
                eventId: editTodo.eventId,

                date: editTodo.type === 'PRIVATE' ? localDateForInput : prev.date,

                offsetMinutes: (editTodo as RealEventTodo & { offsetMinutes?: number | null }).offsetMinutes ?? prev.offsetMinutes,
            }));
        }
        else if (editEventId) {
            (async () => {
                try {
                    setIsLoading(true);
                    // api 호출
                    // 이벤트 조회(members:ProjectMember[] 사용)
                    const eventData:EventData = await getEvent(projectId, editEventId);
                    console.log('이벤트 조회 성공:', eventData);
                    // 공통 상태 저장
                    setFormData(prev => ({
                        ...prev,
                        title: eventData.title,
                        description: eventData.description,
                        startAt: eventData.startAt,
                        endAt: eventData.endAt,
                        location: eventData.location ?? "",
                        visibility: eventData.visibility,
                        color: eventData.color ?? "",
                        offsetMinutes: eventData.offsetMinutes ?? null,
                        projectId: eventData.projectId,
                        eventId: eventData.id,
                        urls: eventData.urls?.map(u => u.url) ?? [],  // EventUrl[] → string[]
                    }));
                    // 멤버 → id 배열
                    const ids: number[] = (eventData.members ?? [])
                        .map(m => (m).userId ?? (m).userId) // 서버 응답 키가 userId가 아닐 수도 있어 안전 처리
                        .filter((v): v is number => typeof v === "number");

                    setAlreadyMember(ids);          // (표시용)
                    setSelectedSet(new Set(ids));   // 선택의 단일 소스 초기화
                } catch (err: unknown) {
                    console.error('이벤트 정보 로드 실패:', err);
                } finally {
                    setIsLoading(false);
                };
                setActiveTab("Event");
            })();
        } else {
            // '생성 모드'일 경우 (editEvent prop이 없을 때) - 기존 로직
            let date = new Date(); // 먼저 현재 시간으로 안전하게 기본값을 설정합니다.
            if (initialDate) {
                const parsedDate = new Date(initialDate);
                // initialDate로 파싱한 날짜가 유효한 경우에만 date 변수를 덮어씁니다.
                if (!isNaN(parsedDate.getTime())) {
                    date = parsedDate;
                }
            }
            // 지금 시간 계산 YYYY-MM-DDTHH:mm
            const startDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16);
            // 한 시간 뒤의 시간 계산 YYYY-MM-DDTHH:mm
            date.setHours(date.getHours() + 1);
            // 끝나는 시간을 한 시간 뒤로 계산
            const endDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16);
            // memo 저장의 위해 "YYYY-MM-DDTHH:mm" -> "YYYY-MM-DD"만 남김
            const justDate = startDateTime.split("T")[0];

            // 공통 상태 저장
            setFormData((prev) => ({
                ...prev,
                startAt: startDateTime,
                endAt: endDateTime,
                memoDate: justDate,
                date: startDateTime,
            }));
        }
    }, [initialDate, editEventId, editTodo, projectId]);

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
    // const handleVisibilityChange = (visibility: "PUBLIC" | "PRIVATE") => {
    //     setFormData((prev) => ({ ...prev, visibility }));
    // };
    // todo type 정의
    const handleTypeChange = (type: "EVENT" | "PRIVATE") => {
        setFormData((prev) => ({ ...prev,
            type,
            ...(type === "PRIVATE" ? { eventId: undefined } : {})
        }));
    };

    // 생성 시 db에 저장
    const handleSave = async () => {
        console.log("저장 클릭");
        console.log("activeTab: ", activeTab);
        setIsLoading(true);
        try {
            if (activeTab === "Memo") {
                const memoData = {
                    title: formData.title,
                    content: formData.content,
                    url: formData.url,
                    memoDate: formData.memoDate,
                };
                // projectId를 props에서 가져와 사용
                const response = await createMemo(projectId, memoData);
                window.alert("메모가 저장되었습니다.");
                // 부모 컴포넌트로 새 메모 전달
                onSave(response, activeTab);
                // 모달 닫기
                onClose();

            } else if (activeTab === "Todo") {
                // --- 유효성 검사 로직 (변경 없음) ---
                const hasParentEvent = typeof formData.eventId === "number" && Number.isFinite(formData.eventId);
                if (formData.type === "EVENT" && !hasParentEvent) {
                    alert("Please select a parent event for the public todo.");
                    setIsLoading(false);
                    return;
                }

                const isPublicType = formData.type === 'EVENT';
                let dateForServer: string; // [FIX] 서버로 보낼 최종 UTC 날짜 문자열

                if (isPublicType) {
                    // --- Public Todo (EVENT) ---

                    const selectedEvent = events.find(e => e.id === formData.eventId);


                    if (!selectedEvent && !editTodo) {
                        alert("Cannot find parent event data.");
                        setIsLoading(false);
                        return;
                    }
                    dateForServer = selectedEvent?.startAt ?? new Date().toISOString(); // 방어 코드
                } else {
                    // --- Private Todo (PRIVATE) ---
                    // formData.date는 KST 문자열입니다 (예: "2025-10-31T20:30")
                    const kstString = formData.date;

                    if (!kstString) {
                        alert("Please select a date for the private todo.");
                        setIsLoading(false);
                        return;
                    }

                    // [FIX] KST 문자열을 Date 객체로 변환 후, UTC ISO 문자열로 변경
                    const kstDate = new Date(kstString);
                    dateForServer = kstDate.toISOString(); // "2025-10-31T11:30:00.000Z"
                }

                // --- 서버에 보낼 데이터 ---
                const serverPayload = {
                    title: formData.title,
                    description: formData.description,
                    url: formData.url,
                    date: dateForServer, // [FIX] 항상 UTC 문자열을 전송합니다.
                    offsetMinutes: typeof formData.offsetMinutes === "number" ? formData.offsetMinutes : 15,
                    projectId,
                    type: formData.type,
                    ...(isPublicType && { eventId: formData.eventId! }),
                };

                // --- 부모 컴포넌트에 전달할 데이터 ---
                const normalizedForParent: ModalFormData = {
                    title: formData.title,
                    description: formData.description || "",
                    url: formData.url || "",
                    startAt: dateForServer, // [FIX] 부모에게도 UTC 전달
                    endAt: dateForServer,
                    location: "",
                    visibility: isPublicType ? "PUBLIC" : "PRIVATE",
                    memoDate: (dateForServer || "").split("T")[0],
                    content: formData.description || "",
                    category: "Todo",
                    color: formData.color || "#3b82f6",
                    ...(typeof formData.offsetMinutes === "number"
                        ? { offsetMinutes: formData.offsetMinutes }
                        : {}),
                    ...(isPublicType && formData.eventId !== undefined
                        ? { eventId: formData.eventId }
                        : {}),
                };

                if (editTodo && editTodo.id) {
                    // ----- UPDATE -----
                    const updatePayload: updateTodoRequest = {
                        title: formData.title,
                        description: formData.description,
                        url: formData.url,
                        status: editTodo.status,
                        type: formData.type,
                        eventId: formData.eventId!,
                        projectId: projectId,
                    };

                    await updateTodo(projectId, editTodo.id, updatePayload);
                    onSave(normalizedForParent, "Todo", editTodo.id);

                } else {
                    // ----- CREATE (생성) -----
                    // 서버에 보낼 데이터 (createTodo용)
                    const serverPayload = {
                        title: formData.title,
                        description: formData.description,
                        url: formData.url,
                        date: dateForServer, // 생성 시에는 dateForServer 사용
                        offsetMinutes: typeof formData.offsetMinutes === "number" ? formData.offsetMinutes : 15,
                        projectId,
                        type: formData.type,
                        ...(isPublicType && { eventId: formData.eventId! }),
                    };

                    await createTodo(projectId, serverPayload);
                    onSave(normalizedForParent, "Todo", undefined); // 생성 시 id 없음
                }
                onClose(); // 성공 후 모달 닫기
            } else if (activeTab === "Event") {
                // --- KST → UTC 변환 로직 추가 ---
                if (!formData.startAt || !formData.endAt) {
                    alert("시작과 종료 시간을 모두 입력해주세요.");
                    return;
                }

                // KST 문자열을 Date로 변환한 뒤, UTC ISO 문자열로 변환
                const startKST = new Date(formData.startAt); // 예: "2025-10-31T20:30"
                const endKST = new Date(formData.endAt);

                // ISO 문자열 (UTC)로 변환
                const startUTC = startKST.toISOString(); // "2025-10-31T11:30:00.000Z"
                const endUTC = endKST.toISOString();

                // 날짜 넘어가는 이벤트인지 확인
                const start = new Date(startUTC);
                const end = new Date(endUTC);
                if (end < start) {
                    alert("The end time cannot be earlier than the start time.");
                    console.log("종료 시간이 시작 시간보다 이전입니다.");
                    return;
                }

                const allDay: boolean = start.toDateString() !== end.toDateString();

                // Date/time 분리 (서버가 date + time 따로 받는 구조일 경우)
                const [startDate, startTimeWithZ] = startUTC.split("T");
                const [endDate, endTimeWithZ] = endUTC.split("T");
                const startTime = startTimeWithZ.replace("Z", ""); // 끝의 Z 제거
                const endTime = endTimeWithZ.replace("Z", "");

                // 생성/수정할 이벤트 정보
                const requestEvent: EventRequest = {
                    projectId: projectId,
                    title: formData.title,
                    startDate: startDate,
                    startTime: startTime,
                    endDate: endDate,
                    endTime: endTime,
                    allDay: allDay,
                    visibility: formData.visibility,
                    description: formData.description,
                    location: formData.location,
                    //  null이면  빼고, number면 그대로 (undefined만 허용)
                    ...(formData.offsetMinutes !== null ? { offsetMinutes: formData.offsetMinutes } : {}),
                    color: formData.color,
                    urls: formData.urls ?? [],
                    memberUserIds: [...selectedSet],
                };
                await (async () => {
                    try {
                        setIsLoading(true);
                        let savedEvent;
                        // 이벤트 수정이면
                        if (editEventId != null) {
                            savedEvent = await updateEvent(projectId, editEventId, requestEvent);
                            window.alert("이벤트가 수정되었습니다.");
                            console.log("수정된 이벤트: ", savedEvent);
                        } else {
                            // 이벤트 생성이면
                            savedEvent = await createEvent(projectId, requestEvent);
                            window.alert("이벤트가 저장되었습니다.");
                            console.log("생성된 이벤트: ", savedEvent);
                        }
                        // 성공 후 닫기
                        onClose();
                    } catch (err) {
                        console.error("이벤트 저장/수정 실패:", err);
                    } finally {
                        setIsLoading(false);
                    }
                })();
                // ㄹㅇ 어디부터 손 봐야할지 모를정도로 노답인 CalendarEvent 타입 관련된 녀석.
                // 나도 모르겠다 걍 둘게.
                const eventPayload: ModalFormData = {
                    title: formData.title,
                    description: formData.description,
                    url: formData.url,
                    startAt: formData.startAt,
                    endAt: formData.endAt,
                    location: formData.location,
                    visibility: formData.visibility,
                    memoDate: formData.memoDate,
                    content: formData.content,
                    category: formData.category,
                    color: formData.color,
                    // null이면 빼고, number면 그대로 (undefined만 허용)
                    ...(formData.offsetMinutes !== null ? { offsetMinutes: formData.offsetMinutes } : {}),
                    // undefined만 넣기
                    ...(formData.eventId !== undefined ? { eventId: formData.eventId } : {}),
                };
                onSave(eventPayload, activeTab, editEventId ? editEventId : undefined);
            }
        } catch (err:unknown) {
            // err 미사용 경고 제거
            console.error("Save error in EventModal:", err);
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
                    ? "bg-slate-200 text-slate-800 dark:bg-slate-500/50 dark:text-slate-200"
                    : "bg-white text-slate-500 hover:bg-slate-100 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-slate-500/20"
            }`}
        >
            {tabName}
        </button>
    );

    const renderForm = () => {
        switch (activeTab) {
            // 이벤트 UI
            case "Event":
                return (
                    <div className="space-y-4">
                        <input
                            type="text"
                            name="title"
                            placeholder="Title"
                            value={formData.title}
                            onChange={handleInputChange}
                            className="w-full text-lg font-semibold border-b pb-1 focus:outline-none focus:border-blue-500 dark:text-neutral-300 dark:border-neutral-600"
                        />

                        <input
                            type="text"
                            name="location"
                            placeholder="Location"
                            value={formData.location}
                            onChange={handleInputChange}
                            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-neutral-300 dark:border-neutral-600"
                        />
                        {/* 이벤트 탭에 메모를 입력할 수 있는 textarea 추가 */}
                        <textarea
                            name="description" // formData의 'content'와 연결
                            placeholder="Write a description for this event..."
                            value={formData.description}
                            onChange={handleInputChange}
                            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-neutral-300 dark:border-neutral-600"
                            rows={4} // 원하는 높이로 조절
                        />

                        <div className="flex flex-col sm:grid sm:grid-cols-[1fr_auto_1fr] gap-2 items-center dark:text-neutral-500">
                            <div className="w-full">
                                <label htmlFor="startAt" className="text-xs text-slate-500 dark:text-slate-400">Start</label>
                                <input
                                    id="startAt"
                                    type="datetime-local"
                                    name="startAt"
                                    value={formData.startAt}
                                    onChange={handleInputChange}
                                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-neutral-300 dark:border-neutral-600"
                                />
                            </div>
                            <span className="hidden sm:inline">-</span>
                            <div className="w-full">
                                <label htmlFor="endAt" className="text-xs text-slate-500 dark:text-slate-400">End</label>
                                <input
                                    id="endAt"
                                    type="datetime-local"
                                    name="endAt"
                                    value={formData.endAt}
                                    onChange={handleInputChange}
                                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-neutral-300 dark:border-neutral-600"
                                />
                            </div>
                        </div>

                        <ReminderPicker
                            value={formData.offsetMinutes ?? null}
                            onChange={(val) => setFormData((prev) => ({...prev, offsetMinutes: val}))}
                            label="Reminder"
                        />
                        {/*url 필드*/}
                        <div className="space-y-2">
                            {formData.urls.map((url, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <input
                                        type="url"
                                        placeholder={`URL ${index + 1}`}
                                        value={url}
                                        onChange={(e) => handleUrlChange(index, e.target.value)}
                                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-slate-300 dark:border-neutral-600"
                                    />
                                    {formData.urls.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeUrlField(index)}
                                            className="px-2 py-1 text-red-500 hover:text-red-700"
                                        >
                                            🗑️
                                        </button>
                                    )}
                                </div>
                            ))}
                            {/*url 추가 버튼*/}
                            <button
                                type="button"
                                onClick={addUrlField}
                                className="text-blue-600 text-sm hover:underline mt-1 dark:text-blue-400"
                            >
                                + URL
                            </button>
                        </div>

                        <div className="w-full border rounded-md p-3 dark:border-neutral-600">
                            {/* 제목 라벨 */}
                            <p className="text-xs font-semibold text-slate-500 mb-2 dark:text-slate-400">Invitees</p>
                            {/*  팀원 목록  */}
                            <InviteesList
                                members={members}
                                alreadyMember={alreadyMember}
                                onSelectAction={handleSelect}
                                selectedIds={[...selectedSet]} // 중복 클릭 막을 상태 전달
                            />
                            {/* 디버깅용 표시 */}
                            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                선택된 ID: {[...selectedSet].join(", ") || "-"}
                            </div>
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
                            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-slate-300 dark:border-neutral-600"
                        />
                        <textarea
                            name="description"
                            placeholder="Description..."
                            value={formData.description}
                            onChange={handleInputChange}
                            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-slate-300 dark:border-neutral-600"
                            rows={3}
                        />
                        {editTodo ? // 수정일 때는 타입 변환 불가능
                            <div>
                                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Visibility</label>
                                <div className="flex gap-4 mt-2">
                                    <label className="flex items-center gap-2 cursor-default">
                                        <input
                                            type="radio"
                                            name="visibility"
                                            value="PUBLIC"
                                            checked={formData.type === "EVENT"}
                                            disabled
                                            className="form-radio h-4 w-4 text-blue-600 cursor-not-allowed"
                                        />
                                        <span className="text-sm text-gray-500">Public</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-default">
                                        <input
                                            type="radio"
                                            name="visibility"
                                            value="PRIVATE"
                                            checked={formData.type === "PRIVATE"}
                                            disabled
                                            className="form-radio h-4 w-4 text-blue-600 cursor-not-allowed"
                                        />
                                        <span className="text-sm text-gray-500">Private</span>
                                    </label>
                                </div>
                            </div>
                            : // 생성일 때는 타입 변환 가능
                            <div>
                                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Visibility</label>
                                <div className="flex gap-4 mt-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio" name="type" value="EVENT"
                                            checked={formData.type === "EVENT"}
                                            onChange={() => handleTypeChange("EVENT")}
                                            className="form-radio h-4 w-4 text-blue-600"
                                        />
                                        <span className="text-sm dark:text-slate-300">Public</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio" name="type" value="PRIVATE"
                                            checked={formData.type === "PRIVATE"}
                                            onChange={() => handleTypeChange("PRIVATE")}
                                            className="form-radio h-4 w-4 text-blue-600"
                                        />
                                        <span className="text-sm dark:text-slate-300">Private</span>
                                    </label>
                                </div>
                            </div>
                        }


                        {/* Public일 때만 카테고리(이벤트) 선택창 표시 */}
                        {formData.type === 'EVENT' && (
                            <div>
                                <label htmlFor="parentEvent" className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                    Category (Event)
                                </label>
                                <select
                                    id="parentEvent"
                                    name="eventId"
                                    value={formData.eventId ?? (editTodo?.eventId ?? '')} // editTodo가 있으면 그걸 기본 선택값으로
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            eventId: e.target.value ? Number(e.target.value) : undefined,
                                        }))
                                    }
                                    className="w-full mt-2 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-600 dark:text-slate-300 dark:bg-neutral-950"
                                >
                                    <option value="">-- Select an event --</option>
                                    {events
                                        .filter(event => !event.title.startsWith('Todo:'))
                                        .map(event => (
                                            <option key={event.id} value={event.id}>
                                                {event.title}
                                            </option>
                                        ))}
                                </select>
                            </div>
                        )}

                        {/* Private일 때만 ReminderPicker 표시 */}
                        {formData.type === 'PRIVATE' && (
                            <div className="space-y-4">
                                <input
                                    type="datetime-local"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleInputChange}
                                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-slate-300 dark:border-neutral-600"
                                />
                                <ReminderPicker
                                    value={formData.offsetMinutes ?? null}
                                    onChange={(val) => setFormData((prev) => ({ ...prev, offsetMinutes: val }))}
                                    label="Reminder"
                                />
                            </div>
                        )}
                        <div className="relative">
                            <input
                                type="text"
                                name="url"
                                placeholder="Add URL..."
                                value={formData.url}
                                onChange={handleInputChange}
                                className="w-full border rounded-md pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-slate-300 dark:border-neutral-600"
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
                                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-slate-300 dark:border-neutral-600"
                            />
                            <input
                                type="date"
                                name="memoDate"
                                value={formData.memoDate}
                                onChange={handleInputChange}
                                className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-slate-300 dark:border-neutral-600"
                            />
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                name="url"
                                placeholder="URL"
                                value={formData.url}
                                onChange={handleInputChange}
                                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-slate-300 dark:border-neutral-600"
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
                            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-slate-300 dark:border-neutral-600"
                            rows={6}
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg dark:bg-neutral-950">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">{editTodo ? "Edit Todo" : (editEventId ? "Edit Event" : "New")}</h2>

                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 text-2xl"
                    >
                        ×
                    </button>
                </div>
                {!editEventId && !editTodo && (
                    <div className="flex items-center gap-2 mb-6 border-b pb-1 dark:border-neutral-600">
                        <TabButton tabName="Event"/>
                        <TabButton tabName="Todo"/>
                        <TabButton tabName="Memo"/>
                    </div>
                )}
                <div className="max-h-[70vh] overflow-y-auto overflow-x-hidden scrollbar-hide">
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

