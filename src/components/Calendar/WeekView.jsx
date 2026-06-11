import { useMemo } from 'react'
import { startOfWeek, addDays, format, isToday, isSameDay } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Plus } from 'lucide-react'
import { sortSchedulesByUserName } from '../../utils/sortUsers'

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

// 시간 표시 유틸
function formatTime(start, end) {
  if (!start && !end) return null
  if (start && end) return `${start.slice(0,5)}~${end.slice(0,5)}`
  if (start) return start.slice(0,5)
  if (end) return `~${end.slice(0,5)}`
  return null
}

export default function WeekView({
  currentDate, events, users, sortBy,
  onDayClick, onEventClick, selectedDate,
  getHolidayName, onAddEvent,
  onQuickAssign, onQuickAssignGroup, groups,
}) {
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 })
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }, [currentDate])

  const getEventsForDay = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return sortSchedulesByUserName(events.filter(e => e.date === dateStr), users, sortBy)
  }

  return (
    <div className="week-view-card">
      {/* 7일 카드 그리드 */}
      <div className="week-card-grid">
        {weekDays.map((day, di) => {
          const dateStr  = format(day, 'yyyy-MM-dd')
          const holiday  = getHolidayName(dateStr)
          const isTodayD = isToday(day)
          const isSelD   = selectedDate && isSameDay(day, selectedDate)
          const isSun    = di === 0
          const isSat    = di === 6
          const dayEvs   = getEventsForDay(day)

          return (
            <div
              key={dateStr}
              className={[
                'week-day-card',
                isTodayD && 'today',
                isSelD   && 'selected',
                holiday  && 'holiday',
                isSun    && 'sunday',
                isSat    && 'saturday',
              ].filter(Boolean).join(' ')}
              onPointerUp={() => onDayClick(day, {})}
            >
              {/* 날짜 헤더 */}
              <div className="week-card-header">
                <div className="week-card-day-label">
                  {DAY_LABELS[di]}
                </div>
                <div className={`week-card-date-num ${isTodayD ? 'today-circle' : ''}`}>
                  {format(day, 'd')}
                </div>
                {holiday && (
                  <div className="week-card-holiday">{holiday}</div>
                )}
              </div>

              {/* 근무자 칩 목록 */}
              <div className="week-card-events">
                {dayEvs.length === 0 ? (
                  <div className="week-card-empty">근무자 없음</div>
                ) : (
                  dayEvs.slice(0, 6).map(ev => {
                    const user  = users.find(u => u.id === ev.user_id)
                    const color = user?.color || ev.color || '#4F8EF7'
                    const timeStr = formatTime(ev.start_time, ev.end_time)
                    return (
                      <div
                        key={ev.id}
                        className="week-card-chip"
                        style={{ backgroundColor: color }}
                        onPointerDown={(e) => e.stopPropagation()}
                        onPointerUp={(e) => { e.stopPropagation(); onEventClick(ev) }}
                        title={ev.assignee}
                      >
                        {timeStr && <span className="chip-time">{timeStr} </span>}
                        {ev.assignee}
                      </div>
                    )
                  })
                )}
                {dayEvs.length > 6 && (
                  <div className="week-card-more">+{dayEvs.length - 6}명</div>
                )}
              </div>

              {/* 추가 버튼 */}
              <button
                className="week-card-add"
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => { e.stopPropagation(); onAddEvent(day) }}
                title="일정 추가"
              >
                <Plus size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
