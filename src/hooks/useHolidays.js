import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { getHolidaysForYear } from '../lib/holidays'

export function useHolidays(currentYear) {
  const [dbHolidays, setDbHolidays] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchHolidays = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('holidays')
        .select('*')
        .order('date', { ascending: true })
      if (error) throw error
      setDbHolidays(data || [])
    } catch (err) {
      console.error('공휴일 불러오기 실패:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHolidays()
    const channel = supabase
      .channel('holidays-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'holidays' }, () => fetchHolidays())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchHolidays])

  // { 'YYYY-MM-DD': '공휴일명' } 형태로 변환
  const holidayMap = useMemo(() => {
    const map = {}
    dbHolidays.forEach(h => {
      if (map[h.date]) {
        // 커스텀 공휴일 우선
        if (h.is_custom) map[h.date] = h.name
      } else {
        map[h.date] = h.name
      }
    })
    return map
  }, [dbHolidays])

  const addCustomHoliday = async (date, name) => {
    try {
      const { error } = await supabase.from('holidays').insert([{
        date, name, type: 'custom', is_custom: true
      }])
      if (error) throw error
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const deleteHoliday = async (id) => {
    try {
      const { error } = await supabase.from('holidays').delete().eq('id', id)
      if (error) throw error
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const updateHoliday = async (id, data) => {
    try {
      const { error } = await supabase.from('holidays').update(data).eq('id', id)
      if (error) throw error
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  // 해당 연도 공휴일 DB에 새로고침
  const refreshYearHolidays = async (year) => {
    try {
      const holidays = getHolidaysForYear(year)
      // 기존 국가 공휴일만 삭제 후 재삽입
      await supabase.from('holidays')
        .delete()
        .eq('is_custom', false)
        .gte('date', `${year}-01-01`)
        .lte('date', `${year}-12-31`)
      // upsert
      const { error } = await supabase.from('holidays').upsert(holidays, { onConflict: 'date,name' })
      if (error) throw error
      await fetchHolidays()
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const getHolidayName = useCallback((dateStr) => {
    return holidayMap[dateStr] || null
  }, [holidayMap])

  const getCustomHolidays = useCallback(() => dbHolidays.filter(h => h.is_custom), [dbHolidays])
  const getAllHolidaysForYear = useCallback((year) => dbHolidays.filter(h => h.date.startsWith(`${year}`)), [dbHolidays])

  return {
    dbHolidays, loading, holidayMap,
    addCustomHoliday, deleteHoliday, updateHoliday,
    refreshYearHolidays, getHolidayName,
    getCustomHolidays, getAllHolidaysForYear,
    refetch: fetchHolidays,
  }
}
