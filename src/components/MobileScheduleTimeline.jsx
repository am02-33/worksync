/**
 * MobileScheduleTimeline — 하단 주차별 가로형 근무표
 *
 * 구조:
 *   [6월]
 *     [첫째주]
 *       ┌───────┬───────┬───────┬───────────────┐
 *       │ 10일  │ 11일  │ 12일  │ 13일 토요일   │
 *       │휴가백두│휴가백두│휴가백두│한라 남산 태백 │
 *       └───────┴───────┴───────┴───────────────┘
 *
 * 규칙:
 * - 오늘 이후 ~ 최대 6개월
 * - 일정 없는 날짜는 가로 표에서 제외
 * - 일정 없는 주차도 제외
 * - 4명 이상이어도 전부 표시 (+N명 없음)
 * - 토요일 파랑, 일요일 빨강
 * - 연차/휴가 검정 배경
 * - 날짜 카드 클릭 → onDayClick (모달 오픈)
 */
import { useMemo } from 'react'
import {
  format, addMonths, eachDayOfInterval,
  startOfDay, isBefore, getDay,
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  isSameMonth,
} from 'date-fns'
import { ko } from 'date-fns/locale'

const WEEK_LABELS = ['첫째주', '둘째주', '셋째주', '넷째주', '다섯째주']
const DOW_KO      = ['일', '월', '화', '수', '목', '금', '토']

/* 주차 인덱스 (해당 월 기준, 0-based) */
function getWeekIndex(date) {
  const d   = new Date(date)
  const day = d.getDate()
  return Math.floor((day - 1) / 7)
}

/* 날짜 텍스트 색상 */
function getDayColor(date) {
  const dow = getDay(date)
  if (dow === 0) return '#EF4444'  // 일요일
  if (dow === 6) return '#3B82F6'  // 토요일
  return '#0F172A'
}

/* 날짜 라벨: "13일 토요일" */
function getDayLabel(date, holiday) {
  const dow   = getDay(date)
  const d     = format(date, 'd')
  const dowKo = DOW_KO[dow]
  if (holiday) return `${d}일 ${holiday}`
  if (dow === 0) return `${d}일 일요일`
  if (dow === 6) return `${d}일 토요일`
  return `${d}일`
}

/* 이름표 칩 */
function Chip({ event, user, onClick }) {
  const isLeave = event.schedule_type === 'annual_leave'
  const color   = isLeave ? '#1A1A2E' : (user?.color || event.color || '#4F8EF7')
  const label   = isLeave ? `휴가 ${event.assignee}` : event.assignee
  return (
    <span
      className="mst-chip"
      style={{ backgroundColor: color }}
      onPointerUp={e => { e.stopPropagation(); onClick(event) }}
    >
      {label}
    </span>
  )
}

export default function MobileScheduleTimeline({
  events, users, getHolidayName,
  onDayClick, onEventClick,
}) {
  const today = startOfDay(new Date())

  /* ── 오늘 ~ 6개월 범위 내 이벤트 필터 ───────────────── */
  const maxDate = addMonths(today, 6)

  const futureEvents = useMemo(() => {
    return events.filter(ev => {
      try {
        const d = startOfDay(new Date(ev.date))
        return !isBefore(d, today) && !isBefore(maxDate, d)
      } catch { return false }
    })
  }, [events, today, maxDate])

  /* ── 월 → 주차 → 날짜 그룹화 ───────────────────────── */
  const grouped = useMemo(() => {
    if (futureEvents.length === 0) return []

    // 이벤트가 있는 날짜 Set
    const activeDates = new Set(futureEvents.map(e => e.date))

    // 오늘부터 6개월 모든 날짜를 순회하며 그룹화
    const allDays = eachDayOfInterval({ start: today, end: maxDate })

    // monthKey → weekIndex → dayStr[]
    const structure = {}

    for (const day of allDays) {
      const ds = format(day, 'yyyy-MM-dd')
      if (!activeDates.has(ds)) continue

      const monthKey  = format(day, 'yyyy-MM')
      const weekIdx   = getWeekIndex(day)

      if (!structure[monthKey])          structure[monthKey] = {}
      if (!structure[monthKey][weekIdx]) structure[monthKey][weekIdx] = []
      structure[monthKey][weekIdx].push(ds)
    }

    // 결과 배열로 변환
    return Object.entries(structure)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, weeks]) => ({
        monthKey,
        monthLabel: format(new Date(monthKey + '-01'), 'M월', { locale: ko }),
        weeks: Object.entries(weeks)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([weekIdx, days]) => ({
            weekLabel: WEEK_LABELS[Number(weekIdx)] || `${Number(weekIdx)+1}째주`,
            days: days.sort(),
          })),
      }))
  }, [futureEvents, today, maxDate])

  /* ── 날짜별 이벤트 정렬 ────────────────────────────── */
  const getEventsForDate = (ds) => {
    return [...futureEvents.filter(e => e.date === ds)].sort((a, b) => {
      const ua = users.find(u => u.id === a.user_id)
      const ub = users.find(u => u.id === b.user_id)
      // 연차 뒤로
      const la = a.schedule_type === 'annual_leave' ? 1 : 0
      const lb = b.schedule_type === 'annual_leave' ? 1 : 0
      if (la !== lb) return la - lb
      // 상단 고정 앞으로
      const pa = ua?.is_pinned ? 1 : 0
      const pb = ub?.is_pinned ? 1 : 0
      if (pa !== pb) return pb - pa
      return (a.assignee || '').localeCompare(b.assignee || '', 'ko')
    })
  }

  if (grouped.length === 0) {
    return (
      <div className="mst-empty">
        <div className="mst-empty-icon">📅</div>
        <div className="mst-empty-text">앞으로 6개월간 등록된 일정이 없습니다.</div>
      </div>
    )
  }

  return (
    <div className="mst-wrap">
      <div className="mst-header-title">📋 근무 스케줄</div>

      {grouped.map(({ monthKey, monthLabel, weeks }) => (
        <div key={monthKey} className="mst-month-section">
          {/* 월 제목 */}
          <div className="mst-month-title">{monthLabel}</div>

          {weeks.map(({ weekLabel, days }) => (
            <div key={weekLabel} className="mst-week-section">
              {/* 주차 제목 */}
              <div className="mst-week-title">{weekLabel}</div>

              {/* 가로 스크롤 날짜 카드 행 */}
              <div className="mst-week-row">
                {days.map(ds => {
                  const date    = new Date(ds)
                  const holiday = getHolidayName(ds)
                  const dow     = getDay(date)
                  const color   = getDayColor(date)
                  const label   = getDayLabel(date, holiday)
                  const dayEvs  = getEventsForDate(ds)

                  return (
                    <div
                      key={ds}
                      className={[
                        'mst-day-card',
                        dow === 6 && 'mst-saturday',
                        dow === 0 && 'mst-sunday',
                        holiday   && 'mst-holiday',
                      ].filter(Boolean).join(' ')}
                      onPointerUp={() => onDayClick(new Date(ds), {})}
                    >
                      {/* 날짜 제목 */}
                      <div className="mst-day-title" style={{ color }}>
                        {label}
                      </div>

                      {/* 이름표 — 전부 표시, +N명 없음 */}
                      <div className="mst-chip-list">
                        {dayEvs.length === 0 ? (
                          <span className="mst-no-schedule">-</span>
                        ) : (
                          dayEvs.map(ev => {
                            const user = users.find(u => u.id === ev.user_id)
                            return (
                              <Chip
                                key={ev.id}
                                event={ev}
                                user={user}
                                onClick={onEventClick}
                              />
                            )
                          })
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* 하단 여백 */}
      <div style={{ height: 40 }} />
    </div>
  )
}
