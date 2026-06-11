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
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
    const channel = supabase
      .channel('events-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, (payload) => {
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
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchEvents])

  const addEvent = async (eventData) => {
    try {
      const { data, error } = await supabase.from('events').insert([eventData]).select().single()
      if (error) throw error
      return { success: true, data }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const updateEvent = async (id, eventData) => {
    try {
      const { data, error } = await supabase.from('events').update(eventData).eq('id', id).select().single()
      if (error) throw error
      return { success: true, data }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const deleteEvent = async (id) => {
    try {
      const { error } = await supabase.from('events').delete().eq('id', id)
      if (error) throw error
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  // 두 이벤트의 날짜를 교체
  const swapEvents = async (eventA, eventB) => {
    try {
      const { error: e1 } = await supabase.from('events').update({ date: eventB.date }).eq('id', eventA.id)
      if (e1) throw e1
      const { error: e2 } = await supabase.from('events').update({ date: eventA.date }).eq('id', eventB.id)
      if (e2) throw e2
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  // 빠른 배정: user 정보로 이벤트 즉시 생성
  const quickAssign = async (date, user) => {
    const eventData = {
      title: `${user.name} 근무`,
      assignee: user.name,
      date,
      color: user.color,
      user_id: user.id,
      category: '근무',
    }
    return await addEvent(eventData)
  }

  const getEventsForDate = useCallback((dateStr) => events.filter(e => e.date === dateStr), [events])
  const getEventsForMonth = useCallback((year, month) => {
    const prefix = `${year}-${String(month).padStart(2, '0')}`
    return events.filter(e => e.date.startsWith(prefix))
  }, [events])

  return { events, loading, error, addEvent, updateEvent, deleteEvent, swapEvents, quickAssign, getEventsForDate, getEventsForMonth, refetch: fetchEvents }
}
