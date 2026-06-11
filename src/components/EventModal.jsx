/**
 * EventModal — PC 일정 추가/수정
 *
 * 다중 사용자 선택:
 * - 여러 이름표를 클릭하면 토글 선택
 * - 그룹 버튼 클릭 시 그룹 구성원 전원 추가
 * - 저장 시 선택된 인원 수만큼 각각 이벤트 생성
 * - 수정 시에는 1명만 (기존 일정 수정)
 */
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { X, Trash2, Save, ArrowLeftRight, Users } from 'lucide-react'

export default function EventModal({
  isOpen, onClose, onSave, onSaveMultiple, onDelete, onSwapStart,
  event, defaultDate, users, groups = [],
}) {
  // 수정 모드: 단일 / 추가 모드: 다중
  const isEdit = !!event

  // 단일 수정용 폼
  const [form, setForm] = useState({
    title: '', user_id: '', assignee: '', date: '',
    start_time: '', end_time: '', memo: '', color: '#4F8EF7', category: '근무',
  })

  // 다중 추가용 선택 상태
  const [selectedUsers, setSelectedUsers] = useState([])   // { id, name, color }[]
  const [commonTime, setCommonTime] = useState({ start_time: '', end_time: '', memo: '' })
  const [addTab, setAddTab] = useState('individual')        // 'individual' | 'group'

  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  useEffect(() => {
    if (!isOpen) return
    setError('')
    if (isEdit) {
      setForm({
        title:      event.title      || '',
        user_id:    event.user_id    || '',
        assignee:   event.assignee   || '',
        date:       event.date       || '',
        start_time: event.start_time || '',
        end_time:   event.end_time   || '',
        memo:       event.memo       || '',
        color:      event.color      || '#4F8EF7',
        category:   event.category   || '근무',
      })
    } else {
      // 새 일정: 다중 선택 초기화
      const dateVal = defaultDate
        ? (defaultDate instanceof Date ? format(defaultDate, 'yyyy-MM-dd') : defaultDate)
        : format(new Date(), 'yyyy-MM-dd')
      setForm(prev => ({ ...prev, date: dateVal }))
      setSelectedUsers([])
      setCommonTime({ start_time: '', end_time: '', memo: '' })
    }
  }, [event, defaultDate, isOpen])

  if (!isOpen) return null

  // ── 다중 선택: 개인 토글 ──────────────────────────────────
  const toggleUser = (user) => {
    setSelectedUsers(prev => {
      const exists = prev.find(u => u.id === user.id)
      return exists ? prev.filter(u => u.id !== user.id) : [...prev, user]
    })
  }

  // ── 다중 선택: 그룹 전체 추가/제거 ───────────────────────
  const toggleGroup = (group) => {
    const members = users.filter(u => u.group_id === group.id)
    const allSelected = members.every(m => selectedUsers.find(u => u.id === m.id))
    if (allSelected) {
      // 전부 선택된 상태 → 제거
      setSelectedUsers(prev => prev.filter(u => !members.find(m => m.id === u.id)))
    } else {
      // 일부 또는 없음 → 전부 추가 (중복 방지)
      setSelectedUsers(prev => {
        const newOnes = members.filter(m => !prev.find(u => u.id === m.id))
        return [...prev, ...newOnes]
      })
    }
  }

  const isGroupFullySelected = (group) => {
    const members = users.filter(u => u.group_id === group.id)
    return members.length > 0 && members.every(m => selectedUsers.find(u => u.id === m.id))
  }
  const isGroupPartiallySelected = (group) => {
    const members = users.filter(u => u.group_id === group.id)
    return members.some(m => selectedUsers.find(u => u.id === m.id)) && !isGroupFullySelected(group)
  }

  // ── 수정 모드: 단일 사용자 선택 ──────────────────────────
  const handleUserSelect = (user) => {
    setForm(prev => ({
      ...prev, user_id: user.id, assignee: user.name, color: user.color,
      title: prev.title || `${user.name} 근무`,
    }))
  }

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  // ── 저장 ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (isEdit) {
      // 수정: 기존 단일 저장
      if (!form.assignee.trim()) { setError('담당자를 선택하세요.'); return }
      if (!form.date)            { setError('날짜를 선택하세요.'); return }
      if (!form.title.trim())    { setError('제목을 입력하세요.'); return }
      setSaving(true)
      const result = await onSave({ ...form, start_time: form.start_time || null, end_time: form.end_time || null })
      setSaving(false)
      if (result?.success === false) setError(result.error || '저장 실패')
      else onClose()
    } else {
      // 추가: 다중 저장
      if (selectedUsers.length === 0) { setError('담당자를 1명 이상 선택하세요.'); return }
      if (!form.date)                  { setError('날짜를 선택하세요.'); return }
      setSaving(true)
      const result = await onSaveMultiple(
        { date: form.date, start_time: commonTime.start_time || null, end_time: commonTime.end_time || null, memo: commonTime.memo || null, category: '근무' },
        selectedUsers
      )
      setSaving(false)
      if (result?.success === false) setError(result.error || '저장 실패')
      else onClose()
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('이 일정을 삭제하시겠습니까?')) return
    setSaving(true)
    await onDelete(event.id)
    setSaving(false)
    onClose()
  }

  const handleOverlayPointerDown = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  const saveBtnLabel = isEdit
    ? (saving ? '저장 중…' : '수정')
    : saving
      ? '저장 중…'
      : selectedUsers.length === 0
        ? '저장'
        : `${selectedUsers.length}명 일정 추가`

  return (
    <div className="modal-overlay" onPointerDown={handleOverlayPointerDown}>
      <div className="modal modal-lg" onPointerDown={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ borderLeft: `4px solid ${isEdit ? form.color : '#E94560'}` }}>
          <h2 className="modal-title">{isEdit ? '일정 수정' : '새 일정 추가'}</h2>
          <button className="modal-close" onPointerUp={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          {error && <div className="form-error">{error}</div>}

          {/* ── 수정 모드: 단일 선택 ────────────────── */}
          {isEdit && (
            <>
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
                    <input className="form-input" type="text" placeholder="담당자 이름 직접 입력"
                      value={form.assignee} onChange={e => handleChange('assignee', e.target.value)}
                      onPointerDown={(e) => e.stopPropagation()} />
                  )}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">제목 *</label>
                <input className="form-input" type="text" placeholder="일정 제목"
                  value={form.title} onChange={e => handleChange('title', e.target.value)}
                  onPointerDown={(e) => e.stopPropagation()} maxLength={100} />
              </div>
              <div className="form-group">
                <label className="form-label">날짜 *</label>
                <input className="form-input" type="date" value={form.date}
                  onChange={e => handleChange('date', e.target.value)}
                  onPointerDown={(e) => e.stopPropagation()} />
              </div>
            </>
          )}

          {/* ── 추가 모드: 날짜 + 다중 선택 ─────────── */}
          {!isEdit && (
            <>
              <div className="form-group">
                <label className="form-label">날짜 *</label>
                <input className="form-input" type="date" value={form.date}
                  onChange={e => handleChange('date', e.target.value)}
                  onPointerDown={(e) => e.stopPropagation()} />
              </div>

              {/* 개인/그룹 탭 */}
              <div className="form-group">
                <label className="form-label">담당자 선택 * (여러 명 가능)</label>

                {groups.length > 0 && (
                  <div className="view-tabs" style={{ marginBottom: '10px', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', display: 'flex' }}>
                    <button className={`view-tab ${addTab === 'individual' ? 'active' : ''}`} style={{ flex: 1, background: addTab === 'individual' ? 'var(--accent-light)' : '#fff', color: addTab === 'individual' ? '#fff' : 'var(--text-secondary)' }}
                      onPointerUp={() => setAddTab('individual')}>개인</button>
                    <button className={`view-tab ${addTab === 'group' ? 'active' : ''}`} style={{ flex: 1, background: addTab === 'group' ? 'var(--accent-light)' : '#fff', color: addTab === 'group' ? '#fff' : 'var(--text-secondary)' }}
                      onPointerUp={() => setAddTab('group')}>그룹</button>
                  </div>
                )}

                {/* 개인 목록 */}
                {(addTab === 'individual' || groups.length === 0) && (
                  <div className="user-btn-grid">
                    {users.map(user => {
                      const selected = !!selectedUsers.find(u => u.id === user.id)
                      return (
                        <button key={user.id}
                          className={`user-select-btn ${selected ? 'active' : ''}`}
                          style={{ backgroundColor: selected ? user.color : 'transparent', borderColor: user.color, color: selected ? '#fff' : user.color }}
                          onPointerUp={() => toggleUser(user)}>
                          {user.name}
                        </button>
                      )
                    })}
                    {users.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>👥 먼저 사용자를 등록하세요</p>}
                  </div>
                )}

                {/* 그룹 목록 */}
                {addTab === 'group' && groups.length > 0 && (
                  <div className="user-btn-grid">
                    {groups.map(group => {
                      const full = isGroupFullySelected(group)
                      const partial = isGroupPartiallySelected(group)
                      const members = users.filter(u => u.group_id === group.id)
                      return (
                        <button key={group.id}
                          className={`user-select-btn ${full ? 'active' : ''}`}
                          style={{
                            backgroundColor: full ? group.color : partial ? group.color + '33' : 'transparent',
                            borderColor: group.color, color: full ? '#fff' : group.color,
                            display: 'flex', alignItems: 'center', gap: '5px',
                          }}
                          onPointerUp={() => toggleGroup(group)}>
                          <Users size={13} /> {group.name} ({members.length}명)
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* 선택된 인원 표시 */}
              {selectedUsers.length > 0 && (
                <div className="form-group">
                  <label className="form-label">선택된 인원 {selectedUsers.length}명</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '8px', background: 'var(--surface-2)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    {selectedUsers.map(u => (
                      <span key={u.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '999px', backgroundColor: u.color, color: '#fff', fontSize: '13px', fontWeight: 700 }}>
                        {u.name}
                        <span style={{ cursor: 'pointer', opacity: .7, fontSize: '14px' }}
                          onPointerUp={() => toggleUser(u)}>×</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* 시간 (공통) */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">시작 시간 <span style={{ fontWeight: 400, color: '#94A3B8', textTransform: 'none' }}>(선택)</span></label>
              <input className="form-input" type="time"
                value={isEdit ? form.start_time : commonTime.start_time}
                onChange={e => isEdit ? handleChange('start_time', e.target.value) : setCommonTime(p => ({ ...p, start_time: e.target.value }))}
                onPointerDown={(e) => e.stopPropagation()} />
            </div>
            <div className="form-group">
              <label className="form-label">종료 시간 <span style={{ fontWeight: 400, color: '#94A3B8', textTransform: 'none' }}>(선택)</span></label>
              <input className="form-input" type="time"
                value={isEdit ? form.end_time : commonTime.end_time}
                onChange={e => isEdit ? handleChange('end_time', e.target.value) : setCommonTime(p => ({ ...p, end_time: e.target.value }))}
                onPointerDown={(e) => e.stopPropagation()} />
            </div>
          </div>

          {/* 메모 */}
          <div className="form-group">
            <label className="form-label">메모 <span style={{ fontWeight: 400, color: '#94A3B8', textTransform: 'none' }}>(선택)</span></label>
            <textarea className="form-input form-textarea" placeholder="메모"
              value={isEdit ? form.memo : commonTime.memo}
              onChange={e => isEdit ? handleChange('memo', e.target.value) : setCommonTime(p => ({ ...p, memo: e.target.value }))}
              onPointerDown={(e) => e.stopPropagation()} rows={2} />
          </div>
        </div>

        <div className="modal-footer">
          <div style={{ display: 'flex', gap: '8px' }}>
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
              disabled={saving || (!isEdit && selectedUsers.length === 0)}>
              <Save size={15} /> {saveBtnLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
