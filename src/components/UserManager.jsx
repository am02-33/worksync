/**
 * UserManager
 *
 * 버그 수정:
 * 1. onClick → onPointerDown + stopPropagation (오버레이 클릭으로 모달 닫히는 문제)
 * 2. editForm.color undefined → COLOR_PRESETS[0] 기본값 보장
 * 3. editForm.group_id null → '' 빈 문자열로 변환 (select 오류 방지)
 * 4. is_pinned 필드 추가 (상단 고정)
 * 5. 수정 저장 후 성공 메시지
 */
import { useState } from 'react'
import { X, Plus, Trash2, Edit2, Check, Pin } from 'lucide-react'

const COLOR_PRESETS = [
  '#4F8EF7','#A855F7','#10B981','#F59E0B','#EF4444',
  '#EC4899','#14B8A6','#F97316','#6366F1','#84CC16',
  '#06B6D4','#8B5CF6',
]

const DEFAULT_COLOR = COLOR_PRESETS[0]

function isValidHex(val) {
  return /^#[0-9A-Fa-f]{6}$/.test(val)
}

function safeColor(val) {
  if (val && isValidHex(val)) return val
  return DEFAULT_COLOR
}

function ColorPicker({ value, onChange }) {
  const safeVal = safeColor(value)
  const [hexInput, setHexInput] = useState(safeVal)
  const [hexError, setHexError] = useState(false)

  const handleHexChange = (raw) => {
    setHexInput(raw)
    const clean = raw.startsWith('#') ? raw : '#' + raw
    if (isValidHex(clean)) {
      setHexError(false)
      onChange(clean)
    } else {
      setHexError(true)
    }
  }

  return (
    <div>
      <div className="color-dot-grid" style={{ marginBottom: '8px' }}>
        {COLOR_PRESETS.map(c => (
          <button
            key={c}
            className={`color-dot ${safeVal === c ? 'active' : ''}`}
            style={{ backgroundColor: c }}
            onPointerUp={() => { onChange(c); setHexInput(c); setHexError(false) }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          type="color"
          value={safeVal}
          onChange={e => { onChange(e.target.value); setHexInput(e.target.value) }}
          className="color-picker-small"
          title="컬러 피커"
        />
        <input
          className={`form-input ${hexError ? 'input-error' : ''}`}
          style={{ width: '110px', fontFamily: 'monospace', fontSize: '13px' }}
          type="text"
          placeholder="#FF5733"
          value={hexInput}
          onChange={e => handleHexChange(e.target.value)}
          onPointerDown={e => e.stopPropagation()}
        />
        <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: safeVal, border: '2px solid var(--border)', flexShrink: 0 }} />
      </div>
    </div>
  )
}

/* ── 상단 고정 체크박스 ────────────────────────────────────── */
function PinToggle({ checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none', padding: '4px 0' }}>
      <div
        style={{
          width: 20, height: 20, borderRadius: 5,
          border: `2px solid ${checked ? '#4F46E5' : '#CBD5E1'}`,
          background: checked ? '#4F46E5' : '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all .15s', flexShrink: 0,
        }}
        onPointerUp={() => onChange(!checked)}
      >
        {checked && <Check size={12} color="#fff" strokeWidth={3} />}
      </div>
      <span style={{ fontSize: '13px', fontWeight: 600, color: checked ? '#4F46E5' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Pin size={13} />
        상단 고정
        {checked && <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '10px', background: '#EEF2FF', color: '#4F46E5', fontWeight: 700 }}>고정됨</span>}
      </span>
    </label>
  )
}

export default function UserManager({ isOpen, onClose, users, groups, onAdd, onUpdate, onDelete, events }) {
  const [form, setForm] = useState({
    name: '', color: DEFAULT_COLOR, memo: '', group_id: '', is_pinned: false,
  })
  const [editingId, setEditingId]   = useState(null)
  const [editForm, setEditForm]     = useState({})
  const [error, setError]           = useState('')
  const [editError, setEditError]   = useState('')
  const [saveMsg, setSaveMsg]       = useState('')

  if (!isOpen) return null

  /* ── 추가 ──────────────────────────────────────────────── */
  const handleAdd = async () => {
    if (!form.name.trim()) { setError('이름을 입력하세요.'); return }
    const result = await onAdd({
      name:      form.name.trim(),
      color:     safeColor(form.color),
      memo:      form.memo || null,
      group_id:  form.group_id || null,
      is_pinned: form.is_pinned ?? false,
    })
    if (result.success) {
      setForm({ name: '', color: DEFAULT_COLOR, memo: '', group_id: '', is_pinned: false })
      setError('')
    } else {
      setError(result.error || '저장 실패')
    }
  }

  /* ── 수정 시작 — 모든 필드 안전하게 초기화 ────────────── */
  const startEdit = (user) => {
    setEditingId(user.id)
    setEditError('')
    setSaveMsg('')
    setEditForm({
      name:      user.name      || '',
      color:     safeColor(user.color),          // undefined/null 방지
      memo:      user.memo      || '',
      group_id:  user.group_id  || '',           // null → '' 변환 (select 오류 방지)
      is_pinned: user.is_pinned ?? false,        // undefined → false 변환
    })
  }

  /* ── 수정 저장 ─────────────────────────────────────────── */
  const handleUpdate = async (id) => {
    if (!editForm.name.trim()) { setEditError('이름을 입력하세요.'); return }
    const result = await onUpdate(id, {
      name:      editForm.name.trim(),
      color:     safeColor(editForm.color),
      memo:      editForm.memo || null,
      group_id:  editForm.group_id || null,
      is_pinned: editForm.is_pinned ?? false,
    })
    if (result.success) {
      setEditingId(null)
      setEditError('')
      setSaveMsg('변경사항이 저장되었습니다.')
      setTimeout(() => setSaveMsg(''), 3000)
    } else {
      setEditError(result.error || '저장 실패')
    }
  }

  /* ── 삭제 ──────────────────────────────────────────────── */
  const handleDelete = async (user) => {
    const cnt = events.filter(e => e.user_id === user.id).length
    if (cnt > 0 && !window.confirm(`${user.name}에게 배정된 일정이 ${cnt}개 있습니다. 그래도 삭제하시겠습니까?`)) return
    await onDelete(user.id)
  }

  /* ── 오버레이 클릭 처리 (수정 중에 닫히지 않도록) ─────── */
  const handleOverlayPointerDown = (e) => {
    // 수정 중이면 오버레이 클릭으로 닫히지 않음
    if (editingId) return
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="modal-overlay" onPointerDown={handleOverlayPointerDown}>
      <div className="modal modal-lg" onPointerDown={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">👥 사용자 관리</h2>
          <button className="modal-close" onPointerUp={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          {/* ── 저장 성공 메시지 ─────────────────────────── */}
          {saveMsg && (
            <div style={{ padding: '8px 12px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, color: '#16A34A', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              ✅ {saveMsg}
            </div>
          )}

          {/* ── 새 사용자 추가 폼 ────────────────────────── */}
          <div className="user-add-form">
            <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px' }}>새 사용자 추가</h3>
            {error && <div className="form-error">{error}</div>}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">이름 *</label>
                <input className="form-input" type="text" placeholder="이름 입력"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  onPointerDown={e => e.stopPropagation()}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()} />
              </div>
              <div className="form-group">
                <label className="form-label">메모/역할</label>
                <input className="form-input" type="text" placeholder="예: 파트타임"
                  value={form.memo}
                  onChange={e => setForm(p => ({ ...p, memo: e.target.value }))}
                  onPointerDown={e => e.stopPropagation()} />
              </div>
            </div>

            {groups.length > 0 && (
              <div className="form-group">
                <label className="form-label">소속 그룹</label>
                <select className="form-input" value={form.group_id}
                  onChange={e => setForm(p => ({ ...p, group_id: e.target.value }))}>
                  <option value="">그룹 없음</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">색상</label>
              <ColorPicker value={form.color} onChange={c => setForm(p => ({ ...p, color: c }))} />
            </div>

            <div className="form-group">
              <PinToggle checked={form.is_pinned} onChange={v => setForm(p => ({ ...p, is_pinned: v }))} />
            </div>

            <button className="btn btn-primary" onPointerUp={handleAdd} style={{ width: '100%', marginTop: '4px' }}>
              <Plus size={14} /> 사용자 추가
            </button>
          </div>

          {/* ── 등록된 사용자 목록 ──────────────────────── */}
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px' }}>
              등록된 사용자 ({users.length}명)
            </h3>

            {users.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', padding: '16px' }}>
                등록된 사용자가 없습니다.
              </p>
            ) : (
              <div className="user-list">
                {users.map(user => {
                  const userGroup = groups.find(g => g.id === user.group_id)
                  const cnt       = events.filter(e => e.user_id === user.id).length
                  const isPinned  = user.is_pinned ?? false

                  return (
                    <div key={user.id} className="user-list-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>

                      {/* ── 수정 폼 ───────────────────────────── */}
                      {editingId === user.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#4F46E5', marginBottom: '2px' }}>
                            ✏️ {user.name} 수정
                          </div>
                          {editError && <div className="form-error">{editError}</div>}

                          <div className="form-row">
                            <div className="form-group">
                              <label className="form-label">이름 *</label>
                              <input className="form-input" value={editForm.name} placeholder="이름"
                                onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                                onPointerDown={e => e.stopPropagation()} />
                            </div>
                            <div className="form-group">
                              <label className="form-label">메모/역할</label>
                              <input className="form-input" value={editForm.memo} placeholder="메모"
                                onChange={e => setEditForm(p => ({ ...p, memo: e.target.value }))}
                                onPointerDown={e => e.stopPropagation()} />
                            </div>
                          </div>

                          {groups.length > 0 && (
                            <div className="form-group">
                              <label className="form-label">소속 그룹</label>
                              <select className="form-input"
                                value={editForm.group_id ?? ''}
                                onChange={e => setEditForm(p => ({ ...p, group_id: e.target.value }))}>
                                <option value="">그룹 없음</option>
                                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                              </select>
                            </div>
                          )}

                          <div className="form-group">
                            <label className="form-label">색상</label>
                            <ColorPicker
                              value={editForm.color}
                              onChange={c => setEditForm(p => ({ ...p, color: c }))}
                            />
                          </div>

                          <div className="form-group">
                            <PinToggle
                              checked={editForm.is_pinned ?? false}
                              onChange={v => setEditForm(p => ({ ...p, is_pinned: v }))}
                            />
                          </div>

                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="btn btn-primary" style={{ flex: 1 }}
                              onPointerUp={() => handleUpdate(user.id)}>
                              <Check size={13} /> 변경사항 저장
                            </button>
                            <button className="btn btn-ghost"
                              onPointerUp={() => { setEditingId(null); setEditError('') }}>
                              <X size={13} /> 취소
                            </button>
                          </div>
                        </div>
                      ) : (

                        /* ── 일반 표시 행 ──────────────────────── */
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                          {/* 색상 배지 */}
                          <div style={{ position: 'relative', flexShrink: 0 }}>
                            <div className="user-color-badge" style={{ backgroundColor: safeColor(user.color) }} />
                            {isPinned && (
                              <div style={{ position: 'absolute', top: -4, right: -4, width: 10, height: 10, borderRadius: '50%', background: '#4F46E5', border: '1px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Pin size={6} color="#fff" />
                              </div>
                            )}
                          </div>

                          {/* 이름 + 정보 */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              {user.name}
                              {isPinned && (
                                <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '10px', background: '#EEF2FF', color: '#4F46E5', fontWeight: 700 }}>
                                  📌 고정
                                </span>
                              )}
                              {userGroup && (
                                <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '10px', backgroundColor: (userGroup.color || '#6366F1') + '22', color: userGroup.color || '#6366F1', fontWeight: 700 }}>
                                  {userGroup.name}
                                </span>
                              )}
                            </div>
                            {user.memo && (
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{user.memo}</div>
                            )}
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                              {safeColor(user.color)} · 일정 {cnt}개
                            </div>
                          </div>

                          {/* 수정/삭제 버튼 */}
                          <button className="icon-btn-sm" title="수정"
                            onPointerUp={() => startEdit(user)}>
                            <Edit2 size={13} />
                          </button>
                          <button className="icon-btn-sm danger" title="삭제"
                            onPointerUp={() => handleDelete(user)}>
                            <Trash2 size={13} />
                          </button>
                        </div>
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
            <button className="btn btn-ghost" onPointerUp={onClose}>닫기</button>
          </div>
        </div>
      </div>
    </div>
  )
}
