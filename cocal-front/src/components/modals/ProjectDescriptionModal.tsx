// src/components/modals/ProjectDescriptionModal.tsx
import React, { FC, useState } from 'react';
import Modal from '../ui/Modal';
import { fetchWithAuth } from '@/utils/authService'; // API 호출
import { LogOut, Loader2 } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

interface ProjectDescriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectName: string;
    description: string;
    projectId: number;
    onProjectLeft: () => void;
}

const ProjectDescriptionModal: FC<ProjectDescriptionModalProps> = ({
                                                                       isOpen,
                                                                       onClose,
                                                                       projectName,
                                                                       description,
                                                                       projectId,
                                                                       onProjectLeft,
                                                                   }) => {
    // 로딩 상태 추가
    const [isLoading, setIsLoading] = useState(false);

    // 프로젝트 나가기 API 호출 함수
    const handleLeaveProject = async () => {
        if (!window.confirm(`정말로 프로젝트 "${projectName}"를 나가시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
            return;
        }
        setIsLoading(true);

        const API_LEAVE_ENDPOINT = `${API_BASE_URL}/api/projects/${projectId}/team/leave`;

        try {
            const response = await fetchWithAuth(API_LEAVE_ENDPOINT, {
                method: 'POST',
            });

            const result = await response.json();

            // 서버의 응답 구조에 따라 success 필드 확인
            if (response.ok && result.success) {
                // 성공 메시지를 응답 데이터에서 추출하여 사용자에게 표시
                const successMessage = result.data?.message || `'${projectName}' 프로젝트에서 성공적으로 나갔습니다.`;
                alert(successMessage);

                onProjectLeft(); // 대시보드 목록 갱신
                onClose(); // 모달 닫기
            } else {
                const errorMessage = result.error?.message || response.statusText;
                alert(`프로젝트 나가기 실패: ${errorMessage}`);
            }
        } catch (error) {
            console.error('프로젝트 나가기 네트워크 오류:', error);
            alert("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        } finally {
            setIsLoading(false); // 로딩 종료
        }
    };

    // 프로젝트 나가기 버튼 (Footer)
    const leaveProjectFooter = (
        <button
            onClick={handleLeaveProject}
            disabled={isLoading}
            className={`flex items-center space-x-2 py-2 px-4 border border-red-500 text-red-500 transition duration-150 rounded-lg font-semibold ${
                isLoading
                ? 'bg-red-200 cursor-not-allowed opacity-70'
                : 'hover:bg-red-50 dark:hover:bg-red-200/5'
            }`}
        >
            {isLoading ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>처리 중...</span>
                </>
            ) : (
                <>
                    <LogOut className="w-5 h-5" />
                    <span>프로젝트 나가기</span>
                </>
            )}
        </button>
    );

    // 뼈대 모달 컴포넌트 사용
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${projectName} - 프로젝트 설명`}
            maxWidth="max-w-md"
            footer={leaveProjectFooter}
        >
            {/* 모달 내용 (설명) */}
            <div className="max-h-80 overflow-y-auto py-4 text-gray-700 dark:text-neutral-300">
                <p className="whitespace-pre-wrap leading-relaxed">{description || "작성된 설명이 없습니다."}</p>
            </div>
        </Modal>
    );
};

export default ProjectDescriptionModal;