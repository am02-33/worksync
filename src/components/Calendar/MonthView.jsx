import { useMemo, useRef, useCallback } from 'react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isToday, isSameDay
} from 'date-fns'
import { sortSchedulesByUserName } from '../../utils/sortUsers'

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

// 모바일: 3명, PC: 6명
const getMaxVisible = () =>
  typeof window !== 'undefined' && window.innerWidth <= 768 ? 3 : 6

// 롱프레스 시간 (ms) — 충분히 길게 설정
const LONG_PRESS_MS = 800

export default function MonthView({
  currentDate, events, users, sortBy,
  onDayClick,   // (date, { shiftKey, ctrlKey }) => void
  onLongPress,  // (date) => void
  onEventClick,
  selectedDate, highlightUserId, swapFirstEvent,
  getHolidayName, selectedDates = [],
}) {
  // 롱프레스 상태 — ref로 관리 (리렌더 없이)
  const lpTimer   = useRef(null)
  const lpFired   = useRef(false)
  const lpTarget  = useRef(null)  // 어떤 날짜를 누르고 있는지

  const MAX_VISIBLE = getMaxVisible()

  const weeks = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd   = endOfMonth(currentDate)
    const calStart   = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calEnd     = endOfWeek(monthEnd, { weekStartsOn: 0 })
    const days       = eachDayOfInterval({ start: calStart, end: calEnd })
    const result = []
    for (let i = 0; i < days.length; i += 7) result.push(days.slice(i, i + 7))
    return result
  }, [currentDate])

  const getEventsForDay = useCallback((date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return sortSchedulesByUserName(
      events.filter(e => e.date === dateStr), users, sortBy
    )
  }, [events, users, sortBy])

  // ─── 롱프레스 시작 ───────────────────────────────────
  const startLP = useCallback((day) => {
    lpFired.current  = false
    lpTarget.current = day
    lpTimer.current  = setTimeout(() => {
      lpFired.current = true
      onLongPress(day)
    }, LONG_PRESS_MS)
  }, [onLongPress])

  // ─── 롱프레스 취소 ───────────────────────────────────
  const cancelLP = useCallback(() => {
    if (lpTimer.current) {
      clearTimeout(lpTimer.current)
      lpTimer.current = null
    }
  }, [])

  // ─── 날짜 셀 클릭 핸들러 ─────────────────────────────
  // PC: onClick (shiftKey/ctrlKey 지원)
  // 모바일: onPointerUp (터치 후 손가락 뗄 때)
  const handlePointerUp = useCallback((e, day) => {
    cancelLP()

    // 롱프레스로 처리됐으면 클릭 무시
    if (lpFired.current) {
      lpFired.current = false
      return
    }

    // 스크롤 중이면 무시 (pointerType이 touch일 때만)
    if (e.pointerType === 'touch') {
      // 이동 거리가 크면 스크롤로 판단 → 무시
      const moveThreshold = 10
      const dx = Math.abs((e.clientX || 0) - (e.target._startX || e.clientX))
      const dy = Math.abs((e.clientY || 0) - (e.target._startY || e.clientY))
      if (dx > moveThreshold || dy > moveThreshold) return
    }

    onDayClick(day, {
      shiftKey: e.shiftKey || false,
      ctrlKey:  e.ctrlKey  || e.metaKey || false,
    })
  }, [cancelLP, onDayClick])

  const handlePointerDown = useCallback((e, day) => {
    // 터치 시작 좌표 저장 (스크롤 판별용)
    e.currentTarget._startX = e.clientX
    e.currentTarget._startY = e.clientY
    startLP(day)
  }, [startLP])

  return (
    <div className="month-view">
      {/* 요일 헤더 */}
      <div className="day-headers">
        {DAY_LABELS.map((label, i) => (
          <div
            key={i}
            className={`day-header ${i === 0 ? 'sunday' : i === 6 ? 'saturday' : ''}`}
          >
            {label}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="month-grid">
        {weeks.map((week) =>
          week.map((day, di) => {
            const dateStr        = format(day, 'yyyy-MM-dd')
            const holiday        = getHolidayName(dateStr)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isTodayDate    = isToday(day)
            const isSelected     = selectedDate && isSameDay(day, selectedDate)
            const isMultiSel     = selectedDates.includes(dateStr)
            const dayEvents      = getEventsForDay(day)
            const isSun          = di === 0
            const isSat          = di === 6
            const hasHighlight   = highlightUserId && dayEvents.some(e => e.user_id === highlightUserId)
            const visibleEvents  = dayEvents.slice(0, MAX_VISIBLE)
            const hiddenCount    = dayEvents.length - MAX_VISIBLE

            return (
              <div
                key={dateStr}
                className={[
                  'day-cell',
                  !isCurrentMonth && 'other-month',
                  isTodayDate    && 'today',
                  isSelected && !isMultiSel && 'selected',
                  isMultiSel     && 'multi-selected',
                  (holiday || isSun) && 'holiday-day',
                  isSat          && 'saturday-day',
                  hasHighlight   && 'highlight-cell',
                ].filter(Boolean).join(' ')}
                // ── 이벤트 연결 ──────────────────────────
                onPointerDown={(e) => handlePointerDown(e, day)}
                onPointerUp={(e)   => handlePointerUp(e, day)}
                onPointerCancel={cancelLP}
                // PC 키보드 지원
                tabIndex={isCurrentMonth ? 0 : -1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onDayClick(day, {})
                  }
                }}
              >
                {/* 날짜 숫자 + 공휴일 */}
                <div className="day-number-row">
                  <span className="day-number">{format(day, 'd')}</span>
                  {isMultiSel && <span className="multi-check">✓</span>}
                  {/* 1순위: 공휴일 */}
                  {holiday && isCurrentMonth && (
                    <span className="holiday-label" title={holiday}>
                      {holiday.length > 5 ? holiday.slice(0, 4) + '…' : holiday}
                    </span>
                  )}
                </div>

                {/* 2순위: 근무자 */}
                <div className="day-events">
                  {visibleEvents.map(event => {
                    const user  = users.find(u => u.id === event.user_id)
                    const color = user?.color || event.color || '#4F8EF7'
                    const isSwapSel = swapFirstEvent?.id === event.id
                    const dimmed    = highlightUserId && event.user_id !== highlightUserId
                    return (
                      <div
                        key={event.id}
                        className={[
                          'event-chip',
                          isSwapSel && 'swap-selected',
                          dimmed    && 'dimmed',
                        ].filter(Boolean).join(' ')}
                        style={{ backgroundColor: color }}
                        // 이벤트 칩은 별도 포인터 이벤트
                        onPointerDown={(e) => e.stopPropagation()}
                        onPointerUp={(e) => {
                          e.stopPropagation()
                          onEventClick(event)
                        }}
                        title={event.assignee}
                      >
                        <span className="event-chip-text">{event.assignee}</span>
                      </div>
                    )
                  })}
                  {hiddenCount > 0 && (
                    <div className="event-more">+{hiddenCount}명</div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
