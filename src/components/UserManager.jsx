/**
 * UserManager.jsx
 *
 * UI 깨짐 원인 수정:
 * - 수정 폼을 user-list-item 안에 인라인으로 넣지 않음
 * - 수정 버튼 → UserEditModal (별도 모달) 열기
 * - 사용자 목록은 항상 동일한 카드 레이아웃 유지
 * - ColorPicker가 모달 안에서만 렌더링
 */
import { useState } from 'react'
import { X, Plus, Trash2, Edit2, Check, Pin } from 'lucide-react'

const COLOR_PRESETS = [
  '#4F8EF7','#A855F7','#10B981','#F59E0B','#EF4444',
  '#EC4899','#14B8A6','#F97316','#6366F1','#84CC16',
  '#06B6D4','#8B5CF6',
]
const DEFAULT_COLOR = '#4F8EF7'

function safeColor(val) {
  if (val && /^#[0-9A-Fa-f]{6}$/.test(val)) return val
  return DEFAULT_COLOR
}

/* ── 색상 선택 컴포넌트 (모달 안에서만 사용) ────────────── */
function ColorPicker({ value, onChange }) {
  const safe = safeColor(value)
  const [hex, setHex] = useState(safe)
  const [hexErr, setHexErr] = useState(false)

  const applyHex = (raw) => {
    setHex(raw)
    const c = raw.startsWith('#') ? raw : '#' + raw
    if (/^#[0-9A-Fa-f]{6}$/.test(c)) { setHexErr(false); onChange(c) }
    else setHexErr(true)
  }

  return (
    <div>
      {/* 프리셋 팔레트 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
        {COLOR_PRESETS.map(c => (
          <button key={c}
            onPointerUp={() => { onChange(c); setHex(c); setHexErr(false) }}
            style={{
              width: 28, height: 28, borderRadius: '50%',
              backgroundColor: c, border: safe === c ? '3px solid #0F172A' : '2px solid transparent',
              cursor: 'pointer', flexShrink: 0, transform: safe === c ? 'scale(1.2)' : 'scale(1)',
              transition: 'transform .12s',
            }} />
        ))}
      </div>
      {/* 직접 입력 */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input type="color" value={safe}
          onChange={e => { onChange(e.target.value); setHex(e.target.value) }}
          style={{ width: 36, height: 36, border: 'none', cursor: 'pointer', borderRadius: 6, padding: 2, background: 'var(--border)' }}
          title="컬러 피커" />
        <input
          className={`form-input ${hexErr ? 'input-error' : ''}`}
          style={{ width: '120px', fontFamily: 'monospace', fontSize: '13px' }}
          type="text" placeholder="#FF5733" value={hex}
          onChange={e => applyHex(e.target.value)}
          onPointerDown={e => e.stopPropagation()} />
        <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: safe, border: '2px solid var(--border)', flexShrink: 0 }} />
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{safe}</span>
      </div>
    </div>
  )
}

/* ── 상단 고정 토글 ─────────────────────────────────────── */
function PinToggle({ checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none', padding: '8px 12px', background: checked ? '#EEF2FF' : 'var(--surface-2)', borderRadius: 8, border: `1px solid ${checked ? '#C7D2FE' : 'var(--border)'}` }}>
      <div
        onPointerUp={() => onChange(!checked)}
        style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${checked ? '#4F46E5' : '#CBD5E1'}`, background: checked ? '#4F46E5' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s', flexShrink: 0 }}>
        {checked && <Check size={13} color="#fff" strokeWidth={3} />}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: checked ? '#4F46E5' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Pin size={13} /> 상단 고정
        </div>
        <div style={{ fontSize: 11, color: checked ? '#6366F1' : 'var(--text-muted)' }}>
          {checked ? '✅ 캘린더에서 항상 위에 표시됩니다' : '체크 시 모든 날짜에서 최상단에 표시'}
        </div>
      </div>
    </label>
  )
}

/* ════════════════════════════════════════════════════════
   UserEditModal — 수정 전용 별도 모달
   사용자 목록과 완전히 분리되어 렌더링
════════════════════════════════════════════════════════ */
function UserEditModal({ user, groups, onSave, onClose }) {
  const [form, setForm] = useState({
    name:      user.name      || '',
    color:     safeColor(user.color),
    memo:      user.memo      || '',
    group_id:  user.group_id  || '',
    is_pinned: Boolean(user.is_pinned),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const handleSave = async () => {
    if (!form.name.trim()) { setError('이름을 입력하세요.'); return }
    setSaving(true); setError('')
    const result = await onSave(user.id, {
      name:      form.name.trim(),
      color:     safeColor(form.color),
      memo:      form.memo  || null,
      group_id:  form.group_id || null,
      is_pinned: Boolean(form.is_pinned),
    })
    setSaving(false)
    if (result?.success === false) setError(result.error || '저장 실패')
    else onClose()
  }

  // 오버레이 클릭으로만 닫기 (내부 클릭은 전파 차단)
  const handleOverlay = (e) => { if (e.target === e.currentTarget) onClose() }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onPointerDown={handleOverlay}>
      <div
        style={{ background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 480, maxHeight: '90dvh', display: 'flex', flexDirection: 'column', boxShadow: '0 12px 40px rgba(0,0,0,.2)', overflow: 'hidden' }}
        onPointerDown={e => e.stopPropagation()}>

        {/* 헤더 */}
        <div style={{ padding: '16px 20px', borderBottom: '3px solid var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>✏️ 사용자 수정</h3>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>변경 후 저장 버튼을 눌러주세요</div>
          </div>
          <button onPointerUp={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'var(--surface-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            <X size={18} />
          </button>
        </div>

        {/* 폼 바디 */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', WebkitOverflowScrolling: 'touch', display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
          {error && <div className="form-error">{error}</div>}

          {/* 이름 */}
          <div className="form-group">
            <label className="form-label">이름 *</label>
            <input className="form-input" type="text" placeholder="이름 입력"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              onPointerDown={e => e.stopPropagation()}
              onKeyDown={e => e.key === 'Enter' && handleSave()} />
          </div>

          {/* 메모/역할 */}
          <div className="form-group">
            <label className="form-label">메모/역할</label>
            <input className="form-input" type="text" placeholder="예: 파트타임"
              value={form.memo}
              onChange={e => setForm(p => ({ ...p, memo: e.target.value }))}
              onPointerDown={e => e.stopPropagation()} />
          </div>

          {/* 그룹 */}
          {groups.length > 0 && (
            <div className="form-group">
              <label className="form-label">소속 그룹</label>
              <select className="form-input"
                value={form.group_id ?? ''}
                onChange={e => setForm(p => ({ ...p, group_id: e.target.value }))}>
                <option value="">그룹 없음</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          )}

          {/* 색상 */}
          <div className="form-group">
            <label className="form-label">색상</label>
            <ColorPicker value={form.color} onChange={c => setForm(p => ({ ...p, color: c }))} />
          </div>

          {/* 상단 고정 */}
          <div className="form-group">
            <label className="form-label">표시 설정</label>
            <PinToggle checked={form.is_pinned} onChange={v => setForm(p => ({ ...p, is_pinned: v }))} />
          </div>
        </div>

        {/* 푸터 버튼 */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, flexShrink: 0 }}>
          <button className="btn btn-ghost" onPointerUp={onClose} disabled={saving} style={{ flex: 1 }}>
            취소
          </button>
          <button className="btn btn-primary" onPointerUp={handleSave} disabled={saving} style={{ flex: 2 }}>
            <Check size={15} /> {saving ? '저장 중…' : '변경사항 저장'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   UserManager — 메인 컴포넌트
════════════════════════════════════════════════════════ */
export default function UserManager({ isOpen, onClose, users, groups, onAdd, onUpdate, onDelete, events }) {
  // 신규 등록 폼 상태
  const [form, setForm] = useState({
    name: '', color: DEFAULT_COLOR, memo: '', group_id: '', is_pinned: false,
  })
  const [addError, setAddError]     = useState('')

  // 수정 모달 상태 — 목록과 완전히 분리
  const [editUser, setEditUser]     = useState(null)   // 수정할 사용자 객체
  const [saveMsg, setSaveMsg]       = useState('')

  if (!isOpen) return null

  /* ── 신규 등록 ───────────────────────────────────────── */
  const handleAdd = async () => {
    if (!form.name.trim()) { setAddError('이름을 입력하세요.'); return }
    const result = await onAdd({
      name:      form.name.trim(),
      color:     safeColor(form.color),
      memo:      form.memo || null,
      group_id:  form.group_id || null,
      is_pinned: Boolean(form.is_pinned),
    })
    if (result.success) {
      setForm({ name: '', color: DEFAULT_COLOR, memo: '', group_id: '', is_pinned: false })
      setAddError('')
    } else {
      setAddError(result.error || '저장 실패')
    }
  }

  /* ── 수정 저장 (UserEditModal에서 호출) ─────────────── */
  const handleUpdate = async (id, data) => {
    const result = await onUpdate(id, data)
    if (result.success) {
      setEditUser(null)
      setSaveMsg('변경사항이 저장되었습니다.')
      setTimeout(() => setSaveMsg(''), 3000)
    }
    return result
  }

  /* ── 삭제 ────────────────────────────────────────────── */
  const handleDelete = async (user) => {
    const cnt = events.filter(e => e.user_id === user.id).length
    if (cnt > 0 && !window.confirm(`${user.name}에게 배정된 일정이 ${cnt}개 있습니다. 그래도 삭제하시겠습니까?`)) return
    await onDelete(user.id)
  }

  /* ── 오버레이 ────────────────────────────────────────── */
  const handleOverlay = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <>
      {/* ── 메인 사용자 관리 모달 ──────────────────────── */}
      <div className="modal-overlay" onPointerDown={handleOverlay}>
        <div className="modal modal-lg" onPointerDown={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">👥 사용자 관리</h2>
            <button className="modal-close" onPointerUp={onClose}><X size={18} /></button>
          </div>

          <div className="modal-body">
            {/* 저장 성공 메시지 */}
            {saveMsg && (
              <div style={{ padding: '8px 12px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, color: '#16A34A', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                ✅ {saveMsg}
              </div>
            )}

            {/* ── 신규 등록 폼 ─────────────────────────── */}
            <div className="user-add-form">
              <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px' }}>새 사용자 등록</h3>
              {addError && <div className="form-error">{addError}</div>}

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
                {/* 신규 등록 폼의 ColorPicker는 여기서도 안전 — 모달 안에 있음 */}
                <ColorPicker value={form.color} onChange={c => setForm(p => ({ ...p, color: c }))} />
              </div>

              <div className="form-group">
                <PinToggle checked={form.is_pinned} onChange={v => setForm(p => ({ ...p, is_pinned: v }))} />
              </div>

              <button className="btn btn-primary" onPointerUp={handleAdd} style={{ width: '100%', marginTop: '4px' }}>
                <Plus size={14} /> 사용자 등록
              </button>
            </div>

            {/* ── 등록된 사용자 목록 ───────────────────── */}
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
                    const isPinned  = Boolean(user.is_pinned)

                    return (
                      /* ── 사용자 카드: 항상 동일한 레이아웃 유지 ── */
                      <div key={user.id} className="user-list-item">
                        {/* 색상 배지 (핀 표시 포함) */}
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <div className="user-color-badge" style={{ backgroundColor: safeColor(user.color) }} />
                          {isPinned && (
                            <div style={{ position: 'absolute', top: -3, right: -3, width: 10, height: 10, borderRadius: '50%', background: '#4F46E5', border: '1.5px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Pin size={6} color="#fff" />
                            </div>
                          )}
                        </div>

                        {/* 이름 + 정보 */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                            {user.name}
                            {isPinned && (
                              <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: 10, background: '#EEF2FF', color: '#4F46E5', fontWeight: 700 }}>📌 고정</span>
                            )}
                            {userGroup && (
                              <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: 10, backgroundColor: (userGroup.color || '#6366F1') + '22', color: userGroup.color || '#6366F1', fontWeight: 700 }}>
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

                        {/* 수정 버튼 — 클릭 시 UserEditModal 열기 (인라인 폼 없음) */}
                        <button
                          className="icon-btn-sm"
                          title="수정"
                          onPointerUp={() => setEditUser(user)}>
                          <Edit2 size={13} />
                        </button>

                        {/* 삭제 버튼 */}
                        <button
                          className="icon-btn-sm danger"
                          title="삭제"
                          onPointerUp={() => handleDelete(user)}>
                          <Trash2 size={13} />
                        </button>
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

      {/* ── 수정 전용 모달 — 목록과 완전히 분리된 별도 레이어 ── */}
      {editUser && (
        <UserEditModal
          user={editUser}
          groups={groups}
          onSave={handleUpdate}
          onClose={() => setEditUser(null)}
        />
      )}
    </>
  )
}
