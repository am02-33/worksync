/**
 * MobileDateModal
 *
 * 근무 교체 정확한 흐름:
 *  SWAP1: 이 날짜의 근무자 중 첫 번째 선택
 *  → onClose() + App에 swapMode=true, firstEvent 저장
 *  → 캘린더에서 두 번째 날짜 클릭
 *  → App이 모달을 다시 열면서 swapReadyForSecond=true 전달
 *  SWAP3: 두 번째 날짜 근무자 목록 표시
 *       → 이름표 클릭 → 확인창 → swapEvents 호출
 */
import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { X, Plus, ArrowLeftRight, Trash2, CalendarDays, ChevronLeft } from 'lucide-react'
import { sortSchedulesByUserName } from '../utils/sortUsers'

// ── 뷰 상태 ──────────────────────────────────────────────────
const VIEW = {
  MAIN:    'main',
  ADD:     'add',
  CHANGE1: 'change1',
  CHANGE2: 'change2',
  SWAP1:   'swap1',   // 첫 번째 근무자 선택
  SWAP3:   'swap3',   // 두 번째 근무자 선택 (두 번째 날짜 모달)
}

/* ── 공통 스타일 컴포넌트들 ─────────────────────────────────── */
function UserPill({ user, onClick, highlight = false }) {
  return (
    <button
      onPointerUp={(e) => { e.stopPropagation(); onClick() }}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        padding: '12px 22px', borderRadius: '999px',
        border: highlight ? '3px solid rgba(255,255,255,.9)' : 'none',
        backgroundColor: user.color || '#4F8EF7', color: '#fff',
        fontWeight: 700, fontFamily: 'var(--font)', fontSize: '15px',
        minHeight: '52px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
        boxShadow: highlight ? `0 0 0 4px ${user.color}44` : '0 2px 6px rgba(0,0,0,.12)',
        WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
      }}
    >
      {user.name}
    </button>
  )
}

function GroupPill({ group, memberCount, onClick }) {
  return (
    <button
      onPointerUp={(e) => { e.stopPropagation(); onClick() }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '12px 20px', borderRadius: '999px', border: 'none',
        backgroundColor: group.color || '#6366F1', color: '#fff',
        fontWeight: 700, fontFamily: 'var(--font)', fontSize: '15px',
        minHeight: '52px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
        WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
      }}
    >
      👥 {group.name}
      {memberCount !== undefined && <span style={{ opacity: .8, fontSize: '13px' }}>({memberCount}명)</span>}
    </button>
  )
}

function ActionBtn({ children, onClick, variant = 'secondary', disabled = false }) {
  const v = {
    primary:   { bg: '#1A1A2E', fg: '#fff',     bd: 'none' },
    secondary: { bg: '#F1F5F9', fg: '#0F172A',  bd: '1px solid #E2E8F0' },
    danger:    { bg: '#FEF2F2', fg: '#EF4444',  bd: '1px solid #FECACA' },
    ghost:     { bg: 'transparent', fg: '#64748B', bd: '1px solid #E2E8F0' },
    warning:   { bg: '#FFFBEB', fg: '#92400E',  bd: '1px solid #FDE68A' },
  }[variant] || { bg: '#F1F5F9', fg: '#0F172A', bd: '1px solid #E2E8F0' }
  return (
    <button
      onPointerUp={(e) => { e.stopPropagation(); if (!disabled) onClick() }}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
        width: '100%', minHeight: '56px', padding: '14px 20px', borderRadius: '14px',
        fontWeight: 700, fontFamily: 'var(--font)', fontSize: '16px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: disabled ? '#F1F5F9' : v.bg,
        color:      disabled ? '#94A3B8' : v.fg,
        border:     disabled ? '1px solid #E2E8F0' : v.bd,
        WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
      }}
    >
      {children}
    </button>
  )
}

function ScheduleRow({ event, user, onClick, highlight = false }) {
  const color = user?.color || event.color || '#4F8EF7'
  return (
    <div
      onPointerUp={(e) => { e.stopPropagation(); onClick() }}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '14px 16px', borderRadius: '12px', cursor: 'pointer',
        background: highlight ? `${color}18` : '#F8FAFC',
        border: highlight ? `2px solid ${color}` : '1px solid #E2E8F0',
        minHeight: '56px',
        WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
      }}
    >
      <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: '16px' }}>{event.assignee}</div>
        {(event.start_time || event.end_time) && (
          <div style={{ fontSize: '13px', color: '#64748B', marginTop: 2 }}>
            {event.start_time ? event.start_time.slice(0,5) : ''}
            {event.end_time ? `~${event.end_time.slice(0,5)}` : ''}
          </div>
        )}
      </div>
      {highlight && <div style={{ fontSize: '13px', color, fontWeight: 700 }}>선택 →</div>}
      {!highlight && <div style={{ color: '#CBD5E1', fontSize: '22px' }}>›</div>}
    </div>
  )
}

function SLabel({ children }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>
      {children}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════ */
export default function MobileDateModal({
  isOpen, onClose,
  selectedDate, events, users, groups,
  getHolidayName, sortBy,
  onEventClick, onAddEvent,
  onQuickAssign, onQuickAssignGroup,
  onDeleteDay, onHolidayManager,
  onSwapEvents,
  // 교체 2단계: App에서 firstEvent 보관 후 두 번째 날짜 모달을 열 때 주입
  swapReadyForSecond,   // boolean — true면 이 모달은 SWAP3으로 시작
  swapFirstEvent,       // 첫 번째 선택된 일정
  onSwapStart,          // (event) => void — App에 firstEvent 저장 요청
  onSwapReset,          // () => void — 교체 모드 전체 초기화
}) {
  const [view, setView]               = useState(VIEW.MAIN)
  const [addTab, setAddTab]           = useState('individual')
  const [changingEvent, setChangingEvent] = useState(null)
  const sheetRef                      = useRef(null)

  /* ── 모달 열릴 때 뷰 설정 ────────────────────────────────
     swapReadyForSecond가 true이면 SWAP3으로 시작
     그 외에는 항상 MAIN으로 시작                         */
  useEffect(() => {
    if (!isOpen) return
    if (swapReadyForSecond) {
      setView(VIEW.SWAP3)
    } else {
      setView(VIEW.MAIN)
      setAddTab('individual')
      setChangingEvent(null)
    }
    if (sheetRef.current) sheetRef.current.scrollTop = 0
  }, [isOpen, selectedDate, swapReadyForSecond])

  if (!selectedDate) return null

  const dateStr   = format(selectedDate, 'yyyy-MM-dd')
  const holiday   = getHolidayName(dateStr)
  const dayEvents = sortSchedulesByUserName(
    events.filter(e => e.date === dateStr), users, sortBy
  )

  /* ── 근무자 추가 ─────────────────────────────────────── */
  const handleAssign = (user) => onQuickAssign(dateStr, user)
  const handleGroupAssign = (group) => {
    const members = users.filter(u => u.group_id === group.id)
    onQuickAssignGroup(dateStr, group, members)
  }

  /* ── 담당자 변경 ─────────────────────────────────────── */
  const handleChangeToUser = async (newUser) => {
    if (!changingEvent) return
    await onEventClick({ ...changingEvent, _changeToUser: newUser })
    setView(VIEW.MAIN)
    setChangingEvent(null)
  }

  /* ── 근무 교체 1단계: 첫 번째 근무자 선택 ──────────────
     onSwapStart에 firstEvent를 넘기고 모달 닫음
     App이 swapMode=true로 바꾸고 캘린더에서 날짜 선택 대기  */
  const handleSelectFirstEvent = (event) => {
    onSwapStart(event)   // App에 저장
    onClose()             // 모달 닫기 → 캘린더로 돌아감
  }

  /* ── 근무 교체 3단계: 두 번째 근무자 선택 → 확인 → swap */
  const handleSelectSecondEvent = async (event) => {
    if (!swapFirstEvent) return

    const d1 = (() => { try { return format(new Date(swapFirstEvent.date), 'M월 d일', { locale: ko }) } catch { return swapFirstEvent.date } })()
    const d2 = (() => { try { return format(new Date(event.date),          'M월 d일', { locale: ko }) } catch { return event.date } })()

    if (!window.confirm(`${d1} ${swapFirstEvent.assignee}와\n${d2} ${event.assignee}의 근무를 교체할까요?`)) return

    await onSwapEvents(swapFirstEvent, event)
    onSwapReset()
    onClose()
  }

  const goBack = () => {
    if (view === VIEW.SWAP3) { onSwapReset(); return }
    setView(VIEW.MAIN)
    setChangingEvent(null)
  }

  const showBack = view !== VIEW.MAIN

  return (
    <>
      {/* 오버레이 */}
      {isOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 300 }}
          onPointerUp={onClose}
        />
      )}

      {/* 시트 */}
      <div
        ref={sheetRef}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: '#fff', borderRadius: '20px 20px 0 0',
          boxShadow: '0 -4px 32px rgba(0,0,0,.18)',
          zIndex: 301, maxHeight: '90dvh', overflowY: 'auto',
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
          {showBack
            ? <button onPointerUp={(e) => { e.stopPropagation(); goBack() }}
                style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, touchAction: 'manipulation' }}>
                <ChevronLeft size={20} color="#64748B" />
              </button>
            : <div style={{ width: 36 }} />
          }
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {format(selectedDate, 'M월 d일 (EEE)', { locale: ko })}
            </div>
            {holiday && <div style={{ fontSize: 13, color: '#EF4444', marginTop: 2 }}>🎌 {holiday}</div>}
          </div>
          <button onPointerUp={(e) => { e.stopPropagation(); onClose() }}
            style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, touchAction: 'manipulation' }}>
            <X size={20} color="#64748B" />
          </button>
        </div>

        {/* 현재 근무자 요약 */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
          <SLabel>현재 근무자 ({dayEvents.length}명)</SLabel>
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

        {/* ── 메인 뷰 ──────────────────────────────────── */}
        {view === VIEW.MAIN && (
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <SLabel>무엇을 할까요?</SLabel>
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
            <ActionBtn variant="danger" disabled={dayEvents.length === 0}
              onClick={() => { onDeleteDay(); onClose() }}>
              <Trash2 size={20} /> 이 날 일정 삭제
            </ActionBtn>
            <ActionBtn variant="ghost" onClick={() => { onHolidayManager(); onClose() }}>
              <CalendarDays size={18} /> 공휴일 지정/수정
            </ActionBtn>

            {dayEvents.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <SLabel>일정 상세</SLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {dayEvents.map(ev => {
                    const user = users.find(u => u.id === ev.user_id)
                    return <ScheduleRow key={ev.id} event={ev} user={user} onClick={() => { onEventClick(ev); onClose() }} />
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 근무자 추가 ──────────────────────────────── */}
        {view === VIEW.ADD && (
          <div style={{ padding: '14px 16px' }}>
            <SLabel>추가할 근무자 선택</SLabel>
            {groups.length > 0 && (
              <div style={{ display: 'flex', border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden', marginBottom: 14 }}>
                {['individual', 'group'].map(tab => (
                  <button key={tab} onPointerUp={(e) => { e.stopPropagation(); setAddTab(tab) }}
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
                <SLabel>현재 근무자</SLabel>
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

        {/* ── 담당자 변경 1 ────────────────────────────── */}
        {view === VIEW.CHANGE1 && (
          <div style={{ padding: '14px 16px' }}>
            <SLabel>변경할 근무자 선택</SLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {dayEvents.map(ev => {
                const user = users.find(u => u.id === ev.user_id)
                return <ScheduleRow key={ev.id} event={ev} user={user} onClick={() => { setChangingEvent(ev); setView(VIEW.CHANGE2) }} />
              })}
            </div>
          </div>
        )}

        {/* ── 담당자 변경 2 ────────────────────────────── */}
        {view === VIEW.CHANGE2 && (
          <div style={{ padding: '14px 16px' }}>
            <div style={{ padding: '10px 14px', background: '#FEF3C7', borderRadius: 10, marginBottom: 14, fontSize: 14, fontWeight: 600, color: '#92400E' }}>
              ✏️ <span style={{ color: '#E94560' }}>{changingEvent?.assignee}</span>를 누구로 변경할까요?
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {users.map(u => <UserPill key={u.id} user={u} onClick={() => handleChangeToUser(u)} />)}
            </div>
          </div>
        )}

        {/* ── 근무 교체 1단계: 첫 번째 근무자 선택 ──────
            이름표 클릭 → App에 firstEvent 저장 → 모달 닫음 */}
        {view === VIEW.SWAP1 && (
          <div style={{ padding: '14px 16px' }}>
            <div style={{ padding: '10px 14px', background: '#EEF2FF', borderRadius: 10, marginBottom: 14, fontSize: 14, color: '#3730A3', lineHeight: 1.6 }}>
              <strong>🔄 근무 교체 1단계</strong><br />
              교체할 근무자를 선택하세요.<br />
              선택 후 캘린더에서 두 번째 날짜를 탭하세요.
            </div>
            {dayEvents.length === 0
              ? <div style={{ fontSize: 14, color: '#94A3B8', textAlign: 'center', padding: 16 }}>이 날 등록된 근무자가 없습니다.</div>
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {dayEvents.map(ev => {
                    const user = users.find(u => u.id === ev.user_id)
                    return (
                      <ScheduleRow key={ev.id} event={ev} user={user} highlight
                        onClick={() => handleSelectFirstEvent(ev)} />
                    )
                  })}
                </div>
              )
            }
          </div>
        )}

        {/* ── 근무 교체 3단계: 두 번째 근무자 선택 ──────
            이름표 자체를 클릭하면 바로 교체 확인창    */}
        {view === VIEW.SWAP3 && (
          <div style={{ padding: '14px 16px' }}>
            {/* 첫 번째 선택 정보 표시 */}
            <div style={{ padding: '10px 14px', background: '#EEF2FF', borderRadius: 10, marginBottom: 14, fontSize: 14, color: '#3730A3', lineHeight: 1.6 }}>
              <strong>🔄 근무 교체 2단계</strong><br />
              <span style={{ color: '#E94560', fontWeight: 700 }}>{swapFirstEvent?.assignee}</span>
              {' '}
              ({swapFirstEvent ? (() => { try { return format(new Date(swapFirstEvent.date), 'M월 d일', { locale: ko }) } catch { return swapFirstEvent.date } })() : ''})
              와 교체할 근무자를 선택하세요.
            </div>

            <SLabel>이 날짜의 근무자 — 클릭하면 즉시 교체</SLabel>

            {dayEvents.length === 0
              ? (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{ fontSize: 14, color: '#94A3B8', marginBottom: 12 }}>이 날 등록된 근무자가 없습니다.</div>
                  <ActionBtn variant="ghost" onClick={() => { onSwapReset(); setView(VIEW.MAIN) }}>취소</ActionBtn>
                </div>
              )
              : (
                <>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                    {dayEvents.map(ev => {
                      const user = users.find(u => u.id === ev.user_id)
                      return (
                        <UserPill key={ev.id} user={user || { name: ev.assignee, color: ev.color || '#4F8EF7' }}
                          highlight onClick={() => handleSelectSecondEvent(ev)} />
                      )
                    })}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {dayEvents.map(ev => {
                      const user = users.find(u => u.id === ev.user_id)
                      return (
                        <ScheduleRow key={ev.id} event={ev} user={user} highlight
                          onClick={() => handleSelectSecondEvent(ev)} />
                      )
                    })}
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <ActionBtn variant="ghost" onClick={() => { onSwapReset(); onClose() }}>교체 취소</ActionBtn>
                  </div>
                </>
              )
            }
          </div>
        )}

        <div style={{ height: 'max(16px, env(safe-area-inset-bottom, 16px))' }} />
      </div>
    </>
  )
}
