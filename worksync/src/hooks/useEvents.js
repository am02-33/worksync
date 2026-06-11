import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })

      if (error) throw error
      setEvents(data || [])
    } catch (err) {
      console.error('이벤트 불러오기 실패:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()

    // 실시간 구독
    const channel = supabase
      .channel('events-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setEvents(prev => [...prev, payload.new].sort((a, b) => {
              if (a.date !== b.date) return a.date.localeCompare(b.date)
              return (a.start_time || '').localeCompare(b.start_time || '')
            }))
          } else if (payload.eventType === 'UPDATE') {
            setEvents(prev => prev.map(e => e.id === payload.new.id ? payload.new : e))
          } else if (payload.eventType === 'DELETE') {
            setEvents(prev => prev.filter(e => e.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchEvents])

  const addEvent = async (eventData) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (err) {
      console.error('이벤트 추가 실패:', err)
      return { success: false, error: err.message }
    }
  }

  const updateEvent = async (id, eventData) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (err) {
      console.error('이벤트 수정 실패:', err)
      return { success: false, error: err.message }
    }
  }

  const deleteEvent = async (id) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { success: true }
    } catch (err) {
      console.error('이벤트 삭제 실패:', err)
      return { success: false, error: err.message }
    }
  }

  const getEventsForDate = useCallback((dateStr) => {
    return events.filter(e => e.date === dateStr)
  }, [events])

  const getEventsForMonth = useCallback((year, month) => {
    const prefix = `${year}-${String(month).padStart(2, '0')}`
    return events.filter(e => e.date.startsWith(prefix))
  }, [events])

  const getEventsForWeek = useCallback((startDate, endDate) => {
    return events.filter(e => e.date >= startDate && e.date <= endDate)
  }, [events])

  return {
    events,
    loading,
    error,
    addEvent,
    updateEvent,
    deleteEvent,
    getEventsForDate,
    getEventsForMonth,
    getEventsForWeek,
    refetch: fetchEvents,
  }
}
