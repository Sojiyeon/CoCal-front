"use client";

import React, { FC, ReactNode, useRef } from 'react';
import { X } from 'lucide-react'; // 닫기 아이콘 사용

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    className?: string;
}


const Modal: FC<ModalProps> = ({ isOpen, onClose, title, children, className = '' }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    if (!isOpen) return null;

    // 모달 외부 클릭 시 닫기
    const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === modalRef.current) {
            onClose();
        }
    };

    return (
        // 배경 (Overlay)
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            ref={modalRef}
            onClick={handleOutsideClick}
        >
            {/* 모달 내용 컨테이너 */}
            <div
                className={`bg-white rounded-xl shadow-2xl w-full max-w-lg transition-all transform duration-300 scale-100 ${className}`}
                onClick={e => e.stopPropagation()} // 내부 클릭 시 닫히지 않도록 방지
            >
                {/* 모달 헤더 */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition"
                        aria-label="Close modal"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* 모달 바디 */}
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;