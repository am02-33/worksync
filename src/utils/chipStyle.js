/**
 * 이벤트 칩 색상/스타일 유틸
 * schedule_type === 'annual_leave' → 검정 배경, 흰색 글씨
 * 그 외 → 사용자 고유 색상
 */

export function getChipStyle(event, user) {
  const isLeave = event.schedule_type === 'annual_leave'
  const color   = isLeave ? '#1A1A2E' : (user?.color || event.color || '#4F8EF7')
  return {
    backgroundColor: color,
    color: '#fff',
    isLeave,
  }
}

export function getChipLabel(event) {
  const isLeave = event.schedule_type === 'annual_leave'
  return isLeave ? `휴가 ${event.assignee}` : event.assignee
}
