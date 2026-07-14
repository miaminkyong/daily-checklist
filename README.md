# 🚀 나의 데일리 퀘스트 (My Daily Quest)

초등학교 1학년 남자아이를 위한 게임 테마 기반 자기주도 학습용 웹앱(PWA)입니다. 공부와 집안일을 "지루한 할 일"이 아니라 게임 속 **비밀 임무(Quest)**처럼 재미있게 완수하도록 설계되었습니다.

---

## 🎮 핵심 디자인 및 시스템 특징

1. **상남자 게임용 대시보드 테마**
   - 아기자기한 파스텔 색상 대신 남자아이가 작전 요원이 된 기분을 느끼도록 **다크 모드 네온 사이버펑크 디자인**(`bg-slate-950`)을 베이스로 구축했습니다.

2. **직관적인 대형 카드 UI**
   - 손가락으로 누르기 힘든 체크박스 대신 시원시원한 **100% 카드 전체 버튼**으로 터치 편의성을 보장합니다.

3. **🪙 15일 챌린지 & 용돈 보상 애니메이션**
   - 매일 지정된 모든 작전을 완료(100% 달성)하면 화면 전체에 **코인이 폭죽과 함께 날아와 금고에 꽂히는 입체 애니메이션**이 작동하고 실시간으로 100원이 추가됩니다.
   - 15일 동안 꾸준히 성공하면 **15개의 금빛 동전**이 가득 채워져 아이가 부모님께 약속된 1,500원 용돈 보상을 직관적으로 요청할 수 있습니다.

---

## 🛠️ 개발 시작 및 배포 방법 (초보자 가이드)

프로젝트 빌드 환경(Vite + React)을 준비하고 배포하는 전체 명령어입니다.

### 1. 로컬 프로젝트 셋업 및 패키지 다운로드
```bash
# Vite 기반의 React TypeScript 프로젝트를 만듭니다.
npm create vite@latest my-daily-quest -- --template react-ts
cd my-daily-quest

# 앱 구동에 필요한 핵심 라이브러리(애니메이션, 그래프, 아이콘 등) 설치
npm install framer-motion recharts lucide-react canvas-confetti
npm install --save-dev @types/canvas-confetti

# Tailwind CSS(디자인 툴) 패키지 설치 및 환경 초기화
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
