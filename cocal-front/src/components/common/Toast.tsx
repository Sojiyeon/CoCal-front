"use client";
import { useEffect, useState } from "react";

interface ToastProps {
    message: string;
    duration?: number; // 표시 시간 (ms)
    onClose: () => void;
}

export default function Toast({ message, duration = 30000, onClose }: ToastProps) {
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isFadingOut, setIsFadingOut] = useState(false);

    useEffect(() => {
        // 0.2초 후 흰색 반투명 전환
        const t1 = setTimeout(() => setIsTransitioning(true), 200);
        // 2.5초 후 fade-out
        const t2 = setTimeout(() => setIsFadingOut(true), 2500);
        // 30초 후 제거
        const t3 = setTimeout(onClose, duration);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
        };
    }, [onClose, duration]);

    /** 클릭 시 즉시 닫힘 */
    const handleClick = () => {
        setIsFadingOut(true);
        setTimeout(onClose, 200); // 약간의 페이드아웃 여유
    };


    return (
        <div
            onClick={handleClick}
            className={`
        fixed top-5 right-5 z-[9999]
        px-4 py-3 rounded-xl shadow-lg border text-sm backdrop-blur-md
        transition-all duration-700 ease-in-out cursor-pointer
        ${isFadingOut ? "opacity-0" : "opacity-100"}
        ${
                isTransitioning
                    ? "bg-white/80 border-gray-200 text-gray-800"
                    : "bg-blue-500 border-blue-400 text-white"
            }
        animate-slide-in
      `}
        >
            <p>{message}</p>
            <p className="text-xs opacity-70 mt-1">클릭 시 닫힘</p>
        </div>
    );
}
