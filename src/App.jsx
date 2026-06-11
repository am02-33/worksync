import { useState, useCallback, useMemo, useEffect } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import Header from './components/Header'
import MonthView from './components/Calendar/MonthView'
import WeekView from './components/Calendar/WeekView'
import DayView from './components/Calendar/DayView'
import YearView from './components/Calendar/YearView'
import EventModal from './components/EventModal'
import QuickAssign from './components/QuickAssign'
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
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('month')
  const [selectedDate, setSelectedDate] = useState(null)

  // ===== 다중 날짜 선택 =====
  const [selectedDates, setSelectedDates] = useState([]) // 'YYYY-MM-DD' 배열
  const [multiMode, setMultiMode] = useState(false)      // 다중 선택 모드 (모바일 long-press 후 활성)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [isUserManagerOpen, setIsUserManagerOpen] = useState(false)
  const [isGroupManagerOpen, setIsGroupManagerOpen] = useState(false)
  const [isHolidayManagerOpen, setIsHolidayManagerOpen] = useState(false)
  const [quickMode, setQuickMode] = useState(false)
  const [swapFirstEvent, setSwapFirstEvent] = useState(null)
  const [highlightUserId, setHighlightUserId] = useState(null)
  const [sortBy, setSortBy] = useState(SORT_OPTIONS.NAME_ASC)

  const { events, loading, addEvent, updateEvent, deleteEvent, deleteAllEvents, swapEvents, quickAssign, quickAssignGroup } = useEvents()
  const { users, addUser, updateUser, deleteUser } = useUsers()
  const { groups, addGroup, updateGroup, deleteGroup } = useGroups()
  const { dbHolidays, addCustomHoliday, deleteHoliday, updateHoliday, refreshYearHolidays, getHolidayName } = useHolidays(currentDate.getFullYear())

  const sortedUsers = useMemo(() => sortUsers(users, sortBy), [users, sortBy])

  // ===== ESC 키로 모달 닫기 =====
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'Escape') return
      // 가장 위에 있는 모달부터 닫기
      if (isHolidayManagerOpen) { setIsHolidayManagerOpen(false); return }
      if (isGroupManagerOpen)   { setIsGroupManagerOpen(false);   return }
      if (isUserManagerOpen)    { setIsUserManagerOpen(false);    return }
      if (isModalOpen)          { setIsModalOpen(false); setEditingEvent(null); return }
      if (multiMode)            { setMultiMode(false); setSelectedDates([]);    return }
      if (swapFirstEvent)       { setSwapFirstEvent(null);                      return }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isHolidayManagerOpen, isGroupManagerOpen, isUserManagerOpen, isModalOpen, multiMode, swapFirstEvent])

  // ===== 날짜 클릭 =====
  // shiftKey: PC 다중 선택 / mobile multiMode: 터치 다중 선택
  const handleDayClick = (date, shiftKey = false) => {
    const dateStr = format(date, 'yyyy-MM-dd')

    if (shiftKey || multiMode) {
      // 다중 선택 토글
      setSelectedDates(prev => {
        const exists = prev.includes(dateStr)
        return exists ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
      })
      setSelectedDate(date)
      return
    }

    // 일반 단일 선택
    setSelectedDates([])
    setSelectedDate(date)
    if (viewMode === 'year') setViewMode('month')
  }

  // 모바일 Long-press 다중 선택 모드 진입
  const handleLongPress = (date) => {
    setMultiMode(true)
    const dateStr = format(date, 'yyyy-MM-dd')
    setSelectedDates([dateStr])
    setSelectedDate(date)
  }

  const clearMultiSelect = () => {
    setMultiMode(false)
    setSelectedDates([])
  }

  // ===== 이 날짜 일정 전체 삭제 =====
  const handleDeleteDayEvents = async () => {
    if (!selectedDate) return
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    const dayEvents = events.filter(e => e.date === dateStr)
    if (dayEvents.length === 0) { alert('이 날짜에 일정이 없습니다.'); return }

    const label = format(selectedDate, 'yyyy년 M월 d일', { locale: ko })
    if (!window.confirm(`${label}의 모든 일정을 삭제할까요?\n(${dayEvents.length}개)`)) return

    for (const ev of dayEvents) {
      await deleteEvent(ev.id)
    }
  }

  const handleEventClick = (event) => {
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
  }

  const handleAddEvent = useCallback((date) => {
    setEditingEvent(null)
    if (date) setSelectedDate(date instanceof Date ? date : new Date(date))
    setIsModalOpen(true)
  }, [])

  const handleSaveEvent = async (formData) => {
    if (editingEvent) return await updateEvent(editingEvent.id, formData)
    return await addEvent(formData)
  }

  // ===== 빠른 배정: 단일 또는 다중 날짜 =====
  const handleQuickAssign = async (dateStr, user) => {
    const dates = selectedDates.length > 0 ? selectedDates : [dateStr]
    for (const d of dates) {
      await quickAssign(d, user)
    }
    // 선택 유지 (기본값)
  }

  // ===== 그룹 배정: 단일 또는 다중 날짜 =====
  const handleQuickAssignGroup = async (dateStr, group, members) => {
    const dates = selectedDates.length > 0 ? selectedDates : [dateStr]
    for (const d of dates) {
      await quickAssignGroup(d, group, members)
    }
  }

  if (!isSupabaseConfigured()) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0F2F5', padding: '20px' }}>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '40px', maxWidth: '500px', width: '100%', textAlign: 'center' }}>
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
        currentDate={currentDate}
        viewMode={viewMode}
        onDateChange={setCurrentDate}
        onViewModeChange={setViewMode}
        onAddEvent={() => handleAddEvent(selectedDate || currentDate)}
        onUserManager={() => setIsUserManagerOpen(true)}
        onGroupManager={() => setIsGroupManagerOpen(true)}
        onHolidayManager={() => setIsHolidayManagerOpen(true)}
        quickMode={quickMode}
        onQuickModeToggle={() => setQuickMode(p => !p)}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onDeleteDayEvents={handleDeleteDayEvents}
        selectedDate={selectedDate}
      />

      {/* 교체 모드 배너 */}
      {swapFirstEvent && (
        <div className="swap-top-banner">
          🔄 <strong>{swapFirstEvent.assignee}</strong> 선택됨 — 교체할 다른 일정을 클릭하세요
          <button onClick={() => setSwapFirstEvent(null)} style={{ marginLeft: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontWeight: 700 }}>✕ 취소</button>
        </div>
      )}

      {/* 다중 선택 배너 */}
      {(selectedDates.length > 0 || multiMode) && (
        <div className="multi-select-banner">
          <span>📅 <strong>{selectedDates.length}개</strong> 날짜 선택됨</span>
          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
            <button className="multi-banner-btn" onClick={() => setSelectedDates([])}>선택 해제</button>
            <button className="multi-banner-btn danger" onClick={clearMultiSelect}>다중선택 종료</button>
          </div>
        </div>
      )}

      <main className="main">
        <div className="calendar-area">
          {loading && <div className="loading-overlay"><div className="loading-spinner" /></div>}

          {viewMode === 'year' && (
            <YearView
              currentDate={currentDate} events={events} users={users}
              sortBy={sortBy} onDayClick={handleDayClick} onLongPress={handleLongPress}
              highlightUserId={highlightUserId} getHolidayName={getHolidayName}
              selectedDates={selectedDates}
            />
          )}
          {viewMode === 'month' && (
            <MonthView
              currentDate={currentDate} events={events} users={users}
              sortBy={sortBy} onDayClick={handleDayClick} onLongPress={handleLongPress}
              onEventClick={handleEventClick} selectedDate={selectedDate}
              highlightUserId={highlightUserId} swapFirstEvent={swapFirstEvent}
              getHolidayName={getHolidayName} selectedDates={selectedDates}
            />
          )}
          {viewMode === 'week' && (
            <WeekView currentDate={currentDate} events={events}
              onDayClick={handleDayClick} onEventClick={handleEventClick} selectedDate={selectedDate} />
          )}
          {viewMode === 'day' && (
            <DayView currentDate={currentDate} events={events}
              onEventClick={handleEventClick} onAddEvent={() => handleAddEvent(currentDate)} />
          )}
        </div>

        <QuickAssign
          selectedDate={selectedDate}
          selectedDates={selectedDates}
          multiMode={multiMode}
          users={users}
          sortedUsers={sortedUsers}
          groups={groups}
          events={events}
          onQuickAssign={handleQuickAssign}
          onQuickAssignGroup={handleQuickAssignGroup}
          onEventClick={handleEventClick}
          onAddEvent={() => handleAddEvent(selectedDate || currentDate)}
          swapFirstEvent={swapFirstEvent}
          quickMode={quickMode}
          sortBy={sortBy}
          onClearMulti={clearMultiSelect}
        />
      </main>

      <EventModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingEvent(null) }}
        onSave={handleSaveEvent}
        onDelete={deleteEvent}
        onSwapStart={setSwapFirstEvent}
        event={editingEvent}
        defaultDate={selectedDate || currentDate}
        users={sortedUsers}
      />

      <UserManager
        isOpen={isUserManagerOpen}
        onClose={() => setIsUserManagerOpen(false)}
        users={sortedUsers}
        groups={groups}
        onAdd={addUser}
        onUpdate={updateUser}
        onDelete={deleteUser}
        events={events}
      />

      <GroupManager
        isOpen={isGroupManagerOpen}
        onClose={() => setIsGroupManagerOpen(false)}
        groups={groups}
        users={sortedUsers}
        onAddGroup={addGroup}
        onUpdateGroup={updateGroup}
        onDeleteGroup={deleteGroup}
        onUpdateUser={updateUser}
      />

      <HolidayManager
        isOpen={isHolidayManagerOpen}
        onClose={() => setIsHolidayManagerOpen(false)}
        dbHolidays={dbHolidays}
        onAdd={addCustomHoliday}
        onDelete={deleteHoliday}
        onUpdate={updateHoliday}
        onRefresh={refreshYearHolidays}
        currentYear={currentDate.getFullYear()}
      />
    </div>
  )
}
