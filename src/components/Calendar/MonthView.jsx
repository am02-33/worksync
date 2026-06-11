import { useMemo } from 'react'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isToday, isSameDay } from 'date-fns'
import { getHolidayName } from '../../lib/holidays'

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

export default function MonthView({ currentDate, events, users, onDayClick, onEventClick, selectedDate, highlightUserId, swapFirstEvent }) {
  const year = currentDate.getFullYear()

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
    return events.filter(e => e.date === dateStr)
  }

  return (
    <div className="month-view">
      <div className="day-headers">
        {DAY_LABELS.map((label, i) => (
          <div key={i} className={`day-header ${i === 0 ? 'sunday' : i === 6 ? 'saturday' : ''}`}>{label}</div>
        ))}
      </div>
      <div className="month-grid">
        {weeks.map((week, wi) =>
          week.map((day, di) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const holiday = getHolidayName(dateStr, year)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isTodayDate = isToday(day)
            const isSelected = selectedDate && isSameDay(day, selectedDate)
            const dayEvents = getEventsForDay(day)
            const isSun = di === 0
            const isSat = di === 6
            const hasHighlight = highlightUserId && dayEvents.some(e => e.user_id === highlightUserId)

            return (
              <div
                key={dateStr}
                className={[
                  'day-cell',
                  !isCurrentMonth && 'other-month',
                  isTodayDate && 'today',
                  isSelected && 'selected',
                  (holiday || isSun) && 'holiday-day',
                  isSat && 'saturday-day',
                  hasHighlight && 'highlight-cell',
                ].filter(Boolean).join(' ')}
                onClick={() => onDayClick(day)}
              >
                <div className="day-number-row">
                  <span className="day-number">{format(day, 'd')}</span>
                  {holiday && <span className="holiday-label" title={holiday}>{holiday.length > 4 ? holiday.slice(0, 3) + '…' : holiday}</span>}
                </div>
                <div className="day-events">
                  {dayEvents.slice(0, 4).map(event => {
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
                        <span className="event-chip-text">
                          {event.start_time && <span className="event-time">{event.start_time.slice(0, 5)} </span>}
                          {event.assignee}
                        </span>
                      </div>
                    )
                  })}
                  {dayEvents.length > 4 && <div className="event-more">+{dayEvents.length - 4}명</div>}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
