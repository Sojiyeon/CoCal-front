// components/Register.tsx
import React from 'react';
// Button 컴포넌트의 경로는 components/ui/Button.tsx에 있다고 가정합니다.
import Button from '../ui/Button';

const Register: React.FC = () => {
    return (
        // Login 컴포넌트와 동일하게 화면 중앙에 배치
        <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
            <div className="w-full max-w-md p-8 bg-white">
                <h1 className="text-4xl font-bold text-center mb-10">Sign Up</h1>

                {/* 입력 폼 섹션 */}
                <form className="space-y-4">

                    {/* 1. Name 입력 필드 (users 테이블의 name 필드와 연결) */}
                    <div>
                        <input
                            type="text"
                            placeholder="Name"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* 2. Email 입력 필드 */}
                    <div>
                        <input
                            type="email"
                            placeholder="Email"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* 3. Password 입력 필드 */}
                    <div>
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* 4. Confirm Password 입력 필드 */}
                    <div>
                        <input
                            type="password"
                            placeholder="Confirm Password"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* SIGN UP 버튼 */}
                    <div className="pt-4">
                        <Button
                            type="submit"
                            variant="primary"
                            fullWidth={true} // 전체 너비
                        >
                            SIGN UP
                        </Button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default Register;