import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { X, Plus, ArrowLeftRight, Trash2, CalendarDays, ChevronLeft } from 'lucide-react'
import { sortSchedulesByUserName } from '../utils/sortUsers'

const VIEW = { MAIN: 'main', ADD: 'add', CHANGE: 'change', CHANGE2: 'change2' }

// 이름표 칩 — opacity 버그 없는 버전
function UserPill({ user, onClick }) {
  return (
    <button
      onPointerUp={onClick}   // onClick 대신 pointerUp 사용
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '12px 20px',
        borderRadius:   '999px',
        border:         'none',
        backgroundColor: user.color || '#4F8EF7',
        color:          '#fff',
        fontWeight:     700,
        fontFamily:     'var(--font)',
        fontSize:       '15px',
        minHeight:      '48px',
        cursor:         'pointer',
        whiteSpace:     'nowrap',
        flexShrink:     0,
        WebkitTapHighlightColor: 'transparent',
        touchAction:    'manipulation',
      }}
    >
      {user.name}
    </button>
  )
}

function GroupPill({ group, memberCount, onClick }) {
  return (
    <button
      onPointerUp={onClick}
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        gap:            '6px',
        padding:        '12px 20px',
        borderRadius:   '999px',
        border:         'none',
        backgroundColor: group.color || '#6366F1',
        color:          '#fff',
        fontWeight:     700,
        fontFamily:     'var(--font)',
        fontSize:       '15px',
        minHeight:      '48px',
        cursor:         'pointer',
        whiteSpace:     'nowrap',
        flexShrink:     0,
        WebkitTapHighlightColor: 'transparent',
        touchAction:    'manipulation',
      }}
    >
      {group.name}
      {memberCount !== undefined && (
        <span style={{ opacity: .8, fontSize: '13px' }}>({memberCount}명)</span>
      )}
    </button>
  )
}

function ActionBtn({ children, onClick, variant = 'default', disabled = false }) {
  const bg = {
    primary:   '#1A1A2E',
    danger:    '#FEF2F2',
    secondary: '#F1F5F9',
    ghost:     'transparent',
  }[variant] || '#F1F5F9'

  const fg = {
    primary:   '#fff',
    danger:    '#EF4444',
    secondary: '#0F172A',
    ghost:     '#64748B',
  }[variant] || '#0F172A'

  const border = {
    danger: '1px solid #FECACA',
    ghost:  '1px solid #E2E8F0',
  }[variant] || 'none'

  return (
    <button
      onPointerUp={onClick}
      disabled={disabled}
      style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            '10px',
        width:          '100%',
        minHeight:      '56px',
        padding:        '14px 20px',
        borderRadius:   '14px',
        border,
        backgroundColor: disabled ? '#F1F5F9' : bg,
        color:          disabled ? '#94A3B8' : fg,
        fontWeight:     700,
        fontFamily:     'var(--font)',
        fontSize:       '16px',
        cursor:         disabled ? 'not-allowed' : 'pointer',
        WebkitTapHighlightColor: 'transparent',
        touchAction:    'manipulation',
        transition:     'background-color .1s',
      }}
    >
      {children}
    </button>
  )
}

function ScheduleRow({ event, user, onClick }) {
  const color = user?.color || event.color || '#4F8EF7'
  return (
    <div
      onPointerUp={onClick}
      style={{
        display:     'flex',
        alignItems:  'center',
        gap:         '12px',
        padding:     '14px 16px',
        borderRadius: '12px',
        background:  '#F8FAFC',
        border:      '1px solid #E2E8F0',
        cursor:      'pointer',
        minHeight:   '56px',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
      }}
    >
      <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: '16px' }}>{event.assignee}</div>
        {event.start_time && (
          <div style={{ fontSize: '13px', color: '#64748B' }}>
            {event.start_time.slice(0, 5)}{event.end_time ? `~${event.end_time.slice(0, 5)}` : ''}
          </div>
        )}
      </div>
      <div style={{ color: '#CBD5E1', fontSize: '22px' }}>›</div>
    </div>
  )
}

export default function MobileDateModal({
  isOpen, onClose,
  selectedDate, events, users, groups,
  getHolidayName, sortBy,
  onEventClick, onAddEvent,
  onQuickAssign, onQuickAssignGroup,
  onDeleteDay, onHolidayManager,
}) {
  const [view, setView]               = useState(VIEW.MAIN)
  const [changingEvent, setChangingEvent] = useState(null)
  const [addTab, setAddTab]           = useState('individual')
  const sheetRef                      = useRef(null)

  // view 리셋
  useEffect(() => {
    if (isOpen) {
      setView(VIEW.MAIN)
      setAddTab('individual')
      setChangingEvent(null)
      // 시트 맨 위로
      if (sheetRef.current) sheetRef.current.scrollTop = 0
    }
  }, [isOpen, selectedDate])

  // body scroll lock은 하지 않음 — 스크롤 버그 원인이므로 제거

  if (!selectedDate) return null

  const dateStr   = format(selectedDate, 'yyyy-MM-dd')
  const holiday   = getHolidayName(dateStr)
  const dayEvents = sortSchedulesByUserName(
    events.filter(e => e.date === dateStr), users, sortBy
  )

  const handleAssign = async (user) => {
    await onQuickAssign(dateStr, user)
  }

  const handleGroupAssign = async (group) => {
    const members = users.filter(u => u.group_id === group.id)
    await onQuickAssignGroup(dateStr, group, members)
  }

  const handleChangeToUser = async (newUser) => {
    if (!changingEvent) return
    await onEventClick({ ...changingEvent, _changeToUser: newUser })
    setView(VIEW.MAIN)
    setChangingEvent(null)
  }

  return (
    <>
      {/* 오버레이 — isOpen일 때만 렌더 */}
      {isOpen && (
        <div
          style={{
            position:   'fixed',
            inset:      0,
            background: 'rgba(0,0,0,.5)',
            zIndex:     300,
          }}
          onPointerUp={onClose}   // 배경 탭으로 닫기
        />
      )}

      {/* 시트 본체 — 항상 렌더, transform으로 보이기/숨기기 */}
      <div
        ref={sheetRef}
        style={{
          position:    'fixed',
          bottom:      0,
          left:        0,
          right:       0,
          background:  '#fff',
          borderRadius: '20px 20px 0 0',
          boxShadow:   '0 -4px 32px rgba(0,0,0,.18)',
          zIndex:      301,
          maxHeight:   '90dvh',
          overflowY:   'auto',
          WebkitOverflowScrolling: 'touch',
          transform:   isOpen ? 'translateY(0)' : 'translateY(100%)',
          transition:  'transform .28s cubic-bezier(.32,.72,0,1)',
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
        }}
        // 시트 내부 터치가 배경 오버레이에 닿지 않도록
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* 핸들 */}
        <div style={{ width: 40, height: 4, background: '#E2E8F0', borderRadius: 2, margin: '12px auto 0' }} />

        {/* 헤더 */}
        <div style={{
          display:       'flex',
          alignItems:    'center',
          justifyContent: 'space-between',
          padding:       '12px 16px 10px',
          borderBottom:  '1px solid #E2E8F0',
          gap:           8,
        }}>
          {view !== VIEW.MAIN ? (
            <button
              onPointerUp={() => setView(VIEW.MAIN)}
              style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
            >
              <ChevronLeft size={20} color="#64748B" />
            </button>
          ) : <div style={{ width: 36 }} />}

          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {format(selectedDate, 'M월 d일 (EEE)', { locale: ko })}
            </div>
            {holiday && (
              <div style={{ fontSize: 13, color: '#EF4444', marginTop: 2 }}>🎌 {holiday}</div>
            )}
          </div>

          <button
            onPointerUp={onClose}
            style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <X size={20} color="#64748B" />
          </button>
        </div>

        {/* 현재 근무자 요약 */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>
            현재 근무자 ({dayEvents.length}명)
          </div>
          {dayEvents.length === 0 ? (
            <div style={{ fontSize: 14, color: '#94A3B8' }}>등록된 근무자 없음</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {dayEvents.map(ev => {
                const user = users.find(u => u.id === ev.user_id)
                const color = user?.color || ev.color || '#4F8EF7'
                return (
                  <span key={ev.id} style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 14px', borderRadius: 999, backgroundColor: color, color: '#fff', fontWeight: 700, fontSize: 14, minHeight: 36 }}>
                    {ev.assignee}
                  </span>
                )
              })}
            </div>
          )}
        </div>

        {/* ── 메인 뷰 ─────────────────────────────── */}
        {view === VIEW.MAIN && (
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>
              무엇을 할까요?
            </div>
            <ActionBtn variant="primary" onClick={() => setView(VIEW.ADD)}>
              <Plus size={22} /> 근무자 추가
            </ActionBtn>
            {dayEvents.length > 0 && (
              <ActionBtn variant="secondary" onClick={() => setView(VIEW.CHANGE)}>
                ✏️ 근무자 변경
              </ActionBtn>
            )}
            {dayEvents.length > 0 && (
              <ActionBtn variant="secondary" onClick={() => { onClose(); /* swap은 일정 클릭으로 시작 */ }}>
                <ArrowLeftRight size={20} /> 근무 교체
              </ActionBtn>
            )}
            <ActionBtn variant="danger" disabled={dayEvents.length === 0} onClick={() => { onDeleteDay(); onClose() }}>
              <Trash2 size={20} /> 이 날 일정 삭제
            </ActionBtn>
            <ActionBtn variant="ghost" onClick={() => { onHolidayManager(); onClose() }}>
              <CalendarDays size={18} /> 공휴일 지정/수정
            </ActionBtn>

            {/* 일정 상세 */}
            {dayEvents.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>일정 상세</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {dayEvents.map(ev => {
                    const user = users.find(u => u.id === ev.user_id)
                    return (
                      <ScheduleRow key={ev.id} event={ev} user={user}
                        onClick={() => { onEventClick(ev); onClose() }} />
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 근무자 추가 뷰 ──────────────────────── */}
        {view === VIEW.ADD && (
          <div style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 12 }}>추가할 근무자 선택</div>

            {/* 개인/그룹 탭 */}
            {groups.length > 0 && (
              <div style={{ display: 'flex', border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden', marginBottom: 14 }}>
                {['individual','group'].map(tab => (
                  <button key={tab} onPointerUp={() => setAddTab(tab)}
                    style={{ flex: 1, padding: '12px 0', border: 'none', fontWeight: 700, fontSize: 15, fontFamily: 'var(--font)', cursor: 'pointer', minHeight: 48, background: addTab === tab ? '#E94560' : '#fff', color: addTab === tab ? '#fff' : '#64748B', transition: 'background .15s' }}>
                    {tab === 'individual' ? '개인' : '그룹'}
                  </button>
                ))}
              </div>
            )}

            {/* 개인 버튼 */}
            {(addTab === 'individual' || groups.length === 0) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {users.length === 0
                  ? <p style={{ fontSize: 14, color: '#94A3B8' }}>👥 먼저 사용자를 등록하세요</p>
                  : users.map(user => (
                    <UserPill key={user.id} user={user} onClick={() => handleAssign(user)} />
                  ))
                }
              </div>
            )}

            {/* 그룹 버튼 */}
            {addTab === 'group' && groups.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {groups.map(group => {
                  const cnt = users.filter(u => u.group_id === group.id).length
                  return (
                    <GroupPill key={group.id} group={group} memberCount={cnt}
                      onClick={() => handleGroupAssign(group)} />
                  )
                })}
              </div>
            )}

            {/* 갱신된 근무자 목록 */}
            {dayEvents.length > 0 && (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>현재 근무자</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {dayEvents.map(ev => {
                    const user = users.find(u => u.id === ev.user_id)
                    return <ScheduleRow key={ev.id} event={ev} user={user} onClick={() => { onEventClick(ev); onClose() }} />
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── 근무자 변경 1: 기존 선택 ────────────── */}
        {view === VIEW.CHANGE && (
          <div style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 12 }}>변경할 근무자 선택</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {dayEvents.map(ev => {
                const user = users.find(u => u.id === ev.user_id)
                return (
                  <ScheduleRow key={ev.id} event={ev} user={user}
                    onClick={() => { setChangingEvent(ev); setView(VIEW.CHANGE2) }} />
                )
              })}
            </div>
          </div>
        )}

        {/* ── 근무자 변경 2: 새 근무자 선택 ───────── */}
        {view === VIEW.CHANGE2 && (
          <div style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>
              <span style={{ color: '#E94560', fontWeight: 700 }}>{changingEvent?.assignee}</span>를 누구로 변경할까요?
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {users.map(user => (
                <UserPill key={user.id} user={user} onClick={() => handleChangeToUser(user)} />
              ))}
            </div>
          </div>
        )}

        {/* 하단 여백 (Safe Area) */}
        <div style={{ height: 'max(16px, env(safe-area-inset-bottom, 16px))' }} />
      </div>
    </>
  )
}
