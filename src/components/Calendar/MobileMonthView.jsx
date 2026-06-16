/**
 * MobileMonthView — 모바일 전용 근무표 뷰
 *
 * 핵심 설계 원칙:
 * - "누가" 근무하는지가 1순위 → 이름표 반드시 표시
 * - 날짜 행 방식: 날짜(좌) + 근무자 chip 가로 스크롤(우)
 * - 인원 제한 없음, 잘림 없음
 * - 공휴일, 연차, 근무 명확히 구분
 * - 날짜 행 탭 → MobileDateModal 열기
 */
import { useMemo, useRef, useCallback } from 'react'
import {
  startOfMonth, endOfMonth, eachDayOfInterval,
  format, isToday, isSameDay,
} from 'date-fns'
import { ko } from 'date-fns/locale'

const LONG_PRESS_MS = 800
const DAY_KO = ['일', '월', '화', '수', '목', '금', '토']

// 요일 인덱스
function getDayOfWeek(date) { return date.getDay() }

// 이름표 칩 컴포넌트
function NameChip({ event, user, onClick }) {
  const isLeave = event.schedule_type === 'annual_leave'
  const color   = isLeave ? '#1A1A2E' : (user?.color || event.color || '#4F8EF7')
  return (
    <button
      onPointerUp={(e) => { e.stopPropagation(); onClick(event) }}
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        gap:            isLeave ? '3px' : 0,
        padding:        '4px 10px',
        borderRadius:   '999px',
        border:         'none',
        backgroundColor: color,
        color:          '#fff',
        fontWeight:     700,
        fontSize:       '13px',
        fontFamily:     'var(--font)',
        whiteSpace:     'nowrap',
        flexShrink:     0,
        cursor:         'pointer',
        minHeight:      '28px',
        WebkitTapHighlightColor: 'transparent',
        touchAction:    'manipulation',
      }}
    >
      {isLeave && <span style={{ fontSize: '11px' }}>🏖</span>}
      {event.assignee}
    </button>
  )
}

export default function MobileMonthView({
  currentDate, events, users, sortBy,
  onDayClick, onLongPress, onEventClick,
  selectedDate, selectedDates = [],
  getHolidayName,
}) {
  const lpTimer = useRef(null)
  const lpFired = useRef(false)

  // 이번 달 전체 날짜 배열
  const days = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(currentDate),
      end:   endOfMonth(currentDate),
    })
  }, [currentDate])

  // 날짜별 이벤트 (is_pinned 우선 → 이름 가나다순)
  const getEventsForDay = useCallback((date) => {
    const ds = format(date, 'yyyy-MM-dd')
    const dayEvs = events.filter(e => e.date === ds)
    return [...dayEvs].sort((a, b) => {
      const ua = users.find(u => u.id === a.user_id)
      const ub = users.find(u => u.id === b.user_id)
      // 연차는 뒤로
      const leaveA = a.schedule_type === 'annual_leave' ? 1 : 0
      const leaveB = b.schedule_type === 'annual_leave' ? 1 : 0
      if (leaveA !== leaveB) return leaveA - leaveB
      // 상단 고정
      const pinA = ua?.is_pinned ? 1 : 0
      const pinB = ub?.is_pinned ? 1 : 0
      if (pinA !== pinB) return pinB - pinA
      // 이름 가나다순
      return (a.assignee || '').localeCompare(b.assignee || '', 'ko')
    })
  }, [events, users])

  // 이번 달 요약 통계
  const monthSummary = useMemo(() => {
    const ds_list = days.map(d => format(d, 'yyyy-MM-dd'))
    const monthEvs = events.filter(e => ds_list.includes(e.date))
    const workDays  = new Set(monthEvs.filter(e => e.schedule_type !== 'annual_leave').map(e => e.date)).size
    const leaveCount = monthEvs.filter(e => e.schedule_type === 'annual_leave').length
    const workCount  = monthEvs.filter(e => e.schedule_type !== 'annual_leave').length
    return { workDays, leaveCount, workCount }
  }, [days, events])

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
    <div className="mmv-wrap">
      {/* ── 이번 달 요약바 ───────────────────────────── */}
      <div className="mmv-summary-bar">
        <div className="mmv-summary-item">
          <span className="mmv-summary-num">{monthSummary.workDays}</span>
          <span className="mmv-summary-label">근무일</span>
        </div>
        <div className="mmv-summary-divider" />
        <div className="mmv-summary-item">
          <span className="mmv-summary-num">{monthSummary.workCount}</span>
          <span className="mmv-summary-label">근무 배정</span>
        </div>
        <div className="mmv-summary-divider" />
        <div className="mmv-summary-item">
          <span className="mmv-summary-num" style={{ color: '#EF4444' }}>{monthSummary.leaveCount}</span>
          <span className="mmv-summary-label">휴가/연차</span>
        </div>
      </div>

      {/* ── 날짜 행 목록 ─────────────────────────────── */}
      <div className="mmv-list">
        {days.map(day => {
          const ds        = format(day, 'yyyy-MM-dd')
          const holiday   = getHolidayName(ds)
          const todayD    = isToday(day)
          const isSel     = selectedDate && isSameDay(day, selectedDate)
          const isMultiSel = selectedDates.includes(ds)
          const dow       = getDayOfWeek(day)
          const isSun     = dow === 0
          const isSat     = dow === 6
          const dayEvs    = getEventsForDay(day)
          const workEvs   = dayEvs.filter(e => e.schedule_type !== 'annual_leave')
          const leaveEvs  = dayEvs.filter(e => e.schedule_type === 'annual_leave')

          return (
            <div
              key={ds}
              className={[
                'mmv-row',
                todayD    && 'mmv-row-today',
                isSel     && 'mmv-row-selected',
                isMultiSel && 'mmv-row-multi',
                holiday   && 'mmv-row-holiday',
              ].filter(Boolean).join(' ')}
              onPointerDown={e => {
                e.currentTarget._startX = e.clientX
                e.currentTarget._startY = e.clientY
                startLP(day)
              }}
              onPointerUp={e => handlePointerUp(e, day)}
              onPointerCancel={cancelLP}
            >
              {/* ── 왼쪽: 날짜 정보 (고정 너비) ───────── */}
              <div className="mmv-date-col">
                <div className={[
                  'mmv-date-num',
                  todayD && 'mmv-today-circle',
                  isSun  && 'mmv-sun',
                  isSat  && 'mmv-sat',
                  holiday && 'mmv-sun',
                ].filter(Boolean).join(' ')}>
                  {format(day, 'd')}
                </div>
                <div className={['mmv-dow', isSun && 'mmv-sun', isSat && 'mmv-sat', holiday && 'mmv-sun'].filter(Boolean).join(' ')}>
                  {DAY_KO[dow]}
                </div>

                {/* 공휴일 뱃지 */}
                {holiday && (
                  <div className="mmv-hol-badge">
                    {holiday.length > 4 ? holiday.slice(0, 3) + '…' : holiday}
                  </div>
                )}

                {/* 다중 선택 체크 */}
                {isMultiSel && (
                  <div className="mmv-multicheck">✓</div>
                )}
              </div>

              {/* ── 오른쪽: 근무자 이름표 가로 스크롤 ──── */}
              <div className="mmv-chips-col"
                onPointerDown={e => e.stopPropagation()}>
                {dayEvs.length === 0 ? (
                  <span className="mmv-empty">근무자 없음</span>
                ) : (
                  <div className="mmv-chips-scroll">
                    {/* 근무자 (연차 아닌 것 먼저) */}
                    {workEvs.map(ev => {
                      const user = users.find(u => u.id === ev.user_id)
                      return (
                        <NameChip
                          key={ev.id}
                          event={ev}
                          user={user}
                          onClick={onEventClick}
                        />
                      )
                    })}
                    {/* 구분선 (연차 있을 때만) */}
                    {workEvs.length > 0 && leaveEvs.length > 0 && (
                      <div className="mmv-divider-v" />
                    )}
                    {/* 연차/휴가 */}
                    {leaveEvs.map(ev => {
                      const user = users.find(u => u.id === ev.user_id)
                      return (
                        <NameChip
                          key={ev.id}
                          event={ev}
                          user={user}
                          onClick={onEventClick}
                        />
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
