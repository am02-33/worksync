import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { X, Plus, ArrowLeftRight, Trash2, CalendarDays, ChevronLeft } from 'lucide-react'
import { sortSchedulesByUserName } from '../utils/sortUsers'

// ─── 뷰 상태 ────────────────────────────────────────────────
const VIEW = {
  MAIN:         'main',       // 메인 액션 선택
  ADD:          'add',        // 근무자 추가
  CHANGE1:      'change1',    // 담당자 변경 - 기존 선택
  CHANGE2:      'change2',    // 담당자 변경 - 새 선택
  SWAP1:        'swap1',      // 근무 교체 - 첫 번째 근무자 선택
  SWAP2:        'swap2',      // 근무 교체 - 두 번째 날짜 선택 안내
  SWAP3:        'swap3',      // 근무 교체 - 두 번째 근무자 선택
}

// ─── 이름표 칩 ───────────────────────────────────────────────
function UserPill({ user, onClick, selected = false, disabled = false }) {
  return (
    <button
      onPointerUp={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        padding: '12px 20px', borderRadius: '999px', border: selected ? '3px solid rgba(255,255,255,.9)' : 'none',
        backgroundColor: disabled ? '#E2E8F0' : (user.color || '#4F8EF7'),
        color: disabled ? '#94A3B8' : '#fff',
        fontWeight: 700, fontFamily: 'var(--font)', fontSize: '15px',
        minHeight: '48px', cursor: disabled ? 'not-allowed' : 'pointer',
        whiteSpace: 'nowrap', flexShrink: 0,
        boxShadow: selected ? `0 0 0 4px ${user.color || '#4F8EF7'}44` : 'none',
        WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
      }}
    >
      {user.name}
    </button>
  )
}

// ─── 그룹 칩 ─────────────────────────────────────────────────
function GroupPill({ group, memberCount, onClick }) {
  return (
    <button
      onPointerUp={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '12px 20px', borderRadius: '999px', border: 'none',
        backgroundColor: group.color || '#6366F1', color: '#fff',
        fontWeight: 700, fontFamily: 'var(--font)', fontSize: '15px',
        minHeight: '48px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
        WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
      }}
    >
      👥 {group.name}
      {memberCount !== undefined && <span style={{ opacity: .8, fontSize: '13px' }}>({memberCount}명)</span>}
    </button>
  )
}

// ─── 액션 버튼 ───────────────────────────────────────────────
function ActionBtn({ children, onClick, variant = 'secondary', disabled = false }) {
  const styles = {
    primary:   { background: '#1A1A2E', color: '#fff', border: 'none' },
    secondary: { background: '#F1F5F9', color: '#0F172A', border: '1px solid #E2E8F0' },
    danger:    { background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA' },
    ghost:     { background: 'transparent', color: '#64748B', border: '1px solid #E2E8F0' },
    warning:   { background: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A' },
  }
  const s = styles[variant] || styles.secondary
  return (
    <button
      onPointerUp={onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
        width: '100%', minHeight: '56px', padding: '14px 20px', borderRadius: '14px',
        fontWeight: 700, fontFamily: 'var(--font)', fontSize: '16px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...s,
        ...(disabled ? { background: '#F1F5F9', color: '#94A3B8', border: '1px solid #E2E8F0' } : {}),
        WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
      }}
    >
      {children}
    </button>
  )
}

// ─── 일정 행 ─────────────────────────────────────────────────
function ScheduleRow({ event, user, onClick, highlight = false }) {
  const color = user?.color || event.color || '#4F8EF7'
  return (
    <div
      onPointerUp={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '14px 16px', borderRadius: '12px',
        background: highlight ? `${color}18` : '#F8FAFC',
        border: highlight ? `2px solid ${color}` : '1px solid #E2E8F0',
        cursor: 'pointer', minHeight: '56px',
        WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
      }}
    >
      <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: '16px' }}>{event.assignee}</div>
        {(event.start_time || event.end_time) && (
          <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
            {event.start_time ? event.start_time.slice(0, 5) : ''}
            {event.end_time ? `~${event.end_time.slice(0, 5)}` : ''}
          </div>
        )}
      </div>
      <div style={{ color: '#CBD5E1', fontSize: '22px' }}>›</div>
    </div>
  )
}

// ─── 섹션 레이블 ─────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>
      {children}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
export default function MobileDateModal({
  isOpen, onClose,
  selectedDate, events, users, groups,
  getHolidayName, sortBy,
  onEventClick, onAddEvent,
  onQuickAssign, onQuickAssignGroup,
  onDeleteDay, onHolidayManager,
  // 진짜 교체 함수 (두 이벤트의 날짜를 swap)
  onSwapEvents,
  // 두 번째 날짜 선택 모드 외부 신호
  swapMode, onSwapModeChange,
}) {
  const [view, setView]                   = useState(VIEW.MAIN)
  const [addTab, setAddTab]               = useState('individual')
  // 담당자 변경
  const [changingEvent, setChangingEvent] = useState(null)
  // 근무 교체
  const [swapStep, setSwapStep]           = useState(1)
  const [firstEvent, setFirstEvent]       = useState(null)   // 첫 번째 선택 일정
  const [secondDate, setSecondDate]       = useState(null)   // 두 번째 날짜 (외부에서 주입)
  const sheetRef                          = useRef(null)

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      // 교체 2단계(두 번째 날짜 선택 후 돌아온 경우)가 아니면 뷰 리셋
      if (!(view === VIEW.SWAP3 && secondDate)) {
        setView(VIEW.MAIN)
        setAddTab('individual')
        setChangingEvent(null)
      }
      if (sheetRef.current) sheetRef.current.scrollTop = 0
    }
  }, [isOpen, selectedDate])

  // 두 번째 날짜가 외부에서 세팅되면 SWAP3으로 이동
  useEffect(() => {
    if (secondDate && firstEvent && isOpen) {
      setView(VIEW.SWAP3)
    }
  }, [secondDate])

  if (!selectedDate) return null

  const dateStr   = format(selectedDate, 'yyyy-MM-dd')
  const holiday   = getHolidayName(dateStr)
  const dayEvents = sortSchedulesByUserName(
    events.filter(e => e.date === dateStr), users, sortBy
  )

  // 두 번째 날짜의 일정
  const secondDateStr    = secondDate ? format(secondDate, 'yyyy-MM-dd') : null
  const secondDayEvents  = secondDateStr
    ? sortSchedulesByUserName(events.filter(e => e.date === secondDateStr), users, sortBy)
    : []

  // ── 근무자 추가 ──────────────────────────────────────────
  const handleAssign = async (user) => {
    await onQuickAssign(dateStr, user)
  }
  const handleGroupAssign = async (group) => {
    const members = users.filter(u => u.group_id === group.id)
    await onQuickAssignGroup(dateStr, group, members)
  }

  // ── 담당자 변경 ──────────────────────────────────────────
  const handleChangeToUser = async (newUser) => {
    if (!changingEvent) return
    // 같은 날짜, 같은 일정의 담당자만 변경
    await onEventClick({ ...changingEvent, _changeToUser: newUser })
    setView(VIEW.MAIN)
    setChangingEvent(null)
  }

  // ── 근무 교체 1단계: 첫 번째 근무자 선택 ────────────────
  const handleSelectFirstEvent = (event) => {
    setFirstEvent(event)
    setSwapStep(2)
    setView(VIEW.SWAP2)
    // 외부에 "두 번째 날짜를 선택하세요" 모드 알림
    onSwapModeChange(true, event)
    onClose() // 모달 닫고 캘린더에서 날짜 선택하게 함
  }

  // ── 근무 교체 3단계: 두 번째 근무자 선택 + 최종 확인 ────
  const handleSelectSecondEvent = async (event) => {
    if (!firstEvent) return
    const d1 = format(new Date(firstEvent.date), 'M월 d일', { locale: ko })
    const d2 = format(new Date(event.date),       'M월 d일', { locale: ko })
    if (!window.confirm(
      `${d1} ${firstEvent.assignee}와\n${d2} ${event.assignee}의 근무를 교체할까요?`
    )) return

    // 실제 교체: 두 이벤트의 날짜를 서로 바꿈
    await onSwapEvents(firstEvent, event)

    // 상태 초기화
    resetSwap()
    onClose()
  }

  const resetSwap = () => {
    setFirstEvent(null)
    setSecondDate(null)
    setSwapStep(1)
    setView(VIEW.MAIN)
    onSwapModeChange(false, null)
  }

  const goBack = () => {
    if (view === VIEW.SWAP3) { resetSwap(); return }
    setView(VIEW.MAIN)
    setChangingEvent(null)
  }

  const showBack = view !== VIEW.MAIN

  return (
    <>
      {isOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 300 }}
          onPointerUp={onClose}
        />
      )}

      <div
        ref={sheetRef}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: '#fff', borderRadius: '20px 20px 0 0',
          boxShadow: '0 -4px 32px rgba(0,0,0,.18)',
          zIndex: 301,
          maxHeight: '90dvh', overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform .28s cubic-bezier(.32,.72,0,1)',
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* 핸들 */}
        <div style={{ width: 40, height: 4, background: '#E2E8F0', borderRadius: 2, margin: '12px auto 0' }} />

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px 10px', borderBottom: '1px solid #E2E8F0', gap: 8 }}>
          {showBack ? (
            <button onPointerUp={goBack}
              style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, touchAction: 'manipulation' }}>
              <ChevronLeft size={20} color="#64748B" />
            </button>
          ) : <div style={{ width: 36 }} />}

          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {format(selectedDate, 'M월 d일 (EEE)', { locale: ko })}
            </div>
            {holiday && <div style={{ fontSize: 13, color: '#EF4444', marginTop: 2 }}>🎌 {holiday}</div>}
          </div>

          <button onPointerUp={onClose}
            style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, touchAction: 'manipulation' }}>
            <X size={20} color="#64748B" />
          </button>
        </div>

        {/* 근무자 요약 */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
          <SectionLabel>현재 근무자 ({dayEvents.length}명)</SectionLabel>
          {dayEvents.length === 0
            ? <div style={{ fontSize: 14, color: '#94A3B8' }}>등록된 근무자 없음</div>
            : (
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
            )
          }
        </div>

        {/* ── 메인 뷰 ────────────────────────────────────── */}
        {view === VIEW.MAIN && (
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <SectionLabel>무엇을 할까요?</SectionLabel>
            <ActionBtn variant="primary" onClick={() => setView(VIEW.ADD)}>
              <Plus size={22} /> 근무자 추가
            </ActionBtn>
            {dayEvents.length > 0 && (
              <ActionBtn variant="secondary" onClick={() => setView(VIEW.CHANGE1)}>
                ✏️ 담당자 변경
              </ActionBtn>
            )}
            {dayEvents.length > 0 && (
              <ActionBtn variant="warning" onClick={() => setView(VIEW.SWAP1)}>
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
              <div style={{ marginTop: 12 }}>
                <SectionLabel>일정 상세</SectionLabel>
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

        {/* ── 근무자 추가 ────────────────────────────────── */}
        {view === VIEW.ADD && (
          <div style={{ padding: '14px 16px' }}>
            <SectionLabel>추가할 근무자 선택</SectionLabel>

            {groups.length > 0 && (
              <div style={{ display: 'flex', border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden', marginBottom: 14 }}>
                {['individual', 'group'].map(tab => (
                  <button key={tab} onPointerUp={() => setAddTab(tab)}
                    style={{ flex: 1, padding: '12px 0', border: 'none', fontWeight: 700, fontSize: 15, fontFamily: 'var(--font)', cursor: 'pointer', minHeight: 48, background: addTab === tab ? '#E94560' : '#fff', color: addTab === tab ? '#fff' : '#64748B', touchAction: 'manipulation' }}>
                    {tab === 'individual' ? '개인' : '그룹'}
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {(addTab === 'individual' || groups.length === 0)
                ? users.length === 0
                  ? <p style={{ fontSize: 14, color: '#94A3B8' }}>👥 먼저 사용자를 등록하세요</p>
                  : users.map(u => <UserPill key={u.id} user={u} onClick={() => handleAssign(u)} />)
                : groups.map(g => {
                    const cnt = users.filter(u => u.group_id === g.id).length
                    return <GroupPill key={g.id} group={g} memberCount={cnt} onClick={() => handleGroupAssign(g)} />
                  })
              }
            </div>

            {dayEvents.length > 0 && (
              <>
                <SectionLabel>현재 근무자</SectionLabel>
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

        {/* ── 담당자 변경 1: 변경할 근무자 선택 ────────── */}
        {view === VIEW.CHANGE1 && (
          <div style={{ padding: '14px 16px' }}>
            <SectionLabel>변경할 근무자를 선택하세요</SectionLabel>
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

        {/* ── 담당자 변경 2: 새 근무자 선택 ────────────── */}
        {view === VIEW.CHANGE2 && (
          <div style={{ padding: '14px 16px' }}>
            <div style={{ padding: '10px 14px', background: '#FEF3C7', borderRadius: 10, marginBottom: 14, fontSize: 14, fontWeight: 600, color: '#92400E' }}>
              ✏️ <span style={{ color: '#E94560' }}>{changingEvent?.assignee}</span>를 누구로 변경할까요?
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {users.map(u => (
                <UserPill key={u.id} user={u} onClick={() => handleChangeToUser(u)} />
              ))}
            </div>
          </div>
        )}

        {/* ── 근무 교체 1: 첫 번째 근무자 선택 ──────────
            이 날짜의 근무자 중 교체할 사람 선택 */}
        {view === VIEW.SWAP1 && (
          <div style={{ padding: '14px 16px' }}>
            <div style={{ padding: '10px 14px', background: '#EEF2FF', borderRadius: 10, marginBottom: 14, fontSize: 14, color: '#3730A3' }}>
              <strong>근무 교체 1단계</strong><br />
              {format(selectedDate, 'M월 d일', { locale: ko })}에서 교체할 근무자를 선택하세요.
            </div>
            {dayEvents.length === 0
              ? <div style={{ fontSize: 14, color: '#94A3B8', textAlign: 'center', padding: 16 }}>이 날 등록된 근무자가 없습니다.</div>
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {dayEvents.map(ev => {
                    const user = users.find(u => u.id === ev.user_id)
                    return (
                      <ScheduleRow key={ev.id} event={ev} user={user}
                        onClick={() => handleSelectFirstEvent(ev)} />
                    )
                  })}
                </div>
              )
            }
          </div>
        )}

        {/* ── 근무 교체 3: 두 번째 근무자 선택 ──────────
            secondDate가 세팅된 후 표시 */}
        {view === VIEW.SWAP3 && secondDate && (
          <div style={{ padding: '14px 16px' }}>
            {/* 첫 번째 선택 정보 */}
            <div style={{ padding: '10px 14px', background: '#EEF2FF', borderRadius: 10, marginBottom: 14, fontSize: 14, color: '#3730A3' }}>
              <strong>근무 교체 2단계</strong><br />
              <span style={{ color: '#E94560' }}>{firstEvent?.assignee}</span> ({format(new Date(firstEvent?.date), 'M월 d일', { locale: ko })})와 교체할 근무자를 선택하세요.
            </div>

            <SectionLabel>{format(secondDate, 'M월 d일 (EEE)', { locale: ko })} 근무자</SectionLabel>

            {secondDayEvents.length === 0
              ? <div style={{ fontSize: 14, color: '#94A3B8', textAlign: 'center', padding: 16 }}>이 날 등록된 근무자가 없습니다.</div>
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {secondDayEvents.map(ev => {
                    const user = users.find(u => u.id === ev.user_id)
                    return (
                      <ScheduleRow key={ev.id} event={ev} user={user}
                        highlight onClick={() => handleSelectSecondEvent(ev)} />
                    )
                  })}
                </div>
              )
            }

            <div style={{ marginTop: 14 }}>
              <ActionBtn variant="ghost" onClick={resetSwap}>취소</ActionBtn>
            </div>
          </div>
        )}

        <div style={{ height: 'max(16px, env(safe-area-inset-bottom, 16px))' }} />
      </div>
    </>
  )
}
