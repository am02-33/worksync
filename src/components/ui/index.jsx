import { Users } from 'lucide-react'

/** 사용자 이름표 칩 */
export function UserChip({ user, onClick, size = 'md', selected = false, style = {} }) {
  const sizes = {
    sm: { padding: '6px 12px', fontSize: '13px', minHeight: '36px' },
    md: { padding: '10px 18px', fontSize: '14px', minHeight: '44px' },
    lg: { padding: '14px 22px', fontSize: '15px', minHeight: '52px' },
  }
  const s = sizes[size] || sizes.md
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...s,
        borderRadius: '999px',
        border: selected ? '3px solid #fff' : 'none',
        backgroundColor: user.color || '#4F8EF7',
        color: '#fff',
        fontWeight: 700,
        fontFamily: 'var(--font)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        boxShadow: selected ? `0 0 0 3px ${user.color || '#4F8EF7'}` : 'none',
        transition: 'opacity .12s, transform .12s',
        WebkitTapHighlightColor: 'transparent',
        ...style,
      }}
      onTouchStart={e => { e.currentTarget.style.opacity = '0.8'; e.currentTarget.style.transform = 'scale(0.96)' }}
      onTouchEnd={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)' }}
    >
      {user.name}
    </button>
  )
}

/** 그룹 칩 */
export function GroupChip({ group, memberCount, onClick, size = 'md', style = {} }) {
  const sizes = {
    sm: { padding: '6px 12px', fontSize: '13px', minHeight: '36px' },
    md: { padding: '10px 18px', fontSize: '14px', minHeight: '44px' },
    lg: { padding: '14px 22px', fontSize: '15px', minHeight: '52px' },
  }
  const s = sizes[size] || sizes.md
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        ...s,
        borderRadius: '999px',
        border: 'none',
        backgroundColor: group.color || '#6366F1',
        color: '#fff',
        fontWeight: 700,
        fontFamily: 'var(--font)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        transition: 'opacity .12s, transform .12s',
        WebkitTapHighlightColor: 'transparent',
        ...style,
      }}
      onTouchStart={e => { e.currentTarget.style.opacity = '0.8' }}
      onTouchEnd={e => { e.currentTarget.style.opacity = '1' }}
    >
      <Users size={14} />
      {group.name}
      {memberCount !== undefined && (
        <span style={{ opacity: .8, fontSize: '12px' }}>({memberCount}명)</span>
      )}
    </button>
  )
}

/** 액션 버튼 */
export function ActionButton({ children, onClick, variant = 'default', size = 'md', fullWidth = false, disabled = false, icon, style = {} }) {
  const variants = {
    primary:   { background: '#E94560', color: '#fff', border: 'none' },
    secondary: { background: '#F1F5F9', color: '#0F172A', border: '1px solid #E2E8F0' },
    danger:    { background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA' },
    ghost:     { background: 'transparent', color: '#64748B', border: '1px solid #E2E8F0' },
    dark:      { background: '#1A1A2E', color: '#fff', border: 'none' },
  }
  const sizes = {
    sm: { padding: '8px 16px', fontSize: '13px', minHeight: '40px' },
    md: { padding: '12px 20px', fontSize: '14px', minHeight: '48px' },
    lg: { padding: '16px 24px', fontSize: '15px', minHeight: '56px' },
  }
  const v = variants[variant] || variants.default
  const s = sizes[size] || sizes.md
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        ...s,
        width: fullWidth ? '100%' : 'auto',
        borderRadius: '12px',
        fontWeight: 700,
        fontFamily: 'var(--font)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? .5 : 1,
        transition: 'opacity .12s, transform .12s',
        WebkitTapHighlightColor: 'transparent',
        ...v,
        ...style,
      }}
      onTouchStart={e => { if (!disabled) e.currentTarget.style.opacity = '0.75' }}
      onTouchEnd={e => { e.currentTarget.style.opacity = disabled ? '0.5' : '1' }}
    >
      {icon && icon}
      {children}
    </button>
  )
}

/** 공휴일 배지 */
export function HolidayBadge({ name, style = {} }) {
  if (!name) return null
  return (
    <span style={{
      display: 'inline-block',
      fontSize: '10px',
      fontWeight: 600,
      color: '#EF4444',
      background: '#FEF2F2',
      padding: '1px 5px',
      borderRadius: '4px',
      whiteSpace: 'nowrap',
      maxWidth: '100%',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      ...style,
    }}>
      {name}
    </span>
  )
}

/** 일정 목록 아이템 */
export function ScheduleItem({ event, user, onClick, showDate = false }) {
  const color = user?.color || event.color || '#4F8EF7'
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 14px',
        borderRadius: '10px',
        background: '#F8FAFC',
        border: '1px solid #E2E8F0',
        cursor: 'pointer',
        minHeight: '52px',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
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
