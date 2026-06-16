/**
 * 사용자 정렬 공통 유틸리티
 *
 * 정렬 우선순위:
 * 1순위: is_pinned=true (상단 고정)
 * 2순위: 이름 가나다순
 */

export const SORT_OPTIONS = {
  NAME_ASC:   'name_asc',
  NAME_DESC:  'name_desc',
  REGISTERED: 'registered',
}

/**
 * 사용자 배열 정렬
 * - is_pinned=true 사용자 항상 최상단
 * - 각 그룹 내에서 가나다순
 */
export function sortUsers(users, sortBy = SORT_OPTIONS.NAME_ASC) {
  if (!users || users.length === 0) return []
  const arr = [...users]

  // 핀 여부 비교 공통 함수
  const pinCmp = (a, b) => {
    const pa = a.is_pinned ? 1 : 0
    const pb = b.is_pinned ? 1 : 0
    if (pa !== pb) return pb - pa  // pinned 먼저
    return 0
  }

  switch (sortBy) {
    case SORT_OPTIONS.NAME_DESC:
      return arr.sort((a, b) => {
        const p = pinCmp(a, b)
        if (p !== 0) return p
        return (b.name || '').localeCompare(a.name || '', 'ko')
      })
    case SORT_OPTIONS.REGISTERED:
      return arr.sort((a, b) => {
        const p = pinCmp(a, b)
        if (p !== 0) return p
        const orderA = a.sort_order ?? 9999
        const orderB = b.sort_order ?? 9999
        if (orderA !== orderB) return orderA - orderB
        return new Date(a.created_at) - new Date(b.created_at)
      })
    case SORT_OPTIONS.NAME_ASC:
    default:
      return arr.sort((a, b) => {
        const p = pinCmp(a, b)
        if (p !== 0) return p
        return (a.name || '').localeCompare(b.name || '', 'ko')
      })
  }
}

/**
 * 일정을 사용자 is_pinned → 이름 순으로 정렬
 * 연차 일정도 동일하게 정렬 (색상은 별도 처리)
 */
export function sortSchedulesByUserName(schedules, users, sortBy = SORT_OPTIONS.NAME_ASC) {
  if (!schedules || schedules.length === 0) return []

  const getUser = (schedule) => users.find(u => u.id === schedule.user_id) || null

  const getName = (schedule) => {
    const u = getUser(schedule)
    return u?.name || schedule.assignee || schedule.title || ''
  }

  const getPinned = (schedule) => {
    const u = getUser(schedule)
    return u?.is_pinned ? 1 : 0
  }

  return [...schedules].sort((a, b) => {
    // 1순위: 상단 고정
    const pinDiff = getPinned(b) - getPinned(a)
    if (pinDiff !== 0) return pinDiff

    // 2순위: 이름
    const nameA = getName(a)
    const nameB = getName(b)
    if (sortBy === SORT_OPTIONS.NAME_DESC) return nameB.localeCompare(nameA, 'ko')
    if (sortBy === SORT_OPTIONS.REGISTERED) {
      const ua = getUser(a)
      const ub = getUser(b)
      const orderA = ua?.sort_order ?? 9999
      const orderB = ub?.sort_order ?? 9999
      if (orderA !== orderB) return orderA - orderB
    }
    return nameA.localeCompare(nameB, 'ko')
  })
}
