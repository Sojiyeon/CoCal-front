// import Dashboard from '@/components/dashboard/Dashboard';
import { UserProvider } from '@/contexts/UserContext';
import ThemeProvider from '@/components/ThemeProvider';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (<ThemeProvider>
        <UserProvider>
            {children}
        </UserProvider></ThemeProvider>
    );
}