import { useState, useCallback, useMemo } from 'react'
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

  const handleDayClick = (date) => {
    setSelectedDate(date)
    if (viewMode === 'year') setViewMode('month')
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

  const handleDeleteAll = async () => {
    const result = await deleteAllEvents()
    if (!result.success) alert('삭제 실패: ' + result.error)
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
        onDeleteAll={handleDeleteAll}
      />

      {swapFirstEvent && (
        <div className="swap-top-banner">
          🔄 <strong>{swapFirstEvent.assignee}</strong> 선택됨 — 교체할 다른 일정을 클릭하세요
          <button onClick={() => setSwapFirstEvent(null)} style={{ marginLeft: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontWeight: 700 }}>✕ 취소</button>
        </div>
      )}

      <main className="main">
        <div className="calendar-area">
          {loading && <div className="loading-overlay"><div className="loading-spinner" /></div>}

          {viewMode === 'year' && (
            <YearView currentDate={currentDate} events={events} users={users}
              sortBy={sortBy} onDayClick={handleDayClick}
              highlightUserId={highlightUserId} getHolidayName={getHolidayName} />
          )}
          {viewMode === 'month' && (
            <MonthView currentDate={currentDate} events={events} users={users}
              sortBy={sortBy} onDayClick={handleDayClick} onEventClick={handleEventClick}
              selectedDate={selectedDate} highlightUserId={highlightUserId}
              swapFirstEvent={swapFirstEvent} getHolidayName={getHolidayName} />
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
          users={users}
          sortedUsers={sortedUsers}
          groups={groups}
          events={events}
          onQuickAssign={quickAssign}
          onQuickAssignGroup={quickAssignGroup}
          onEventClick={handleEventClick}
          onAddEvent={() => handleAddEvent(selectedDate || currentDate)}
          swapFirstEvent={swapFirstEvent}
          quickMode={quickMode}
          sortBy={sortBy}
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
