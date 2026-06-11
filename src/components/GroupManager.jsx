import { useState } from 'react'
import { X, Plus, Trash2, Edit2, Check, Users } from 'lucide-react'

const COLOR_PRESETS = ['#6366F1','#8B5CF6','#EC4899','#EF4444','#F97316','#F59E0B','#10B981','#14B8A6','#3B82F6','#06B6D4']

export default function GroupManager({ isOpen, onClose, groups, users, onAddGroup, onUpdateGroup, onDeleteGroup, onUpdateUser }) {
  const [form, setForm] = useState({ name: '', color: COLOR_PRESETS[0], memo: '' })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleAdd = async () => {
    if (!form.name.trim()) { setError('그룹 이름을 입력하세요.'); return }
    const result = await onAddGroup(form)
    if (result.success) { setForm({ name: '', color: COLOR_PRESETS[0], memo: '' }); setError('') }
    else setError(result.error)
  }

  const handleDelete = async (group) => {
    const members = users.filter(u => u.group_id === group.id)
    if (members.length > 0) {
      if (!window.confirm(`"${group.name}"에 ${members.length}명이 속해 있습니다.\n그래도 삭제하시겠습니까?\n(멤버들의 그룹 연결만 해제됩니다)`)) return
    }
    await onDeleteGroup(group.id)
  }

  const handleUserGroupChange = async (userId, groupId) => {
    await onUpdateUser(userId, { group_id: groupId || null })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">🏷️ 그룹 관리</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          {/* 그룹 추가 */}
          <div className="user-add-form">
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px' }}>새 그룹 추가</h3>
            {error && <div className="form-error">{error}</div>}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">그룹명</label>
                <input className="form-input" type="text" placeholder="예: A그룹, 주간팀"
                  value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()} />
              </div>
              <div className="form-group">
                <label className="form-label">메모</label>
                <input className="form-input" type="text" placeholder="설명 (선택)"
                  value={form.memo} onChange={e => setForm(p => ({ ...p, memo: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">그룹 색상</label>
              <div className="color-dot-grid">
                {COLOR_PRESETS.map(c => (
                  <button key={c} className={`color-dot ${form.color === c ? 'active' : ''}`}
                    style={{ backgroundColor: c }} onClick={() => setForm(p => ({ ...p, color: c }))} />
                ))}
                <input type="color" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                  className="color-picker-small" title="직접 선택" />
              </div>
            </div>
            <button className="btn btn-primary" onClick={handleAdd} style={{ width: '100%' }}>
              <Plus size={14} /> 그룹 추가
            </button>
          </div>

          {/* 그룹 목록 */}
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px' }}>등록된 그룹 ({groups.length}개)</h3>
            {groups.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', padding: '16px' }}>등록된 그룹이 없습니다.</p>
            ) : (
              <div className="user-list">
                {groups.map(group => {
                  const members = users.filter(u => u.group_id === group.id)
                  return (
                    <div key={group.id} style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', marginBottom: '8px' }}>
                      {/* 그룹 헤더 */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--surface-2)' }}>
                        {editingId === group.id ? (
                          <>
                            <input className="form-input" style={{ width: '120px' }} value={editForm.name}
                              onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
                            <div className="color-dot-grid" style={{ gap: '4px' }}>
                              {COLOR_PRESETS.map(c => (
                                <button key={c} className={`color-dot sm ${editForm.color === c ? 'active' : ''}`}
                                  style={{ backgroundColor: c }} onClick={() => setEditForm(p => ({ ...p, color: c }))} />
                              ))}
                            </div>
                            <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '12px' }}
                              onClick={async () => { await onUpdateGroup(group.id, editForm); setEditingId(null) }}>
                              <Check size={12} />
                            </button>
                            <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '12px' }}
                              onClick={() => setEditingId(null)}>
                              <X size={12} />
                            </button>
                          </>
                        ) : (
                          <>
                            <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: group.color, flexShrink: 0 }} />
                            <span style={{ fontWeight: 700, fontSize: '14px', flex: 1 }}>{group.name}</span>
                            {group.memo && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{group.memo}</span>}
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{members.length}명</span>
                            <button className="icon-btn-sm" onClick={() => { setEditingId(group.id); setEditForm({ name: group.name, color: group.color, memo: group.memo || '' }) }}>
                              <Edit2 size={13} />
                            </button>
                            <button className="icon-btn-sm danger" onClick={() => handleDelete(group)}>
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                      {/* 멤버 목록 */}
                      <div style={{ padding: '8px 12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {members.length === 0 ? (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>멤버 없음</span>
                        ) : (
                          members.map(u => (
                            <span key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', background: u.color + '22', color: u.color, padding: '3px 8px', borderRadius: '20px', fontWeight: 600 }}>
                              {u.name}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 사용자별 그룹 배정 */}
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px' }}>사용자 그룹 배정</h3>
            {users.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>등록된 사용자가 없습니다.</p>
            ) : (
              <div className="user-list">
                {users.map(user => (
                  <div key={user.id} className="user-list-item">
                    <div className="user-color-badge" style={{ backgroundColor: user.color }} />
                    <span style={{ flex: 1, fontWeight: 600, fontSize: '13px' }}>{user.name}</span>
                    <select
                      className="form-input"
                      style={{ width: 'auto', fontSize: '12px', padding: '4px 8px' }}
                      value={user.group_id || ''}
                      onChange={e => handleUserGroupChange(user.id, e.target.value)}
                    >
                      <option value="">그룹 없음</option>
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                ))}
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
