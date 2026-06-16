import { format, isToday } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Plus, Trash2, Users } from 'lucide-react'
import { sortSchedulesByUserName } from '../../utils/sortUsers'
import { getChipLabel } from '../../utils/chipStyle'

function resolveColor(event, user) {
  if (event.schedule_type === 'annual_leave') return '#1A1A2E'
  return user?.color || event.color || '#4F8EF7'
}

function fmtTime(s, e) {
  if (!s && !e) return null
  if (s && e) return `${s.slice(0,5)}~${e.slice(0,5)}`
  if (s) return s.slice(0,5)
  return `~${e.slice(0,5)}`
}

export default function DayView({
  currentDate, events, users, sortBy,
  onEventClick, onAddEvent, getHolidayName,
  onQuickAssign, onQuickAssignGroup, groups, onDeleteDay,
}) {
  const ds       = format(currentDate, 'yyyy-MM-dd')
  const holiday  = getHolidayName(ds)
  const todayD   = isToday(currentDate)
  const dayEvs   = sortSchedulesByUserName(events.filter(e => e.date === ds), users, sortBy)
  const noTimeEvs  = dayEvs.filter(e => !e.start_time)
  const hasTimeEvs = dayEvs.filter(e => !!e.start_time).sort((a,b) => (a.start_time||'').localeCompare(b.start_time||''))

  return (
    <div className="dv-wrap">
      <div className={['dv-header', todayD&&'dv-today', holiday&&'dv-holiday'].filter(Boolean).join(' ')}>
        <div>
          <div className="dv-date">{format(currentDate,'yyyy년 M월 d일 (EEE)',{locale:ko})}</div>
          {holiday && <div className="dv-holiday-text">🎌 {holiday}</div>}
        </div>
        <div className="dv-count">{dayEvs.length}명 근무</div>
      </div>

      <div className="dv-body">
        <div className="dv-left">
          <div className="dv-section-title">근무자 목록</div>
          {dayEvs.length === 0 ? (
            <div className="dv-empty">
              <div style={{ fontSize:32, marginBottom:8 }}>📅</div>
              <p>이 날 등록된 일정이 없습니다</p>
              <button className="btn btn-outline-sm" style={{ marginTop:10 }} onPointerUp={() => onAddEvent(currentDate)}>일정 추가</button>
            </div>
          ) : (
            <div className="dv-event-list">
              {noTimeEvs.length > 0 && (
                <>
                  <div className="dv-sub-label">시간 없음 ({noTimeEvs.length}명)</div>
                  {noTimeEvs.map(ev => {
                    const user  = users.find(u => u.id === ev.user_id)
                    const color = resolveColor(ev, user)
                    const label = getChipLabel(ev)
                    return (
                      <div key={ev.id} className="dv-card" style={{ borderLeftColor: color }} onPointerUp={() => onEventClick(ev)}>
                        <div className="dv-dot" style={{ backgroundColor: color }} />
                        <div className="dv-info">
                          <div className="dv-name">{label}</div>
                          {ev.memo && <div className="dv-memo">{ev.memo}</div>}
                        </div>
                        <div className="dv-arrow">›</div>
                      </div>
                    )
                  })}
                </>
              )}
              {hasTimeEvs.length > 0 && (
                <>
                  <div className="dv-sub-label" style={{ marginTop: noTimeEvs.length>0?12:0 }}>시간 지정 ({hasTimeEvs.length}건)</div>
                  {hasTimeEvs.map(ev => {
                    const user  = users.find(u => u.id === ev.user_id)
                    const color = resolveColor(ev, user)
                    const label = getChipLabel(ev)
                    const t     = fmtTime(ev.start_time, ev.end_time)
                    return (
                      <div key={ev.id} className="dv-card" style={{ borderLeftColor: color }} onPointerUp={() => onEventClick(ev)}>
                        <div className="dv-dot" style={{ backgroundColor: color }} />
                        <div className="dv-info">
                          <div className="dv-name">{label}</div>
                          {t && <div className="dv-time">{t}</div>}
                          {ev.memo && <div className="dv-memo">{ev.memo}</div>}
                        </div>
                        <div className="dv-arrow">›</div>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          )}
          <div className="dv-actions">
            <button className="btn btn-primary" style={{ flex:1 }} onPointerUp={() => onAddEvent(currentDate)}><Plus size={16} /> 일정 추가</button>
            {dayEvs.length > 0 && <button className="btn btn-danger" onPointerUp={onDeleteDay}><Trash2 size={16} /> 이 날 삭제</button>}
          </div>
        </div>

        <div className="dv-right">
          <div className="dv-section-title">빠른 배정</div>
          {users.length > 0 && (
            <div className="dv-assign-block">
              <div className="dv-assign-label">개인</div>
              <div className="dv-assign-chips">
                {users.map(user => (
                  <button key={user.id} className="dv-chip-btn" style={{ backgroundColor: user.color||'#4F8EF7', color:'#fff' }}
                    onPointerUp={() => onQuickAssign(ds, user)}>{user.name}</button>
                ))}
              </div>
            </div>
          )}
          {groups && groups.length > 0 && (
            <div className="dv-assign-block">
              <div className="dv-assign-label">그룹</div>
              <div className="dv-assign-chips">
                {groups.map(group => {
                  const members = users.filter(u => u.group_id === group.id)
                  return (
                    <button key={group.id} className="dv-chip-btn" style={{ backgroundColor: group.color||'#6366F1', color:'#fff', display:'flex', alignItems:'center', gap:5 }}
                      onPointerUp={() => onQuickAssignGroup(ds, group, members)}>
                      <Users size={12} /> {group.name} ({members.length})
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          {users.length === 0 && <p style={{ fontSize:13, color:'var(--text-muted)', textAlign:'center', padding:'16px 0' }}>👥 사용자를 먼저 등록하세요</p>}
        </div>
      </div>
    </div>
  )
}
