// 메인 캘린더 화면
// src/app/(main)/calendar/page.tsx

// src/app/(main)/calendar/page.tsx
/*
"use client";

import { useState } from 'react';
import MyCalendar from '@/components/calendar/MyCalendar'; // MyCalendar 컴포넌트
import MyWeekCalendar from '@/components/calendar/MyWeekCalendar'; // 주간 캘린더
import MyDayCalendar from '@/components/calendar/MyDayCalendar'; // 일간 캘린더

export default function CalendarPage() {
    const [view, setView] = useState('month'); // 'month', 'week', 'day'

    return (
        <div className="p-8">
            <div className="flex justify-center space-x-4 mb-6">
                <button onClick={() => setView('month')} className="p-2 border rounded">월</button>
                <button onClick={() => setView('week')} className="p-2 border rounded">주</button>
                <button onClick={() => setView('day')} className="p-2 border rounded">일</button>
            </div>
            {view === 'month' && <MyCalendar />}
            {view === 'week' && <MyWeekCalendar />}
            {view === 'day' && <MyDayCalendar />}
        </div>
    );
}

/*import MyCalendar from '@/components/calendar/Calendar';

export default function CalendarPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <MyCalendar />
        </div>
    );
}
*/