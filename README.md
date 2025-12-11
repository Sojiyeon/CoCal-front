# CoCal Front

**CoCal (Calendar + Collaboration)** - 마감일까지의 남은 시간을 시각화하고, 팀 전체가 일정을 공유하는 공동 캘린더 서비스의 프론트엔드입니다.

백엔드 레포지토리: [CoCal-server](https://github.com/dodo5517/CoCal-server)

---

## 미리보기

### Web
<p>
  <img src="https://github.com/user-attachments/assets/b2fe9bac-a180-42a5-a9bf-c9a4cd988294" width="49%" />
  <img src="https://github.com/user-attachments/assets/06e00825-5f08-4363-966e-dcd007804ea1" width="49%" />
</p>

### Mobile
<p>
  <img src="https://github.com/user-attachments/assets/7558a7e1-83a0-4825-a59b-624ff46f4120" width="24%" />
  <img src="https://github.com/user-attachments/assets/d7e521c8-8989-4ee6-8d99-d72d1523d6fe" width="24%" />
  <img src="https://github.com/user-attachments/assets/b32db065-9f05-4a57-8b71-26f55458e9d9" width="24%" />
  <img src="https://github.com/user-attachments/assets/3d8b1aea-9bea-4ed0-9cc6-02a25ea1cfdc" width="24%" />
</p>

---

## 개요

CoCal은 팀 프로젝트를 진행하는 사람들을 위한 협업 캘린더 플랫폼입니다. 마감일까지의 진행률을 퍼센트로 표시하고, 공동 일정/메모/투두/초대 관리를 통합 제공합니다.

**주요 특징**
- 프로젝트 단위 일정 관리 및 진행률 표시
- 단체 메모 및 투두 공유
- 링크/이메일 기반 초대 시스템
- 실시간 알림
- 반응형 웹 (모바일 대응)

---

## 개발 기간

2025.09 ~ 2025.10 (약 1.5개월)

---

## 팀 구성

| 역할 | 이름 |
|------|------|
| Backend | [dodo5517](https://github.com/dodo5517), [sungAh123](https://github.com/sungAh123) |
| Frontend | [Sojiyeon](https://github.com/Sojiyeon), [kimmmddh](https://github.com/kimmmddh) |

---

## 데모

[데모 바로가기](https://co-cal.vercel.app/)

---

## 기술 스택

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| 캘린더 | 프로젝트별 일정 조회, 남은 시간 퍼센트 표시 |
| 일정 관리 | 일정 생성, 수정, 삭제 |
| 메모 | 날짜별 단체 메모 작성 및 조회 |
| 투두 | 개인/단체 투두 관리 |
| 프로젝트 | 프로젝트 생성, 멤버 초대 및 관리 |
| 알림 | 실시간 알림 수신 |

---

## 실행 방법

**1. Clone**
```bash
git clone https://github.com/Sojiyeon/CoCal-front.git
cd CoCal-front
```

**2. 패키지 설치**
```bash
npm install
```

**3. 환경 설정**
```bash
cp .env.example .env.local
# .env.local 파일에 API 서버 주소 등 설정
```

**4. 실행**
```bash
npm run dev
```

로컬 실행 시 기본 포트는 3000입니다.
