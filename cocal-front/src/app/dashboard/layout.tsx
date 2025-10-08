// app/dashboard/layout.tsx
import Dashboard from '@/components/dashboard/Dashboard';
import { UserProvider } from '@/components/modals/ProfileSettingModal';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <UserProvider>
            {children}
        </UserProvider>
    );
}