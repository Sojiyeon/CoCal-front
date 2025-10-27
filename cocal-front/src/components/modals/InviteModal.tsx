// src/components/modals/InviteModal.tsx
import React, { FC } from 'react';
import Modal from '../ui/Modal'; // 💡 뼈대 모달 사용
import { Users } from 'lucide-react';

interface InviteModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectName: string;
    description?: string;
    inviterEmail: string;
    onAccept: () => void; // 수락 버튼 클릭 시 실행될 함수
}

const InviteModal: FC<InviteModalProps> = ({
                                               isOpen,
                                               onClose,
                                               projectName,
                                               description,
                                               inviterEmail,
                                               onAccept,
                                           }) => {
    // 푸터에 들어갈 버튼 요소
    const modalFooter = (
        <div className="flex justify-end space-x-3">
            <button
                onClick={onClose}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition duration-150 dark:bg-neutral-700 dark:text-white dark:hover:bg-gray-700"
            >
                취소 (홈으로)
            </button>
            <button
                onClick={onAccept}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-150"
            >
                초대 수락 및 참여
            </button>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="팀 프로젝트 초대"
            maxWidth="max-w-md"
            footer={modalFooter}
        >
            <div className="flex flex-col space-y-4">
                <div className="flex items-center text-gray-700 dark:text-neutral-200">
                    <Users className="w-5 h-5 mr-2 text-blue-500 dark:text-blue-300" />
                    <span className="font-semibold">{inviterEmail}</span> 님이 프로젝트에 초대했습니다.
                </div>

                <h3 className="text-xl font-bold dark:text-dark-text-primary">{projectName}</h3>

                    <p className="text-sm font-semibold mb-2 dark:text-dark-text-primary">프로젝트 설명:</p>
                    <div className="max-h-32 overflow-y-auto text-gray-700 dark:text-neutral-300 bg-gray-50 dark:bg-neutral-800 p-3 rounded-lg text-sm">
                        <p className="whitespace-pre-wrap leading-relaxed">{description || "작성된 설명이 없습니다."}</p>
                </div>
            </div>
        </Modal>
    );
};

export default InviteModal;