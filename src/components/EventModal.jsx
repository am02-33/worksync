import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { X, Trash2, Save, ArrowLeftRight } from 'lucide-react'

const DEFAULT_FORM = {
  title: '', user_id: '', assignee: '', date: '',
  start_time: '', end_time: '', memo: '', color: '#4F8EF7', category: '근무',
}

export default function EventModal({ isOpen, onClose, onSave, onDelete, onSwapStart, event, defaultDate, users }) {
  const [form, setForm] = useState(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    if (event) {
      setForm({
        title: event.title || '',
        user_id: event.user_id || '',
        assignee: event.assignee || '',
        date: event.date || '',
        start_time: event.start_time || '',
        end_time: event.end_time || '',
        memo: event.memo || '',
        color: event.color || '#4F8EF7',
        category: event.category || '근무',
      })
    } else {
      setForm({
        ...DEFAULT_FORM,
        date: defaultDate ? format(defaultDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      })
    }
    setError('')
  }, [event, defaultDate, isOpen])

  if (!isOpen) return null

  const handleUserSelect = (user) => {
    setForm(prev => ({
      ...prev,
      user_id: user.id,
      assignee: user.name,
      color: user.color,
      title: prev.title || `${user.name} 근무`,
    }))
  }

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async () => {
    if (!form.assignee.trim()) { setError('담당자를 선택하세요.'); return }
    if (!form.date) { setError('날짜를 선택하세요.'); return }
    if (!form.title.trim()) { setError('제목을 입력하세요.'); return }
    setSaving(true)
    setError('')
    const result = await onSave(form)
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

  const handleSwap = () => {
    onSwapStart(event)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ borderLeftColor: form.color }}>
          <h2 className="modal-title">{event ? '일정 수정' : '새 일정 추가'}</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          {error && <div className="form-error">{error}</div>}

          {/* 담당자 선택 버튼 */}
          <div className="form-group">
            <label className="form-label">담당자 선택 *</label>
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
                  onClick={() => handleUserSelect(user)}
                >
                  {user.name}
                </button>
              ))}
              {users.length === 0 && (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  먼저 사용자를 등록하세요 (👥 아이콘)
                </p>
              )}
            </div>
            {form.assignee && !users.find(u => u.id === form.user_id) && (
              <input className="form-input" style={{ marginTop: '6px' }} type="text" placeholder="직접 입력"
                value={form.assignee} onChange={e => handleChange('assignee', e.target.value)} />
            )}
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
            <input className="form-input" type="date" value={form.date} onChange={e => handleChange('date', e.target.value)} />
          </div>

          {/* 시간 */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">시작 시간</label>
              <input className="form-input" type="time" value={form.start_time} onChange={e => handleChange('start_time', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">종료 시간</label>
              <input className="form-input" type="time" value={form.end_time} onChange={e => handleChange('end_time', e.target.value)} />
            </div>
          </div>

          {/* 메모 */}
          <div className="form-group">
            <label className="form-label">메모</label>
            <textarea className="form-input form-textarea" placeholder="메모 (선택)"
              value={form.memo} onChange={e => handleChange('memo', e.target.value)} rows={2} />
          </div>
        </div>

        <div className="modal-footer">
          <div style={{ display: 'flex', gap: '8px' }}>
            {event && (
              <>
                <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>
                  <Trash2 size={15} /> 삭제
                </button>
                <button className="btn btn-swap" onClick={handleSwap} disabled={saving}>
                  <ArrowLeftRight size={15} /> 교체
                </button>
              </>
            )}
          </div>
          <div className="modal-footer-right">
            <button className="btn btn-ghost" onClick={onClose} disabled={saving}>취소</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              <Save size={15} /> {saving ? '저장 중…' : (event ? '수정' : '추가')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
