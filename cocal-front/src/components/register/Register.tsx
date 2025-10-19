// components/Register.tsx
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ButtonProps {
    children: React.ReactNode;
    onClick?: (e: React.MouseEvent) => void;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    fullWidth?: boolean;
    variant?: 'primary' | 'secondary';
}

const Button: React.FC<ButtonProps> = ({ children, onClick, type, disabled, fullWidth, variant }) => (
    <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`
            ${fullWidth ? 'w-full' : 'w-auto'} 
            py-3 px-6 rounded-md font-bold transition duration-200 
            ${variant === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
    >
        {children}
    </button>
);

const PASSWORD_REGEX = /^[A-Za-z0-9!@%=*_-]{8,16}$/;
const API_REGISTER_ENDPOINT = process.env.NEXT_PUBLIC_API_URL!+'/api/users'
    //'https://cocal-server.onrender.com/api/users';
    //'http://localhost:3000/api/users';

const Register: React.FC = () => {
    const router = useRouter();

    // 폼 입력 상태
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    // 로딩 상태
    const [isLoading, setIsLoading] = useState(false);

    // 에러 상태 (클라이언트 측에서 발생하는 에러)
    const [errors, setErrors] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        apiError: '' // 서버에서 반환되는 '이미 가입된 이메일' 오류 처리용
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // 입력할 때 에러 메시지 초기화
        setErrors(prev => ({ ...prev, [name]: '', apiError: '' }));
    };

    const validate = () => {
        const newErrors = { email: '', password: '', confirmPassword: '', apiError: '' };
        let isValid = true;

        // Name 검사
        if (!formData.name.trim()) {
        }

        // Email 유효성 검사 (기본 형식 검사)
        if (!formData.email || !formData.email.includes('@') || !formData.email.includes('.')) {
            newErrors.email = '올바른 이메일 형식이 아닙니다.';
            isValid = false;
        }

        // Password 유효성 검사 (정규식 검사)
        if (!formData.password || !PASSWORD_REGEX.test(formData.password)) {
            newErrors.password = '8~16자의 대소문자, 숫자, !@%=*-_ 문자만 사용할 수 있습니다.';
            isValid = false;
        }

        // Confirm Password 일치 검사
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
            isValid = false;
        } else if (!formData.confirmPassword) {
            // Confirm Password가 비어있을 경우에도 에러 처리
            newErrors.confirmPassword = '비밀번호 확인을 입력해주세요.';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            return; // 클라이언트 유효성 검사 실패 시
        }

        setIsLoading(true); // 로딩 시작
        setErrors(prev => ({ ...prev, apiError: '', email: '' })); // 에러 상태 초기화

        try {
            // API 호출
            const response = await fetch(API_REGISTER_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                // HTTP 상태 코드가 200번대가 아닐 때

                // 서버에서 '이미 가입된 이메일' 오류가 반환될 경우 (409 Conflict 또는 400 Bad Request 가정)
                if (response.status === 409 || data.message === 'Email already exists') {
                    setErrors(prev => ({ ...prev, email: '이미 가입된 이메일입니다.' }));
                    return;
                }

                // 기타 서버 오류 처리
                setErrors(prev => ({ ...prev, apiError: data.message || '회원가입 중 알 수 없는 오류가 발생했습니다.' }));
                return;
            }

            // 회원가입 성공 (HTTP 200 또는 201)
            console.log('회원가입 성공:', data);

            // 로그인 페이지로 리디렉션
            router.push('/');

        } catch (error) {
            console.error("Network or Fetch Error:", error);
            setErrors(prev => ({ ...prev, apiError: '네트워크 연결에 문제가 발생했습니다. 다시 시도해 주세요.' }));
        } finally {
            setIsLoading(false); // 로딩 종료
        }
    };


    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
            <div className="w-full max-w-md p-8 bg-white">
                <h1 className="text-4xl font-bold text-center mb-10">Sign Up</h1>

                <form className="space-y-4" onSubmit={handleSubmit}>

                    {/* Name 입력 필드 */}
                    <div>
                        <input
                            type="text"
                            placeholder="Name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    {/* Email 입력 필드 + 경고 문구 */}
                    <div>
                        <input
                            type="email"
                            placeholder="Email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 ${
                                errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                            }`}
                            required
                            disabled={isLoading}
                        />
                        {errors.email && (
                            <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                        )}
                    </div>

                    {/* Password 입력 필드 + 경고 문구 */}
                    <div>
                        <input
                            type="password"
                            placeholder="Password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 ${
                                errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                            }`}
                            required
                            disabled={isLoading}
                        />
                        {errors.password && (
                            <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                        )}
                    </div>

                    {/* Confirm Password 입력 필드 + 경고 문구 */}
                    <div>
                        <input
                            type="password"
                            placeholder="Confirm Password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 ${
                                errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                            }`}
                            required
                            disabled={isLoading}
                        />
                        {errors.confirmPassword && (
                            <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>
                        )}
                    </div>

                    {/* SIGN UP 버튼 */}
                    <div className="pt-4">
                        <Button
                            type="submit"
                            variant="primary"
                            fullWidth={true}
                            disabled={isLoading} // 로딩 중에는 버튼 비활성화
                        >
                            {isLoading ? 'Processing...' : 'SIGN UP'}
                        </Button>
                    </div>

                    {/* 전체 API 오류 표시 */}
                    {errors.apiError && (
                        <p className="text-sm text-center text-red-500 mt-3">{errors.apiError}</p>
                    )}

                    {/* 로그인 페이지 링크 (Next.js Link 사용) */}
                    <p className="mt-4 text-center text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link href="/" className="font-medium text-blue-600 hover:text-blue-500">
                            Sign In
                        </Link>
                    </p>

                </form>
            </div>
        </div>
    );
};

export default Register;