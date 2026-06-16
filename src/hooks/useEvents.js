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
      const { data, error } = await supabase.from('events').insert([{
        ...eventData,
        schedule_type: eventData.schedule_type || 'work',
      }]).select().single()
      if (error) throw error
      return { success: true, data }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  /**
   * 다중 날짜 × 다중 사용자 일정 생성
   * @param {string[]} targetDates    - ['YYYY-MM-DD', ...]
   * @param {Object[]} selectedUsers  - [{ id, name, color }, ...]
   * @param {Object}   commonData     - { start_time, end_time, memo, schedule_type }
   * @returns {{ success, count, error }}
   */
  const addMultipleEvents = useCallback(async (targetDates, selectedUsers, commonData) => {
    if (!targetDates || targetDates.length === 0) return { success: false, error: '날짜를 선택하세요.' }
    if (!selectedUsers || selectedUsers.length === 0) return { success: false, error: '사용자를 선택하세요.' }

    const scheduleType = commonData.schedule_type || 'work'
    const isLeave      = scheduleType === 'annual_leave'

    const inserts = []
    for (const date of targetDates) {
      for (const user of selectedUsers) {
        inserts.push({
          title:         isLeave ? `${user.name} 연차` : `${user.name} 근무`,
          assignee:      user.name,
          date,
          start_time:    commonData.start_time  || null,
          end_time:      commonData.end_time    || null,
          memo:          commonData.memo        || null,
          color:         isLeave ? '#1A1A2E' : (user.color || '#4F8EF7'),
          user_id:       user.id,
          category:      isLeave ? '연차' : '근무',
          schedule_type: scheduleType,
        })
      }
    }

    try {
      const { error } = await supabase.from('events').insert(inserts)
      if (error) throw error
      return { success: true, count: inserts.length }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  const updateEvent = async (id, eventData) => {
    try {
      const saveData = { ...eventData, schedule_type: eventData.schedule_type || 'work' }
      // 연차면 color를 검정으로 강제
      if (saveData.schedule_type === 'annual_leave') saveData.color = '#1A1A2E'
      const { data, error } = await supabase.from('events').update(saveData).eq('id', id).select().single()
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

  // 빠른 배정 — 항상 work
  const quickAssign = async (date, user) => {
    return await addEvent({
      title: `${user.name} 근무`, assignee: user.name,
      date, color: user.color, user_id: user.id,
      category: '근무', schedule_type: 'work',
    })
  }

  const quickAssignGroup = async (date, group, members) => {
    if (!members || members.length === 0) return { success: false, error: '그룹에 멤버가 없습니다.' }
    try {
      const inserts = members.map(user => ({
        title: `${user.name} 근무`, assignee: user.name,
        date, color: user.color, user_id: user.id,
        category: '근무', schedule_type: 'work',
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
