'use client';
import useAuthRedirect from '@/hooks/useAuthRedirect';
import Dashboard from '@/components/dashboard/Dashboard';
const DashboardPage = () => {
    // 훅을 사용하여 인증 상태 확인 및 리다이렉션 로직 실행
    const { isChecking, isAuthenticated } = useAuthRedirect();

    // 🚨 1. 인증 확인 중일 때 (토큰 확인 중)
    if (isChecking) {
        // 빈 화면이나 간단한 로딩 스피너를 보여주어 깜빡임을 최소화
        return <div style={{height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            Loading...
        </div>;
    }
    if (!isAuthenticated) {
        return null;
    }

    // 3. 인증된 상태일 때 정상적으로 대시보드 내용 렌더링
    return (
        <main>
            <Dashboard />
            {/* 실제 대시보드 내용 (Event, Project 관련 컴포넌트) */}
        </main>
    );
};

export default DashboardPage;

/*
export default function DashboardPage() {
    return <Dashboard />;
}*/
