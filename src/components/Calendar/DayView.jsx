import { format, isToday } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Plus, Trash2, Users } from 'lucide-react'
import { sortSchedulesByUserName } from '../../utils/sortUsers'

function formatTime(start, end) {
  if (!start && !end) return null
  if (start && end) return `${start.slice(0,5)}~${end.slice(0,5)}`
  if (start) return start.slice(0,5)
  if (end) return `~${end.slice(0,5)}`
  return null
}

export default function DayView({
  currentDate, events, users, sortBy,
  onEventClick, onAddEvent, getHolidayName,
  onQuickAssign, onQuickAssignGroup, groups, onDeleteDay,
}) {
  const dateStr   = format(currentDate, 'yyyy-MM-dd')
  const holiday   = getHolidayName(dateStr)
  const isTodayD  = isToday(currentDate)
  const dayEvents = sortSchedulesByUserName(
    events.filter(e => e.date === dateStr), users, sortBy
  )

  return (
    <div className="day-view-card">
      {/* 날짜 헤더 */}
      <div className={`day-card-header ${isTodayD ? 'today' : ''} ${holiday ? 'holiday' : ''}`}>
        <div className="day-card-date">
          {format(currentDate, 'yyyy년 M월 d일 (EEE)', { locale: ko })}
        </div>
        {holiday && (
          <div className="day-card-holiday">🎌 {holiday}</div>
        )}
        <div className="day-card-count">{dayEvents.length}명 근무</div>
      </div>

      <div className="day-card-body">
        {/* 왼쪽: 근무자 목록 */}
        <div className="day-card-left">
          <div className="day-card-section-title">근무자 목록</div>

          {dayEvents.length === 0 ? (
            <div className="day-card-empty">
              <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
              <div style={{ fontSize: 14, color: '#94A3B8' }}>이 날 등록된 일정이 없습니다</div>
              <button className="btn btn-outline-sm" style={{ marginTop: 12 }}
                onPointerUp={() => onAddEvent(currentDate)}>
                일정 추가
              </button>
            </div>
          ) : (
            <div className="day-event-list">
              {dayEvents.map(ev => {
                const user    = users.find(u => u.id === ev.user_id)
                const color   = user?.color || ev.color || '#4F8EF7'
                const timeStr = formatTime(ev.start_time, ev.end_time)
                return (
                  <div
                    key={ev.id}
                    className="day-event-card"
                    style={{ borderLeftColor: color }}
                    onPointerUp={() => onEventClick(ev)}
                  >
                    <div className="day-event-dot" style={{ backgroundColor: color }} />
                    <div className="day-event-info">
                      <div className="day-event-name">{ev.assignee}</div>
                      {timeStr && <div className="day-event-time">{timeStr}</div>}
                      {ev.memo && <div className="day-event-memo">{ev.memo}</div>}
                    </div>
                    <div style={{ color: '#CBD5E1', fontSize: 20 }}>›</div>
                  </div>
                )
              })}
            </div>
          )}

          {/* 하단 액션 버튼 */}
          <div className="day-card-actions">
            <button className="btn btn-primary" style={{ flex: 1 }}
              onPointerUp={() => onAddEvent(currentDate)}>
              <Plus size={16} /> 일정 추가
            </button>
            {dayEvents.length > 0 && (
              <button className="btn btn-danger"
                onPointerUp={onDeleteDay}>
                <Trash2 size={16} /> 이 날 삭제
              </button>
            )}
          </div>
        </div>

        {/* 오른쪽: 빠른 배정 패널 */}
        <div className="day-card-right">
          <div className="day-card-section-title">빠른 배정</div>

          {/* 개인 */}
          {users.length > 0 && (
            <div className="day-assign-section">
              <div className="day-assign-label">개인</div>
              <div className="day-assign-chips">
                {users.map(user => (
                  <button
                    key={user.id}
                    className="day-assign-chip"
                    style={{ backgroundColor: user.color || '#4F8EF7', color: '#fff' }}
                    onPointerUp={() => onQuickAssign(dateStr, user)}
                    title={`${user.name} 즉시 배정`}
                  >
                    {user.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 그룹 */}
          {groups && groups.length > 0 && (
            <div className="day-assign-section">
              <div className="day-assign-label">그룹</div>
              <div className="day-assign-chips">
                {groups.map(group => {
                  const members = users.filter(u => u.group_id === group.id)
                  return (
                    <button
                      key={group.id}
                      className="day-assign-chip group-chip"
                      style={{ backgroundColor: group.color || '#6366F1', color: '#fff' }}
                      onPointerUp={() => onQuickAssignGroup(dateStr, group, members)}
                    >
                      <Users size={13} /> {group.name} ({members.length}명)
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {users.length === 0 && (
            <div style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '20px 0' }}>
              👥 사용자를 먼저 등록하세요
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
