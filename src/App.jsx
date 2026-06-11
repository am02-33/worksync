import { useState, useCallback, useMemo, useEffect } from 'react'
import { format, eachDayOfInterval, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import Header from './components/Header'
import MonthView from './components/Calendar/MonthView'
import WeekView from './components/Calendar/WeekView'
import DayView from './components/Calendar/DayView'
import YearView from './components/Calendar/YearView'
import EventModal from './components/EventModal'
import QuickAssign from './components/QuickAssign'
import MobileDateModal from './components/MobileDateModal'
import UserManager from './components/UserManager'
import GroupManager from './components/GroupManager'
import HolidayManager from './components/HolidayManager'
import { useEvents } from './hooks/useEvents'
import { useUsers } from './hooks/useUsers'
import { useGroups } from './hooks/useGroups'
import { useHolidays } from './hooks/useHolidays'
import { sortUsers, SORT_OPTIONS } from './utils/sortUsers'

const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL
  return url && !url.includes('placeholder') && !url.includes('your-project')
}

export default function App() {
  // ── 반응형 모바일 감지 ─────────────────────────────────────
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  )
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  // ── 달력 상태 ──────────────────────────────────────────────
  const [currentDate, setCurrentDate]   = useState(new Date())
  const [viewMode, setViewMode]         = useState('month')
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedDates, setSelectedDates] = useState([])
  const [multiMode, setMultiMode]       = useState(false)
  const [lastClickedDate, setLastClickedDate] = useState(null)

  // ── 모달 상태 ──────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen]       = useState(false)
  const [editingEvent, setEditingEvent]     = useState(null)
  const [mobileDateModalOpen, setMobileDateModalOpen] = useState(false)
  const [isUserManagerOpen, setIsUserManagerOpen]     = useState(false)
  const [isGroupManagerOpen, setIsGroupManagerOpen]   = useState(false)
  const [isHolidayManagerOpen, setIsHolidayManagerOpen] = useState(false)

  // ── PC 교체 모드 ───────────────────────────────────────────
  const [swapFirstEvent, setSwapFirstEvent] = useState(null)

  // ── 모바일 교체 모드 ───────────────────────────────────────
  // mobileSwapFirstEvent: 첫 번째 선택된 일정 (App에서 보관)
  // mobileSwapMode: true면 캘린더에서 두 번째 날짜를 기다리는 상태
  const [mobileSwapMode, setMobileSwapMode]         = useState(false)
  const [mobileSwapFirstEvent, setMobileSwapFirstEvent] = useState(null)

  // ── 기타 ───────────────────────────────────────────────────
  const [quickMode, setQuickMode]       = useState(false)
  const [highlightUserId]               = useState(null)
  const [sortBy, setSortBy]             = useState(SORT_OPTIONS.NAME_ASC)

  const { events, loading, addEvent, updateEvent, deleteEvent, swapEvents, quickAssign, quickAssignGroup } = useEvents()
  const { users, addUser, updateUser, deleteUser } = useUsers()
  const { groups, addGroup, updateGroup, deleteGroup } = useGroups()
  const { dbHolidays, addCustomHoliday, deleteHoliday, updateHoliday, refreshYearHolidays, getHolidayName } = useHolidays(currentDate.getFullYear())

  const sortedUsers = useMemo(() => sortUsers(users, sortBy), [users, sortBy])

  // ── ESC 키 ─────────────────────────────────────────────────
  // input 등 타이핑 중에는 ESC가 모달을 닫으면 안 됨
  // → 포커스된 요소가 input/textarea/select이면 무시
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'Escape') return
      // 입력 중인 요소가 있으면 포커스만 해제하고 모달은 유지
      const tag = document.activeElement?.tagName?.toLowerCase()
      if (['input', 'textarea', 'select'].includes(tag)) {
        document.activeElement.blur()
        return
      }
      if (isHolidayManagerOpen)  { setIsHolidayManagerOpen(false);  return }
      if (isGroupManagerOpen)    { setIsGroupManagerOpen(false);     return }
      if (isUserManagerOpen)     { setIsUserManagerOpen(false);      return }
      if (isModalOpen)           { setIsModalOpen(false); setEditingEvent(null); return }
      if (mobileDateModalOpen)   { setMobileDateModalOpen(false);    return }
      if (mobileSwapMode)        { resetMobileSwap();                return }
      if (multiMode)             { clearMultiSelect();               return }
      if (swapFirstEvent)        { setSwapFirstEvent(null);          return }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isHolidayManagerOpen, isGroupManagerOpen, isUserManagerOpen, isModalOpen, mobileDateModalOpen, mobileSwapMode, multiMode, swapFirstEvent])

  // ── 모바일 교체 초기화 ─────────────────────────────────────
  const resetMobileSwap = useCallback(() => {
    setMobileSwapMode(false)
    setMobileSwapFirstEvent(null)
  }, [])

  // ── 모바일 교체 시작: MobileDateModal에서 firstEvent 전달 ──
  const handleMobileSwapStart = useCallback((firstEvent) => {
    setMobileSwapFirstEvent(firstEvent)
    setMobileSwapMode(true)
    // 모달은 이미 닫혀있음 (MobileDateModal에서 onClose() 호출)
  }, [])

  // ── 날짜 클릭 ──────────────────────────────────────────────
  const handleDayClick = useCallback((date, opts = {}) => {
    const { shiftKey = false, ctrlKey = false } = opts
    const dateStr = format(date, 'yyyy-MM-dd')

    // 모바일 교체 2단계: 두 번째 날짜 선택
    if (isMobile && mobileSwapMode) {
      const firstDateStr = mobileSwapFirstEvent
        ? format(new Date(mobileSwapFirstEvent.date), 'yyyy-MM-dd')
        : null
      if (firstDateStr && dateStr === firstDateStr) {
        alert('같은 날짜는 선택할 수 없습니다. 다른 날짜를 선택하세요.')
        return
      }
      // 두 번째 날짜 선택 → 모달을 swapReadyForSecond=true로 열기
      setSelectedDate(date)
      setMobileDateModalOpen(true)
      return
    }

    // 모바일 일반 클릭 → 날짜 액션 모달
    if (isMobile && !multiMode) {
      setSelectedDate(date)
      setSelectedDates([])
      setMobileDateModalOpen(true)
      if (viewMode === 'year') setViewMode('month')
      return
    }

    // 다중 선택 (Ctrl)
    if (multiMode || ctrlKey) {
      setSelectedDates(prev => {
        const next = prev.includes(dateStr)
          ? prev.filter(d => d !== dateStr)
          : [...prev, dateStr]
        if (next.length === 0) { setMultiMode(false); return [] }
        return next
      })
      setSelectedDate(date)
      setLastClickedDate(dateStr)
      return
    }

    // Shift 범위 선택
    if (shiftKey && lastClickedDate) {
      try {
        const start = lastClickedDate < dateStr ? parseISO(lastClickedDate) : date
        const end   = lastClickedDate < dateStr ? date : parseISO(lastClickedDate)
        const range = eachDayOfInterval({ start, end }).map(d => format(d, 'yyyy-MM-dd'))
        setSelectedDates(prev => Array.from(new Set([...prev, ...range])))
        setSelectedDate(date)
      } catch {}
      return
    }

    // 일반 단일 클릭 (PC)
    setSelectedDates([])
    setMultiMode(false)
    setSelectedDate(date)
    setLastClickedDate(dateStr)
    if (viewMode === 'year') setViewMode('month')
  }, [isMobile, mobileSwapMode, mobileSwapFirstEvent, multiMode, lastClickedDate, viewMode])

  const handleLongPress = useCallback((date) => {
    setMultiMode(true)
    setMobileDateModalOpen(false)
    const dateStr = format(date, 'yyyy-MM-dd')
    setSelectedDates([dateStr])
    setSelectedDate(date)
    setLastClickedDate(dateStr)
  }, [])

  const clearMultiSelect = useCallback(() => {
    setMultiMode(false)
    setSelectedDates([])
  }, [])

  // ── 이벤트 클릭 ────────────────────────────────────────────
  const handleEventClick = useCallback((event) => {
    // 담당자 변경
    if (event._changeToUser) {
      const u = event._changeToUser
      updateEvent(event.id, { assignee: u.name, color: u.color, user_id: u.id })
      return
    }
    // PC 교체 모드
    if (swapFirstEvent) {
      if (swapFirstEvent.id === event.id) { setSwapFirstEvent(null); return }
      const fmtD = (d) => { try { return format(new Date(d), 'M월 d일', { locale: ko }) } catch { return d } }
      if (window.confirm(`${fmtD(swapFirstEvent.date)} ${swapFirstEvent.assignee}와\n${fmtD(event.date)} ${event.assignee}의 근무를 교체할까요?`)) {
        swapEvents(swapFirstEvent, event)
      }
      setSwapFirstEvent(null)
      return
    }
    setEditingEvent(event)
    setIsModalOpen(true)
    setMobileDateModalOpen(false)
  }, [swapFirstEvent, swapEvents, updateEvent])

  // ── 일정 추가 ──────────────────────────────────────────────
  const handleAddEvent = useCallback((date) => {
    setEditingEvent(null)
    if (date) setSelectedDate(date instanceof Date ? date : new Date(date))
    setIsModalOpen(true)
    setMobileDateModalOpen(false)
  }, [])

  const handleSaveEvent = async (formData) => {
    if (editingEvent) return await updateEvent(editingEvent.id, formData)
    return await addEvent(formData)
  }

  // ── 선택 날짜 일정 삭제 ────────────────────────────────────
  const handleDeleteSelected = useCallback(async () => {
    const targets = selectedDates.length > 0
      ? selectedDates
      : selectedDate ? [format(selectedDate, 'yyyy-MM-dd')] : []
    if (targets.length === 0) { alert('날짜를 먼저 선택하세요.'); return }
    const evs = events.filter(e => targets.includes(e.date))
    if (evs.length === 0) { alert('선택된 날짜에 일정이 없습니다.'); return }
    const msg = targets.length === 1
      ? `${targets[0]}의 모든 일정(${evs.length}개)을 삭제할까요?`
      : `선택된 ${targets.length}일의 일정(${evs.length}개)을 삭제합니다. 계속하시겠습니까?`
    if (!window.confirm(msg)) return
    for (const ev of evs) await deleteEvent(ev.id)
    if (targets.length > 1) alert(`${targets.length}개 날짜의 일정이 삭제되었습니다.`)
    clearMultiSelect()
  }, [selectedDates, selectedDate, events, deleteEvent, clearMultiSelect])

  // ── 빠른 배정 ──────────────────────────────────────────────
  const handleQuickAssign = useCallback(async (dateStr, user) => {
    const dates = selectedDates.length > 0 ? selectedDates : [dateStr]
    for (const d of dates) await quickAssign(d, user)
  }, [selectedDates, quickAssign])

  const handleQuickAssignGroup = useCallback(async (dateStr, group, members) => {
    const dates = selectedDates.length > 0 ? selectedDates : [dateStr]
    for (const d of dates) await quickAssignGroup(d, group, members)
  }, [selectedDates, quickAssignGroup])

  if (!isSupabaseConfigured()) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0F2F5', padding: '20px' }}>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '40px', maxWidth: '480px', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔧</div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Supabase 설정 필요</h1>
          <p style={{ color: '#64748B', fontSize: '14px', marginTop: '8px' }}>.env 파일에 환경변수를 설정해주세요.</p>
        </div>
      </div>
    )
  }

  // 모바일 교체 2단계 여부: 두 번째 날짜 클릭 후 모달이 열리는 경우
  const isSwapSecondStep = isMobile && mobileSwapMode && mobileSwapFirstEvent !== null

  return (
    <div className="app">
      <Header
        currentDate={currentDate} viewMode={viewMode}
        onDateChange={setCurrentDate}
        onViewModeChange={(m) => { setViewMode(m); setMobileDateModalOpen(false) }}
        onAddEvent={() => handleAddEvent(selectedDate || currentDate)}
        onUserManager={() => setIsUserManagerOpen(true)}
        onGroupManager={() => setIsGroupManagerOpen(true)}
        onHolidayManager={() => setIsHolidayManagerOpen(true)}
        quickMode={quickMode} onQuickModeToggle={() => setQuickMode(p => !p)}
        sortBy={sortBy} onSortChange={setSortBy}
        onDeleteSelected={handleDeleteSelected}
        selectedDate={selectedDate} selectedDates={selectedDates}
      />

      {/* PC 교체 배너 */}
      {swapFirstEvent && (
        <div className="swap-top-banner">
          🔄 <strong>{swapFirstEvent.assignee}</strong> — 교체할 일정 클릭
          <button onPointerUp={() => setSwapFirstEvent(null)}
            style={{ marginLeft: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontWeight: 700, fontSize: '16px', touchAction: 'manipulation' }}>✕</button>
        </div>
      )}

      {/* 모바일 교체 2단계 배너 */}
      {mobileSwapMode && mobileSwapFirstEvent && (
        <div className="swap-top-banner" style={{ background: '#7C3AED' }}>
          🔄 <strong>{mobileSwapFirstEvent.assignee}</strong> 선택됨 — 교체할 날짜를 탭하세요
          <button onPointerUp={resetMobileSwap}
            style={{ marginLeft: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontWeight: 700, fontSize: '16px', touchAction: 'manipulation' }}>✕ 취소</button>
        </div>
      )}

      {(selectedDates.length > 0 || multiMode) && (
        <div className="multi-select-banner">
          <span>📅 <strong>{selectedDates.length}개</strong> 날짜 선택됨</span>
          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
            <button className="multi-banner-btn" onPointerUp={() => setSelectedDates([])}>선택 해제</button>
            <button className="multi-banner-btn danger" onPointerUp={clearMultiSelect}>종료</button>
          </div>
        </div>
      )}

      <main className="main">
        <div className="calendar-area">
          {loading && <div className="loading-overlay"><div className="loading-spinner" /></div>}

          {viewMode === 'year' && (
            <YearView currentDate={currentDate} events={events} users={users}
              sortBy={sortBy} onDayClick={handleDayClick} onLongPress={handleLongPress}
              highlightUserId={highlightUserId} getHolidayName={getHolidayName}
              selectedDates={selectedDates} />
          )}
          {viewMode === 'month' && (
            <MonthView currentDate={currentDate} events={events} users={users}
              sortBy={sortBy} onDayClick={handleDayClick} onLongPress={handleLongPress}
              onEventClick={handleEventClick} selectedDate={selectedDate}
              highlightUserId={highlightUserId} swapFirstEvent={swapFirstEvent}
              getHolidayName={getHolidayName} selectedDates={selectedDates} />
          )}
          {viewMode === 'week' && (
            <WeekView currentDate={currentDate} events={events} users={sortedUsers}
              onDayClick={handleDayClick} onEventClick={handleEventClick}
              selectedDate={selectedDate} getHolidayName={getHolidayName}
              sortBy={sortBy} onAddEvent={handleAddEvent}
              onQuickAssign={handleQuickAssign} onQuickAssignGroup={handleQuickAssignGroup}
              groups={groups} />
          )}
          {viewMode === 'day' && (
            <DayView currentDate={currentDate} events={events} users={sortedUsers}
              onEventClick={handleEventClick} onAddEvent={handleAddEvent}
              getHolidayName={getHolidayName} sortBy={sortBy}
              onQuickAssign={handleQuickAssign} onQuickAssignGroup={handleQuickAssignGroup}
              groups={groups} onDeleteDay={handleDeleteSelected} />
          )}
        </div>

        {!isMobile && (
          <QuickAssign
            selectedDate={selectedDate} selectedDates={selectedDates} multiMode={multiMode}
            users={users} sortedUsers={sortedUsers} groups={groups} events={events}
            onQuickAssign={handleQuickAssign} onQuickAssignGroup={handleQuickAssignGroup}
            onEventClick={handleEventClick} onAddEvent={() => handleAddEvent(selectedDate || currentDate)}
            swapFirstEvent={swapFirstEvent} quickMode={quickMode} sortBy={sortBy}
            onClearMulti={clearMultiSelect} getHolidayName={getHolidayName}
          />
        )}
      </main>

      {/* 모바일 날짜 액션 모달 */}
      <MobileDateModal
        isOpen={mobileDateModalOpen}
        onClose={() => setMobileDateModalOpen(false)}
        selectedDate={selectedDate}
        events={events} users={sortedUsers} groups={groups}
        getHolidayName={getHolidayName} sortBy={sortBy}
        onEventClick={handleEventClick} onAddEvent={handleAddEvent}
        onQuickAssign={handleQuickAssign} onQuickAssignGroup={handleQuickAssignGroup}
        onDeleteDay={handleDeleteSelected}
        onHolidayManager={() => setIsHolidayManagerOpen(true)}
        onSwapEvents={swapEvents}
        // 교체 관련
        swapReadyForSecond={isSwapSecondStep}
        swapFirstEvent={mobileSwapFirstEvent}
        onSwapStart={handleMobileSwapStart}
        onSwapReset={resetMobileSwap}
      />

      {/* PC 일정 추가/수정 모달 */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingEvent(null) }}
        onSave={handleSaveEvent} onDelete={deleteEvent}
        onSwapStart={setSwapFirstEvent}
        event={editingEvent} defaultDate={selectedDate || currentDate} users={sortedUsers}
      />

      <UserManager isOpen={isUserManagerOpen} onClose={() => setIsUserManagerOpen(false)}
        users={sortedUsers} groups={groups} onAdd={addUser} onUpdate={updateUser} onDelete={deleteUser} events={events} />
      <GroupManager isOpen={isGroupManagerOpen} onClose={() => setIsGroupManagerOpen(false)}
        groups={groups} users={sortedUsers} onAddGroup={addGroup} onUpdateGroup={updateGroup}
        onDeleteGroup={deleteGroup} onUpdateUser={updateUser} />
      <HolidayManager isOpen={isHolidayManagerOpen} onClose={() => setIsHolidayManagerOpen(false)}
        dbHolidays={dbHolidays} onAdd={addCustomHoliday} onDelete={deleteHoliday}
        onUpdate={updateHoliday} onRefresh={refreshYearHolidays} currentYear={currentDate.getFullYear()} />
    </div>
  )
}
