import { X } from 'lucide-react'
import { format } from 'date-fns'

export default function StatsPanel({ isOpen, onClose, users, groups, events, currentDate, onHighlight, highlightUserId }) {
  if (!isOpen) return null

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1
  const monthPrefix = `${year}-${String(month).padStart(2, '0')}`

  const getUserStats = (user) => ({
    monthly: events.filter(e => e.user_id === user.id && e.date.startsWith(monthPrefix)).length,
    yearly:  events.filter(e => e.user_id === user.id && e.date.startsWith(`${year}`)).length,
  })

  const getGroupStats = (group) => {
    const memberIds = users.filter(u => u.group_id === group.id).map(u => u.id)
    return {
      monthly: events.filter(e => memberIds.includes(e.user_id) && e.date.startsWith(monthPrefix)).length,
      yearly:  events.filter(e => memberIds.includes(e.user_id) && e.date.startsWith(`${year}`)).length,
      memberCount: memberIds.length,
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">📊 근무 통계</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            {year}년 {month}월 기준
          </div>

          {/* 그룹별 통계 */}
          {groups.length > 0 && (
            <>
              <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-secondary)' }}>그룹별</h3>
              <div className="stats-list" style={{ marginBottom: '16px' }}>
                {groups.map(group => {
                  const stats = getGroupStats(group)
                  return (
                    <div key={group.id} className="stats-item">
                      <div className="stats-color" style={{ backgroundColor: group.color }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '13px' }}>{group.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{stats.memberCount}명</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '17px', fontWeight: 700, color: group.color }}>{stats.monthly}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>이번달</div>
                      </div>
                      <div style={{ textAlign: 'right', minWidth: '44px' }}>
                        <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-secondary)' }}>{stats.yearly}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>올해</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* 개인별 통계 */}
          <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-secondary)' }}>개인별</h3>
          <div className="stats-list">
            {users.map(user => {
              const stats = getUserStats(user)
              const isHL = highlightUserId === user.id
              const userGroup = groups.find(g => g.id === user.group_id)
              return (
                <div key={user.id} className={`stats-item ${isHL ? 'highlighted' : ''}`}
                  onClick={() => onHighlight(isHL ? null : user.id)} style={{ cursor: 'pointer' }}>
                  <div className="stats-color" style={{ backgroundColor: user.color }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {user.name}
                      {userGroup && (
                        <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '10px', backgroundColor: userGroup.color + '22', color: userGroup.color, fontWeight: 700 }}>
                          {userGroup.name}
                        </span>
                      )}
                    </div>
                    {user.memo && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user.memo}</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '17px', fontWeight: 700, color: user.color }}>{stats.monthly}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>이번달</div>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: '44px' }}>
                    <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-secondary)' }}>{stats.yearly}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>올해</div>
                  </div>
                </div>
              )
            })}
            {users.length === 0 && <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '16px' }}>등록된 사용자가 없습니다.</p>}
          </div>

          <div style={{ marginTop: '12px', padding: '10px', background: 'var(--surface-2)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            💡 이름을 클릭하면 해당 사용자 근무일만 강조됩니다.
          </div>
        </div>
        <div className="modal-footer">
          <div className="modal-footer-right">
            {highlightUserId && <button className="btn btn-ghost" onClick={() => onHighlight(null)}>강조 해제</button>}
            <button className="btn btn-ghost" onClick={onClose}>닫기</button>
          </div>
        </div>
      </div>
    </div>
  )
}
