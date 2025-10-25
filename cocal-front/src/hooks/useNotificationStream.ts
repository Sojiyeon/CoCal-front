import { useEffect, useRef } from "react";
import { NotificationItem } from "@/types/notification";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

/**
 * 안정형 SSE 구독 훅 (자동 재연결 + 중복 연결 방지 + 안전 종료)
 */
export default function useNotificationStream(
    userId: number,
    onMessage?: (notification: NotificationItem) => void
) {
    const eventSourceRef = useRef<EventSource | null>(null);

    useEffect(() => {
        if (!userId) return;

        const token = localStorage.getItem("accessToken");
        if (!token) {
            console.error("AccessToken 없음 - SSE 연결 불가");
            return;
        }

        // 이미 연결되어 있으면 중복 연결 방지
        if (eventSourceRef.current) {
            console.log("기존 SSE 연결 유지 중");
            return;
        }

        const url = `${API_BASE_URL}/api/notifications/subscribe?token=${token}`;
        console.log("SSE 연결 시도:", url);

        const eventSource = new EventSource(url);
        eventSourceRef.current = eventSource;

        eventSource.addEventListener("connect", () => {
            console.log("SSE 연결 성공");
        });

        eventSource.addEventListener("notification", (event) => {
            try {
                const notification: NotificationItem = JSON.parse(event.data);
                console.log("새 알림 도착:", notification);
                onMessage?.(notification);
            } catch (err) {
                console.error("SSE 데이터 파싱 실패:", err);
            }
        });

        // 연결이 일시적으로 끊기면 브라우저가 자동 재연결함
        eventSource.onerror = (err) => {
            console.warn("SSE 오류 발생:", err);
            // EventSource는 자동 재연결하므로 수동 close 불필요
            // 연결이 완전히 불가능한 경우만 close
            if (eventSource.readyState === EventSource.CLOSED) {
                console.log("SSE 완전 종료");
                eventSource.close();
                eventSourceRef.current = null;
            }
        };

        // cleanup: 컴포넌트 언마운트 시 연결 닫기
        return () => {
            console.log(" SSE 연결 해제");
            eventSource.close();
            eventSourceRef.current = null;
        };
    }, [userId]);

    return eventSourceRef;
}
