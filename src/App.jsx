import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
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

const isMobile = () => typeof window !== 'undefined' && window.innerWidth <= 768

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('month')
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedDates, setSelectedDates] = useState([])
  const [multiMode, setMultiMode] = useState(false)
  const [lastClickedDate, setLastClickedDate] = useState(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [mobileDateModalOpen, setMobileDateModalOpen] = useState(false)
  const [isUserManagerOpen, setIsUserManagerOpen] = useState(false)
  const [isGroupManagerOpen, setIsGroupManagerOpen] = useState(false)
  const [isHolidayManagerOpen, setIsHolidayManagerOpen] = useState(false)

  const [quickMode, setQuickMode] = useState(false)
  const [swapFirstEvent, setSwapFirstEvent] = useState(null)
  const [highlightUserId, setHighlightUserId] = useState(null)
  const [sortBy, setSortBy] = useState(SORT_OPTIONS.NAME_ASC)

  const { events, loading, addEvent, updateEvent, deleteEvent, swapEvents, quickAssign, quickAssignGroup } = useEvents()
  const { users, addUser, updateUser, deleteUser } = useUsers()
  const { groups, addGroup, updateGroup, deleteGroup } = useGroups()
  const { dbHolidays, addCustomHoliday, deleteHoliday, updateHoliday, refreshYearHolidays, getHolidayName } = useHolidays(currentDate.getFullYear())

  const sortedUsers = useMemo(() => sortUsers(users, sortBy), [users, sortBy])

  // ESC 키
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'Escape') return
      if (isHolidayManagerOpen)  { setIsHolidayManagerOpen(false);  return }
      if (isGroupManagerOpen)    { setIsGroupManagerOpen(false);     return }
      if (isUserManagerOpen)     { setIsUserManagerOpen(false);      return }
      if (isModalOpen)           { setIsModalOpen(false); setEditingEvent(null); return }
      if (mobileDateModalOpen)   { setMobileDateModalOpen(false);    return }
      if (multiMode)             { setMultiMode(false); setSelectedDates([]); return }
      if (swapFirstEvent)        { setSwapFirstEvent(null);          return }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isHolidayManagerOpen, isGroupManagerOpen, isUserManagerOpen, isModalOpen, mobileDateModalOpen, multiMode, swapFirstEvent])

  // ===== 날짜 클릭 =====
  const handleDayClick = (date, opts = {}) => {
    const { shiftKey = false, ctrlKey = false } = opts
    const dateStr = format(date, 'yyyy-MM-dd')

    if (isMobile() && !multiMode) {
      // 모바일: 날짜 선택 모달 열기
      setSelectedDate(date)
      setSelectedDates([])
      setMobileDateModalOpen(true)
      if (viewMode === 'year') setViewMode('month')
      return
    }

    if (multiMode || ctrlKey) {
      setSelectedDates(prev => {
        const exists = prev.includes(dateStr)
        const next = exists ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
        if (next.length === 0) { setMultiMode(false); return [] }
        return next
      })
      setSelectedDate(date)
      setLastClickedDate(dateStr)
      return
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

    setSelectedDates([])
    setMultiMode(false)
    setSelectedDate(date)
    setLastClickedDate(dateStr)
    if (viewMode === 'year') setViewMode('month')
  }

  const handleLongPress = (date) => {
    setMultiMode(true)
    setMobileDateModalOpen(false)
    const dateStr = format(date, 'yyyy-MM-dd')
    setSelectedDates([dateStr])
    setSelectedDate(date)
    setLastClickedDate(dateStr)
  }

  const clearMultiSelect = () => { setMultiMode(false); setSelectedDates([]) }

  // ===== 이벤트 클릭: 교체 모드 or 수정 모달 or 변경 처리 =====
  const handleEventClick = (event) => {
    // 모바일 근무자 변경 흐름에서 _changeToUser가 있으면 업데이트
    if (event._changeToUser) {
      const newUser = event._changeToUser
      updateEvent(event.id, {
        assignee: newUser.name,
        color: newUser.color,
        user_id: newUser.id,
      })
      return
    }

    if (swapFirstEvent) {
      if (swapFirstEvent.id === event.id) { setSwapFirstEvent(null); return }
      const fmtDate = (d) => { try { return format(new Date(d), 'M월 d일', { locale: ko }) } catch { return d } }
      if (window.confirm(`${fmtDate(swapFirstEvent.date)} ${swapFirstEvent.assignee}와\n${fmtDate(event.date)} ${event.assignee}의 근무를 교체할까요?`)) {
        swapEvents(swapFirstEvent, event)
      }
      setSwapFirstEvent(null)
      return
    }

    setEditingEvent(event)
    setIsModalOpen(true)
    setMobileDateModalOpen(false)
  }

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

  // 선택 날짜 일정 삭제
  const handleDeleteSelected = async () => {
    const targets = selectedDates.length > 0
      ? selectedDates
      : selectedDate ? [format(selectedDate, 'yyyy-MM-dd')] : []

    if (targets.length === 0) { alert('날짜를 먼저 선택하세요.'); return }

    const targetEvents = events.filter(e => targets.includes(e.date))
    if (targetEvents.length === 0) { alert('선택된 날짜에 일정이 없습니다.'); return }

    const dateList = targets.length === 1
      ? `${targets[0]}의 모든 일정(${targetEvents.length}개)을 삭제할까요?`
      : `선택된 날짜:\n${targets.map(d => `• ${d}`).join('\n')}\n\n총 ${targets.length}일의 일정(${targetEvents.length}개)을 삭제합니다.\n계속하시겠습니까?`

    if (!window.confirm(dateList)) return
    for (const ev of targetEvents) await deleteEvent(ev.id)
    if (targets.length > 1) alert(`${targets.length}개 날짜의 일정이 삭제되었습니다.`)
    clearMultiSelect()
  }

  // 빠른 배정
  const handleQuickAssign = async (dateStr, user) => {
    const dates = selectedDates.length > 0 ? selectedDates : [dateStr]
    for (const d of dates) await quickAssign(d, user)
  }

  const handleQuickAssignGroup = async (dateStr, group, members) => {
    const dates = selectedDates.length > 0 ? selectedDates : [dateStr]
    for (const d of dates) await quickAssignGroup(d, group, members)
  }

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
          <button onClick={() => setSwapFirstEvent(null)}
            style={{ marginLeft: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontWeight: 700 }}>✕</button>
        </div>
      )}

      {(selectedDates.length > 0 || multiMode) && (
        <div className="multi-select-banner">
          <span>📅 <strong>{selectedDates.length}개</strong> 날짜 선택됨</span>
          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
            <button className="multi-banner-btn" onClick={() => setSelectedDates([])}>선택 해제</button>
            <button className="multi-banner-btn danger" onClick={clearMultiSelect}>종료</button>
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
            <WeekView currentDate={currentDate} events={events}
              onDayClick={(d) => handleDayClick(d)} onEventClick={handleEventClick} selectedDate={selectedDate} />
          )}
          {viewMode === 'day' && (
            <DayView currentDate={currentDate} events={events}
              onEventClick={handleEventClick} onAddEvent={() => handleAddEvent(currentDate)} />
          )}
        </div>

        {/* PC 사이드바 */}
        <QuickAssign
          selectedDate={selectedDate} selectedDates={selectedDates} multiMode={multiMode}
          users={users} sortedUsers={sortedUsers} groups={groups} events={events}
          onQuickAssign={handleQuickAssign} onQuickAssignGroup={handleQuickAssignGroup}
          onEventClick={handleEventClick} onAddEvent={() => handleAddEvent(selectedDate || currentDate)}
          swapFirstEvent={swapFirstEvent} quickMode={quickMode} sortBy={sortBy}
          onClearMulti={clearMultiSelect} getHolidayName={getHolidayName}
        />
      </main>

      {/* 모바일 날짜 액션 모달 */}
      <MobileDateModal
        isOpen={mobileDateModalOpen}
        onClose={() => setMobileDateModalOpen(false)}
        selectedDate={selectedDate}
        events={events}
        users={sortedUsers}
        groups={groups}
        getHolidayName={getHolidayName}
        sortBy={sortBy}
        onEventClick={handleEventClick}
        onAddEvent={handleAddEvent}
        onQuickAssign={handleQuickAssign}
        onQuickAssignGroup={handleQuickAssignGroup}
        onDeleteDay={handleDeleteSelected}
        onSwapStart={setSwapFirstEvent}
        onHolidayManager={() => setIsHolidayManagerOpen(true)}
      />

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
