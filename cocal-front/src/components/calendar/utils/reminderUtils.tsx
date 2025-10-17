
export type ReminderValue = number | null;


export const REMINDER_OPTIONS: { label: string; value: ReminderValue }[] = [
    { label: "Off", value: null },
    { label: "At start time", value: 0 },
    { label: "5 minutes before", value: 5 },
    { label: "10 minutes before", value: 10 },
    { label: "15 minutes before", value: 15 },
    { label: "30 minutes before", value: 30 },
    { label: "1 hour before", value: 60 },
    { label: "2 hours before", value: 120 },
    { label: "1 day before", value: 60 * 24 },
    { label: "2 days before", value: 60 * 48 },
    { label: "1 week before", value: 60 * 24 * 7 },
];

/**
 * 미리 알림 값(분)에 해당하는 표시용 라벨(텍스트)을 찾아 반환합니다.
 * @param value - 찾고자 하는 미리 알림 값 (e.g., 60)
 * @returns 해당하는 라벨 (e.g., "1 hour before") 또는 기본값
 */
export const getReminderLabel = (value: ReminderValue): string => {
    if (value === null) {
        return "Off"; // 'null'일 경우 'Off' 반환
    }
    const option = REMINDER_OPTIONS.find(opt => opt.value === value);
    return option ? option.label : "Custom"; // 옵션에 없는 값이면 'Custom'으로 표시
};