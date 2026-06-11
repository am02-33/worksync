import { useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { X, Plus, ArrowLeftRight, Trash2, Users } from 'lucide-react'
import { sortSchedulesByUserName } from '../utils/sortUsers'

export default function BottomSheet({
  isOpen, onClose, selectedDate, events, users, groups,
  getHolidayName, sortBy,
  onEventClick, onAddEvent, onQuickAssign, onQuickAssignGroup,
  onDeleteDay, onSwapStart,
}) {
  const sheetRef = useRef(null)

  useEffect(() => {
    if (isOpen && sheetRef.current) {
      sheetRef.current.scrollTop = 0
    }
  }, [isOpen, selectedDate])

  if (!selectedDate) return null

  const dateStr = format(selectedDate, 'yyyy-MM-dd')
  const holiday = getHolidayName(dateStr)
  const dayEvents = sortSchedulesByUserName(
    events.filter(e => e.date === dateStr), users, sortBy
  )

  const handleGroupAssign = (group) => {
    const members = users.filter(u => u.group_id === group.id)
    onQuickAssignGroup(dateStr, group, members)
  }

  return (
    <>
      {/* 오버레이 */}
      {isOpen && (
        <div className="bs-overlay" onClick={onClose} />
      )}

      {/* 바텀시트 */}
      <div className={`bottom-sheet ${isOpen ? 'open' : ''}`} ref={sheetRef}>
        {/* 핸들 */}
        <div className="bs-handle" />

        {/* 헤더 */}
        <div className="bs-header">
          <div>
            <div className="bs-date">{format(selectedDate, 'M월 d일 (EEE)', { locale: ko })}</div>
            {holiday && <div className="bs-holiday">🎌 {holiday}</div>}
          </div>
          <button className="bs-close" onClick={onClose}><X size={20} /></button>
        </div>

        {/* 근무자 목록 */}
        <div className="bs-section">
          <div className="bs-section-title">근무자 ({dayEvents.length}명)</div>
          {dayEvents.length === 0 ? (
            <div className="bs-empty">이 날 등록된 일정이 없습니다</div>
          ) : (
            <div className="bs-event-list">
              {dayEvents.map(event => {
                const user = users.find(u => u.id === event.user_id)
                const color = user?.color || event.color || '#4F8EF7'
                return (
                  <div key={event.id} className="bs-event-item" onClick={() => { onEventClick(event); onClose() }}>
                    <div className="bs-event-dot" style={{ backgroundColor: color }} />
                    <div className="bs-event-name">{event.assignee}</div>
                    {event.start_time && (
                      <div className="bs-event-time">{event.start_time.slice(0, 5)}{event.end_time ? `~${event.end_time.slice(0, 5)}` : ''}</div>
                    )}
                    <div className="bs-event-arrow">›</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 개인 빠른 배정 */}
        {users.length > 0 && (
          <div className="bs-section">
            <div className="bs-section-title">개인 배정</div>
            <div className="bs-chip-scroll">
              {users.map(user => (
                <button
                  key={user.id}
                  className="bs-user-chip"
                  style={{ backgroundColor: user.color, color: '#fff' }}
                  onClick={() => onQuickAssign(dateStr, user)}
                >
                  {user.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 그룹 빠른 배정 */}
        {groups.length > 0 && (
          <div className="bs-section">
            <div className="bs-section-title">그룹 배정</div>
            <div className="bs-chip-scroll">
              {groups.map(group => {
                const memberCount = users.filter(u => u.group_id === group.id).length
                return (
                  <button
                    key={group.id}
                    className="bs-group-chip"
                    style={{ backgroundColor: group.color, color: '#fff' }}
                    onClick={() => handleGroupAssign(group)}
                  >
                    <Users size={14} />
                    {group.name}
                    <span style={{ opacity: .8, fontSize: '12px' }}>({memberCount})</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="bs-actions">
          <button className="bs-action-btn primary" onClick={() => { onAddEvent(selectedDate); onClose() }}>
            <Plus size={20} />
            일정 추가
          </button>
          <button className="bs-action-btn danger" onClick={() => { onDeleteDay(); onClose() }}>
            <Trash2 size={18} />
            이 날 삭제
          </button>
        </div>

        <div style={{ height: '20px' }} />
      </div>
    </>
  )
}
