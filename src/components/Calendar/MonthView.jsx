import { useMemo, useRef } from 'react'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isToday, isSameDay } from 'date-fns'
import { sortSchedulesByUserName } from '../../utils/sortUsers'

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']
const MAX_VISIBLE = 6
const LONG_PRESS_MS = 800

export default function MonthView({
  currentDate, events, users, sortBy,
  onDayClick, onLongPress, onEventClick,
  selectedDate, highlightUserId, swapFirstEvent,
  getHolidayName, selectedDates,
}) {
  const longPressTimer = useRef(null)

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
    const dayEvs = events.filter(e => e.date === dateStr)
    return sortSchedulesByUserName(dayEvs, users, sortBy)
  }

  const handleMouseDown = (day) => {
    // 모바일 long-press 시작
    longPressTimer.current = setTimeout(() => {
      onLongPress(day)
    }, LONG_PRESS_MS)
  }

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const handleClick = (e, day) => {
    // long-press 중이면 클릭 무시
    onDayClick(day, e.shiftKey)
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
                onMouseDown={() => handleMouseDown(day)}
                onMouseUp={handleMouseUp}
                onTouchStart={() => handleMouseDown(day)}
                onTouchEnd={handleMouseUp}
                onTouchCancel={handleMouseUp}
              >
                <div className="day-number-row">
                  <span className="day-number">{format(day, 'd')}</span>
                  {isMultiSelected && <span className="multi-check">✓</span>}
                  {holiday && isCurrentMonth && (
                    <span className="holiday-label" title={holiday}>
                      {holiday.length > 5 ? holiday.slice(0, 4) + '…' : holiday}
                    </span>
                  )}
                </div>
                <div className="day-events">
                  {visibleEvents.map(event => {
                    const user = users.find(u => u.id === event.user_id)
                    const color = user?.color || event.color || '#4F8EF7'
                    const isSwapSelected = swapFirstEvent?.id === event.id
                    const dimmed = highlightUserId && event.user_id !== highlightUserId
                    return (
                      <div
                        key={event.id}
                        className={`event-chip ${isSwapSelected ? 'swap-selected' : ''} ${dimmed ? 'dimmed' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={(e) => { e.stopPropagation(); onEventClick(event) }}
                        title={`${event.assignee} - ${event.title}`}
                      >
                        <span className="event-chip-text">{event.assignee}</span>
                      </div>
                    )
                  })}
                  {hiddenCount > 0 && (
                    <div className="event-more" onClick={(e) => { e.stopPropagation(); onDayClick(day, false) }}>
                      +{hiddenCount}명 더보기
                    </div>
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
