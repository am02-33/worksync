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

  /**
   * 여러 사용자를 동일 날짜/시간/메모로 한 번에 등록
   * @param {Object} commonData - { date, start_time, end_time, memo, category }
   * @param {Array} selectedUsers - [{ id, name, color }, ...]
   */
  const addMultipleEvents = async (commonData, selectedUsers) => {
    if (!selectedUsers || selectedUsers.length === 0) {
      return { success: false, error: '사용자를 선택하세요.' }
    }
    try {
      const inserts = selectedUsers.map(user => ({
        title:      `${user.name} 근무`,
        assignee:   user.name,
        date:       commonData.date,
        start_time: commonData.start_time || null,
        end_time:   commonData.end_time   || null,
        memo:       commonData.memo       || null,
        color:      user.color            || '#4F8EF7',
        user_id:    user.id,
        category:   commonData.category   || '근무',
      }))
      const { error } = await supabase.from('events').insert(inserts)
      if (error) throw error
      return { success: true, count: inserts.length }
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

  const quickAssign = async (date, user) => {
    return await addEvent({
      title: `${user.name} 근무`, assignee: user.name,
      date, color: user.color, user_id: user.id, category: '근무',
    })
  }

  const quickAssignGroup = async (date, group, members) => {
    if (!members || members.length === 0) return { success: false, error: '그룹에 멤버가 없습니다.' }
    try {
      const inserts = members.map(user => ({
        title: `${user.name} 근무`, assignee: user.name,
        date, color: user.color, user_id: user.id, category: '근무',
      }))
      const { error } = await supabase.from('events').insert(inserts)
      if (error) throw error
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const getEventsForDate = useCallback((dateStr) => events.filter(e => e.date === dateStr), [events])

  return {
    events, loading, error,
    addEvent, addMultipleEvents, updateEvent, deleteEvent,
    swapEvents, quickAssign, quickAssignGroup,
    getEventsForDate, refetch: fetchEvents,
  }
}
