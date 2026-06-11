import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useGroups() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchGroups = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: true })
      if (error) throw error
      setGroups(data || [])
    } catch (err) {
      console.error('그룹 불러오기 실패:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGroups()
    const channel = supabase
      .channel('groups-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, (payload) => {
        if (payload.eventType === 'INSERT') setGroups(prev => [...prev, payload.new])
        else if (payload.eventType === 'UPDATE') setGroups(prev => prev.map(g => g.id === payload.new.id ? payload.new : g))
        else if (payload.eventType === 'DELETE') setGroups(prev => prev.filter(g => g.id !== payload.old.id))
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchGroups])

  const addGroup = async (groupData) => {
    try {
      const { data, error } = await supabase.from('groups').insert([groupData]).select().single()
      if (error) throw error
      return { success: true, data }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const updateGroup = async (id, groupData) => {
    try {
      const { data, error } = await supabase.from('groups').update(groupData).eq('id', id).select().single()
      if (error) throw error
      return { success: true, data }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const deleteGroup = async (id) => {
    try {
      const { error } = await supabase.from('groups').delete().eq('id', id)
      if (error) throw error
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const getGroupById = useCallback((id) => groups.find(g => g.id === id), [groups])

  return { groups, loading, addGroup, updateGroup, deleteGroup, getGroupById, refetch: fetchGroups }
}
