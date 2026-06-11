import { useMemo } from 'react'
import { startOfWeek, addDays, format, isToday, isSameDay } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Plus } from 'lucide-react'
import { sortSchedulesByUserName } from '../../utils/sortUsers'

const DAY_KO  = ['일', '월', '화', '수', '목', '금', '토']

function formatTime(s, e) {
  if (!s && !e) return null
  if (s && e)   return `${s.slice(0,5)}~${e.slice(0,5)}`
  if (s)        return s.slice(0,5)
  return `~${e.slice(0,5)}`
}

export default function WeekView({
  currentDate, events, users, sortBy,
  onDayClick, onEventClick, selectedDate,
  getHolidayName, onAddEvent, groups,
  onQuickAssign, onQuickAssignGroup,
}) {
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 })
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }, [currentDate])

  const getEventsForDay = (date) => {
    const ds = format(date, 'yyyy-MM-dd')
    return sortSchedulesByUserName(events.filter(e => e.date === ds), users, sortBy)
  }

  return (
    <div className="wv-wrap">
      <div className="wv-grid">
        {weekDays.map((day, di) => {
          const ds       = format(day, 'yyyy-MM-dd')
          const holiday  = getHolidayName(ds)
          const todayDay = isToday(day)
          const selDay   = selectedDate && isSameDay(day, selectedDate)
          const isSun    = di === 0
          const isSat    = di === 6
          const dayEvs   = getEventsForDay(day)
          const visible  = dayEvs.slice(0, 6)
          const hidden   = dayEvs.length - 6

          return (
            <div
              key={ds}
              className={['wv-card', todayDay && 'wv-today', selDay && 'wv-selected', holiday && 'wv-holiday'].filter(Boolean).join(' ')}
              onPointerUp={() => onDayClick(day, {})}
            >
              {/* 카드 헤더 */}
              <div className="wv-card-head">
                <span className={['wv-dow', isSun && 'wv-sun', isSat && 'wv-sat'].filter(Boolean).join(' ')}>
                  {DAY_KO[di]}
                </span>
                <span className={['wv-num', todayDay && 'wv-num-today', isSun && 'wv-sun', isSat && 'wv-sat'].filter(Boolean).join(' ')}>
                  {format(day, 'd')}
                </span>
                {holiday && (
                  <span className="wv-holiday-badge">{holiday.length > 5 ? holiday.slice(0,4)+'…' : holiday}</span>
                )}
              </div>

              {/* 근무자 칩 */}
              <div className="wv-chips">
                {dayEvs.length === 0 && (
                  <span className="wv-empty">근무자 없음</span>
                )}
                {visible.map(ev => {
                  const user  = users.find(u => u.id === ev.user_id)
                  const color = user?.color || ev.color || '#4F8EF7'
                  const t     = formatTime(ev.start_time, ev.end_time)
                  return (
                    <div key={ev.id} className="wv-chip"
                      style={{ backgroundColor: color }}
                      onPointerDown={e => e.stopPropagation()}
                      onPointerUp={e => { e.stopPropagation(); onEventClick(ev) }}>
                      {t && <span className="wv-chip-time">{t} </span>}
                      {ev.assignee}
                    </div>
                  )
                })}
                {hidden > 0 && <div className="wv-more">+{hidden}명</div>}
              </div>

              {/* + 버튼 */}
              <button className="wv-add"
                onPointerDown={e => e.stopPropagation()}
                onPointerUp={e => { e.stopPropagation(); onAddEvent(day) }}>
                <Plus size={13} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
