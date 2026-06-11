export default function SetupGuide() {
  return (
    <div className="setup-guide">
      <div className="setup-card">
        <div className="setup-icon">🚀</div>
        <h1 className="setup-title">WorkSync 설정 안내</h1>
        <p className="setup-desc">
          Supabase 환경변수가 설정되지 않았습니다.<br />
          아래 단계를 따라 설정해주세요.
        </p>

        <div className="setup-steps">
          <div className="setup-step">
            <div className="step-num">1</div>
            <div className="step-content">
              <h3>Supabase 프로젝트 생성</h3>
              <p>
                <a href="https://app.supabase.com" target="_blank" rel="noreferrer">
                  app.supabase.com
                </a>
                에서 무료 계정으로 새 프로젝트를 만드세요.
              </p>
            </div>
          </div>

          <div className="setup-step">
            <div className="step-num">2</div>
            <div className="step-content">
              <h3>테이블 생성</h3>
              <p>SQL Editor에서 아래 쿼리를 실행하세요:</p>
              <pre className="setup-code">{`create table events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  assignee text not null,
  date date not null,
  start_time time,
  end_time time,
  memo text,
  color text default '#4F8EF7',
  category text default '업무',
  created_at timestamptz default now()
);

-- RLS 비활성화 (공개 공유용)
alter table events disable row level security;

-- 또는 모든 사용자 허용
create policy "allow_all" on events for all using (true);`}</pre>
            </div>
          </div>

          <div className="setup-step">
            <div className="step-num">3</div>
            <div className="step-content">
              <h3>Realtime 활성화</h3>
              <p>
                Database → Replication → events 테이블 활성화
              </p>
            </div>
          </div>

          <div className="setup-step">
            <div className="step-num">4</div>
            <div className="step-content">
              <h3>환경변수 설정</h3>
              <p>프로젝트 루트에 <code>.env</code> 파일을 만드세요:</p>
              <pre className="setup-code">{`VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ADMIN_PASSWORD=your-admin-password`}</pre>
              <p>API 키는 Supabase 대시보드 → Settings → API에서 확인하세요.</p>
            </div>
          </div>

          <div className="setup-step">
            <div className="step-num">5</div>
            <div className="step-content">
              <h3>서버 재시작</h3>
              <pre className="setup-code">npm run dev</pre>
            </div>
          </div>
        </div>

        <div className="setup-footer">
          <p>설정 완료 후 이 화면은 자동으로 사라집니다. 🎉</p>
        </div>
      </div>
    </div>
  )
}
