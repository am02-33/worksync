import { useState, useCallback } from 'react'
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
import StatsPanel from './components/StatsPanel'
import { useEvents } from './hooks/useEvents'
import { useUsers } from './hooks/useUsers'

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
  const [isStatsOpen, setIsStatsOpen] = useState(false)
  const [quickMode, setQuickMode] = useState(false)
  const [swapFirstEvent, setSwapFirstEvent] = useState(null)
  const [highlightUserId, setHighlightUserId] = useState(null)

  const { events, loading, addEvent, updateEvent, deleteEvent, swapEvents, quickAssign } = useEvents()
  const { users, addUser, updateUser, deleteUser } = useUsers()

  if (!isSupabaseConfigured()) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '20px' }}>
        <div style={{ background: 'var(--surface)', borderRadius: '16px', padding: '40px', maxWidth: '500px', width: '100%', textAlign: 'center', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔧</div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>Supabase 설정 필요</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>.env 파일에 VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 설정해주세요.</p>
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
      // 교체 두 번째 선택
      if (swapFirstEvent.id === event.id) {
        setSwapFirstEvent(null)
        return
      }
      const dateA = format(swapFirstEvent.date ? new Date(swapFirstEvent.date) : new Date(), 'M월 d일', { locale: ko })
      const dateB = format(event.date ? new Date(event.date) : new Date(), 'M월 d일', { locale: ko })
      if (window.confirm(`${dateA} ${swapFirstEvent.assignee}와\n${dateB} ${event.assignee}의 근무를 교체할까요?`)) {
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
    if (date) setSelectedDate(date)
    setIsModalOpen(true)
  }, [])

  const handleSaveEvent = async (formData) => {
    if (editingEvent) return await updateEvent(editingEvent.id, formData)
    return await addEvent(formData)
  }

  const handleDeleteEvent = async (id) => {
    return await deleteEvent(id)
  }

  const handleSwapStart = (event) => {
    setSwapFirstEvent(event)
  }

  const handleQuickAssign = async (dateStr, user) => {
    await quickAssign(dateStr, user)
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
        onStatsPanel={() => setIsStatsOpen(true)}
        quickMode={quickMode}
        onQuickModeToggle={() => setQuickMode(p => !p)}
      />

      {/* 교체 모드 배너 */}
      {swapFirstEvent && (
        <div className="swap-top-banner">
          🔄 <strong>{swapFirstEvent.assignee}</strong> 선택됨 — 교체할 다른 일정을 클릭하세요
          <button onClick={() => setSwapFirstEvent(null)} style={{ marginLeft: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontWeight: 700 }}>✕ 취소</button>
        </div>
      )}

      <main className="main">
        <div className="calendar-area">
          {loading && (
            <div className="loading-overlay">
              <div className="loading-spinner" />
            </div>
          )}

          {viewMode === 'year' && (
            <YearView currentDate={currentDate} events={events} users={users} onDayClick={handleDayClick} highlightUserId={highlightUserId} />
          )}
          {viewMode === 'month' && (
            <MonthView
              currentDate={currentDate} events={events} users={users}
              onDayClick={handleDayClick} onEventClick={handleEventClick}
              selectedDate={selectedDate} highlightUserId={highlightUserId}
              swapFirstEvent={swapFirstEvent}
            />
          )}
          {viewMode === 'week' && (
            <WeekView currentDate={currentDate} events={events} onDayClick={handleDayClick} onEventClick={handleEventClick} selectedDate={selectedDate} />
          )}
          {viewMode === 'day' && (
            <DayView currentDate={currentDate} events={events} onEventClick={handleEventClick} onAddEvent={() => handleAddEvent(currentDate)} />
          )}
        </div>

        <QuickAssign
          selectedDate={selectedDate}
          users={users}
          events={events}
          onQuickAssign={handleQuickAssign}
          onEventClick={handleEventClick}
          onAddEvent={() => handleAddEvent(selectedDate || currentDate)}
          swapFirstEvent={swapFirstEvent}
          onSwapStart={handleSwapStart}
          quickMode={quickMode}
        />
      </main>

      <EventModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingEvent(null) }}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        onSwapStart={handleSwapStart}
        event={editingEvent}
        defaultDate={selectedDate || currentDate}
        users={users}
      />

      <UserManager
        isOpen={isUserManagerOpen}
        onClose={() => setIsUserManagerOpen(false)}
        users={users}
        onAdd={addUser}
        onUpdate={updateUser}
        onDelete={deleteUser}
        events={events}
      />

      <StatsPanel
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        users={users}
        events={events}
        currentDate={currentDate}
        onHighlight={setHighlightUserId}
        highlightUserId={highlightUserId}
      />
    </div>
  )
}
