"use client";
import React, { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import Button from '../ui/Button';
import Link from 'next/link'; // next/link 임포트 필요

const API_LOGIN_ENDPOINT = 'https://cocal-server.onrender.com/api/auth/login';
    //'https://cocal-server.onrender.com/api/auth/login';
    //'http://localhost:3000/api/auth/login'
const API_ME_ENDPOINT = 'https://cocal-server.onrender.com/api/users/me';

const handleGoogleLogin = () => {
    window.location.href = 'https://cocal-server.onrender.com/oauth2/authorization/google';
};

const fetchUserProfile = async (accessToken: string) => {
    try {
        const response = await fetch(API_ME_ENDPOINT, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
        });

        if (response.ok) {
            const userData = await response.json();
            const userProfile = {
                name: userData.name,
                email: userData.email
            };
            localStorage.setItem('userProfile', JSON.stringify(userProfile));
            console.log('User profile saved:', userProfile);
        } else {
            console.error('Failed to fetch user profile:', response.status);
        }
    } catch (error) {
        console.error('Network error while fetching profile:', error);
    }
};

const Login: React.FC = () => {
    // const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(''); // 에러 메시지 상태
    const [isLoading, setIsLoading] = useState(false); // 로딩 상태

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); // 폼의 기본 제출 동작(새로고침) 방지
        setIsLoading(true);
        setError(''); // 이전 에러 메시지 초기화

        try {
            const response = await fetch(API_LOGIN_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) { // 로그인 실패 시
                setError(data.message || '이메일 또는 비밀번호가 올바르지 않습니다.');
                return;
            }
            // 로그인 성공 시
            const accessToken = data.accessToken;
            const refreshToken = data.refreshToken;

            if (accessToken) { // 토큰을 브라우저의 로컬 저장소에 저장
                localStorage.setItem('accessToken', accessToken);

                if (refreshToken) {
                    localStorage.setItem('refreshToken', refreshToken);
                    console.log('Access/Refresh Token 저장 완료.');
                } else {
                    console.warn('Refresh Token이 응답에 포함되어 있지 않습니다. 로그아웃이 정상 작동하지 않을 수 있습니다.');
                }
                await fetchUserProfile(accessToken);
            }
            // 로그인 후 대시보드로 리디렉션
            window.location.href = '/dashboard';

        } catch (err) {
            // 네트워크 에러 등 fetch 자체의 실패
            setError('로그인 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
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