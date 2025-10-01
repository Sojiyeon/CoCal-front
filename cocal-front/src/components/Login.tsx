// components/Login.tsx
import React from 'react';
import { FcGoogle } from 'react-icons/fc';
// 👇 경로 수정: components/ui/Button에서 불러옴
import Button from './ui/Button';

const Login: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white">
            <div className="w-full max-w-md p-8">
                <h1 className="text-4xl font-bold text-center mb-10">Welcome</h1>

                <form className="space-y-4">
                    {/* Email 입력 및 Password 입력 (이전 코드와 동일) */}
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

                    {/* 재사용 가능한 Button 컴포넌트 적용 */}
                    <div className="flex space-x-4 pt-2">
                        <Button
                            type="submit"
                            variant="primary" // SIGN IN 스타일
                        >
                            SIGN IN
                        </Button>

                        <Button
                            type="button"
                            variant="secondary" // SIGN UP 스타일
                        >
                            SIGN UP
                        </Button>
                    </div>
                </form>

                {/* 분리선 (or) */}
                <div className="flex items-center my-6">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="mx-4 text-sm text-gray-500">or</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                </div>

                {/* Google 버튼 적용 */}
                <Button
                    type="button"
                    variant="google"
                    fullWidth={true} // 전체 너비
                    icon={<FcGoogle className="w-5 h-5" />}
                >
                    Sign in with Google
                </Button>
            </div>
        </div>
    );
};

export default Login;