import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { X, Plus, ArrowLeftRight, Trash2, CalendarDays, ChevronLeft } from 'lucide-react'
import { UserChip, GroupChip, ActionButton, HolidayBadge, ScheduleItem } from './ui/index.jsx'
import { sortSchedulesByUserName } from '../utils/sortUsers'

// 뷰 상태
const VIEW = {
  MAIN:    'main',
  ADD:     'add',
  CHANGE:  'change',
  CHANGE2: 'change2', // 새 근무자 선택
}

export default function MobileDateModal({
  isOpen, onClose,
  selectedDate, events, users, groups,
  getHolidayName, sortBy,
  onEventClick, onAddEvent,
  onQuickAssign, onQuickAssignGroup,
  onDeleteDay, onSwapStart,
  onHolidayManager,
}) {
  const [view, setView] = useState(VIEW.MAIN)
  const [changingEvent, setChangingEvent] = useState(null) // 변경할 기존 일정
  const [addTab, setAddTab] = useState('individual')

  useEffect(() => {
    if (isOpen) setView(VIEW.MAIN)
  }, [isOpen, selectedDate])

  // 모달 열릴 때 body 스크롤 막기
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen || !selectedDate) return null

  const dateStr = format(selectedDate, 'yyyy-MM-dd')
  const holiday = getHolidayName(dateStr)
  const dayEvents = sortSchedulesByUserName(
    events.filter(e => e.date === dateStr), users, sortBy
  )

  const handleAssign = async (user) => {
    await onQuickAssign(dateStr, user)
    // 즉시 갱신은 실시간 구독이 처리
  }

  const handleGroupAssign = async (group) => {
    const members = users.filter(u => u.group_id === group.id)
    await onQuickAssignGroup(dateStr, group, members)
  }

  const handleChangeSelect = (event) => {
    setChangingEvent(event)
    setView(VIEW.CHANGE2)
  }

  const handleChangeToUser = async (newUser) => {
    if (!changingEvent) return
    await onEventClick({ ...changingEvent, _changeToUser: newUser })
    setView(VIEW.MAIN)
    setChangingEvent(null)
  }

  return (
    <>
      <div className="mdm-overlay" onClick={onClose} />
      <div className="mdm-sheet">
        {/* 핸들 */}
        <div className="mdm-handle" />

        {/* 헤더 */}
        <div className="mdm-header">
          {view !== VIEW.MAIN ? (
            <button className="mdm-back" onClick={() => setView(VIEW.MAIN)}>
              <ChevronLeft size={20} />
            </button>
          ) : <div style={{ width: '36px' }} />}

          <div className="mdm-header-center">
            <div className="mdm-date">{format(selectedDate, 'M월 d일 (EEE)', { locale: ko })}</div>
            {holiday && <HolidayBadge name={holiday} />}
          </div>

          <button className="mdm-close" onClick={onClose}><X size={20} /></button>
        </div>

        {/* 현재 근무자 요약 (항상 표시) */}
        <div className="mdm-workers">
          {dayEvents.length === 0 ? (
            <div className="mdm-no-worker">등록된 근무자 없음</div>
          ) : (
            <div className="mdm-worker-chips">
              {dayEvents.map(ev => {
                const user = users.find(u => u.id === ev.user_id)
                const color = user?.color || ev.color || '#4F8EF7'
                return (
                  <span key={ev.id} className="mdm-worker-tag" style={{ backgroundColor: color }}>
                    {ev.assignee}
                  </span>
                )
              })}
            </div>
          )}
        </div>

        {/* ===== 메인 뷰 ===== */}
        {view === VIEW.MAIN && (
          <div className="mdm-body">
            <div className="mdm-section-label">무엇을 할까요?</div>
            <div className="mdm-actions-grid">
              <ActionButton variant="dark" size="lg" fullWidth icon={<Plus size={20} />} onClick={() => setView(VIEW.ADD)}>
                근무자 추가
              </ActionButton>
              {dayEvents.length > 0 && (
                <ActionButton variant="secondary" size="lg" fullWidth icon={<span style={{ fontSize: '18px' }}>✏️</span>} onClick={() => setView(VIEW.CHANGE)}>
                  근무자 변경
                </ActionButton>
              )}
              {dayEvents.length > 0 && (
                <ActionButton variant="secondary" size="lg" fullWidth icon={<ArrowLeftRight size={18} />} onClick={() => { onClose(); /* swap mode activated via event click */ }}>
                  근무 교체
                </ActionButton>
              )}
              <ActionButton variant="danger" size="lg" fullWidth icon={<Trash2 size={18} />} onClick={() => { onDeleteDay(); onClose() }}
                disabled={dayEvents.length === 0}>
                이 날 일정 삭제
              </ActionButton>
              <ActionButton variant="ghost" size="md" fullWidth icon={<CalendarDays size={16} />} onClick={() => { onHolidayManager(); onClose() }}>
                공휴일 지정/수정
              </ActionButton>
            </div>

            {/* 일정 목록 */}
            {dayEvents.length > 0 && (
              <div className="mdm-schedule-section">
                <div className="mdm-section-label">일정 상세</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {dayEvents.map(ev => {
                    const user = users.find(u => u.id === ev.user_id)
                    return (
                      <ScheduleItem key={ev.id} event={ev} user={user}
                        onClick={() => { onEventClick(ev); onClose() }} />
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== 근무자 추가 뷰 ===== */}
        {view === VIEW.ADD && (
          <div className="mdm-body">
            <div className="mdm-section-label">추가할 근무자 선택</div>

            {/* 개인/그룹 탭 */}
            {groups.length > 0 && (
              <div className="mdm-tab-row">
                <button className={`mdm-tab ${addTab === 'individual' ? 'active' : ''}`} onClick={() => setAddTab('individual')}>개인</button>
                <button className={`mdm-tab ${addTab === 'group' ? 'active' : ''}`} onClick={() => setAddTab('group')}>그룹</button>
              </div>
            )}

            {/* 개인 */}
            {(addTab === 'individual' || groups.length === 0) && (
              <div className="mdm-chip-wrap">
                {users.length === 0
                  ? <p className="mdm-empty-hint">👥 먼저 사용자를 등록해주세요</p>
                  : users.map(user => (
                    <UserChip key={user.id} user={user} size="lg" onClick={() => handleAssign(user)} />
                  ))
                }
              </div>
            )}

            {/* 그룹 */}
            {addTab === 'group' && groups.length > 0 && (
              <div className="mdm-chip-wrap">
                {groups.map(group => {
                  const cnt = users.filter(u => u.group_id === group.id).length
                  return (
                    <GroupChip key={group.id} group={group} memberCount={cnt} size="lg"
                      onClick={() => handleGroupAssign(group)} />
                  )
                })}
              </div>
            )}

            {/* 갱신된 근무자 목록 */}
            {dayEvents.length > 0 && (
              <div className="mdm-schedule-section">
                <div className="mdm-section-label" style={{ marginTop: '16px' }}>현재 근무자</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {dayEvents.map(ev => {
                    const user = users.find(u => u.id === ev.user_id)
                    return <ScheduleItem key={ev.id} event={ev} user={user} onClick={() => { onEventClick(ev); onClose() }} />
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== 근무자 변경 - 기존 선택 ===== */}
        {view === VIEW.CHANGE && (
          <div className="mdm-body">
            <div className="mdm-section-label">변경할 근무자 선택</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {dayEvents.map(ev => {
                const user = users.find(u => u.id === ev.user_id)
                return (
                  <ScheduleItem key={ev.id} event={ev} user={user}
                    onClick={() => handleChangeSelect(ev)} />
                )
              })}
            </div>
          </div>
        )}

        {/* ===== 근무자 변경 - 새 근무자 선택 ===== */}
        {view === VIEW.CHANGE2 && (
          <div className="mdm-body">
            <div className="mdm-section-label">
              <span style={{ color: '#E94560' }}>{changingEvent?.assignee}</span>를 누구로 변경할까요?
            </div>
            <div className="mdm-chip-wrap">
              {users.map(user => (
                <UserChip key={user.id} user={user} size="lg"
                  onClick={() => handleChangeToUser(user)} />
              ))}
            </div>
          </div>
        )}

        <div className="mdm-footer-space" />
      </div>
    </>
  )
}
