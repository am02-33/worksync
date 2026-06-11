import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { X, Plus, ArrowLeftRight, Trash2, CalendarDays, ChevronLeft, Save, Users } from 'lucide-react'
import { sortSchedulesByUserName } from '../utils/sortUsers'

const VIEW = {
  MAIN:       'main',
  QUICK_ADD:  'quick_add',   // 빠른 근무자 추가 (즉시 등록)
  FORM_ADD:   'form_add',    // 정식 일정 추가 폼 (다중+시간+메모)
  CHANGE1:    'change1',
  CHANGE2:    'change2',
  SWAP1:      'swap1',
  SWAP3:      'swap3',
}

/* ── 공통 버튼/칩 ──────────────────────────────────────────── */
function Pill({ user, selected, onClick }) {
  return (
    <button onPointerUp={(e) => { e.stopPropagation(); onClick() }}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        padding: '10px 18px', borderRadius: '999px',
        border: selected ? '3px solid rgba(255,255,255,.9)' : 'none',
        backgroundColor: user.color || '#4F8EF7', color: '#fff',
        fontWeight: 700, fontFamily: 'var(--font)', fontSize: '15px',
        minHeight: '48px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
        boxShadow: selected ? `0 0 0 4px ${user.color}44` : '0 1px 4px rgba(0,0,0,.12)',
        WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
      }}>
      {user.name}
    </button>
  )
}

function GPill({ group, memberCount, selected, onClick }) {
  return (
    <button onPointerUp={(e) => { e.stopPropagation(); onClick() }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '10px 18px', borderRadius: '999px',
        border: selected ? '3px solid rgba(255,255,255,.9)' : 'none',
        backgroundColor: group.color || '#6366F1', color: '#fff',
        fontWeight: 700, fontFamily: 'var(--font)', fontSize: '15px',
        minHeight: '48px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
        WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
      }}>
      👥 {group.name} ({memberCount}명)
    </button>
  )
}

function ABtn({ children, onClick, variant = 'secondary', disabled = false }) {
  const bg = { primary:'#1A1A2E', secondary:'#F1F5F9', danger:'#FEF2F2', ghost:'transparent', warning:'#FFFBEB' }[variant] || '#F1F5F9'
  const fg = { primary:'#fff', secondary:'#0F172A', danger:'#EF4444', ghost:'#64748B', warning:'#92400E' }[variant] || '#0F172A'
  const bd = { danger:'1px solid #FECACA', ghost:'1px solid #E2E8F0', warning:'1px solid #FDE68A' }[variant] || 'none'
  return (
    <button onPointerUp={(e) => { e.stopPropagation(); if (!disabled) onClick() }} disabled={disabled}
      style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', width:'100%', minHeight:'56px', padding:'14px 20px', borderRadius:'14px', fontWeight:700, fontFamily:'var(--font)', fontSize:'16px', cursor: disabled?'not-allowed':'pointer', background: disabled?'#F1F5F9':bg, color: disabled?'#94A3B8':fg, border: disabled?'1px solid #E2E8F0':bd, WebkitTapHighlightColor:'transparent', touchAction:'manipulation' }}>
      {children}
    </button>
  )
}

function SRow({ event, user, onClick, highlight }) {
  const color = user?.color || event.color || '#4F8EF7'
  return (
    <div onPointerUp={(e) => { e.stopPropagation(); onClick() }}
      style={{ display:'flex', alignItems:'center', gap:'12px', padding:'14px 16px', borderRadius:'12px', cursor:'pointer', background: highlight?`${color}18`:'#F8FAFC', border: highlight?`2px solid ${color}`:'1px solid #E2E8F0', minHeight:'56px', WebkitTapHighlightColor:'transparent', touchAction:'manipulation' }}>
      <div style={{ width:12, height:12, borderRadius:'50%', backgroundColor:color, flexShrink:0 }} />
      <div style={{ flex:1 }}>
        <div style={{ fontWeight:700, fontSize:'16px' }}>{event.assignee}</div>
        {(event.start_time||event.end_time) && (
          <div style={{ fontSize:'13px', color:'#64748B', marginTop:2 }}>
            {event.start_time?event.start_time.slice(0,5):''}{event.end_time?`~${event.end_time.slice(0,5)}`:''}
          </div>
        )}
      </div>
      {highlight ? <div style={{ fontSize:'13px', color, fontWeight:700 }}>선택 →</div> : <div style={{ color:'#CBD5E1', fontSize:'22px' }}>›</div>}
    </div>
  )
}

function SLabel({ children }) {
  return <div style={{ fontSize:12, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:10 }}>{children}</div>
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
  swapReadyForSecond, swapFirstEvent, onSwapStart, onSwapReset,
  // 다중 저장 함수
  onSaveMultiple,
}) {
  const [view, setView]               = useState(VIEW.MAIN)
  const [addTab, setAddTab]           = useState('individual')
  const [changingEvent, setChangingEvent] = useState(null)

  // 정식 일정 추가 폼 상태
  const [formUsers, setFormUsers]     = useState([])   // 선택된 사용자들
  const [formTime, setFormTime]       = useState({ start_time: '', end_time: '', memo: '' })
  const [formSaving, setFormSaving]   = useState(false)
  const [formError, setFormError]     = useState('')
  const [formAddTab, setFormAddTab]   = useState('individual')

  const sheetRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    if (swapReadyForSecond) { setView(VIEW.SWAP3); return }
    setView(VIEW.MAIN)
    setAddTab('individual')
    setChangingEvent(null)
    setFormUsers([])
    setFormTime({ start_time:'', end_time:'', memo:'' })
    setFormError('')
    if (sheetRef.current) sheetRef.current.scrollTop = 0
  }, [isOpen, selectedDate, swapReadyForSecond])

  if (!selectedDate) return null

  const ds       = format(selectedDate, 'yyyy-MM-dd')
  const holiday  = getHolidayName(ds)
  const dayEvs   = sortSchedulesByUserName(events.filter(e => e.date === ds), users, sortBy)

  /* ── 빠른 추가 (즉시 등록) ─────────────────────────────── */
  const handleQuickAssign  = (user)          => onQuickAssign(ds, user)
  const handleGroupAssign  = (group)         => { const members = users.filter(u => u.group_id === group.id); onQuickAssignGroup(ds, group, members) }

  /* ── 정식 일정 추가: 사용자 토글 ──────────────────────── */
  const toggleFormUser = (user) => {
    setFormUsers(prev => prev.find(u => u.id === user.id) ? prev.filter(u => u.id !== user.id) : [...prev, user])
  }
  const toggleFormGroup = (group) => {
    const members = users.filter(u => u.group_id === group.id)
    const allSel  = members.every(m => formUsers.find(u => u.id === m.id))
    if (allSel) setFormUsers(prev => prev.filter(u => !members.find(m => m.id === u.id)))
    else        setFormUsers(prev => { const news = members.filter(m => !prev.find(u => u.id === m.id)); return [...prev, ...news] })
  }
  const isGroupSel = (group) => {
    const members = users.filter(u => u.group_id === group.id)
    return members.length > 0 && members.every(m => formUsers.find(u => u.id === m.id))
  }

  /* ── 정식 일정 저장 ────────────────────────────────────── */
  const handleFormSave = async () => {
    if (formUsers.length === 0) { setFormError('담당자를 1명 이상 선택하세요.'); return }
    setFormSaving(true)
    setFormError('')
    const result = await onSaveMultiple(
      { date: ds, start_time: formTime.start_time || null, end_time: formTime.end_time || null, memo: formTime.memo || null, category: '근무' },
      formUsers
    )
    setFormSaving(false)
    if (result?.success === false) setFormError(result.error || '저장 실패')
    else { setView(VIEW.MAIN); setFormUsers([]); setFormTime({ start_time:'', end_time:'', memo:'' }) }
  }

  /* ── 담당자 변경 ───────────────────────────────────────── */
  const handleChangeToUser = async (newUser) => {
    if (!changingEvent) return
    await onEventClick({ ...changingEvent, _changeToUser: newUser })
    setView(VIEW.MAIN); setChangingEvent(null)
  }

  /* ── 근무 교체 ─────────────────────────────────────────── */
  const handleSelectFirst  = (ev)   => { onSwapStart(ev); onClose() }
  const handleSelectSecond = async (ev) => {
    if (!swapFirstEvent) return
    const d1 = (() => { try { return format(new Date(swapFirstEvent.date),'M월 d일',{locale:ko}) } catch { return swapFirstEvent.date } })()
    const d2 = (() => { try { return format(new Date(ev.date),'M월 d일',{locale:ko}) } catch { return ev.date } })()
    if (!window.confirm(`${d1} ${swapFirstEvent.assignee}와\n${d2} ${ev.assignee}의 근무를 교체할까요?`)) return
    await onSwapEvents(swapFirstEvent, ev)
    onSwapReset(); onClose()
  }

  const goBack = () => {
    if (view === VIEW.SWAP3) { onSwapReset(); return }
    if (view === VIEW.FORM_ADD) { setFormUsers([]); setFormError('') }
    setView(VIEW.MAIN); setChangingEvent(null)
  }

  return (
    <>
      {isOpen && <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:300 }} onPointerUp={onClose} />}

      <div ref={sheetRef}
        style={{ position:'fixed', bottom:0, left:0, right:0, background:'#fff', borderRadius:'20px 20px 0 0', boxShadow:'0 -4px 32px rgba(0,0,0,.18)', zIndex:301, maxHeight:'90dvh', overflowY:'auto', WebkitOverflowScrolling:'touch', transform: isOpen?'translateY(0)':'translateY(100%)', transition:'transform .28s cubic-bezier(.32,.72,0,1)', paddingBottom:'env(safe-area-inset-bottom, 16px)' }}
        onPointerDown={e => e.stopPropagation()}>

        {/* 핸들 */}
        <div style={{ width:40, height:4, background:'#E2E8F0', borderRadius:2, margin:'12px auto 0' }} />

        {/* 헤더 */}
        <div style={{ display:'flex', alignItems:'center', padding:'12px 16px 10px', borderBottom:'1px solid #E2E8F0', gap:8 }}>
          {view !== VIEW.MAIN
            ? <button onPointerUp={e => { e.stopPropagation(); goBack() }} style={{ width:36, height:36, borderRadius:'50%', border:'1px solid #E2E8F0', background:'#F8FAFC', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, touchAction:'manipulation' }}><ChevronLeft size={20} color="#64748B" /></button>
            : <div style={{ width:36 }} />
          }
          <div style={{ flex:1, textAlign:'center' }}>
            <div style={{ fontSize:18, fontWeight:700 }}>{format(selectedDate,'M월 d일 (EEE)',{locale:ko})}</div>
            {holiday && <div style={{ fontSize:13, color:'#EF4444', marginTop:2 }}>🎌 {holiday}</div>}
          </div>
          <button onPointerUp={e => { e.stopPropagation(); onClose() }} style={{ width:36, height:36, borderRadius:'50%', border:'none', background:'#F8FAFC', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, touchAction:'manipulation' }}><X size={20} color="#64748B" /></button>
        </div>

        {/* 현재 근무자 요약 */}
        <div style={{ padding:'10px 16px', borderBottom:'1px solid #E2E8F0', background:'#F8FAFC' }}>
          <SLabel>현재 근무자 ({dayEvs.length}명)</SLabel>
          {dayEvs.length === 0
            ? <div style={{ fontSize:14, color:'#94A3B8' }}>등록된 근무자 없음</div>
            : <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {dayEvs.map(ev => { const user=users.find(u=>u.id===ev.user_id); const color=user?.color||ev.color||'#4F8EF7'; return <span key={ev.id} style={{ display:'inline-flex', alignItems:'center', padding:'6px 14px', borderRadius:999, backgroundColor:color, color:'#fff', fontWeight:700, fontSize:14, minHeight:36 }}>{ev.assignee}</span> })}
              </div>
          }
        </div>

        {/* ── 메인 뷰 ──────────────────────────────────────── */}
        {view === VIEW.MAIN && (
          <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:8 }}>
            <SLabel>무엇을 할까요?</SLabel>
            <ABtn variant="primary" onClick={() => setView(VIEW.QUICK_ADD)}>
              ⚡ 근무자 추가 (빠른 배정)
            </ABtn>
            <ABtn variant="secondary" onClick={() => setView(VIEW.FORM_ADD)}>
              <Plus size={20} /> 일정 추가 (시간/메모 포함)
            </ABtn>
            {dayEvs.length > 0 && <ABtn variant="secondary" onClick={() => setView(VIEW.CHANGE1)}>✏️ 담당자 변경</ABtn>}
            {dayEvs.length > 0 && <ABtn variant="warning" onClick={() => setView(VIEW.SWAP1)}><ArrowLeftRight size={20} /> 근무 교체</ABtn>}
            <ABtn variant="danger" disabled={dayEvs.length === 0} onClick={() => { onDeleteDay(); onClose() }}><Trash2 size={20} /> 이 날 일정 삭제</ABtn>
            <ABtn variant="ghost" onClick={() => { onHolidayManager(); onClose() }}><CalendarDays size={18} /> 공휴일 지정/수정</ABtn>

            {dayEvs.length > 0 && (
              <div style={{ marginTop:12 }}>
                <SLabel>일정 상세</SLabel>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {dayEvs.map(ev => { const user=users.find(u=>u.id===ev.user_id); return <SRow key={ev.id} event={ev} user={user} onClick={() => { onEventClick(ev); onClose() }} /> })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 빠른 근무자 추가 ─────────────────────────────── */}
        {view === VIEW.QUICK_ADD && (
          <div style={{ padding:'14px 16px' }}>
            <div style={{ padding:'10px 14px', background:'#EEF2FF', borderRadius:10, marginBottom:14, fontSize:14, color:'#3730A3' }}>
              ⚡ <strong>빠른 배정</strong> — 이름을 누르면 즉시 추가됩니다.
            </div>
            {groups.length > 0 && (
              <div style={{ display:'flex', border:'1px solid #E2E8F0', borderRadius:8, overflow:'hidden', marginBottom:14 }}>
                {['individual','group'].map(t => <button key={t} onPointerUp={e => { e.stopPropagation(); setAddTab(t) }} style={{ flex:1, padding:'12px 0', border:'none', fontWeight:700, fontSize:15, fontFamily:'var(--font)', cursor:'pointer', minHeight:48, background:addTab===t?'#E94560':'#fff', color:addTab===t?'#fff':'#64748B', touchAction:'manipulation' }}>{t==='individual'?'개인':'그룹'}</button>)}
              </div>
            )}
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {(addTab==='individual'||groups.length===0)
                ? users.length===0 ? <p style={{ fontSize:14, color:'#94A3B8' }}>👥 먼저 사용자를 등록하세요</p>
                  : users.map(u => <Pill key={u.id} user={u} onClick={() => handleQuickAssign(u)} />)
                : groups.map(g => { const cnt=users.filter(u=>u.group_id===g.id).length; return <GPill key={g.id} group={g} memberCount={cnt} onClick={() => handleGroupAssign(g)} /> })
              }
            </div>
          </div>
        )}

        {/* ── 정식 일정 추가 폼 ────────────────────────────── */}
        {view === VIEW.FORM_ADD && (
          <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:12 }}>
            <SLabel>정식 일정 추가</SLabel>
            {formError && <div style={{ background:'#FEF2F2', color:'#EF4444', padding:'8px 12px', borderRadius:8, fontSize:13, border:'1px solid #FECACA' }}>{formError}</div>}

            {/* 담당자 탭 */}
            {groups.length > 0 && (
              <div style={{ display:'flex', border:'1px solid #E2E8F0', borderRadius:8, overflow:'hidden' }}>
                {['individual','group'].map(t => <button key={t} onPointerUp={e => { e.stopPropagation(); setFormAddTab(t) }} style={{ flex:1, padding:'12px 0', border:'none', fontWeight:700, fontSize:15, fontFamily:'var(--font)', cursor:'pointer', minHeight:48, background:formAddTab===t?'#E94560':'#fff', color:formAddTab===t?'#fff':'#64748B', touchAction:'manipulation' }}>{t==='individual'?'개인':'그룹'}</button>)}
              </div>
            )}

            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {(formAddTab==='individual'||groups.length===0)
                ? users.map(u => <Pill key={u.id} user={u} selected={!!formUsers.find(x=>x.id===u.id)} onClick={() => toggleFormUser(u)} />)
                : groups.map(g => { const cnt=users.filter(u=>u.group_id===g.id).length; return <GPill key={g.id} group={g} memberCount={cnt} selected={isGroupSel(g)} onClick={() => toggleFormGroup(g)} /> })
              }
            </div>

            {/* 선택된 인원 */}
            {formUsers.length > 0 && (
              <div style={{ padding:'8px 12px', background:'#F8FAFC', borderRadius:8, border:'1px solid #E2E8F0' }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#64748B', marginBottom:6 }}>선택된 인원 {formUsers.length}명</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {formUsers.map(u => (
                    <span key={u.id} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:999, backgroundColor:u.color, color:'#fff', fontSize:14, fontWeight:700 }}>
                      {u.name}
                      <span onPointerUp={e => { e.stopPropagation(); toggleFormUser(u) }} style={{ cursor:'pointer', opacity:.7, fontSize:16 }}>×</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 시간 입력 */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:'#64748B', marginBottom:4 }}>시작 시간 (선택)</div>
                <input type="time" value={formTime.start_time}
                  onChange={e => setFormTime(p => ({ ...p, start_time: e.target.value }))}
                  onPointerDown={e => e.stopPropagation()}
                  style={{ width:'100%', minHeight:48, border:'1px solid #E2E8F0', borderRadius:8, padding:'10px 12px', fontSize:15, fontFamily:'var(--font)', outline:'none' }} />
              </div>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:'#64748B', marginBottom:4 }}>종료 시간 (선택)</div>
                <input type="time" value={formTime.end_time}
                  onChange={e => setFormTime(p => ({ ...p, end_time: e.target.value }))}
                  onPointerDown={e => e.stopPropagation()}
                  style={{ width:'100%', minHeight:48, border:'1px solid #E2E8F0', borderRadius:8, padding:'10px 12px', fontSize:15, fontFamily:'var(--font)', outline:'none' }} />
              </div>
            </div>

            {/* 메모 */}
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:'#64748B', marginBottom:4 }}>메모 (선택)</div>
              <textarea value={formTime.memo}
                onChange={e => setFormTime(p => ({ ...p, memo: e.target.value }))}
                onPointerDown={e => e.stopPropagation()}
                placeholder="메모" rows={2}
                style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:8, padding:'10px 12px', fontSize:15, fontFamily:'var(--font)', outline:'none', resize:'vertical' }} />
            </div>

            {/* 저장 버튼 */}
            <ABtn variant={formUsers.length > 0 ? 'primary' : 'secondary'} disabled={formUsers.length === 0 || formSaving} onClick={handleFormSave}>
              <Save size={20} />
              {formSaving ? '저장 중…' : formUsers.length === 0 ? '담당자를 선택하세요' : `${formUsers.length}명 일정 저장`}
            </ABtn>
          </div>
        )}

        {/* ── 담당자 변경 1 ─────────────────────────────────── */}
        {view === VIEW.CHANGE1 && (
          <div style={{ padding:'14px 16px' }}>
            <SLabel>변경할 근무자 선택</SLabel>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {dayEvs.map(ev => { const user=users.find(u=>u.id===ev.user_id); return <SRow key={ev.id} event={ev} user={user} onClick={() => { setChangingEvent(ev); setView(VIEW.CHANGE2) }} /> })}
            </div>
          </div>
        )}

        {/* ── 담당자 변경 2 ─────────────────────────────────── */}
        {view === VIEW.CHANGE2 && (
          <div style={{ padding:'14px 16px' }}>
            <div style={{ padding:'10px 14px', background:'#FEF3C7', borderRadius:10, marginBottom:14, fontSize:14, fontWeight:600, color:'#92400E' }}>
              ✏️ <span style={{ color:'#E94560' }}>{changingEvent?.assignee}</span>를 누구로 변경할까요?
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {users.map(u => <Pill key={u.id} user={u} onClick={() => handleChangeToUser(u)} />)}
            </div>
          </div>
        )}

        {/* ── 근무 교체 1 ───────────────────────────────────── */}
        {view === VIEW.SWAP1 && (
          <div style={{ padding:'14px 16px' }}>
            <div style={{ padding:'10px 14px', background:'#EEF2FF', borderRadius:10, marginBottom:14, fontSize:14, color:'#3730A3', lineHeight:1.6 }}>
              <strong>🔄 근무 교체 1단계</strong><br/>교체할 근무자를 선택 → 모달 닫힘 → 다른 날짜 탭
            </div>
            {dayEvs.length === 0 ? <div style={{ fontSize:14, color:'#94A3B8', textAlign:'center', padding:16 }}>이 날 등록된 근무자가 없습니다.</div>
              : <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {dayEvs.map(ev => { const user=users.find(u=>u.id===ev.user_id); return <SRow key={ev.id} event={ev} user={user} highlight onClick={() => handleSelectFirst(ev)} /> })}
                </div>
            }
          </div>
        )}

        {/* ── 근무 교체 3 ───────────────────────────────────── */}
        {view === VIEW.SWAP3 && (
          <div style={{ padding:'14px 16px' }}>
            <div style={{ padding:'10px 14px', background:'#EEF2FF', borderRadius:10, marginBottom:14, fontSize:14, color:'#3730A3', lineHeight:1.6 }}>
              <strong>🔄 근무 교체 2단계</strong><br/>
              <span style={{ color:'#E94560', fontWeight:700 }}>{swapFirstEvent?.assignee}</span>와 교체할 근무자를 선택하세요.
            </div>
            <SLabel>이 날짜 근무자 — 클릭하면 즉시 교체</SLabel>
            {dayEvs.length === 0
              ? <div style={{ fontSize:14, color:'#94A3B8', textAlign:'center', padding:16 }}>이 날 등록된 근무자가 없습니다.</div>
              : <>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:16 }}>
                    {dayEvs.map(ev => { const user=users.find(u=>u.id===ev.user_id); return <Pill key={ev.id} user={user||{name:ev.assignee,color:ev.color||'#4F8EF7'}} onClick={() => handleSelectSecond(ev)} /> })}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {dayEvs.map(ev => { const user=users.find(u=>u.id===ev.user_id); return <SRow key={ev.id} event={ev} user={user} highlight onClick={() => handleSelectSecond(ev)} /> })}
                  </div>
                  <div style={{ marginTop:14 }}>
                    <ABtn variant="ghost" onClick={() => { onSwapReset(); onClose() }}>교체 취소</ABtn>
                  </div>
                </>
            }
          </div>
        )}

        <div style={{ height:'max(16px, env(safe-area-inset-bottom, 16px))' }} />
      </div>
    </>
  )
}
