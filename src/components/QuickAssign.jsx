import { useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ArrowLeftRight, Clock, Users } from 'lucide-react'
import { sortSchedulesByUserName } from '../utils/sortUsers'

export default function QuickAssign({
  selectedDate, selectedDates, multiMode,
  users, sortedUsers, groups, events,
  onQuickAssign, onQuickAssignGroup,
  onEventClick, onAddEvent,
  swapFirstEvent, quickMode, sortBy, onClearMulti,
  getHolidayName,
}) {
  const [activeTab, setActiveTab] = useState('individual')

  const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null

  const displayEvents = (() => {
    if (selectedDates.length > 0) {
      return sortSchedulesByUserName(events.filter(e => selectedDates.includes(e.date)), users, sortBy)
    }
    if (dateStr) {
      return sortSchedulesByUserName(events.filter(e => e.date === dateStr), users, sortBy)
    }
    const today = format(new Date(), 'yyyy-MM-dd')
    return events.filter(e => e.date >= today).slice(0, 10)
  })()

  const title = selectedDates.length > 1
    ? `${selectedDates.length}개 날짜`
    : selectedDate
      ? format(selectedDate, 'M월 d일 (EEE)', { locale: ko })
      : '다가오는 일정'

  const hasDateSelected = selectedDate || selectedDates.length > 0

  return (
    <aside className="event-list pc-only">
      <div className="event-list-header">
        <h3 className="event-list-title">{title}</h3>
        <button className="event-list-add" onClick={onAddEvent}>＋</button>
      </div>

      {hasDateSelected && (
        <div className="quick-user-panel">
          {groups.length > 0 && (
            <div className="quick-tabs">
              <button className={`quick-tab ${activeTab === 'individual' ? 'active' : ''}`} onClick={() => setActiveTab('individual')}>개인</button>
              <button className={`quick-tab ${activeTab === 'group' ? 'active' : ''}`} onClick={() => setActiveTab('group')}>그룹</button>
            </div>
          )}
          <div className="quick-user-label">
            {selectedDates.length > 1 ? `⚡ ${selectedDates.length}개 날짜 일괄 배정` : quickMode ? '⚡ 클릭하면 즉시 배정' : '클릭하여 배정'}
          </div>

          {(activeTab === 'individual' || groups.length === 0) && (
            <div className="quick-user-buttons">
              {sortedUsers.map(user => (
                <button key={user.id} className="quick-user-btn"
                  style={{ backgroundColor: user.color, color: '#fff' }}
                  onClick={() => onQuickAssign(dateStr, user)}>
                  {user.name}
                </button>
              ))}
              {users.length === 0 && <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>👥 먼저 사용자를 등록하세요</p>}
            </div>
          )}

          {activeTab === 'group' && groups.length > 0 && (
            <div className="quick-user-buttons">
              {groups.map(group => {
                const members = sortedUsers.filter(u => u.group_id === group.id)
                return (
                  <button key={group.id} className="quick-group-btn"
                    style={{ backgroundColor: group.color, color: '#fff' }}
                    onClick={() => onQuickAssignGroup(dateStr, group, members)}>
                    <Users size={12} style={{ marginRight: '4px' }} />
                    {group.name}
                    <span style={{ fontSize: '10px', marginLeft: '4px', opacity: .8 }}>({members.length}명)</span>
                  </button>
                )
              })}
            </div>
          )}

          {selectedDates.length > 1 && (
            <button className="btn btn-ghost" style={{ width: '100%', marginTop: '6px', fontSize: '12px' }} onClick={onClearMulti}>
              선택 해제 ({selectedDates.length}개)
            </button>
          )}
        </div>
      )}

      {swapFirstEvent && (
        <div className="swap-banner">
          <ArrowLeftRight size={13} />
          <span><strong>{swapFirstEvent.assignee}</strong> — 교체할 일정 클릭</span>
        </div>
      )}

      {displayEvents.length === 0 ? (
        <div className="event-list-empty">
          <div className="empty-icon">📅</div>
          <p>{hasDateSelected ? '이 날 일정이 없습니다' : '다가오는 일정 없음'}</p>
          <button className="btn btn-outline-sm" onClick={onAddEvent}>일정 추가</button>
        </div>
      ) : (
        <ul className="event-list-items">
          {displayEvents.map(event => {
            const user = users.find(u => u.id === event.user_id)
            const color = user?.color || event.color || '#4F8EF7'
            const isSwapSel = swapFirstEvent?.id === event.id
            return (
              <li key={event.id} className={`event-item ${isSwapSel ? 'swap-selected-item' : ''}`} onClick={() => onEventClick(event)}>
                <div className="event-item-bar" style={{ backgroundColor: color }} />
                <div className="event-item-content">
                  <div className="event-item-header">
                    <span className="event-item-title">{event.assignee}</span>
                    {isSwapSel && <span style={{ fontSize: '10px', color: '#F59E0B' }}>선택됨</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{event.title}</div>
                  {selectedDates.length > 1 && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>📅 {event.date}</div>}
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
