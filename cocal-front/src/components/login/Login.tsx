"use client";
import React, { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { useRouter } from 'next/navigation';
import Button from '../ui/Button';
import Link from 'next/link';
import {authApi} from "@/api/authApi";

const Login: React.FC = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // 구글 소셜 로그인 핸들러
    const handleGoogleLogin = () => {
        const url:string = authApi.getGoogleAuthUrl();
        window.location.href = url; // <- 실제 이동
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        console.log("login 요청 시작");
        try {
            // 로그인 요청 → accessToken 저장
            const accessToken = await authApi.login(email, password);
            // accessToken으로 사용자 정보 요청
            const user = await authApi.getUserInfo(accessToken);
            if (user) {
                localStorage.setItem('userProfile', JSON.stringify(user));
                console.log('사용자 정보 저장 완료:', user);
            }

            // 대시보드로 이동
            router.push('/dashboard');
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message || '로그인 중 문제가 발생했습니다.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
            <div className="w-full max-w-md p-8 bg-white">
                <h1 className="text-4xl font-bold text-center mb-10">Welcome</h1>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <input
                            type="email"
                            placeholder="Email"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-center text-red-500">{error}</p>
                    )}

                    <div className="pt-2">
                        {/* 웹 화면 (MD 이상) */}
                        <div className="hidden md:flex space-x-4">
                            <Button
                                type="submit"
                                variant="primary"
                                className="flex-1"
                                fullWidth={true}
                                disabled={isLoading}
                            >
                                {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
                            </Button>

                            <Link href="/register" className="flex-1">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    fullWidth={true}
                                    className="w-full"
                                    disabled={isLoading}
                                >
                                    SIGN UP
                                </Button>
                            </Link>
                        </div>

                        {/* 모바일 화면 - SIGN IN은 전체 버튼, SIGN UP은 텍스트 링크 */}
                        <div className="flex flex-col space-y-4 md:hidden">
                            <Button
                                type="submit"
                                variant="primary"
                                fullWidth={true}
                                disabled={isLoading}
                            >
                                {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
                            </Button>

                            {/* SIGN UP 텍스트 링크 */}
                            <div className="text-center text-sm">
                                Don&apos;t have an account?
                                <Link href="/register" className="text-blue-500 font-semibold hover:text-blue-700 ml-1">
                                    Sign up
                                </Link>
                            </div>
                        </div>
                    </div>
                </form>

                {/* 분리선 */}
                <div className="flex items-center mt-6 mb-4">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="mx-4 text-sm text-gray-500">or</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                </div>

                {/* Google 버튼 */}
                <Button
                    type="button"
                    variant="google"
                    fullWidth={true}
                    icon={<FcGoogle className="w-5 h-5" />}
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                >
                    Sign in with Google
                </Button>
            </div>
        </div>
    );
};

export default Login;