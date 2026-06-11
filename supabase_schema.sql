-- WorkSync - Supabase SQL 스키마
-- Supabase 대시보드 > SQL Editor 에서 실행하세요

-- 1. events 테이블 생성
create table if not exists public.events (
  id          uuid        default gen_random_uuid() primary key,
  title       text        not null,
  assignee    text        not null,
  date        date        not null,
  start_time  time,
  end_time    time,
  memo        text,
  color       text        default '#4F8EF7',
  category    text        default '업무',
  created_at  timestamptz default now()
);

-- 2. RLS (Row Level Security) 설정
-- 공개 공유 방식: 모든 사용자가 읽기/쓰기 가능
alter table public.events enable row level security;

-- 모든 사용자 읽기 허용
create policy "events_select" on public.events
  for select using (true);

-- 모든 사용자 삽입 허용
create policy "events_insert" on public.events
  for insert with check (true);

-- 모든 사용자 수정 허용
create policy "events_update" on public.events
  for update using (true);

-- 모든 사용자 삭제 허용 (앱 레벨에서 관리자 제한)
create policy "events_delete" on public.events
  for delete using (true);

-- 3. Realtime 활성화 (대시보드에서도 할 수 있음)
alter publication supabase_realtime add table public.events;

-- 4. 인덱스 생성 (성능 향상)
create index if not exists events_date_idx on public.events (date);
create index if not exists events_created_at_idx on public.events (created_at desc);

-- 5. 샘플 데이터 (선택사항 - 테스트용)
-- insert into public.events (title, assignee, date, start_time, end_time, memo, color, category) values
-- ('팀 주간 회의', '김철수', current_date, '10:00', '11:00', '매주 월요일 진행', '#A855F7', '회의'),
-- ('프로젝트 마감', '이영희', current_date + 3, '18:00', '18:00', 'v1.0 배포 마감', '#EF4444', '마감'),
-- ('신규 직원 교육', '박지수', current_date + 1, '14:00', '17:00', '온보딩 교육', '#10B981', '교육');
