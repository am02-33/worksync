import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { X, Trash2, Save, ArrowLeftRight } from 'lucide-react'

const DEFAULT_FORM = {
  title: '', user_id: '', assignee: '', date: '',
  start_time: '', end_time: '',   // 빈 문자열 = 선택 안 함
  memo: '', color: '#4F8EF7', category: '근무',
}

export default function EventModal({
  isOpen, onClose, onSave, onDelete, onSwapStart, event, defaultDate, users,
}) {
  const [form, setForm]     = useState(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  useEffect(() => {
    if (!isOpen) return
    if (event) {
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
      setForm({
        ...DEFAULT_FORM,
        date: defaultDate
          ? (defaultDate instanceof Date ? format(defaultDate, 'yyyy-MM-dd') : defaultDate)
          : format(new Date(), 'yyyy-MM-dd'),
      })
    }
    setError('')
  }, [event, defaultDate, isOpen])

  if (!isOpen) return null

  const handleUserSelect = (user) => {
    setForm(prev => ({
      ...prev,
      user_id:  user.id,
      assignee: user.name,
      color:    user.color,
      title:    prev.title || `${user.name} 근무`,
    }))
  }

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async () => {
    if (!form.assignee.trim()) { setError('담당자를 선택하세요.'); return }
    if (!form.date)            { setError('날짜를 선택하세요.'); return }
    if (!form.title.trim())    { setError('제목을 입력하세요.'); return }
    // 시간은 필수 아님

    setSaving(true)
    setError('')
    // null 처리: 빈 문자열은 null로 저장
    const saveData = {
      ...form,
      start_time: form.start_time || null,
      end_time:   form.end_time   || null,
    }
    const result = await onSave(saveData)
    setSaving(false)
    if (result?.success === false) setError(result.error || '저장 실패')
    else onClose()
  }

  const handleDelete = async () => {
    if (!window.confirm('이 일정을 삭제하시겠습니까?')) return
    setSaving(true)
    await onDelete(event.id)
    setSaving(false)
    onClose()
  }

  return (
    <div className="modal-overlay" onPointerUp={onClose}>
      <div className="modal" onPointerDown={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ borderLeftColor: form.color, borderLeftWidth: 4, borderLeftStyle: 'solid' }}>
          <h2 className="modal-title">{event ? '일정 수정' : '새 일정 추가'}</h2>
          <button className="modal-close" onPointerUp={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          {error && <div className="form-error">{error}</div>}

          {/* 담당자 선택 */}
          <div className="form-group">
            <label className="form-label">담당자 *</label>
            <div className="user-btn-grid">
              {users.map(user => (
                <button
                  key={user.id}
                  className={`user-select-btn ${form.user_id === user.id ? 'active' : ''}`}
                  style={{
                    backgroundColor: form.user_id === user.id ? user.color : 'transparent',
                    borderColor: user.color,
                    color: form.user_id === user.id ? '#fff' : user.color,
                  }}
                  onPointerUp={() => handleUserSelect(user)}
                >
                  {user.name}
                </button>
              ))}
              {users.length === 0 && (
                <input className="form-input" type="text" placeholder="담당자 이름 직접 입력"
                  value={form.assignee} onChange={e => handleChange('assignee', e.target.value)} />
              )}
            </div>
          </div>

          {/* 제목 */}
          <div className="form-group">
            <label className="form-label">제목 *</label>
            <input className="form-input" type="text" placeholder="일정 제목"
              value={form.title} onChange={e => handleChange('title', e.target.value)} maxLength={100} />
          </div>

          {/* 날짜 */}
          <div className="form-group">
            <label className="form-label">날짜 *</label>
            <input className="form-input" type="date" value={form.date}
              onChange={e => handleChange('date', e.target.value)} />
          </div>

          {/* 시간 — 선택 사항 */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">시작 시간 <span style={{ fontWeight: 400, color: '#94A3B8' }}>(선택)</span></label>
              <input className="form-input" type="time" value={form.start_time}
                onChange={e => handleChange('start_time', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">종료 시간 <span style={{ fontWeight: 400, color: '#94A3B8' }}>(선택)</span></label>
              <input className="form-input" type="time" value={form.end_time}
                onChange={e => handleChange('end_time', e.target.value)} />
            </div>
          </div>

          {/* 메모 */}
          <div className="form-group">
            <label className="form-label">메모 <span style={{ fontWeight: 400, color: '#94A3B8' }}>(선택)</span></label>
            <textarea className="form-input form-textarea" placeholder="메모"
              value={form.memo} onChange={e => handleChange('memo', e.target.value)} rows={2} />
          </div>
        </div>

        <div className="modal-footer">
          <div style={{ display: 'flex', gap: '8px' }}>
            {event && (
              <>
                <button className="btn btn-danger" onPointerUp={handleDelete} disabled={saving}>
                  <Trash2 size={15} /> 삭제
                </button>
                <button className="btn btn-swap" onPointerUp={() => { onSwapStart(event); onClose() }} disabled={saving}>
                  <ArrowLeftRight size={15} /> 교체
                </button>
              </>
            )}
          </div>
          <div className="modal-footer-right">
            <button className="btn btn-ghost" onPointerUp={onClose} disabled={saving}>취소</button>
            <button className="btn btn-primary" onPointerUp={handleSubmit} disabled={saving}>
              <Save size={15} /> {saving ? '저장 중…' : (event ? '수정' : '추가')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
