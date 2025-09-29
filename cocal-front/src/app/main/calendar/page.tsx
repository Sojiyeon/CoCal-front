// src/app/(main)/calendar/page.tsx
import MyCalendar from '@/components/calendar/Calendar';

export default function CalendarPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <MyCalendar />
        </div>
    );
}
