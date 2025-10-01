// components/Register.tsx
"use client";

import React, { useState } from 'react';
import Button from '../ui/Button';

const PASSWORD_REGEX = /^[A-Za-z0-9!@%=*_-]{8,16}$/;

const Register: React.FC = () => {
    // 폼 입력 상태
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

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

        // Email 유효성 검사 (기본 형식 검사)
        if (!formData.email || !formData.email.includes('@') || !formData.email.includes('.')) {
            newErrors.email = '올바른 이메일 형식이 아닙니다.';
            isValid = false;
        }
        // '이미 가입된 이메일' 경고는 서버 통신 후 API 오류로 처리 (handleSubmit에서 처리)

        // Password 유효성 검사 (정규식 검사)
        if (!formData.password || !PASSWORD_REGEX.test(formData.password)) {
            newErrors.password = '8~16자의 대소문자, 숫자, !@%=*-_ 문자만 사용할 수 있습니다.';
            isValid = false;
        }

        // Confirm Password 일치 검사
        if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
            isValid = false;
        } else if (!formData.confirmPassword) {
            // 단순히 비어있을 때도 유효성 검사에 실패하게 처리할 수 있으나, 여기서는 일치 여부에 초점을 둡니다.
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            return; // 클라이언트 유효성 검사 실패 시
        }

        // 서버 통신 (이미 가입된 이메일 체크 및 가입 처리)
        try {
            // 실제 API 호출 로직을 여기에 구현 (fetch 또는 axios 사용)
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                // 서버에서 '이미 가입된 이메일' 오류가 반환될 경우
                if (data.message === 'Email already exists') {
                    setErrors(prev => ({ ...prev, email: '이미 가입된 이메일입니다.' }));
                    return;
                }
                // 기타 서버 오류 처리
                setErrors(prev => ({ ...prev, apiError: data.message || '회원가입 중 오류가 발생했습니다.' }));
                return;
            }

            // 회원가입 성공 시 로그인 페이지로 리디렉션 등 처리
            console.log('회원가입 성공:', data);
            // router.push('/'); // Next.js router 사용 예시

        } catch (_error) {
            setErrors(prev => ({ ...prev, apiError: '네트워크 오류가 발생했습니다.' }));
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
                        >
                            SIGN UP
                        </Button>
                    </div>

                    {/* 전체 API 오류 표시 */}
                    {errors.apiError && (
                        <p className="text-sm text-center text-red-500 mt-3">{errors.apiError}</p>
                    )}

                </form>
            </div>
        </div>
    );
};

export default Register;