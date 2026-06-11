import { useState } from 'react'
import { X, Plus, Trash2, Edit2, Check } from 'lucide-react'

const COLOR_PRESETS = ['#4F8EF7','#A855F7','#10B981','#F59E0B','#EF4444','#EC4899','#14B8A6','#F97316','#6366F1','#84CC16']

export default function UserManager({ isOpen, onClose, users, groups, onAdd, onUpdate, onDelete, events }) {
  const [form, setForm] = useState({ name: '', color: COLOR_PRESETS[0], memo: '', group_id: '' })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleAdd = async () => {
    if (!form.name.trim()) { setError('이름을 입력하세요.'); return }
    const result = await onAdd({ ...form, group_id: form.group_id || null })
    if (result.success) { setForm({ name: '', color: COLOR_PRESETS[0], memo: '', group_id: '' }); setError('') }
    else setError(result.error)
  }

  const handleUpdate = async (id) => {
    const result = await onUpdate(id, { ...editForm, group_id: editForm.group_id || null })
    if (result.success) setEditingId(null)
  }

  const handleDelete = async (user) => {
    const userEvents = events.filter(e => e.user_id === user.id)
    if (userEvents.length > 0) {
      if (!window.confirm(`${user.name}에게 배정된 일정이 ${userEvents.length}개 있습니다. 그래도 삭제하시겠습니까?`)) return
    }
    await onDelete(user.id)
  }

  const startEdit = (user) => {
    setEditingId(user.id)
    setEditForm({ name: user.name, color: user.color, memo: user.memo || '', group_id: user.group_id || '' })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">👥 사용자 관리</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          {/* 추가 폼 */}
          <div className="user-add-form">
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px' }}>새 사용자 추가</h3>
            {error && <div className="form-error">{error}</div>}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">이름</label>
                <input className="form-input" type="text" placeholder="이름 입력"
                  value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()} />
              </div>
              <div className="form-group">
                <label className="form-label">메모/역할</label>
                <input className="form-input" type="text" placeholder="예: 파트타임"
                  value={form.memo} onChange={e => setForm(p => ({ ...p, memo: e.target.value }))} />
              </div>
            </div>
            {groups.length > 0 && (
              <div className="form-group">
                <label className="form-label">소속 그룹</label>
                <select className="form-input" value={form.group_id} onChange={e => setForm(p => ({ ...p, group_id: e.target.value }))}>
                  <option value="">그룹 없음</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">색상</label>
              <div className="color-dot-grid">
                {COLOR_PRESETS.map(c => (
                  <button key={c} className={`color-dot ${form.color === c ? 'active' : ''}`}
                    style={{ backgroundColor: c }} onClick={() => setForm(p => ({ ...p, color: c }))} />
                ))}
                <input type="color" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                  className="color-picker-small" />
              </div>
            </div>
            <button className="btn btn-primary" onClick={handleAdd} style={{ width: '100%' }}>
              <Plus size={14} /> 사용자 추가
            </button>
          </div>

          {/* 사용자 목록 */}
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px' }}>등록된 사용자 ({users.length}명)</h3>
            {users.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', padding: '16px' }}>등록된 사용자가 없습니다.</p>
            ) : (
              <div className="user-list">
                {users.map(user => {
                  const userGroup = groups.find(g => g.id === user.group_id)
                  const userEventCount = events.filter(e => e.user_id === user.id).length
                  return (
                    <div key={user.id} className="user-list-item">
                      {editingId === user.id ? (
                        <div style={{ flex: 1, display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                          <input className="form-input" style={{ width: '90px' }} value={editForm.name}
                            onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
                          <input className="form-input" style={{ width: '100px' }} value={editForm.memo}
                            onChange={e => setEditForm(p => ({ ...p, memo: e.target.value }))} placeholder="메모" />
                          {groups.length > 0 && (
                            <select className="form-input" style={{ width: '90px', fontSize: '12px', padding: '4px' }}
                              value={editForm.group_id} onChange={e => setEditForm(p => ({ ...p, group_id: e.target.value }))}>
                              <option value="">그룹없음</option>
                              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>
                          )}
                          <div className="color-dot-grid" style={{ gap: '3px' }}>
                            {COLOR_PRESETS.map(c => (
                              <button key={c} className={`color-dot sm ${editForm.color === c ? 'active' : ''}`}
                                style={{ backgroundColor: c }} onClick={() => setEditForm(p => ({ ...p, color: c }))} />
                            ))}
                          </div>
                          <button className="btn btn-primary" style={{ padding: '4px 8px' }} onClick={() => handleUpdate(user.id)}><Check size={13} /></button>
                          <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setEditingId(null)}><X size={13} /></button>
                        </div>
                      ) : (
                        <>
                          <div className="user-color-badge" style={{ backgroundColor: user.color }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {user.name}
                              {userGroup && (
                                <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '10px', backgroundColor: userGroup.color + '22', color: userGroup.color, fontWeight: 700 }}>
                                  {userGroup.name}
                                </span>
                              )}
                            </div>
                            {user.memo && <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{user.memo}</div>}
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>일정 {userEventCount}개</div>
                          </div>
                          <button className="icon-btn-sm" onClick={() => startEdit(user)}><Edit2 size={13} /></button>
                          <button className="icon-btn-sm danger" onClick={() => handleDelete(user)}><Trash2 size={13} /></button>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
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
