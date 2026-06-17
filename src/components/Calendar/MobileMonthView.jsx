/**
 * MobileMonthView — 상단 컴팩트 달력
 * - 날짜 칸: 날짜숫자 + 색상 점만 (이름표 없음)
 * - 이름표는 하단 MobileScheduleTimeline에서 전부 표시
 * - 날짜 클릭 → MobileDateModal
 */
import { useMemo, useRef, useCallback } from 'react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isToday, isSameDay,
} from 'date-fns'

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']
const LONG_PRESS_MS = 800

export default function MobileMonthView({
  currentDate, events, users,
  onDayClick, onLongPress,
  selectedDate, selectedDates = [],
  getHolidayName,
}) {
  const lpTimer = useRef(null)
  const lpFired = useRef(false)

  const weeks = useMemo(() => {
    const calStart = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 })
    const calEnd   = endOfWeek(endOfMonth(currentDate),   { weekStartsOn: 0 })
    const days     = eachDayOfInterval({ start: calStart, end: calEnd })
    const result = []
    for (let i = 0; i < days.length; i += 7) result.push(days.slice(i, i + 7))
    return result
  }, [currentDate])

  // 날짜별 색상 점 (최대 5개)
  const getDots = useCallback((date) => {
    const ds  = format(date, 'yyyy-MM-dd')
    const evs = events.filter(e => e.date === ds)
    return evs.slice(0, 5).map(ev => {
      if (ev.schedule_type === 'annual_leave') return '#1A1A2E'
      const user = users.find(u => u.id === ev.user_id)
      return user?.color || ev.color || '#4F8EF7'
    })
  }, [events, users])

  const startLP = (day) => {
    lpFired.current = false
    lpTimer.current = setTimeout(() => { lpFired.current = true; onLongPress(day) }, LONG_PRESS_MS)
  }
  const cancelLP = () => { if (lpTimer.current) { clearTimeout(lpTimer.current); lpTimer.current = null } }

  const handlePUp = (e, day) => {
    cancelLP()
    if (lpFired.current) { lpFired.current = false; return }
    if (Math.abs((e.clientX||0)-(e.currentTarget._sx||e.clientX)) > 8) return
    if (Math.abs((e.clientY||0)-(e.currentTarget._sy||e.clientY)) > 8) return
    onDayClick(day, {})
  }

  return (
    <div className="mmv">
      {/* 요일 헤더 */}
      <div className="mmv-week-header">
        {DAY_LABELS.map((l, i) => (
          <div key={i} className={`mmv-dow-label ${i===0?'sun':i===6?'sat':''}`}>{l}</div>
        ))}
      </div>

      {/* 7열 그리드 */}
      <div className="mmv-grid">
        {weeks.map(week =>
          week.map((day, di) => {
            const ds       = format(day, 'yyyy-MM-dd')
            const inMonth  = isSameMonth(day, currentDate)
            const todayD   = isToday(day)
            const isSel    = selectedDate && isSameDay(day, selectedDate)
            const isMulti  = selectedDates.includes(ds)
            const holiday  = inMonth ? getHolidayName(ds) : null
            const isSun    = di === 0
            const isSat    = di === 6
            const dots     = inMonth ? getDots(day) : []

            return (
              <div
                key={ds}
                className={[
                  'mmv-cell',
                  !inMonth && 'out',
                  todayD   && 'today',
                  isSel    && !isMulti && 'selected',
                  isMulti  && 'multi',
                  holiday  && inMonth && 'hol-day',
                ].filter(Boolean).join(' ')}
                onPointerDown={e => { e.currentTarget._sx=e.clientX; e.currentTarget._sy=e.clientY; if(inMonth) startLP(day) }}
                onPointerUp={e => { if(inMonth) handlePUp(e, day) }}
                onPointerCancel={cancelLP}
              >
                {/* 날짜 숫자 */}
                <div className={[
                  'mmv-num',
                  todayD && 'mmv-today-circle',
                  !todayD && (isSun||holiday) && 'mmv-sun',
                  !todayD && isSat && !holiday && 'mmv-sat',
                ].filter(Boolean).join(' ')}>
                  {format(day, 'd')}
                </div>

                {/* 공휴일명 */}
                {holiday && inMonth && (
                  <div className="mmv-hol-name">
                    {holiday.length > 3 ? holiday.slice(0,3)+'…' : holiday}
                  </div>
                )}

                {/* 색상 점 */}
                {dots.length > 0 && (
                  <div className="mmv-dots-row">
                    {dots.map((c, i) => (
                      <span key={i} className="mmv-dot" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                )}

                {/* 다중 선택 */}
                {isMulti && <div className="mmv-check">✓</div>}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
