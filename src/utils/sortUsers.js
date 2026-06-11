/**
 * 사용자 정렬 공통 유틸리티
 * 기본: 이름 가나다순 오름차순
 */

export const SORT_OPTIONS = {
  NAME_ASC:   'name_asc',     // 이름 가나다순 (기본)
  NAME_DESC:  'name_desc',    // 이름 가나다순 역순
  REGISTERED: 'registered',   // 등록 순서
}

/**
 * 사용자 배열 정렬
 */
export function sortUsers(users, sortBy = SORT_OPTIONS.NAME_ASC) {
  if (!users || users.length === 0) return []
  const arr = [...users]
  switch (sortBy) {
    case SORT_OPTIONS.NAME_DESC:
      return arr.sort((a, b) => (b.name || '').localeCompare(a.name || '', 'ko'))
    case SORT_OPTIONS.REGISTERED:
      return arr.sort((a, b) => {
        const orderA = a.sort_order ?? 0
        const orderB = b.sort_order ?? 0
        if (orderA !== orderB) return orderA - orderB
        return new Date(a.created_at) - new Date(b.created_at)
      })
    case SORT_OPTIONS.NAME_ASC:
    default:
      return arr.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko'))
  }
}

/**
 * 일정을 사용자 이름 기준으로 정렬
 * @param {Array} schedules - 이벤트 배열
 * @param {Array} users - 사용자 배열
 * @param {string} sortBy - 정렬 기준
 */
export function sortSchedulesByUserName(schedules, users, sortBy = SORT_OPTIONS.NAME_ASC) {
  if (!schedules || schedules.length === 0) return []

  const getUserName = (schedule) => {
    if (schedule.user_id) {
      const user = users.find(u => u.id === schedule.user_id)
      if (user) return user.name || ''
    }
    // user_id 없는 구형 데이터는 assignee 또는 title 사용
    return schedule.assignee || schedule.title || ''
  }

  return [...schedules].sort((a, b) => {
    const nameA = getUserName(a)
    const nameB = getUserName(b)
    if (sortBy === SORT_OPTIONS.NAME_DESC) {
      return nameB.localeCompare(nameA, 'ko')
    }
    if (sortBy === SORT_OPTIONS.REGISTERED) {
      const ua = users.find(u => u.id === a.user_id)
      const ub = users.find(u => u.id === b.user_id)
      const orderA = ua?.sort_order ?? 9999
      const orderB = ub?.sort_order ?? 9999
      if (orderA !== orderB) return orderA - orderB
    }
    return nameA.localeCompare(nameB, 'ko')
  })
}
