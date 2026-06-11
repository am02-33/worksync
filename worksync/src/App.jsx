import { useState, useCallback } from 'react'
import { format } from 'date-fns'
import Header from './components/Header'
import MonthView from './components/Calendar/MonthView'
import WeekView from './components/Calendar/WeekView'
import DayView from './components/Calendar/DayView'
import EventModal from './components/EventModal'
import EventList from './components/EventList'
import AdminModal from './components/AdminModal'
import SetupGuide from './components/SetupGuide'
import { useEvents } from './hooks/useEvents'

const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL
  return url && url !== 'https://placeholder.supabase.co' && !url.includes('your-project')
}

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('month')
  const [selectedDate, setSelectedDate] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  const { events, loading, addEvent, updateEvent, deleteEvent } = useEvents()

  if (!isSupabaseConfigured()) {
    return <SetupGuide />
  }

  const handleDayClick = (date) => {
    setSelectedDate(date)
    if (viewMode === 'month') {
      // 모바일에서는 일간 뷰로 전환
    }
  }

  const handleEventClick = (event) => {
    setEditingEvent(event)
    setIsModalOpen(true)
  }

  const handleAddEvent = useCallback(() => {
    setEditingEvent(null)
    setIsModalOpen(true)
  }, [])

  const handleSaveEvent = async (formData) => {
    if (editingEvent) {
      return await updateEvent(editingEvent.id, formData)
    } else {
      return await addEvent(formData)
    }
  }

  const handleDeleteEvent = async (id) => {
    return await deleteEvent(id)
  }

  const handleAdminToggle = () => {
    if (isAdmin) {
      setIsAdmin(false)
    } else {
      setIsAdminModalOpen(true)
    }
  }

  return (
    <div className="app">
      <Header
        currentDate={currentDate}
        viewMode={viewMode}
        onDateChange={setCurrentDate}
        onViewModeChange={setViewMode}
        onAddEvent={handleAddEvent}
        isAdmin={isAdmin}
        onAdminToggle={handleAdminToggle}
      />

      <main className="main">
        <div className="calendar-area">
          {loading && (
            <div className="loading-overlay">
              <div className="loading-spinner" />
            </div>
          )}

          {viewMode === 'month' && (
            <MonthView
              currentDate={currentDate}
              events={events}
              onDayClick={handleDayClick}
              onEventClick={handleEventClick}
              selectedDate={selectedDate}
            />
          )}
          {viewMode === 'week' && (
            <WeekView
              currentDate={currentDate}
              events={events}
              onDayClick={handleDayClick}
              onEventClick={handleEventClick}
              selectedDate={selectedDate}
            />
          )}
          {viewMode === 'day' && (
            <DayView
              currentDate={currentDate}
              events={events}
              onEventClick={handleEventClick}
              onAddEvent={handleAddEvent}
            />
          )}
        </div>

        <EventList
          events={events}
          selectedDate={selectedDate}
          onEventClick={handleEventClick}
          onAddEvent={handleAddEvent}
        />
      </main>

      <EventModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingEvent(null) }}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        event={editingEvent}
        defaultDate={selectedDate || currentDate}
        isAdmin={isAdmin}
      />

      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSuccess={() => setIsAdmin(true)}
      />
    </div>
  )
}
