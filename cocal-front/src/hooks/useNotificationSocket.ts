import { useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import {NotificationItem} from "@/types/notification";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

export default function useNotificationSocket(
    userId: number,
    onMessage?: (notification: NotificationItem) => void // ← 두 번째 인자 추가
) {
    const clientRef = useRef<Client | null>(null);

    useEffect(() => {
        if (!userId) return;

        const token = localStorage.getItem("accessToken");
        if (!token) {
            console.error("AccessToken 없음 - WebSocket 연결 불가");
            return;
        }

        const client = new Client({
            webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws?token=${token}`),
            reconnectDelay: 10000,
            debug: (msg) => console.log("[STOMP]", msg),

            onConnect: () => {
                console.log("STOMP 연결 성공:", userId);

                // 연결 후 구독
                client.subscribe(`/topic/notifications/${userId}`, (message) => {
                    const notification: NotificationItem = JSON.parse(message.body);
                    console.log("새 알림 도착:", notification);
                    onMessage?.(notification); // 콜백이 있으면 실행
                });
            },
        });

        clientRef.current = client;
        client.activate();

        return () => {
            console.log("STOMP 연결 해제");
            client.deactivate();
        };
    }, [userId, onMessage]);

    return clientRef;
}
