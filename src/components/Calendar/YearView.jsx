import { useMemo, useState } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday } from 'date-fns'
import { ko } from 'date-fns/locale'
import { getHolidayName } from '../../lib/holidays'

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)
const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

function MiniMonth({ year, month, events, users, onDayClick, highlightUserId }) {
  const monthDate = new Date(year, month - 1, 1)
  const monthStart = startOfMonth(monthDate)
  const monthEnd = endOfMonth(monthDate)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })
  const holidays = {}
  days.forEach(d => {
    const ds = format(d, 'yyyy-MM-dd')
    const h = getHolidayName(ds, year)
    if (h) holidays[ds] = h
  })

  const getEventsForDay = (dateStr) => events.filter(e => e.date === dateStr)

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
          const dateStr = format(day, 'yyyy-MM-dd')
          const inMonth = isSameMonth(day, monthDate)
          const holiday = holidays[dateStr]
          const dayEvents = getEventsForDay(dateStr)
          const isSun = day.getDay() === 0
          const isSat = day.getDay() === 6
          const isHighlight = highlightUserId && dayEvents.some(e => e.user_id === highlightUserId)

          return (
            <div
              key={dateStr}
              className={[
                'mini-day',
                !inMonth && 'out',
                isToday(day) && 'today',
                (holiday || isSun) && 'hol',
                isSat && 'sat',
                isHighlight && 'highlighted',
              ].filter(Boolean).join(' ')}
              onClick={() => inMonth && onDayClick(day)}
              title={holiday || ''}
            >
              <span className="mini-day-num">{format(day, 'd')}</span>
              {inMonth && dayEvents.length > 0 && (
                <div className="mini-dots">
                  {dayEvents.slice(0, 4).map((ev, i) => {
                    const user = users.find(u => u.id === ev.user_id)
                    return (
                      <span
                        key={i}
                        className="mini-dot"
                        style={{ backgroundColor: user?.color || ev.color || '#4F8EF7' }}
                        title={ev.assignee}
                      />
                    )
                  })}
                  {dayEvents.length > 4 && <span className="mini-dot-more">+{dayEvents.length - 4}</span>}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function YearView({ currentDate, events, users, onDayClick, highlightUserId }) {
  const year = currentDate.getFullYear()

  return (
    <div className="year-view">
      <div className="year-grid">
        {MONTHS.map(month => (
          <MiniMonth
            key={month}
            year={year}
            month={month}
            events={events}
            users={users}
            onDayClick={onDayClick}
            highlightUserId={highlightUserId}
          />
        ))}
      </div>
    </div>
  )
}
