import { X } from 'lucide-react'
import { format } from 'date-fns'

export default function StatsPanel({ isOpen, onClose, users, events, currentDate, onHighlight, highlightUserId }) {
  if (!isOpen) return null

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1
  const monthPrefix = `${year}-${String(month).padStart(2, '0')}`

  const getUserStats = (user) => {
    const monthEvents = events.filter(e => e.user_id === user.id && e.date.startsWith(monthPrefix))
    const yearEvents = events.filter(e => e.user_id === user.id && e.date.startsWith(`${year}`))
    return { monthly: monthEvents.length, yearly: yearEvents.length }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">📊 근무 통계</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            {year}년 {month}월 기준
          </div>

          {/* 색상 범례 + 통계 */}
          <div className="stats-list">
            {users.map(user => {
              const stats = getUserStats(user)
              const isHL = highlightUserId === user.id
              return (
                <div
                  key={user.id}
                  className={`stats-item ${isHL ? 'highlighted' : ''}`}
                  onClick={() => onHighlight(isHL ? null : user.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="stats-color" style={{ backgroundColor: user.color }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{user.name}</div>
                    {user.memo && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user.memo}</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: user.color }}>{stats.monthly}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>이번달</div>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: '48px' }}>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-secondary)' }}>{stats.yearly}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>올해</div>
                  </div>
                </div>
              )
            })}
            {users.length === 0 && (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>등록된 사용자가 없습니다.</p>
            )}
          </div>

          <div style={{ marginTop: '16px', padding: '12px', background: 'var(--surface-2)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            💡 이름을 클릭하면 해당 사용자의 근무일만 강조 표시됩니다.
          </div>
        </div>
        <div className="modal-footer">
          <div className="modal-footer-right">
            {highlightUserId && (
              <button className="btn btn-ghost" onClick={() => onHighlight(null)}>강조 해제</button>
            )}
            <button className="btn btn-ghost" onClick={onClose}>닫기</button>
          </div>
        </div>
      </div>
    </div>
  )
}
