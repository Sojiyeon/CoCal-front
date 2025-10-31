"use client";

import React, { useState, useEffect, FC } from 'react';
import { X } from 'lucide-react';

// API 요청 및 유저 컨텍스트에 사용할 뷰 타입
type ViewOption = 'DAY' | 'WEEK' | 'MONTH';

interface DefaultViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    // 현재 유저의 뷰 설정값 (예: 'MONTH')
    currentView: string;
    // 저장 시 실행될 함수 (API 호출 로직)
    onSave: (newView: ViewOption) => Promise<void>;
}

// 모달에 표시할 옵션 목록
const viewOptions: { key: ViewOption, label: string }[] = [
    { key: 'DAY', label: 'Day' },
    { key: 'WEEK', label: 'Week' },
    { key: 'MONTH', label: 'Month' },
];

const DefaultViewModal: FC<DefaultViewModalProps> = ({ isOpen, onClose, currentView, onSave }) => {
    const [selectedView, setSelectedView] = useState<ViewOption>(currentView.toUpperCase() as ViewOption);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (currentView) {
            setSelectedView(currentView.toUpperCase() as ViewOption);
        }
    }, [currentView, isOpen]);

    if (!isOpen) {
        return null;
    }

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await onSave(selectedView);
        } catch (error) {
            console.error("Failed to save default view:", error);
            alert("Failed to save settings.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[500] flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={onClose}
        >
            {/* 2. 모달 컨테이너 스타일 통일 */}
            <div
                className="bg-white dark:bg-neutral-900 rounded-3xl p-8 w-full max-w-sm shadow-2xl relative transform transition-all duration-300 scale-100"
                onClick={(e) => e.stopPropagation()} // 모달 내부 클릭 시 닫기 방지
            >
                {/* 3. 'X' 닫기 버튼 스타일 및 위치 변경 */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-50/5 transition"
                    aria-label="Close"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* 헤더 */}
                <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-8">
                    Default View
                </h2>

                {/* 뷰 선택 옵션 */}
                <div className="bg-gray-100 dark:bg-neutral-800 rounded-lg p-3 space-y-1.5 mb-8">
                    {viewOptions.map((option) => (
                        <div
                            key={option.key}
                            onClick={() => !isLoading && setSelectedView(option.key)}
                            className={`w-full p-3 rounded-md cursor-pointer transition-all duration-150 text-center
                                ${selectedView === option.key
                                ? 'bg-white dark:bg-neutral-700 shadow-sm font-semibold text-blue-600 dark:text-blue-300'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-700/50'
                            }
                            `}
                        >
                            {option.label}
                        </div>
                    ))}
                </div>

                {/* 저장 버튼 */}
                <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Saving...' : 'Save'}
                </button>
            </div>
        </div>
    );
};

export default DefaultViewModal;