import { useState } from 'react'
import { X, Plus, Trash2, Edit2, Check, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export default function HolidayManager({ isOpen, onClose, dbHolidays, onAdd, onDelete, onUpdate, onRefresh, currentYear }) {
  const [form, setForm] = useState({ date: '', name: '' })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [viewYear, setViewYear] = useState(currentYear)

  if (!isOpen) return null

  const yearHolidays = dbHolidays
    .filter(h => h.date.startsWith(`${viewYear}`))
    .sort((a, b) => a.date.localeCompare(b.date))

  const handleAdd = async () => {
    if (!form.date) { setError('날짜를 선택하세요.'); return }
    if (!form.name.trim()) { setError('공휴일 이름을 입력하세요.'); return }
    const result = await onAdd(form.date, form.name)
    if (result.success) { setForm({ date: '', name: '' }); setError('') }
    else setError(result.error || '이미 등록된 날짜입니다.')
  }

  const handleDelete = async (holiday) => {
    if (!window.confirm(`"${holiday.name}" 공휴일을 삭제할까요?`)) return
    await onDelete(holiday.id)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    const result = await onRefresh(viewYear)
    setRefreshing(false)
    if (!result.success) alert('업데이트 실패: ' + result.error)
    else alert(`${viewYear}년 공휴일 데이터가 업데이트됐습니다!`)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">🎌 공휴일 관리</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          {/* 연도 선택 + 새로고침 */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
            <select className="form-input" style={{ width: '100px' }}
              value={viewYear} onChange={e => setViewYear(Number(e.target.value))}>
              {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                <option key={y} value={y}>{y}년</option>
              ))}
            </select>
            <button className="btn btn-ghost" onClick={handleRefresh} disabled={refreshing} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <RefreshCw size={14} className={refreshing ? 'spinning' : ''} />
              {refreshing ? '업데이트 중...' : '공휴일 최신화'}
            </button>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{yearHolidays.length}개</span>
          </div>

          {/* 사용자 지정 공휴일 추가 */}
          <div className="user-add-form" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>사용자 지정 공휴일 추가</h3>
            {error && <div className="form-error">{error}</div>}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">날짜</label>
                <input className="form-input" type="date" value={form.date}
                  onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">공휴일 이름</label>
                <input className="form-input" type="text" placeholder="예: 회사휴무, 여름휴가"
                  value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()} />
              </div>
            </div>
            <button className="btn btn-primary" onClick={handleAdd} style={{ width: '100%', marginTop: '4px' }}>
              <Plus size={14} /> 공휴일 추가
            </button>
          </div>

          {/* 공휴일 목록 */}
          <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {yearHolidays.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                등록된 공휴일이 없습니다. "공휴일 최신화" 버튼을 눌러주세요.
              </div>
            ) : yearHolidays.map(holiday => (
              <div key={holiday.id} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 10px', borderRadius: '6px',
                background: holiday.is_custom ? '#FEF3C7' : 'var(--surface-2)',
                border: `1px solid ${holiday.is_custom ? '#FDE68A' : 'var(--border)'}`,
              }}>
                {editingId === holiday.id ? (
                  <>
                    <input className="form-input" style={{ width: '130px' }} type="date" value={editForm.date}
                      onChange={e => setEditForm(p => ({ ...p, date: e.target.value }))} />
                    <input className="form-input" style={{ flex: 1 }} value={editForm.name}
                      onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
                    <button className="btn btn-primary" style={{ padding: '4px 8px' }}
                      onClick={async () => { await onUpdate(holiday.id, editForm); setEditingId(null) }}>
                      <Check size={12} />
                    </button>
                    <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setEditingId(null)}>
                      <X size={12} />
                    </button>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', minWidth: '80px', fontFamily: 'monospace' }}>
                      {holiday.date}
                    </span>
                    <span style={{ flex: 1, fontSize: '13px', fontWeight: 600 }}>{holiday.name}</span>
                    {holiday.is_custom && (
                      <span style={{ fontSize: '10px', background: '#F59E0B', color: '#fff', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>
                        커스텀
                      </span>
                    )}
                    {holiday.is_custom && (
                      <>
                        <button className="icon-btn-sm" onClick={() => { setEditingId(holiday.id); setEditForm({ date: holiday.date, name: holiday.name }) }}>
                          <Edit2 size={12} />
                        </button>
                        <button className="icon-btn-sm danger" onClick={() => handleDelete(holiday)}>
                          <Trash2 size={12} />
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <div className="modal-footer-right">
            <button className="btn btn-ghost" onClick={onClose}>닫기</button>
          </div>
        </div>
      </div>
    </div>
  )
}
