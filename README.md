# WorkSync 🗓️

> 팀 업무 스케줄 실시간 공유 플랫폼

모든 팀원이 같은 달력을 공유하고, 실시간으로 일정을 추가·수정할 수 있는 웹앱입니다.

---

## ✨ 주요 기능

- **월간 / 주간 / 일간 보기** 지원
- **한국 공휴일 자동 표시** (2020~2030년)
- **실시간 공유** — Supabase Realtime으로 모든 사용자에게 즉시 반영
- **관리자 모드** — 비밀번호 입력 시 삭제 권한 활성화
- **반응형 디자인** — PC / 태블릿 / 모바일 모두 최적화
- 일정 항목: 제목, 담당자, 날짜, 시작/종료 시간, 메모, 색상/분류

---

## 🚀 설치 및 실행 방법 (초보자용)

### 사전 준비
- [Node.js 18+](https://nodejs.org) 설치 필요
- 인터넷 브라우저 (Chrome, Edge, Safari 등)

---

### 1단계: 코드 준비

```bash
# 방법 A: 이 폴더를 그대로 사용
cd worksync

# 방법 B: Git으로 클론한 경우
git clone <your-repo-url>
cd worksync
```

---

### 2단계: Supabase 설정

1. [https://app.supabase.com](https://app.supabase.com) 접속 → 무료 회원가입
2. **New Project** 클릭 → 프로젝트 이름 입력 (예: `worksync`) → 비밀번호 설정 → **Create new project**
3. 프로젝트 생성 완료 후 → 좌측 메뉴 **SQL Editor** 클릭
4. `supabase_schema.sql` 파일 내용을 복사해서 붙여넣기 → **Run** 버튼 클릭
5. 좌측 메뉴 **Settings → API** 로 이동
6. 다음 두 값을 복사해 두세요:
   - **Project URL** (예: `https://abcdef.supabase.co`)
   - **anon public key** (긴 문자열)
7. Realtime 활성화: 좌측 메뉴 **Database → Replication** → `events` 테이블의 토글 ON

---

### 3단계: 환경변수 설정

프로젝트 루트에 `.env` 파일을 생성하세요:

```bash
# Windows: 메모장으로 .env 파일 만들기
# Mac/Linux:
touch .env
```

`.env` 파일 내용:
```
VITE_SUPABASE_URL=https://여기에-project-url-붙여넣기.supabase.co
VITE_SUPABASE_ANON_KEY=여기에-anon-key-붙여넣기
VITE_ADMIN_PASSWORD=원하는관리자비밀번호
```

---

### 4단계: 실행

```bash
# 의존성 설치 (처음 한 번만)
npm install

# 개발 서버 시작
npm run dev
```

브라우저에서 `http://localhost:5173` 접속!

---

### 5단계: 배포 (선택)

#### Vercel (추천, 무료)
```bash
npm install -g vercel
vercel
# 환경변수는 Vercel 대시보드 > Settings > Environment Variables 에서 설정
```

#### Netlify
```bash
npm run build
# dist 폴더를 netlify.app 에 드래그 앤 드롭
```

---

## 🔧 환경변수 설명

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase 공개 키 | `eyJhbGciOi...` |
| `VITE_ADMIN_PASSWORD` | 관리자 비밀번호 | `mypassword123` |

---

## 📱 사용 방법

### 일정 추가
1. 우측 상단 **+ 일정 추가** 버튼 클릭
2. 또는 달력에서 날짜 클릭 후 추가

### 일정 수정
- 달력의 일정 칩 또는 사이드바 목록에서 일정 클릭

### 일정 삭제 (관리자만)
1. 우측 상단 🛡️ 버튼 클릭
2. 관리자 비밀번호 입력
3. 일정 클릭 → **삭제** 버튼 활성화

### 보기 모드 변경
- 우측 상단 **월 / 주 / 일** 탭 클릭

---

## 🗂️ 파일 구조

```
worksync/
├── src/
│   ├── components/
│   │   ├── Calendar/
│   │   │   ├── MonthView.jsx   # 월간 달력
│   │   │   ├── WeekView.jsx    # 주간 보기
│   │   │   └── DayView.jsx     # 일간 보기
│   │   ├── Header.jsx          # 상단 네비게이션
│   │   ├── EventModal.jsx      # 일정 추가/수정 모달
│   │   ├── EventList.jsx       # 사이드바 일정 목록
│   │   ├── AdminModal.jsx      # 관리자 인증 모달
│   │   └── SetupGuide.jsx      # 초기 설정 안내 화면
│   ├── hooks/
│   │   └── useEvents.js        # Supabase CRUD + Realtime
│   ├── lib/
│   │   ├── supabase.js         # Supabase 클라이언트
│   │   └── holidays.js         # 한국 공휴일 데이터
│   ├── App.jsx                 # 메인 앱
│   ├── main.jsx                # 진입점
│   └── index.css               # 전체 스타일
├── supabase_schema.sql         # DB 테이블 생성 SQL
├── .env.example                # 환경변수 예시
├── index.html
├── vite.config.js
└── package.json
```

---

## ❓ 자주 묻는 질문

**Q: 실시간 공유가 안 돼요**
→ Supabase 대시보드에서 Database → Replication → events 테이블 Realtime이 ON인지 확인하세요.

**Q: "Supabase 환경변수가 설정되지 않았습니다" 화면이 나와요**
→ `.env` 파일을 프로젝트 루트에 만들고 서버를 재시작하세요.

**Q: 공휴일이 틀려요**
→ `src/lib/holidays.js` 파일의 해당 연도 데이터를 수정하세요.

**Q: 여러 사람이 동시에 쓸 수 있나요?**
→ 네! Supabase Realtime 덕분에 누군가 일정을 추가하면 모든 사람 화면에 즉시 반영됩니다.
