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
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  )
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  const [currentDate, setCurrentDate]   = useState(new Date())
  const [viewMode, setViewMode]         = useState('month')
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedDates, setSelectedDates] = useState([])
  const [multiMode, setMultiMode]       = useState(false)
  const [lastClickedDate, setLastClickedDate] = useState(null)

  const [isModalOpen, setIsModalOpen]       = useState(false)
  const [editingEvent, setEditingEvent]     = useState(null)
  const [mobileDateModalOpen, setMobileDateModalOpen] = useState(false)
  const [isUserManagerOpen, setIsUserManagerOpen]     = useState(false)
  const [isGroupManagerOpen, setIsGroupManagerOpen]   = useState(false)
  const [isHolidayManagerOpen, setIsHolidayManagerOpen] = useState(false)

  const [swapFirstEvent, setSwapFirstEvent]     = useState(null)
  const [mobileSwapMode, setMobileSwapMode]     = useState(false)
  const [mobileSwapFirstEvent, setMobileSwapFirstEvent] = useState(null)

  const [quickMode, setQuickMode] = useState(false)
  const [sortBy, setSortBy]       = useState(SORT_OPTIONS.NAME_ASC)

  const { events, loading, addEvent, addMultipleEvents, updateEvent, deleteEvent, swapEvents, quickAssign, quickAssignGroup } = useEvents()
  const { users, addUser, updateUser, deleteUser } = useUsers()
  const { groups, addGroup, updateGroup, deleteGroup } = useGroups()
  const { dbHolidays, addCustomHoliday, deleteHoliday, updateHoliday, refreshYearHolidays, getHolidayName } = useHolidays(currentDate.getFullYear())

  const sortedUsers = useMemo(() => sortUsers(users, sortBy), [users, sortBy])

  // ESC — input 입력 중에는 blur만, 그 외에는 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'Escape') return
      const tag = document.activeElement?.tagName?.toLowerCase()
      if (['input', 'textarea', 'select'].includes(tag)) {
        document.activeElement.blur(); return
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

  const resetMobileSwap = useCallback(() => {
    setMobileSwapMode(false); setMobileSwapFirstEvent(null)
  }, [])

  const handleMobileSwapStart = useCallback((firstEvent) => {
    setMobileSwapFirstEvent(firstEvent); setMobileSwapMode(true)
  }, [])

  // 날짜 클릭
  const handleDayClick = useCallback((date, opts = {}) => {
    const { shiftKey = false, ctrlKey = false } = opts
    const dateStr = format(date, 'yyyy-MM-dd')

    if (isMobile && mobileSwapMode) {
      const firstDs = mobileSwapFirstEvent ? format(new Date(mobileSwapFirstEvent.date), 'yyyy-MM-dd') : null
      if (firstDs && dateStr === firstDs) { alert('같은 날짜는 선택할 수 없습니다.'); return }
      setSelectedDate(date); setMobileDateModalOpen(true); return
    }

    if (isMobile && !multiMode) {
      setSelectedDate(date); setSelectedDates([]); setMobileDateModalOpen(true)
      if (viewMode === 'year') setViewMode('month'); return
    }

    if (multiMode || ctrlKey) {
      setSelectedDates(prev => {
        const next = prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
        if (next.length === 0) { setMultiMode(false); return [] }
        return next
      })
      setSelectedDate(date); setLastClickedDate(dateStr); return
    }

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

    setSelectedDates([]); setMultiMode(false)
    setSelectedDate(date); setLastClickedDate(dateStr)
    if (viewMode === 'year') setViewMode('month')
  }, [isMobile, mobileSwapMode, mobileSwapFirstEvent, multiMode, lastClickedDate, viewMode])

  const handleLongPress = useCallback((date) => {
    setMultiMode(true); setMobileDateModalOpen(false)
    const ds = format(date, 'yyyy-MM-dd')
    setSelectedDates([ds]); setSelectedDate(date); setLastClickedDate(ds)
  }, [])

  const clearMultiSelect = useCallback(() => { setMultiMode(false); setSelectedDates([]) }, [])

  const handleEventClick = useCallback((event) => {
    if (event._changeToUser) {
      const u = event._changeToUser
      updateEvent(event.id, { assignee: u.name, color: u.color, user_id: u.id }); return
    }
    if (swapFirstEvent) {
      if (swapFirstEvent.id === event.id) { setSwapFirstEvent(null); return }
      const fmtD = (d) => { try { return format(new Date(d), 'M월 d일', { locale: ko }) } catch { return d } }
      if (window.confirm(`${fmtD(swapFirstEvent.date)} ${swapFirstEvent.assignee}와\n${fmtD(event.date)} ${event.assignee}의 근무를 교체할까요?`)) {
        swapEvents(swapFirstEvent, event)
      }
      setSwapFirstEvent(null); return
    }
    setEditingEvent(event); setIsModalOpen(true); setMobileDateModalOpen(false)
  }, [swapFirstEvent, swapEvents, updateEvent])

  const handleAddEvent = useCallback((date) => {
    setEditingEvent(null)
    if (date) setSelectedDate(date instanceof Date ? date : new Date(date))
    setIsModalOpen(true); setMobileDateModalOpen(false)
  }, [])

  // 단일 저장 (수정)
  const handleSaveEvent = async (formData) => {
    if (editingEvent) return await updateEvent(editingEvent.id, formData)
    return await addEvent(formData)
  }

  // 다중 저장 (추가 — EventModal / MobileDateModal 공용)
  const handleSaveMultiple = async (commonData, selectedUsers) => {
    return await addMultipleEvents(commonData, selectedUsers)
  }

  const handleDeleteSelected = useCallback(async () => {
    const targets = selectedDates.length > 0 ? selectedDates : selectedDate ? [format(selectedDate, 'yyyy-MM-dd')] : []
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
      <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F0F2F5', padding:'20px' }}>
        <div style={{ background:'#fff', borderRadius:'16px', padding:'40px', maxWidth:'480px', width:'100%', textAlign:'center' }}>
          <div style={{ fontSize:'48px', marginBottom:'16px' }}>🔧</div>
          <h1 style={{ fontSize:'22px', fontWeight:700 }}>Supabase 설정 필요</h1>
          <p style={{ color:'#64748B', fontSize:'14px', marginTop:'8px' }}>.env 파일에 환경변수를 설정해주세요.</p>
        </div>
      </div>
    )
  }

  const isSwapSecondStep = isMobile && mobileSwapMode && !!mobileSwapFirstEvent

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

      {swapFirstEvent && (
        <div className="swap-top-banner">
          🔄 <strong>{swapFirstEvent.assignee}</strong> — 교체할 일정 클릭
          <button onPointerUp={() => setSwapFirstEvent(null)} style={{ marginLeft:'12px', background:'none', border:'none', cursor:'pointer', color:'#fff', fontWeight:700, fontSize:'16px', touchAction:'manipulation' }}>✕</button>
        </div>
      )}

      {mobileSwapMode && mobileSwapFirstEvent && (
        <div className="swap-top-banner" style={{ background:'#7C3AED' }}>
          🔄 <strong>{mobileSwapFirstEvent.assignee}</strong> — 교체할 날짜를 탭하세요
          <button onPointerUp={resetMobileSwap} style={{ marginLeft:'12px', background:'none', border:'none', cursor:'pointer', color:'#fff', fontWeight:700, fontSize:'16px', touchAction:'manipulation' }}>✕ 취소</button>
        </div>
      )}

      {(selectedDates.length > 0 || multiMode) && (
        <div className="multi-select-banner">
          <span>📅 <strong>{selectedDates.length}개</strong> 날짜 선택됨</span>
          <div style={{ display:'flex', gap:'8px', marginLeft:'auto' }}>
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
              highlightUserId={null} getHolidayName={getHolidayName} selectedDates={selectedDates} />
          )}
          {viewMode === 'month' && (
            <MonthView currentDate={currentDate} events={events} users={users}
              sortBy={sortBy} onDayClick={handleDayClick} onLongPress={handleLongPress}
              onEventClick={handleEventClick} selectedDate={selectedDate}
              highlightUserId={null} swapFirstEvent={swapFirstEvent}
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

      <MobileDateModal
        isOpen={mobileDateModalOpen}
        onClose={() => setMobileDateModalOpen(false)}
        selectedDate={selectedDate} events={events} users={sortedUsers} groups={groups}
        getHolidayName={getHolidayName} sortBy={sortBy}
        onEventClick={handleEventClick} onAddEvent={handleAddEvent}
        onQuickAssign={handleQuickAssign} onQuickAssignGroup={handleQuickAssignGroup}
        onDeleteDay={handleDeleteSelected}
        onHolidayManager={() => setIsHolidayManagerOpen(true)}
        onSwapEvents={swapEvents}
        swapReadyForSecond={isSwapSecondStep}
        swapFirstEvent={mobileSwapFirstEvent}
        onSwapStart={handleMobileSwapStart}
        onSwapReset={resetMobileSwap}
        onSaveMultiple={handleSaveMultiple}
      />

      <EventModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingEvent(null) }}
        onSave={handleSaveEvent}
        onSaveMultiple={handleSaveMultiple}
        onDelete={deleteEvent}
        onSwapStart={setSwapFirstEvent}
        event={editingEvent} defaultDate={selectedDate || currentDate}
        users={sortedUsers} groups={groups}
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
