import { Users } from 'lucide-react'

/**
 * 공통 UI 컴포넌트
 * - onPointerUp 사용 (스크롤 중 opacity 남는 버그 없음)
 * - touchAction: 'manipulation' 으로 300ms 딜레이 제거
 */

export function UserChip({ user, onClick, size = 'md', selected = false, style = {} }) {
  const pad = { sm: '6px 12px', md: '10px 18px', lg: '13px 22px' }[size] || '10px 18px'
  const fs  = { sm: '13px',     md: '14px',      lg: '15px'      }[size] || '14px'
  const mh  = { sm: '36px',     md: '44px',      lg: '50px'      }[size] || '44px'

  return (
    <button
      onPointerUp={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        padding: pad, borderRadius: '999px', border: selected ? '3px solid rgba(255,255,255,.8)' : 'none',
        backgroundColor: user.color || '#4F8EF7', color: '#fff',
        fontWeight: 700, fontFamily: 'var(--font)', fontSize: fs,
        minHeight: mh, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
        WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
        ...style,
      }}
    >
      {user.name}
    </button>
  )
}

export function GroupChip({ group, memberCount, onClick, size = 'md', style = {} }) {
  const pad = { sm: '6px 12px', md: '10px 18px', lg: '13px 22px' }[size] || '10px 18px'
  const fs  = { sm: '13px',     md: '14px',      lg: '15px'      }[size] || '14px'
  const mh  = { sm: '36px',     md: '44px',      lg: '50px'      }[size] || '44px'

  return (
    <button
      onPointerUp={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: pad, borderRadius: '999px', border: 'none',
        backgroundColor: group.color || '#6366F1', color: '#fff',
        fontWeight: 700, fontFamily: 'var(--font)', fontSize: fs,
        minHeight: mh, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
        WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
        ...style,
      }}
    >
      <Users size={14} />
      {group.name}
      {memberCount !== undefined && (
        <span style={{ opacity: .8, fontSize: '12px' }}>({memberCount}명)</span>
      )}
    </button>
  )
}

export function ActionButton({
  children, onClick, variant = 'secondary', size = 'md',
  fullWidth = false, disabled = false, icon, style = {},
}) {
  const bg = { primary: '#E94560', secondary: '#F1F5F9', danger: '#FEF2F2', ghost: 'transparent', dark: '#1A1A2E' }[variant] || '#F1F5F9'
  const fg = { primary: '#fff', secondary: '#0F172A', danger: '#EF4444', ghost: '#64748B', dark: '#fff' }[variant] || '#0F172A'
  const bd = { danger: '1px solid #FECACA', ghost: '1px solid #E2E8F0' }[variant] || 'none'
  const mh = { sm: '40px', md: '48px', lg: '56px' }[size] || '48px'
  const fs = { sm: '13px', md: '14px', lg: '15px' }[size] || '14px'
  const pd = { sm: '8px 16px', md: '12px 20px', lg: '14px 24px' }[size] || '12px 20px'

  return (
    <button
      onPointerUp={onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        padding: pd, width: fullWidth ? '100%' : 'auto',
        minHeight: mh, borderRadius: '12px', border: bd,
        backgroundColor: disabled ? '#F1F5F9' : bg,
        color: disabled ? '#94A3B8' : fg,
        fontWeight: 700, fontFamily: 'var(--font)', fontSize: fs,
        cursor: disabled ? 'not-allowed' : 'pointer',
        WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
        ...style,
      }}
    >
      {icon && icon}
      {children}
    </button>
  )
}

export function HolidayBadge({ name, style = {} }) {
  if (!name) return null
  return (
    <span style={{
      display: 'inline-block', fontSize: '10px', fontWeight: 600,
      color: '#EF4444', background: '#FEF2F2',
      padding: '1px 5px', borderRadius: '4px',
      whiteSpace: 'nowrap', maxWidth: '100%',
      overflow: 'hidden', textOverflow: 'ellipsis',
      ...style,
    }}>
      {name}
    </span>
  )
}

export function ScheduleItem({ event, user, onClick, showDate = false }) {
  const color = user?.color || event.color || '#4F8EF7'
  return (
    <div
      onPointerUp={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '12px 14px', borderRadius: '10px',
        background: '#F8FAFC', border: '1px solid #E2E8F0',
        cursor: 'pointer', minHeight: '52px',
        WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
      }}
    >
      <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '15px', color: '#0F172A' }}>{event.assignee}</div>
        {showDate && <div style={{ fontSize: '12px', color: '#94A3B8' }}>{event.date}</div>}
        {event.start_time && (
          <div style={{ fontSize: '12px', color: '#64748B' }}>
            {event.start_time.slice(0, 5)}{event.end_time ? `~${event.end_time.slice(0, 5)}` : ''}
          </div>
        )}
      </div>
      <div style={{ color: '#CBD5E1', fontSize: '20px' }}>›</div>
    </div>
  )
}
