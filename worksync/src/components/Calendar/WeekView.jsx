import { useMemo } from 'react'
import { startOfWeek, addDays, format, isToday, isSameDay } from 'date-fns'
import { ko } from 'date-fns/locale'
import { getHolidayName } from '../../lib/holidays'

const HOURS = Array.from({ length: 24 }, (_, i) => i)

export default function WeekView({ currentDate, events, onDayClick, onEventClick, selectedDate }) {
  const year = currentDate.getFullYear()

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 })
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }, [currentDate])

  const getEventsForDay = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return events.filter(e => e.date === dateStr)
  }

  return (
    <div className="week-view">
      {/* 헤더 행 */}
      <div className="week-header-row">
        <div className="week-time-gutter" />
        {weekDays.map((day, di) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const holiday = getHolidayName(dateStr, year)
          const isSun = di === 0
          const isSat = di === 6
          return (
            <div
              key={dateStr}
              className={[
                'week-day-header',
                isToday(day) && 'today',
                (holiday || isSun) && 'holiday-day',
                isSat && 'saturday-day',
              ].filter(Boolean).join(' ')}
              onClick={() => onDayClick(day)}
            >
              <div className="week-day-name">
                {format(day, 'EEE', { locale: ko })}
              </div>
              <div className="week-day-num">{format(day, 'd')}</div>
              {holiday && <div className="week-holiday-label">{holiday}</div>}
            </div>
          )
        })}
      </div>

      {/* 시간 그리드 */}
      <div className="week-body">
        <div className="week-time-col">
          {HOURS.map(h => (
            <div key={h} className="week-hour-label">
              {h > 0 ? `${String(h).padStart(2, '0')}:00` : ''}
            </div>
          ))}
        </div>

        {weekDays.map((day, di) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const dayEvents = getEventsForDay(day)

          return (
            <div
              key={dateStr}
              className={`week-day-col ${di === 0 ? 'sunday' : di === 6 ? 'saturday' : ''}`}
              onClick={() => onDayClick(day)}
            >
              {HOURS.map(h => (
                <div key={h} className="week-hour-cell" />
              ))}

              {dayEvents.map(event => {
                const startH = event.start_time ? parseInt(event.start_time.split(':')[0]) : 0
                const startM = event.start_time ? parseInt(event.start_time.split(':')[1]) : 0
                const endH = event.end_time ? parseInt(event.end_time.split(':')[0]) : startH + 1
                const endM = event.end_time ? parseInt(event.end_time.split(':')[1]) : startM

                const top = (startH * 60 + startM) * (48 / 60)
                const height = Math.max(((endH - startH) * 60 + (endM - startM)) * (48 / 60), 24)

                return (
                  <div
                    key={event.id}
                    className="week-event"
                    style={{
                      top: `${top}px`,
                      height: `${height}px`,
                      backgroundColor: event.color || '#4F8EF7',
                    }}
                    onClick={(e) => { e.stopPropagation(); onEventClick(event) }}
                    title={event.title}
                  >
                    <div className="week-event-title">{event.title}</div>
                    {event.assignee && (
                      <div className="week-event-assignee">{event.assignee}</div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
