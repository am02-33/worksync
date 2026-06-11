import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ArrowLeftRight, Trash2, Clock, Plus } from 'lucide-react'

export default function QuickAssign({
  selectedDate, users, events, onQuickAssign, onEventClick, onAddEvent,
  swapFirstEvent, onSwapStart, quickMode,
}) {
  const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null
  const dayEvents = dateStr ? events.filter(e => e.date === dateStr) : []
  const upcomingEvents = !selectedDate
    ? events.filter(e => e.date >= format(new Date(), 'yyyy-MM-dd')).slice(0, 10)
    : []

  const displayEvents = selectedDate ? dayEvents : upcomingEvents
  const title = selectedDate
    ? format(selectedDate, 'M월 d일 (EEE)', { locale: ko })
    : '다가오는 일정'

  return (
    <aside className="event-list">
      {/* 헤더 */}
      <div className="event-list-header">
        <h3 className="event-list-title">{title}</h3>
        <button className="event-list-add" onClick={onAddEvent}>＋</button>
      </div>

      {/* 빠른 배정 사용자 버튼 */}
      {selectedDate && (
        <div className="quick-user-panel">
          <div className="quick-user-label">
            {quickMode ? '⚡ 클릭하면 즉시 배정' : '사용자 선택 후 배정'}
          </div>
          <div className="quick-user-buttons">
            {users.map(user => (
              <button
                key={user.id}
                className="quick-user-btn"
                style={{ backgroundColor: user.color, color: '#fff' }}
                onClick={() => onQuickAssign(format(selectedDate, 'yyyy-MM-dd'), user)}
                title={`${user.name} 즉시 배정`}
              >
                {user.name}
              </button>
            ))}
            {users.length === 0 && (
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>👥 먼저 사용자를 등록하세요</p>
            )}
          </div>
        </div>
      )}

      {/* 교체 모드 안내 */}
      {swapFirstEvent && (
        <div className="swap-banner">
          <ArrowLeftRight size={14} />
          <span><strong>{swapFirstEvent.assignee}</strong> 선택됨 — 교체할 다른 일정 클릭</span>
        </div>
      )}

      {/* 일정 목록 */}
      {displayEvents.length === 0 ? (
        <div className="event-list-empty">
          <div className="empty-icon">📅</div>
          <p>{selectedDate ? '이 날 일정이 없습니다' : '다가오는 일정이 없습니다'}</p>
          <button className="btn btn-outline-sm" onClick={onAddEvent}>일정 추가</button>
        </div>
      ) : (
        <ul className="event-list-items">
          {displayEvents.map(event => {
            const user = users.find(u => u.id === event.user_id)
            const color = user?.color || event.color || '#4F8EF7'
            const isSwapSelected = swapFirstEvent?.id === event.id
            return (
              <li key={event.id} className={`event-item ${isSwapSelected ? 'swap-selected-item' : ''}`}
                onClick={() => onEventClick(event)}>
                <div className="event-item-bar" style={{ backgroundColor: color }} />
                <div className="event-item-content">
                  <div className="event-item-header">
                    <span className="event-item-title">{event.assignee}</span>
                    {isSwapSelected && <span style={{ fontSize: '11px', color: '#F59E0B' }}>선택됨</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{event.title}</div>
                  {event.start_time && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                      <Clock size={10} /> {event.start_time.slice(0, 5)}{event.end_time && `~${event.end_time.slice(0, 5)}`}
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </aside>
  )
}
