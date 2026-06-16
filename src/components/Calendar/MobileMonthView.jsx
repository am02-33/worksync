/**
 * MobileMonthView — 모바일 전용 7열 그리드 달력
 *
 * 구조:
 *  - 상단 요약바 (근무일 / 배정 / 휴가)
 *  - 요일 헤더 (일~토)
 *  - 7열 그리드 달력
 *  - 날짜 셀: 날짜숫자 + 공휴일 + 이름표 최대 3개 + +N명
 *  - 근무자 없는 날: 날짜만, "근무자 없음" 표시 안 함
 */
import { useMemo, useRef, useCallback } from 'react'
import {
  startOfMonth, endOfMonth,
  startOfWeek, endOfWeek,
  eachDayOfInterval,
  format, isSameMonth, isToday, isSameDay,
} from 'date-fns'

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']
const LONG_PRESS_MS = 800
const MAX_CHIPS = 3   // 셀 안에 표시할 최대 이름표 수

export default function MobileMonthView({
  currentDate, events, users,
  onDayClick, onLongPress, onEventClick,
  selectedDate, selectedDates = [],
  getHolidayName,
}) {
  const lpTimer = useRef(null)
  const lpFired = useRef(false)

  /* ── 달력 주 배열 ──────────────────────────────────── */
  const weeks = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd   = endOfMonth(currentDate)
    const calStart   = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calEnd     = endOfWeek(monthEnd,   { weekStartsOn: 0 })
    const days       = eachDayOfInterval({ start: calStart, end: calEnd })
    const result = []
    for (let i = 0; i < days.length; i += 7) result.push(days.slice(i, i + 7))
    return result
  }, [currentDate])

  /* ── 날짜별 이벤트 (is_pinned → 가나다순) ─────────── */
  const getEventsForDay = useCallback((date) => {
    const ds = format(date, 'yyyy-MM-dd')
    return [...events.filter(e => e.date === ds)].sort((a, b) => {
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
  }, [events, users])

  /* ── 이번 달 요약 ──────────────────────────────────── */
  const summary = useMemo(() => {
    const monthDates = eachDayOfInterval({
      start: startOfMonth(currentDate),
      end:   endOfMonth(currentDate),
    }).map(d => format(d, 'yyyy-MM-dd'))
    const monthEvs  = events.filter(e => monthDates.includes(e.date))
    const workEvs   = monthEvs.filter(e => e.schedule_type !== 'annual_leave')
    const leaveEvs  = monthEvs.filter(e => e.schedule_type === 'annual_leave')
    const workDays  = new Set(workEvs.map(e => e.date)).size
    return { workDays, workCount: workEvs.length, leaveCount: leaveEvs.length }
  }, [currentDate, events])

  /* ── 롱프레스 ──────────────────────────────────────── */
  const startLP = (day) => {
    lpFired.current = false
    lpTimer.current = setTimeout(() => {
      lpFired.current = true
      onLongPress(day)
    }, LONG_PRESS_MS)
  }
  const cancelLP = () => {
    if (lpTimer.current) { clearTimeout(lpTimer.current); lpTimer.current = null }
  }
  const handlePointerUp = (e, day) => {
    cancelLP()
    if (lpFired.current) { lpFired.current = false; return }
    const dx = Math.abs((e.clientX || 0) - (e.currentTarget._startX || e.clientX))
    const dy = Math.abs((e.clientY || 0) - (e.currentTarget._startY || e.clientY))
    if (dx > 8 || dy > 8) return
    onDayClick(day, {})
  }

  return (
    <div className="mmv">

      {/* ── 요약바 ─────────────────────────────────────── */}
      <div className="mmv-bar">
        <div className="mmv-bar-item">
          <span className="mmv-bar-num">{summary.workDays}</span>
          <span className="mmv-bar-label">근무일</span>
        </div>
        <div className="mmv-bar-sep" />
        <div className="mmv-bar-item">
          <span className="mmv-bar-num">{summary.workCount}</span>
          <span className="mmv-bar-label">근무 배정</span>
        </div>
        <div className="mmv-bar-sep" />
        <div className="mmv-bar-item">
          <span className="mmv-bar-num mmv-leave-num">{summary.leaveCount}</span>
          <span className="mmv-bar-label">휴가/연차</span>
        </div>
      </div>

      {/* ── 요일 헤더 ──────────────────────────────────── */}
      <div className="mmv-week-header">
        {DAY_LABELS.map((l, i) => (
          <div key={i} className={`mmv-dow-label ${i === 0 ? 'sun' : i === 6 ? 'sat' : ''}`}>
            {l}
          </div>
        ))}
      </div>

      {/* ── 7열 달력 그리드 ────────────────────────────── */}
      <div className="mmv-grid">
        {weeks.map((week, wi) =>
          week.map((day, di) => {
            const ds        = format(day, 'yyyy-MM-dd')
            const inMonth   = isSameMonth(day, currentDate)
            const todayD    = isToday(day)
            const isSel     = selectedDate && isSameDay(day, selectedDate)
            const isMulti   = selectedDates.includes(ds)
            const holiday   = inMonth ? getHolidayName(ds) : null
            const isSun     = di === 0
            const isSat     = di === 6
            const dayEvs    = inMonth ? getEventsForDay(day) : []
            const visible   = dayEvs.slice(0, MAX_CHIPS)
            const hidden    = dayEvs.length - MAX_CHIPS

            return (
              <div
                key={ds}
                className={[
                  'mmv-cell',
                  !inMonth  && 'out',
                  todayD    && 'today',
                  isSel     && !isMulti && 'selected',
                  isMulti   && 'multi',
                  holiday   && 'hol-day',
                ].filter(Boolean).join(' ')}
                onPointerDown={e => {
                  e.currentTarget._startX = e.clientX
                  e.currentTarget._startY = e.clientY
                  if (inMonth) startLP(day)
                }}
                onPointerUp={e => { if (inMonth) handlePointerUp(e, day) }}
                onPointerCancel={cancelLP}
              >
                {/* 날짜 숫자 */}
                <div className={[
                  'mmv-num',
                  todayD && 'mmv-today-circle',
                  !todayD && isSun && 'mmv-sun',
                  !todayD && isSat && 'mmv-sat',
                  !todayD && holiday && 'mmv-sun',
                ].filter(Boolean).join(' ')}>
                  {format(day, 'd')}
                </div>

                {/* 공휴일명 */}
                {holiday && inMonth && (
                  <div className="mmv-hol-name">
                    {holiday.length > 4 ? holiday.slice(0, 3) + '…' : holiday}
                  </div>
                )}

                {/* 이름표 (최대 MAX_CHIPS개) */}
                {visible.map(ev => {
                  const user    = users.find(u => u.id === ev.user_id)
                  const isLeave = ev.schedule_type === 'annual_leave'
                  const color   = isLeave ? '#1A1A2E' : (user?.color || ev.color || '#4F8EF7')
                  return (
                    <div
                      key={ev.id}
                      className="mmv-chip"
                      style={{ backgroundColor: color }}
                      onPointerDown={e => e.stopPropagation()}
                      onPointerUp={e => { e.stopPropagation(); onEventClick(ev) }}
                    >
                      {isLeave && <span className="mmv-chip-icon">🏖</span>}
                      <span className="mmv-chip-name">{ev.assignee}</span>
                    </div>
                  )
                })}

                {/* +N명 */}
                {hidden > 0 && (
                  <div className="mmv-more">+{hidden}명</div>
                )}

                {/* 다중 선택 체크 */}
                {isMulti && <div className="mmv-check">✓</div>}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
