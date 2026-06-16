/**
 * EventModal
 * 수정사항:
 * - schedule_type (work / annual_leave) 선택 추가
 * - selectedDates (다중 날짜 배열)을 받아서 저장 시 모든 날짜에 등록
 * - 저장 후 "N개 날짜 × N명 = N건 추가" 메시지 표시
 */
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { X, Trash2, Save, ArrowLeftRight, Users } from 'lucide-react'

const SCHEDULE_TYPES = [
  { value: 'work',         label: '일반 근무', color: undefined },
  { value: 'annual_leave', label: '연차 / 휴가', color: '#1A1A2E' },
]

export default function EventModal({
  isOpen, onClose,
  onSave,           // 단일 수정용
  onSaveMultiple,   // 다중 추가용: (targetDates, selectedUsers, commonData) => Promise
  onDelete, onSwapStart,
  event, defaultDate,
  users, groups = [],
  selectedDates = [],  // ← 다중 날짜 배열 (App에서 전달)
}) {
  const isEdit = !!event

  // 수정 폼 (단일)
  const [form, setForm] = useState({
    title: '', user_id: '', assignee: '', date: '',
    start_time: '', end_time: '', memo: '',
    color: '#4F8EF7', category: '근무', schedule_type: 'work',
  })

  // 추가 폼 (다중)
  const [selUsers, setSelUsers]       = useState([])
  const [addTab, setAddTab]           = useState('individual')
  const [scheduleType, setScheduleType] = useState('work')
  const [commonTime, setCommonTime]   = useState({ start_time: '', end_time: '', memo: '' })

  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  useEffect(() => {
    if (!isOpen) return
    setError('')
    if (isEdit) {
      setForm({
        title:         event.title         || '',
        user_id:       event.user_id       || '',
        assignee:      event.assignee      || '',
        date:          event.date          || '',
        start_time:    event.start_time    || '',
        end_time:      event.end_time      || '',
        memo:          event.memo          || '',
        color:         event.color         || '#4F8EF7',
        category:      event.category      || '근무',
        schedule_type: event.schedule_type || 'work',
      })
    } else {
      const dateVal = defaultDate
        ? (defaultDate instanceof Date ? format(defaultDate, 'yyyy-MM-dd') : defaultDate)
        : format(new Date(), 'yyyy-MM-dd')
      setForm(prev => ({ ...prev, date: dateVal, schedule_type: 'work' }))
      setSelUsers([])
      setScheduleType('work')
      setCommonTime({ start_time: '', end_time: '', memo: '' })
    }
  }, [event, defaultDate, isOpen])

  if (!isOpen) return null

  // ── 실제 저장 대상 날짜 ─────────────────────────────────
  // selectedDates가 있으면 그것 사용, 없으면 form.date 단일
  const targetDates = !isEdit && selectedDates.length > 0
    ? selectedDates
    : !isEdit ? [form.date] : []

  // ── 다중: 개인 토글 ─────────────────────────────────────
  const toggleUser = (user) =>
    setSelUsers(prev => prev.find(u => u.id === user.id) ? prev.filter(u => u.id !== user.id) : [...prev, user])

  // ── 다중: 그룹 토글 ─────────────────────────────────────
  const toggleGroup = (group) => {
    const members  = users.filter(u => u.group_id === group.id)
    const allInSel = members.every(m => selUsers.find(u => u.id === m.id))
    if (allInSel) setSelUsers(prev => prev.filter(u => !members.find(m => m.id === u.id)))
    else          setSelUsers(prev => { const news = members.filter(m => !prev.find(u => u.id === m.id)); return [...prev, ...news] })
  }
  const isGroupFull    = (group) => { const ms = users.filter(u => u.group_id === group.id); return ms.length > 0 && ms.every(m => selUsers.find(u => u.id === m.id)) }
  const isGroupPartial = (group) => { const ms = users.filter(u => u.group_id === group.id); return ms.some(m => selUsers.find(u => u.id === m.id)) && !isGroupFull(group) }

  // ── 수정: 단일 사용자 선택 ──────────────────────────────
  const handleUserSelect = (user) => setForm(prev => ({
    ...prev, user_id: user.id, assignee: user.name,
    color: prev.schedule_type === 'annual_leave' ? '#1A1A2E' : user.color,
    title: prev.title || `${user.name} 근무`,
  }))

  const handleChange = (field, value) => setForm(prev => {
    const next = { ...prev, [field]: value }
    // schedule_type 변경 시 color 자동 조정
    if (field === 'schedule_type') {
      if (value === 'annual_leave') next.color = '#1A1A2E'
      else {
        const u = users.find(u => u.id === next.user_id)
        if (u) next.color = u.color
      }
    }
    return next
  })

  // ── 저장 ────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (isEdit) {
      if (!form.assignee.trim()) { setError('담당자를 선택하세요.'); return }
      if (!form.date)            { setError('날짜를 선택하세요.'); return }
      if (!form.title.trim())    { setError('제목을 입력하세요.'); return }
      setSaving(true)
      const result = await onSave({
        ...form,
        start_time:    form.start_time    || null,
        end_time:      form.end_time      || null,
        schedule_type: form.schedule_type || 'work',
        color: form.schedule_type === 'annual_leave' ? '#1A1A2E' : form.color,
      })
      setSaving(false)
      if (result?.success === false) setError(result.error || '저장 실패')
      else onClose()
    } else {
      // 다중 추가
      if (selUsers.length === 0) { setError('담당자를 1명 이상 선택하세요.'); return }
      if (targetDates.length === 0 || !targetDates[0]) { setError('날짜를 선택하세요.'); return }

      setSaving(true)
      const result = await onSaveMultiple(
        targetDates,
        selUsers,
        { ...commonTime, schedule_type: scheduleType }
      )
      setSaving(false)
      if (result?.success === false) {
        setError(result.error || '저장 실패')
      } else {
        const count = result?.count || selUsers.length * targetDates.length
        if (targetDates.length > 1) {
          alert(`${targetDates.length}개 날짜에 ${selUsers.length}명씩 총 ${count}개의 일정이 추가되었습니다.`)
        }
        onClose()
      }
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('이 일정을 삭제하시겠습니까?')) return
    setSaving(true); await onDelete(event.id); setSaving(false); onClose()
  }

  const handleOverlayPointerDown = (e) => { if (e.target === e.currentTarget) onClose() }

  // 저장 버튼 레이블
  const saveBtnLabel = (() => {
    if (saving) return '저장 중…'
    if (isEdit) return '수정'
    if (selUsers.length === 0) return '저장'
    const dCount = targetDates.length
    const uCount = selUsers.length
    if (dCount > 1) return `${dCount}일 × ${uCount}명 = ${dCount * uCount}건 추가`
    return `${uCount}명 일정 추가`
  })()

  return (
    <div className="modal-overlay" onPointerDown={handleOverlayPointerDown}>
      <div className="modal modal-lg" onPointerDown={e => e.stopPropagation()}>
        <div className="modal-header" style={{ borderLeft: `4px solid ${isEdit ? (form.schedule_type === 'annual_leave' ? '#1A1A2E' : form.color) : '#E94560'}` }}>
          <h2 className="modal-title">{isEdit ? '일정 수정' : '새 일정 추가'}</h2>
          <button className="modal-close" onPointerUp={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          {error && <div className="form-error">{error}</div>}

          {/* ── 수정 모드 ──────────────────────────────── */}
          {isEdit && (
            <>
              {/* 담당자 */}
              <div className="form-group">
                <label className="form-label">담당자 *</label>
                <div className="user-btn-grid">
                  {users.map(user => (
                    <button key={user.id}
                      className={`user-select-btn ${form.user_id === user.id ? 'active' : ''}`}
                      style={{ backgroundColor: form.user_id === user.id ? user.color : 'transparent', borderColor: user.color, color: form.user_id === user.id ? '#fff' : user.color }}
                      onPointerUp={() => handleUserSelect(user)}>
                      {user.name}
                    </button>
                  ))}
                  {users.length === 0 && (
                    <input className="form-input" type="text" placeholder="담당자 이름"
                      value={form.assignee} onChange={e => handleChange('assignee', e.target.value)}
                      onPointerDown={e => e.stopPropagation()} />
                  )}
                </div>
              </div>

              {/* 근무 유형 */}
              <div className="form-group">
                <label className="form-label">근무 유형</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {SCHEDULE_TYPES.map(t => (
                    <button key={t.value}
                      className={`user-select-btn ${form.schedule_type === t.value ? 'active' : ''}`}
                      style={{
                        backgroundColor: form.schedule_type === t.value ? (t.color || '#E94560') : 'transparent',
                        borderColor:     t.color || '#E94560',
                        color:           form.schedule_type === t.value ? '#fff' : (t.color || '#E94560'),
                      }}
                      onPointerUp={() => handleChange('schedule_type', t.value)}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 날짜 */}
              <div className="form-group">
                <label className="form-label">날짜 *</label>
                <input className="form-input" type="date" value={form.date}
                  onChange={e => handleChange('date', e.target.value)}
                  onPointerDown={e => e.stopPropagation()} />
              </div>
            </>
          )}

          {/* ── 추가 모드 ──────────────────────────────── */}
          {!isEdit && (
            <>
              {/* 날짜 표시 */}
              <div className="form-group">
                <label className="form-label">날짜</label>
                {targetDates.length > 1 ? (
                  <div style={{ padding: '8px 12px', background: '#EEF2FF', borderRadius: 8, border: '1px solid #C7D2FE', fontSize: 13, color: '#3730A3', fontWeight: 600 }}>
                    📅 {targetDates.length}개 날짜 선택됨: {targetDates.slice(0, 3).join(', ')}{targetDates.length > 3 ? ` 외 ${targetDates.length - 3}개` : ''}
                  </div>
                ) : (
                  <input className="form-input" type="date" value={form.date}
                    onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                    onPointerDown={e => e.stopPropagation()} />
                )}
              </div>

              {/* 근무 유형 */}
              <div className="form-group">
                <label className="form-label">근무 유형</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {SCHEDULE_TYPES.map(t => (
                    <button key={t.value}
                      className={`user-select-btn ${scheduleType === t.value ? 'active' : ''}`}
                      style={{
                        backgroundColor: scheduleType === t.value ? (t.color || '#E94560') : 'transparent',
                        borderColor:     t.color || '#E94560',
                        color:           scheduleType === t.value ? '#fff' : (t.color || '#E94560'),
                      }}
                      onPointerUp={() => setScheduleType(t.value)}>
                      {t.label}
                    </button>
                  ))}
                </div>
                {scheduleType === 'annual_leave' && (
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: '#1A1A2E' }} />
                    연차는 캘린더에서 검정색으로 표시됩니다
                  </div>
                )}
              </div>

              {/* 담당자 선택 (다중) */}
              <div className="form-group">
                <label className="form-label">담당자 선택 * (여러 명 가능)</label>
                {groups.length > 0 && (
                  <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}>
                    {['individual', 'group'].map(t => (
                      <button key={t}
                        style={{ flex: 1, padding: '8px 0', border: 'none', fontWeight: 700, fontSize: 13, fontFamily: 'var(--font)', cursor: 'pointer', minHeight: 40, background: addTab === t ? 'var(--accent-light)' : '#fff', color: addTab === t ? '#fff' : 'var(--text-secondary)' }}
                        onPointerUp={() => setAddTab(t)}>
                        {t === 'individual' ? '개인' : '그룹'}
                      </button>
                    ))}
                  </div>
                )}

                <div className="user-btn-grid">
                  {(addTab === 'individual' || groups.length === 0)
                    ? users.length === 0
                      ? <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>👥 먼저 사용자를 등록하세요</p>
                      : users.map(user => {
                          const sel = !!selUsers.find(u => u.id === user.id)
                          return (
                            <button key={user.id}
                              className={`user-select-btn ${sel ? 'active' : ''}`}
                              style={{ backgroundColor: sel ? user.color : 'transparent', borderColor: user.color, color: sel ? '#fff' : user.color }}
                              onPointerUp={() => toggleUser(user)}>
                              {user.name}
                            </button>
                          )
                        })
                    : groups.map(group => {
                        const full    = isGroupFull(group)
                        const partial = isGroupPartial(group)
                        const members = users.filter(u => u.group_id === group.id)
                        return (
                          <button key={group.id}
                            className={`user-select-btn ${full ? 'active' : ''}`}
                            style={{ backgroundColor: full ? group.color : partial ? group.color + '33' : 'transparent', borderColor: group.color, color: full ? '#fff' : group.color, display: 'flex', alignItems: 'center', gap: 5 }}
                            onPointerUp={() => toggleGroup(group)}>
                            <Users size={13} /> {group.name} ({members.length}명)
                          </button>
                        )
                      })
                  }
                </div>

                {/* 선택된 인원 표시 */}
                {selUsers.length > 0 && (
                  <div style={{ marginTop: 8, padding: '8px 10px', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>
                      선택된 인원 {selUsers.length}명
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {selUsers.map(u => (
                        <span key={u.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 999, backgroundColor: scheduleType === 'annual_leave' ? '#1A1A2E' : u.color, color: '#fff', fontSize: 13, fontWeight: 700 }}>
                          {u.name}
                          <span onPointerUp={() => toggleUser(u)} style={{ cursor: 'pointer', opacity: .7, fontSize: 14, lineHeight: 1 }}>×</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* 시간 (공통) */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">시작 시간 <span style={{ fontWeight: 400, color: '#94A3B8', textTransform: 'none' }}>(선택)</span></label>
              <input className="form-input" type="time"
                value={isEdit ? form.start_time : commonTime.start_time}
                onChange={e => isEdit ? handleChange('start_time', e.target.value) : setCommonTime(p => ({ ...p, start_time: e.target.value }))}
                onPointerDown={e => e.stopPropagation()} />
            </div>
            <div className="form-group">
              <label className="form-label">종료 시간 <span style={{ fontWeight: 400, color: '#94A3B8', textTransform: 'none' }}>(선택)</span></label>
              <input className="form-input" type="time"
                value={isEdit ? form.end_time : commonTime.end_time}
                onChange={e => isEdit ? handleChange('end_time', e.target.value) : setCommonTime(p => ({ ...p, end_time: e.target.value }))}
                onPointerDown={e => e.stopPropagation()} />
            </div>
          </div>

          {/* 메모 */}
          <div className="form-group">
            <label className="form-label">메모 <span style={{ fontWeight: 400, color: '#94A3B8', textTransform: 'none' }}>(선택)</span></label>
            <textarea className="form-input form-textarea" placeholder="메모"
              value={isEdit ? form.memo : commonTime.memo}
              onChange={e => isEdit ? handleChange('memo', e.target.value) : setCommonTime(p => ({ ...p, memo: e.target.value }))}
              onPointerDown={e => e.stopPropagation()} rows={2} />
          </div>
        </div>

        <div className="modal-footer">
          <div style={{ display: 'flex', gap: 8 }}>
            {isEdit && (
              <>
                <button className="btn btn-danger" onPointerUp={handleDelete} disabled={saving}><Trash2 size={15} /> 삭제</button>
                <button className="btn btn-swap" onPointerUp={() => { if (onSwapStart) { onSwapStart(event); onClose() } }} disabled={saving}><ArrowLeftRight size={15} /> 교체</button>
              </>
            )}
          </div>
          <div className="modal-footer-right">
            <button className="btn btn-ghost" onPointerUp={onClose} disabled={saving}>취소</button>
            <button className="btn btn-primary"
              onPointerUp={handleSubmit}
              disabled={saving || (!isEdit && selUsers.length === 0)}>
              <Save size={15} /> {saveBtnLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
