// components/ui/Button.tsx
import React from 'react';

// 1. TypeScript 인터페이스 정의
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** 버튼의 스타일 종류 (primary: 채워진 파란색, secondary: 테두리 파란색, google: Google 로그인) */
    variant?: 'primary' | 'secondary' | 'google';
    /** 버튼 텍스트 */
    children: React.ReactNode;
    /** 버튼 너비를 100%로 설정할지 여부 */
    fullWidth?: boolean;
    /** 버튼 왼쪽에 표시될 아이콘 (예: <FcGoogle />) */
    icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
                                           variant = 'primary',
                                           children,
                                           fullWidth = false,
                                           icon,
                                           className = '',
                                           ...rest
                                       }) => {
    // 1. 기본 스타일
    const baseStyle = 'px-4 py-3 font-semibold rounded-md transition duration-150 flex items-center justify-center';

    // 폼 버튼(SIGN IN/UP)은 flex-1로, Google 버튼은 fullWidth로 처리합니다.
    const widthStyle = fullWidth ? 'w-full' : 'flex-1';

    // 2. variant에 따른 스타일 분기
    let variantStyle = '';

    switch (variant) {
        case 'primary':
            // SIGN IN 버튼 스타일 (파란색 채우기)
            variantStyle = 'bg-blue-500 text-white hover:bg-blue-600';
            break;
        case 'secondary':
            // SIGN UP 버튼 스타일 (파두리 파란색)
            variantStyle = 'border border-blue-500 text-blue-500 hover:bg-blue-50';
            break;
        case 'google':
            // Google 로그인 버튼 스타일 (흰색 배경, 테두리, 둥근 모양)
            variantStyle = 'border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50';
            break;
        default:
            // 기본 스타일은 primary
            variantStyle = 'bg-blue-500 text-white hover:bg-blue-600';
    }

    // 최종 CSS 클래스 조합
    // className은 사용자가 추가로 전달하는 스타일입니다.
    const finalClassName = `${baseStyle} ${variantStyle} ${widthStyle} ${className}`;

    return (
        <button
            className={finalClassName}
            {...rest} // type, onClick, disabled 등 HTML 기본 속성 전달
        >
            {icon && <span className="mr-3">{icon}</span>}
            {children}
        </button>
    );
};

export default Button;