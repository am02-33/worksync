import { useMemo, useRef, useCallback } from 'react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isToday, isSameDay
} from 'date-fns'
import { sortSchedulesByUserName } from '../../utils/sortUsers'
import { getChipLabel } from '../../utils/chipStyle'

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']
const LONG_PRESS_MS = 800

// 이벤트 칩 색상 결정
function resolveChipColor(event, user) {
  if (event.schedule_type === 'annual_leave') return '#1A1A2E'
  return user?.color || event.color || '#4F8EF7'
}

const getMaxVisible = () =>
  typeof window !== 'undefined' && window.innerWidth <= 768 ? 3 : 6

export default function MonthView({
  currentDate, events, users, sortBy,
  onDayClick, onLongPress, onEventClick,
  selectedDate, highlightUserId, swapFirstEvent,
  getHolidayName, selectedDates = [],
}) {
  const lpTimer  = useRef(null)
  const lpFired  = useRef(false)
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
    return sortSchedulesByUserName(events.filter(e => e.date === dateStr), users, sortBy)
  }, [events, users, sortBy])

  const startLP = useCallback((day) => {
    lpFired.current = false
    lpTimer.current = setTimeout(() => { lpFired.current = true; onLongPress(day) }, LONG_PRESS_MS)
  }, [onLongPress])

  const cancelLP = useCallback(() => {
    if (lpTimer.current) { clearTimeout(lpTimer.current); lpTimer.current = null }
  }, [])

  const handlePointerUp = useCallback((e, day) => {
    cancelLP()
    if (lpFired.current) { lpFired.current = false; return }
    if (e.pointerType === 'touch') {
      const dx = Math.abs((e.clientX || 0) - (e.currentTarget._startX || e.clientX))
      const dy = Math.abs((e.clientY || 0) - (e.currentTarget._startY || e.clientY))
      if (dx > 10 || dy > 10) return
    }
    onDayClick(day, { shiftKey: e.shiftKey || false, ctrlKey: e.ctrlKey || e.metaKey || false })
  }, [cancelLP, onDayClick])

  const handlePointerDown = useCallback((e, day) => {
    e.currentTarget._startX = e.clientX
    e.currentTarget._startY = e.clientY
    startLP(day)
  }, [startLP])

  return (
    <div className="month-view">
      <div className="day-headers">
        {DAY_LABELS.map((label, i) => (
          <div key={i} className={`day-header ${i === 0 ? 'sunday' : i === 6 ? 'saturday' : ''}`}>{label}</div>
        ))}
      </div>
      <div className="month-grid">
        {weeks.map((week) =>
          week.map((day, di) => {
            const dateStr      = format(day, 'yyyy-MM-dd')
            const holiday      = getHolidayName(dateStr)
            const isCurrentM   = isSameMonth(day, currentDate)
            const isTodayDate  = isToday(day)
            const isSelected   = selectedDate && isSameDay(day, selectedDate)
            const isMultiSel   = selectedDates.includes(dateStr)
            const dayEvents    = getEventsForDay(day)
            const isSun        = di === 0
            const isSat        = di === 6
            const hasHighlight = highlightUserId && dayEvents.some(e => e.user_id === highlightUserId)
            const visibleEvs   = dayEvents.slice(0, MAX_VISIBLE)
            const hiddenCount  = dayEvents.length - MAX_VISIBLE

            return (
              <div
                key={dateStr}
                className={[
                  'day-cell',
                  !isCurrentM   && 'other-month',
                  isTodayDate   && 'today',
                  isSelected && !isMultiSel && 'selected',
                  isMultiSel    && 'multi-selected',
                  (holiday || isSun) && 'holiday-day',
                  isSat         && 'saturday-day',
                  hasHighlight  && 'highlight-cell',
                ].filter(Boolean).join(' ')}
                onPointerDown={(e) => handlePointerDown(e, day)}
                onPointerUp={(e)   => handlePointerUp(e, day)}
                onPointerCancel={cancelLP}
                tabIndex={isCurrentM ? 0 : -1}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onDayClick(day, {}) } }}
              >
                <div className="day-number-row">
                  <span className="day-number">{format(day, 'd')}</span>
                  {isMultiSel && <span className="multi-check">✓</span>}
                  {holiday && isCurrentM && (
                    <span className="holiday-label" title={holiday}>
                      {holiday.length > 5 ? holiday.slice(0, 4) + '…' : holiday}
                    </span>
                  )}
                </div>
                <div className="day-events">
                  {visibleEvs.map(event => {
                    const user  = users.find(u => u.id === event.user_id)
                    const color = resolveChipColor(event, user)
                    const isSwapSel = swapFirstEvent?.id === event.id
                    const dimmed    = highlightUserId && event.user_id !== highlightUserId
                    const label     = getChipLabel(event)
                    return (
                      <div
                        key={event.id}
                        className={['event-chip', isSwapSel && 'swap-selected', dimmed && 'dimmed'].filter(Boolean).join(' ')}
                        style={{ backgroundColor: color }}
                        onPointerDown={e => e.stopPropagation()}
                        onPointerUp={e => { e.stopPropagation(); onEventClick(event) }}
                        title={label}
                      >
                        <span className="event-chip-text">{label}</span>
                      </div>
                    )
                  })}
                  {hiddenCount > 0 && <div className="event-more">+{hiddenCount}명</div>}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
