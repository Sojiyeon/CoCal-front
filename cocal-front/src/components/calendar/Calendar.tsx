// src/components/calendar/Calendar.tsx
"use client"; // 클라이언트 컴포넌트로 지정

import { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // 스타일 import

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

export default function MyCalendar() {
    const [value, onChange] = useState<Value>(new Date());

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">공동 캘린더</h1>
            <Calendar onChange={onChange} value={value} />
        </div>
    );
}
