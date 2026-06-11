import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: true })
      if (error) throw error
      setUsers(data || [])
    } catch (err) {
      console.error('사용자 불러오기 실패:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
    const channel = supabase
      .channel('users-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
        if (payload.eventType === 'INSERT') setUsers(prev => [...prev, payload.new])
        else if (payload.eventType === 'UPDATE') setUsers(prev => prev.map(u => u.id === payload.new.id ? payload.new : u))
        else if (payload.eventType === 'DELETE') setUsers(prev => prev.filter(u => u.id !== payload.old.id))
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchUsers])

  const addUser = async (userData) => {
    try {
      const { data, error } = await supabase.from('users').insert([userData]).select().single()
      if (error) throw error
      return { success: true, data }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const updateUser = async (id, userData) => {
    try {
      const { data, error } = await supabase.from('users').update(userData).eq('id', id).select().single()
      if (error) throw error
      return { success: true, data }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const deleteUser = async (id) => {
    try {
      const { error } = await supabase.from('users').delete().eq('id', id)
      if (error) throw error
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const getUserById = useCallback((id) => users.find(u => u.id === id), [users])

  return { users, loading, addUser, updateUser, deleteUser, getUserById, refetch: fetchUsers }
}
