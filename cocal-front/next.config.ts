import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'readory-dodo.s3.ap-southeast-2.amazonaws.com',
                port: '', // 포트는 비워둡니다.
                pathname: '/profiles/**', // 또는 '/profile-images/**' 등 S3 경로에 따라 와일드카드를 사용합니다.
            },
            // 기존에 placehold.co 같은 다른 도메인을 사용했다면 여기에 추가합니다.
            {
                protocol: 'https',
                hostname: 'placehold.co',
            },
        ],
    },
};

export default nextConfig;
