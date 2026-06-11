import { ChevronLeft, ChevronRight, Plus, Calendar, Shield } from 'lucide-react'
import { format, addMonths, addWeeks, addDays, subMonths, subWeeks, subDays } from 'date-fns'
import { ko } from 'date-fns/locale'

export default function Header({
  currentDate,
  viewMode,
  onDateChange,
  onViewModeChange,
  onAddEvent,
  isAdmin,
  onAdminToggle,
}) {
  const goNext = () => {
    if (viewMode === 'month') onDateChange(addMonths(currentDate, 1))
    else if (viewMode === 'week') onDateChange(addWeeks(currentDate, 1))
    else onDateChange(addDays(currentDate, 1))
  }

  const goPrev = () => {
    if (viewMode === 'month') onDateChange(subMonths(currentDate, 1))
    else if (viewMode === 'week') onDateChange(subWeeks(currentDate, 1))
    else onDateChange(subDays(currentDate, 1))
  }

  const goToday = () => onDateChange(new Date())

  const getTitle = () => {
    if (viewMode === 'month') return format(currentDate, 'yyyy년 M월', { locale: ko })
    if (viewMode === 'week') return format(currentDate, 'yyyy년 M월', { locale: ko })
    return format(currentDate, 'yyyy년 M월 d일 (EEE)', { locale: ko })
  }

  return (
    <header className="header">
      <div className="header-inner">
        {/* 로고 */}
        <div className="logo">
          <Calendar size={22} className="logo-icon" />
          <span className="logo-text">WorkSync</span>
        </div>

        {/* 네비게이션 */}
        <div className="nav-center">
          <button className="nav-btn" onClick={goPrev} aria-label="이전">
            <ChevronLeft size={18} />
          </button>
          <div className="nav-title-group">
            <h1 className="nav-title">{getTitle()}</h1>
            <button className="today-btn" onClick={goToday}>오늘</button>
          </div>
          <button className="nav-btn" onClick={goNext} aria-label="다음">
            <ChevronRight size={18} />
          </button>
        </div>

        {/* 우측 액션 */}
        <div className="header-actions">
          {/* 보기 모드 탭 */}
          <div className="view-tabs">
            {['month', 'week', 'day'].map((mode) => (
              <button
                key={mode}
                className={`view-tab ${viewMode === mode ? 'active' : ''}`}
                onClick={() => onViewModeChange(mode)}
              >
                {mode === 'month' ? '월' : mode === 'week' ? '주' : '일'}
              </button>
            ))}
          </div>

          {/* 관리자 버튼 */}
          <button
            className={`admin-btn ${isAdmin ? 'active' : ''}`}
            onClick={onAdminToggle}
            title={isAdmin ? '관리자 모드 ON' : '관리자 모드 OFF'}
          >
            <Shield size={16} />
          </button>

          {/* 일정 추가 버튼 */}
          <button className="add-btn" onClick={onAddEvent}>
            <Plus size={18} />
            <span className="add-btn-text">일정 추가</span>
          </button>
        </div>
      </div>
    </header>
  )
}
