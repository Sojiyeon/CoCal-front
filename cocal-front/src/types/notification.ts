export interface NotificationItem {
    id: number;
    userId: number;
    type: string;
    referenceId: number; // 관련 리소스 ID
    title: string;
    message: string;
    isRead: boolean;
    sentAt: string;
}