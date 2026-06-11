import { format, isToday, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Clock, User, ChevronRight } from 'lucide-react'

export default function EventList({ events, selectedDate, onEventClick, onAddEvent }) {
  const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null
  const todayEvents = dateStr ? events.filter(e => e.date === dateStr) : []

  // 다가오는 일정 (오늘 이후 7일)
  const today = format(new Date(), 'yyyy-MM-dd')
  const upcoming = events
    .filter(e => e.date >= today)
    .slice(0, 8)

  const displayEvents = selectedDate ? todayEvents : upcoming
  const title = selectedDate
    ? format(selectedDate, 'M월 d일 (EEE)', { locale: ko })
    : '다가오는 일정'

  return (
    <aside className="event-list">
      <div className="event-list-header">
        <h3 className="event-list-title">{title}</h3>
        <button className="event-list-add" onClick={onAddEvent} title="일정 추가">＋</button>
      </div>

      {displayEvents.length === 0 ? (
        <div className="event-list-empty">
          <div className="empty-icon">📅</div>
          <p>일정이 없습니다</p>
          <button className="btn btn-outline-sm" onClick={onAddEvent}>일정 추가</button>
        </div>
      ) : (
        <ul className="event-list-items">
          {displayEvents.map(event => (
            <li
              key={event.id}
              className="event-item"
              onClick={() => onEventClick(event)}
            >
              <div
                className="event-item-bar"
                style={{ backgroundColor: event.color || '#4F8EF7' }}
              />
              <div className="event-item-content">
                <div className="event-item-header">
                  <span className="event-item-title">{event.title}</span>
                  <ChevronRight size={14} className="event-item-arrow" />
                </div>
                <div className="event-item-meta">
                  {!selectedDate && (
                    <span className="event-item-date">
                      📅 {format(parseISO(event.date), 'M/d(EEE)', { locale: ko })}
                    </span>
                  )}
                  {event.start_time && (
                    <span className="event-item-time">
                      <Clock size={11} />
                      {event.start_time.slice(0, 5)}
                      {event.end_time && `~${event.end_time.slice(0, 5)}`}
                    </span>
                  )}
                  {event.assignee && (
                    <span className="event-item-assignee">
                      <User size={11} /> {event.assignee}
                    </span>
                  )}
                </div>
                {event.memo && (
                  <p className="event-item-memo">{event.memo}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
