// components/Login.tsx
"use client";
import React from 'react';
import { FcGoogle } from 'react-icons/fc';
import Button from '../ui/Button';
import Link from 'next/link'; // next/link 임포트 필요

const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
};

const Login: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
            <div className="w-full max-w-md p-8 bg-white">
                <h1 className="text-4xl font-bold text-center mb-10">Welcome</h1>

                <form className="space-y-4">
                    {/* Email 및 Password 입력 필드는 이전과 동일 */}
                    <div>
                        <input
                            type="email"
                            placeholder="Email"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* 👇 버튼 그룹 섹션 (웹과 모바일 분리) 👇 */}
                    <div className="pt-2">

                        {/* 1. 웹 화면 (MD 이상) - 두 버튼이 수평으로 나란히, 동일 너비 */}
                        {/* 기본(모바일)에서는 숨기고, MD 이상에서 flex로 표시 */}
                        <div className="hidden md:flex space-x-4">
                            <Button
                                type="submit"
                                variant="primary"
                                className="flex-1"
                                fullWidth={true} // flex-1 w-full 효과로 동일 너비 확보
                            >
                                SIGN IN
                            </Button>

                            <Link href="/register" className="flex-1">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    fullWidth={true} // flex-1 w-full 효과로 동일 너비 확보
                                    className="w-full"
                                >
                                    SIGN UP
                                </Button>
                            </Link>
                        </div>

                        {/* 2. 모바일 화면 (기본, MD 미만) - SIGN IN은 전체 버튼, SIGN UP은 텍스트 링크 */}
                        {/* MD 이상에서는 숨김 */}
                        <div className="flex flex-col space-y-4 md:hidden">
                            {/* SIGN IN 버튼 (모바일 전체 너비) */}
                            <Button
                                type="submit"
                                variant="primary"
                                fullWidth={true}
                            >
                                SIGN IN
                            </Button>

                            {/* SIGN UP 텍스트 링크 (사진의 디자인) */}
                            <div className="text-center text-sm">
                                Don&apos;t have an account?
                                <Link href="/register" className="text-blue-500 font-semibold hover:text-blue-700 ml-1">
                                    Sign up
                                </Link>
                            </div>
                        </div>
                    </div>
                    {/* 👆 버튼 그룹 섹션 끝 👆 */}
                </form>

                {/* 분리선 (or) - 모바일 텍스트 링크와 Google 버튼 사이 간격 조절 */}
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
                    >
                        Sign in with Google
                    </Button>
            </div>
        </div>
    );
};

export default Login;