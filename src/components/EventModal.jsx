import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { X, Trash2, Save, Clock, User, Calendar, Tag, FileText } from 'lucide-react'

const COLOR_PRESETS = [
  { label: '업무', color: '#4F8EF7' },
  { label: '회의', color: '#A855F7' },
  { label: '출장', color: '#F59E0B' },
  { label: '교육', color: '#10B981' },
  { label: '마감', color: '#EF4444' },
  { label: '개인', color: '#6B7280' },
  { label: '휴가', color: '#EC4899' },
  { label: '기타', color: '#14B8A6' },
]

const DEFAULT_FORM = {
  title: '',
  assignee: '',
  date: '',
  start_time: '09:00',
  end_time: '10:00',
  memo: '',
  color: '#4F8EF7',
  category: '업무',
}

export default function EventModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  event,
  defaultDate,
  isAdmin,
}) {
  const [form, setForm] = useState(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (event) {
      setForm({
        title: event.title || '',
        assignee: event.assignee || '',
        date: event.date || '',
        start_time: event.start_time || '09:00',
        end_time: event.end_time || '10:00',
        memo: event.memo || '',
        color: event.color || '#4F8EF7',
        category: event.category || '업무',
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

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleColorPreset = (preset) => {
    setForm(prev => ({ ...prev, color: preset.color, category: preset.label }))
  }

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError('제목을 입력하세요.'); return }
    if (!form.date) { setError('날짜를 선택하세요.'); return }
    if (!form.assignee.trim()) { setError('담당자를 입력하세요.'); return }

    setSaving(true)
    setError('')
    const result = await onSave(form)
    setSaving(false)
    if (result?.success === false) {
      setError(result.error || '저장에 실패했습니다.')
    } else {
      onClose()
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('이 일정을 삭제하시겠습니까?')) return
    setSaving(true)
    await onDelete(event.id)
    setSaving(false)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="modal-header" style={{ borderLeftColor: form.color }}>
          <h2 className="modal-title">{event ? '일정 수정' : '새 일정 추가'}</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          {error && <div className="form-error">{error}</div>}

          {/* 색상/분류 프리셋 */}
          <div className="form-group">
            <label className="form-label"><Tag size={14} /> 분류</label>
            <div className="color-presets">
              {COLOR_PRESETS.map(preset => (
                <button
                  key={preset.color}
                  className={`color-preset ${form.color === preset.color ? 'active' : ''}`}
                  style={{ backgroundColor: preset.color }}
                  onClick={() => handleColorPreset(preset)}
                  title={preset.label}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="color-custom-row">
              <input
                type="color"
                value={form.color}
                onChange={e => handleChange('color', e.target.value)}
                className="color-picker"
                title="직접 색상 선택"
              />
              <span className="color-custom-label">직접 선택</span>
            </div>
          </div>

          {/* 제목 */}
          <div className="form-group">
            <label className="form-label"><Calendar size={14} /> 제목 *</label>
            <input
              className="form-input"
              type="text"
              placeholder="일정 제목을 입력하세요"
              value={form.title}
              onChange={e => handleChange('title', e.target.value)}
              maxLength={100}
            />
          </div>

          {/* 담당자 */}
          <div className="form-group">
            <label className="form-label"><User size={14} /> 담당자 *</label>
            <input
              className="form-input"
              type="text"
              placeholder="담당자 이름"
              value={form.assignee}
              onChange={e => handleChange('assignee', e.target.value)}
              maxLength={50}
            />
          </div>

          {/* 날짜 */}
          <div className="form-group">
            <label className="form-label"><Calendar size={14} /> 날짜 *</label>
            <input
              className="form-input"
              type="date"
              value={form.date}
              onChange={e => handleChange('date', e.target.value)}
            />
          </div>

          {/* 시간 */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label"><Clock size={14} /> 시작 시간</label>
              <input
                className="form-input"
                type="time"
                value={form.start_time}
                onChange={e => handleChange('start_time', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label"><Clock size={14} /> 종료 시간</label>
              <input
                className="form-input"
                type="time"
                value={form.end_time}
                onChange={e => handleChange('end_time', e.target.value)}
              />
            </div>
          </div>

          {/* 메모 */}
          <div className="form-group">
            <label className="form-label"><FileText size={14} /> 메모</label>
            <textarea
              className="form-input form-textarea"
              placeholder="추가 메모 (선택)"
              value={form.memo}
              onChange={e => handleChange('memo', e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>
        </div>

        {/* 푸터 */}
        <div className="modal-footer">
          {event && isAdmin && (
            <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>
              <Trash2 size={16} /> 삭제
            </button>
          )}
          {event && !isAdmin && (
            <span className="admin-only-note">🔒 삭제는 관리자만 가능</span>
          )}
          <div className="modal-footer-right">
            <button className="btn btn-ghost" onClick={onClose} disabled={saving}>
              취소
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              <Save size={16} /> {saving ? '저장 중...' : (event ? '수정' : '추가')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
