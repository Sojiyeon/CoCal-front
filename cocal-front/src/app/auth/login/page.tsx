// 로그인 페이지
// src/app/(auth)/login/page.tsx
/*
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();

    const handleSubmit = (e) => {
        e.preventDefault();
        // TODO: 백엔드 API 연동하여 로그인 처리
        // 성공 시, 프로젝트 선택 화면으로 이동
        router.push('/projects');
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold mb-4">로그인</h1>
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일"
                className="mb-2 p-2 border"
            />
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
                className="mb-4 p-2 border"
            />
            <button type="submit" className="bg-blue-500 text-white p-2 rounded">
                로그인
            </button>
            <Link href="/register" className="mt-4 text-blue-500">
                회원가입
            </Link>
        </form>
    );
}
*/