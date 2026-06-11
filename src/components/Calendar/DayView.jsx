import { format, isToday } from 'date-fns'
import { ko } from 'date-fns/locale'
import { getHolidayName } from '../../lib/holidays'
import { Clock, User } from 'lucide-react'

const HOURS = Array.from({ length: 24 }, (_, i) => i)

export default function DayView({ currentDate, events, onEventClick, onAddEvent }) {
  const dateStr = format(currentDate, 'yyyy-MM-dd')
  const year = currentDate.getFullYear()
  const holiday = getHolidayName(dateStr, year)
  const dayEvents = events.filter(e => e.date === dateStr)

  return (
    <div className="day-view">
      {/* 날짜 헤더 */}
      <div className={`day-view-header ${isToday(currentDate) ? 'today' : ''} ${holiday ? 'holiday-day' : ''}`}>
        <div className="day-view-date">
          {format(currentDate, 'M월 d일 (EEE)', { locale: ko })}
        </div>
        {holiday && <div className="day-view-holiday">{holiday} 🎌</div>}
        <div className="day-view-count">{dayEvents.length}개 일정</div>
      </div>

      <div className="day-body">
        {/* 시간 그리드 */}
        <div className="day-time-col">
          {HOURS.map(h => (
            <div key={h} className="day-hour-label">
              {h > 0 ? `${String(h).padStart(2, '0')}:00` : ''}
            </div>
          ))}
        </div>

        <div className="day-events-col" onClick={onAddEvent}>
          {HOURS.map(h => (
            <div key={h} className="day-hour-cell" />
          ))}

          {dayEvents.map(event => {
            const startH = event.start_time ? parseInt(event.start_time.split(':')[0]) : 8
            const startM = event.start_time ? parseInt(event.start_time.split(':')[1]) : 0
            const endH = event.end_time ? parseInt(event.end_time.split(':')[0]) : startH + 1
            const endM = event.end_time ? parseInt(event.end_time.split(':')[1]) : startM

            const top = (startH * 60 + startM) * (48 / 60)
            const height = Math.max(((endH - startH) * 60 + (endM - startM)) * (48 / 60), 32)

            return (
              <div
                key={event.id}
                className="day-event"
                style={{
                  top: `${top}px`,
                  height: `${height}px`,
                  backgroundColor: event.color || '#4F8EF7',
                }}
                onClick={(e) => { e.stopPropagation(); onEventClick(event) }}
              >
                <div className="day-event-title">{event.title}</div>
                <div className="day-event-meta">
                  {event.start_time && (
                    <span><Clock size={11} /> {event.start_time.slice(0, 5)}~{event.end_time?.slice(0, 5)}</span>
                  )}
                  {event.assignee && (
                    <span><User size={11} /> {event.assignee}</span>
                  )}
                </div>
                {event.memo && height > 60 && (
                  <div className="day-event-memo">{event.memo}</div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
