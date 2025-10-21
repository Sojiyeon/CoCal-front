"use client";

import React, { FC, ReactNode, useRef } from 'react';
import { X } from 'lucide-react'; // 닫기 아이콘 사용

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    className?: string;

    titleClassName?: string;
    footer?: ReactNode; // 버튼을 위한 푸터 영역
    maxWidth?: string; // 모달 최대 너비 제어 (max-w-md, max-w-lg 등)
}


const Modal: FC<ModalProps> = ({ isOpen, onClose, title, children, className, titleClassName, footer = '' }) => {
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
            className="fixed inset-0 bg-black/50 z-[500] flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            ref={modalRef}
            onClick={handleOutsideClick}
        >
            {/* 모달 내용 컨테이너 */}
            <div
                className={`bg-white p-6 rounded-xl z-[510] shadow-2xl w-full max-w-lg transition-all transform duration-300 scale-100 ${className}`}
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
                
                {footer && (
                    <div className="flex justify-end p-4 border-t border-gray-100 dark:border-dark-border">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;