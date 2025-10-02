// ===================== 달력 유틸 =====================
export const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// 특정 연도/월에 대한 달력 행렬 생성
export function getMonthMatrix(year: number, monthIndex: number) {
    const first = new Date(year, monthIndex, 1);
    const last = new Date(year, monthIndex + 1, 0);

    const firstDay = (first.getDay() + 6) % 7; // 월요일 기준 시작
    const daysInMonth = last.getDate();

    const rows: (number | null)[][] = [];
    let currentDay = 1 - firstDay;

    while (currentDay <= daysInMonth) {
        const week: (number | null)[] = [];
        for (let i = 0; i < 7; i++) {
            if (currentDay < 1 || currentDay > daysInMonth) week.push(null);
            else week.push(currentDay);
            currentDay++;
        }
        rows.push(week);
    }
    return rows;
}

// YYYY-MM-DD 포맷 변환
export function formatYMD(year: number, month: number, day: number) {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
}
