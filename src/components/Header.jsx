import { ChevronLeft, ChevronRight, Users, Zap, BarChart2 } from 'lucide-react'
import { format, addMonths, subMonths, addYears, subYears } from 'date-fns'
import { ko } from 'date-fns/locale'

export default function Header({
  currentDate, viewMode, onDateChange, onViewModeChange,
  onAddEvent, onUserManager, onStatsPanel, quickMode, onQuickModeToggle,
}) {
  const goNext = () => {
    if (viewMode === 'year') onDateChange(addYears(currentDate, 1))
    else onDateChange(addMonths(currentDate, 1))
  }
  const goPrev = () => {
    if (viewMode === 'year') onDateChange(subYears(currentDate, 1))
    else onDateChange(subMonths(currentDate, 1))
  }
  const goToday = () => onDateChange(new Date())

  const getTitle = () => {
    if (viewMode === 'year') return format(currentDate, 'yyyy년', { locale: ko })
    if (viewMode === 'month') return format(currentDate, 'yyyy년 M월', { locale: ko })
    if (viewMode === 'week') return format(currentDate, 'yyyy년 M월', { locale: ko })
    return format(currentDate, 'yyyy년 M월 d일 (EEE)', { locale: ko })
  }

  return (
    <header className="header">
      <div className="header-inner">
        {/* 로고 */}
        <div className="logo">
          <div className="logo-mark">
            <span className="logo-mark-inner">O</span>
          </div>
          <div className="logo-text-group">
            <span className="logo-text">OKWOOD</span>
            <span className="logo-sub">근무 스케줄</span>
          </div>
        </div>

        {/* 네비게이션 */}
        <div className="nav-center">
          <button className="nav-btn" onClick={goPrev}><ChevronLeft size={16} /></button>
          <div className="nav-title-group">
            <h1 className="nav-title">{getTitle()}</h1>
            <button className="today-btn" onClick={goToday}>오늘</button>
          </div>
          <button className="nav-btn" onClick={goNext}><ChevronRight size={16} /></button>
        </div>

        {/* 우측 액션 */}
        <div className="header-actions">
          {/* 보기 탭 */}
          <div className="view-tabs">
            {[
              { key: 'year', label: '연간' },
              { key: 'month', label: '월간' },
              { key: 'week', label: '주간' },
              { key: 'day', label: '일간' },
            ].map(({ key, label }) => (
              <button key={key} className={`view-tab ${viewMode === key ? 'active' : ''}`} onClick={() => onViewModeChange(key)}>
                {label}
              </button>
            ))}
          </div>

          {/* 빠른 배정 모드 */}
          <button className={`quick-btn ${quickMode ? 'active' : ''}`} onClick={onQuickModeToggle} title="빠른 배정 모드">
            <Zap size={15} />
            <span className="quick-btn-text">{quickMode ? '빠른배정 ON' : '빠른배정'}</span>
          </button>

          {/* 통계 */}
          <button className="icon-btn" onClick={onStatsPanel} title="근무 통계">
            <BarChart2 size={16} />
          </button>

          {/* 사용자 관리 */}
          <button className="icon-btn" onClick={onUserManager} title="사용자 관리">
            <Users size={16} />
          </button>

          {/* 일정 추가 */}
          <button className="add-btn" onClick={onAddEvent}>
            <span>＋</span>
            <span className="add-btn-text">일정 추가</span>
          </button>
        </div>
      </div>
    </header>
  )
}
