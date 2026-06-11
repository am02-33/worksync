import { ChevronLeft, ChevronRight, Users, Zap, Tag, CalendarDays, Trash2 } from 'lucide-react'
import { format, addMonths, subMonths, addYears, subYears } from 'date-fns'
import { ko } from 'date-fns/locale'
import { SORT_OPTIONS } from '../utils/sortUsers'

export default function Header({
  currentDate, viewMode, onDateChange, onViewModeChange,
  onAddEvent, onUserManager, onGroupManager, onHolidayManager,
  quickMode, onQuickModeToggle, sortBy, onSortChange, onDeleteAll,
}) {
  const goNext = () => viewMode === 'year' ? onDateChange(addYears(currentDate, 1)) : onDateChange(addMonths(currentDate, 1))
  const goPrev = () => viewMode === 'year' ? onDateChange(subYears(currentDate, 1)) : onDateChange(subMonths(currentDate, 1))
  const goToday = () => onDateChange(new Date())

  const getTitle = () => {
    if (viewMode === 'year') return format(currentDate, 'yyyy년', { locale: ko })
    if (viewMode === 'month' || viewMode === 'week') return format(currentDate, 'yyyy년 M월', { locale: ko })
    return format(currentDate, 'yyyy년 M월 d일 (EEE)', { locale: ko })
  }

  const handleDeleteAll = () => {
    if (!window.confirm('정말 모든 일정을 삭제할까요?\n(사용자·그룹 정보는 삭제되지 않습니다)')) return
    if (!window.confirm('⚠️ 삭제하면 복구할 수 없습니다.\n그래도 삭제할까요?')) return
    onDeleteAll()
  }

  return (
    <header className="header">
      <div className="header-inner">
        <div className="logo">
          <div className="logo-mark"><span className="logo-mark-inner">O</span></div>
          <div className="logo-text-group">
            <span className="logo-text">OKWOOD</span>
            <span className="logo-sub">근무 스케줄</span>
          </div>
        </div>

        <div className="nav-center">
          <button className="nav-btn" onClick={goPrev}><ChevronLeft size={16} /></button>
          <div className="nav-title-group">
            <h1 className="nav-title">{getTitle()}</h1>
            <button className="today-btn" onClick={goToday}>오늘</button>
          </div>
          <button className="nav-btn" onClick={goNext}><ChevronRight size={16} /></button>
        </div>

        <div className="header-actions">
          <div className="view-tabs">
            {[{ key: 'year', label: '연간' }, { key: 'month', label: '월간' }, { key: 'week', label: '주간' }, { key: 'day', label: '일간' }].map(({ key, label }) => (
              <button key={key} className={`view-tab ${viewMode === key ? 'active' : ''}`} onClick={() => onViewModeChange(key)}>{label}</button>
            ))}
          </div>

          <select className="sort-select" value={sortBy} onChange={e => onSortChange(e.target.value)} title="정렬 기준">
            <option value={SORT_OPTIONS.NAME_ASC}>가나다순</option>
            <option value={SORT_OPTIONS.NAME_DESC}>역순</option>
            <option value={SORT_OPTIONS.REGISTERED}>등록순</option>
          </select>

          <button className={`quick-btn ${quickMode ? 'active' : ''}`} onClick={onQuickModeToggle} title="빠른 배정 모드">
            <Zap size={14} />
            <span className="quick-btn-text">{quickMode ? '빠른ON' : '빠른배정'}</span>
          </button>

          <button className="icon-btn" onClick={onHolidayManager} title="공휴일 관리"><CalendarDays size={15} /></button>
          <button className="icon-btn" onClick={onGroupManager} title="그룹 관리"><Tag size={15} /></button>
          <button className="icon-btn" onClick={onUserManager} title="사용자 관리"><Users size={15} /></button>
          <button className="icon-btn danger-icon" onClick={handleDeleteAll} title="전체 일정 삭제"><Trash2 size={15} /></button>

          <button className="add-btn" onClick={onAddEvent}>
            <span>＋</span>
            <span className="add-btn-text">일정 추가</span>
          </button>
        </div>
      </div>
    </header>
  )
}
