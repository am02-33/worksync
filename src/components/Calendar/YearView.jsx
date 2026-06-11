import { useRef, useCallback } from 'react'
import {
  format, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, eachDayOfInterval,
  isSameMonth, isToday
} from 'date-fns'
import { sortSchedulesByUserName } from '../../utils/sortUsers'

const MONTHS      = Array.from({ length: 12 }, (_, i) => i + 1)
const DAY_LABELS  = ['일', '월', '화', '수', '목', '금', '토']
const LONG_PRESS_MS = 800

function MiniMonth({
  year, month, events, users, sortBy,
  onDayClick, onLongPress,
  highlightUserId, getHolidayName, selectedDates,
}) {
  const lpTimer = useRef(null)
  const lpFired = useRef(false)

  const monthDate = new Date(year, month - 1, 1)
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(monthDate), { weekStartsOn: 0 }),
    end:   endOfWeek(endOfMonth(monthDate),     { weekStartsOn: 0 }),
  })

  const getEventsForDay = useCallback((dateStr) =>
    sortSchedulesByUserName(events.filter(e => e.date === dateStr), users, sortBy),
  [events, users, sortBy])

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

  return (
    <div className="mini-month">
      <div className="mini-month-title">{month}월</div>
      <div className="mini-day-headers">
        {DAY_LABELS.map((l, i) => (
          <div key={i} className={`mini-day-header ${i === 0 ? 'sun' : i === 6 ? 'sat' : ''}`}>{l}</div>
        ))}
      </div>
      <div className="mini-grid">
        {days.map(day => {
          const dateStr    = format(day, 'yyyy-MM-dd')
          const inMonth    = isSameMonth(day, monthDate)
          const holiday    = inMonth ? getHolidayName(dateStr) : null
          const dayEvents  = inMonth ? getEventsForDay(dateStr) : []
          const isSun      = day.getDay() === 0
          const isSat      = day.getDay() === 6
          const isHighlight = highlightUserId && dayEvents.some(e => e.user_id === highlightUserId)
          const isMultiSel  = selectedDates.includes(dateStr)

          return (
            <div
              key={dateStr}
              className={[
                'mini-day',
                !inMonth       && 'out',
                isToday(day)   && 'today',
                (holiday||isSun) && 'hol',
                isSat          && 'sat',
                isHighlight    && 'highlighted',
                isMultiSel     && 'mini-multi-selected',
              ].filter(Boolean).join(' ')}
              onPointerDown={() => inMonth && startLP(day)}
              onPointerUp={(e) => {
                cancelLP()
                if (!lpFired.current && inMonth) {
                  onDayClick(day, { shiftKey: e.shiftKey, ctrlKey: e.ctrlKey })
                }
                lpFired.current = false
              }}
              onPointerCancel={cancelLP}
              title={holiday || ''}
            >
              <span className="mini-day-num">{format(day, 'd')}</span>
              {inMonth && dayEvents.length > 0 && (
                <div className="mini-dots">
                  {dayEvents.slice(0, 3).map((ev, i) => {
                    const user = users.find(u => u.id === ev.user_id)
                    return (
                      <span key={i} className="mini-dot"
                        style={{ backgroundColor: user?.color || ev.color || '#4F8EF7' }}
                        title={ev.assignee} />
                    )
                  })}
                  {dayEvents.length > 3 && (
                    <span className="mini-dot-more">+{dayEvents.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function YearView({
  currentDate, events, users, sortBy,
  onDayClick, onLongPress,
  highlightUserId, getHolidayName, selectedDates,
}) {
  const year = currentDate.getFullYear()
  return (
    <div className="year-view">
      <div className="year-grid">
        {MONTHS.map(month => (
          <MiniMonth key={month} year={year} month={month}
            events={events} users={users} sortBy={sortBy}
            onDayClick={onDayClick} onLongPress={onLongPress}
            highlightUserId={highlightUserId} getHolidayName={getHolidayName}
            selectedDates={selectedDates} />
        ))}
      </div>
    </div>
  )
}
