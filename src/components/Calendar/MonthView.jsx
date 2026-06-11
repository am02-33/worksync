import { useMemo, useRef } from 'react'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isToday, isSameDay } from 'date-fns'
import { sortSchedulesByUserName } from '../../utils/sortUsers'
import { HolidayBadge } from '../ui/index.jsx'

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']
const LONG_PRESS_MS = 800

export default function MonthView({
  currentDate, events, users, sortBy,
  onDayClick, onLongPress, onEventClick,
  selectedDate, highlightUserId, swapFirstEvent,
  getHolidayName, selectedDates,
}) {
  const longPressTimer = useRef(null)
  const longPressTriggered = useRef(false)
  const isMobileView = typeof window !== 'undefined' && window.innerWidth <= 768
  const MAX_VISIBLE = isMobileView ? 3 : 6

  const weeks = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
    const days = eachDayOfInterval({ start: calStart, end: calEnd })
    const result = []
    for (let i = 0; i < days.length; i += 7) result.push(days.slice(i, i + 7))
    return result
  }, [currentDate])

  const getEventsForDay = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return sortSchedulesByUserName(events.filter(e => e.date === dateStr), users, sortBy)
  }

  const startLP = (day) => {
    longPressTriggered.current = false
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true
      onLongPress(day)
    }, LONG_PRESS_MS)
  }
  const cancelLP = () => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null }
  }
  const handleClick = (e, day) => {
    if (longPressTriggered.current) return
    onDayClick(day, { shiftKey: e.shiftKey, ctrlKey: e.ctrlKey || e.metaKey })
  }

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
            const dateStr = format(day, 'yyyy-MM-dd')
            const holiday = getHolidayName(dateStr)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isTodayDate = isToday(day)
            const isSelected = selectedDate && isSameDay(day, selectedDate)
            const isMultiSelected = selectedDates.includes(dateStr)
            const dayEvents = getEventsForDay(day)
            const isSun = di === 0
            const isSat = di === 6
            const hasHighlight = highlightUserId && dayEvents.some(e => e.user_id === highlightUserId)
            const visibleEvents = dayEvents.slice(0, MAX_VISIBLE)
            const hiddenCount = dayEvents.length - MAX_VISIBLE

            return (
              <div
                key={dateStr}
                className={[
                  'day-cell',
                  !isCurrentMonth && 'other-month',
                  isTodayDate && 'today',
                  isSelected && !isMultiSelected && 'selected',
                  isMultiSelected && 'multi-selected',
                  (holiday || isSun) && 'holiday-day',
                  isSat && 'saturday-day',
                  hasHighlight && 'highlight-cell',
                ].filter(Boolean).join(' ')}
                onClick={(e) => handleClick(e, day)}
                onMouseDown={() => startLP(day)}
                onMouseUp={cancelLP}
                onMouseLeave={cancelLP}
                onTouchStart={(e) => { e.stopPropagation(); startLP(day) }}
                onTouchEnd={(e) => {
                  cancelLP()
                  if (!longPressTriggered.current) handleClick(e, day)
                }}
                onTouchCancel={cancelLP}
              >
                <div className="day-number-row">
                  <span className="day-number">{format(day, 'd')}</span>
                  {isMultiSelected && <span className="multi-check">✓</span>}
                  {/* 1순위: 공휴일 */}
                  {holiday && isCurrentMonth && (
                    <HolidayBadge name={holiday.length > 5 ? holiday.slice(0, 4) + '…' : holiday} />
                  )}
                </div>
                {/* 2순위: 근무자 */}
                <div className="day-events">
                  {visibleEvents.map(event => {
                    const user = users.find(u => u.id === event.user_id)
                    const color = user?.color || event.color || '#4F8EF7'
                    const isSwapSel = swapFirstEvent?.id === event.id
                    const dimmed = highlightUserId && event.user_id !== highlightUserId
                    return (
                      <div
                        key={event.id}
                        className={`event-chip ${isSwapSel ? 'swap-selected' : ''} ${dimmed ? 'dimmed' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={(e) => { e.stopPropagation(); onEventClick(event) }}
                        title={`${event.assignee}`}
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
