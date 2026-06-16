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
        .order('is_pinned', { ascending: false })   // 핀 먼저
        .order('sort_order', { ascending: true })
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchUsers()
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchUsers])

  const addUser = async (userData) => {
    try {
      const maxOrder = users.reduce((max, u) => Math.max(max, u.sort_order || 0), 0)
      const { data, error } = await supabase
        .from('users')
        .insert([{
          ...userData,
          sort_order: maxOrder + 1,
          is_pinned: userData.is_pinned ?? false,
        }])
        .select().single()
      if (error) throw error
      return { success: true, data }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const updateUser = async (id, userData) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...userData,
          is_pinned: userData.is_pinned ?? false,
        })
        .eq('id', id)
        .select().single()
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

  const getUserById     = useCallback((id) => users.find(u => u.id === id), [users])
  const getUsersByGroup = useCallback((groupId) => users.filter(u => u.group_id === groupId), [users])

  return { users, loading, addUser, updateUser, deleteUser, getUserById, getUsersByGroup, refetch: fetchUsers }
}
