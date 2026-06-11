import { useState } from 'react'
import { X, Shield } from 'lucide-react'

export default function AdminModal({ isOpen, onClose, onSuccess }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = () => {
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin1234'
    if (password === adminPassword) {
      onSuccess()
      setPassword('')
      setError('')
      onClose()
    } else {
      setError('비밀번호가 올바르지 않습니다.')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} color="#6366F1" />
            <h2 className="modal-title">관리자 인증</h2>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            관리자 비밀번호를 입력하면 일정 삭제 권한이 부여됩니다.
          </p>
          {error && <div className="form-error">{error}</div>}
          <input
            className="form-input"
            type="password"
            placeholder="관리자 비밀번호"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoFocus
          />
        </div>
        <div className="modal-footer">
          <div className="modal-footer-right">
            <button className="btn btn-ghost" onClick={onClose}>취소</button>
            <button className="btn btn-primary" onClick={handleSubmit}>확인</button>
          </div>
        </div>
      </div>
    </div>
  )
}
