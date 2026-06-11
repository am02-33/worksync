/**
 * 사용자 정렬 공통 유틸리티
 * 모든 화면에서 동일한 정렬 순서 보장
 */

export const SORT_OPTIONS = {
  REGISTERED: 'registered',   // 등록 순서 오름차순 (기본)
  NAME_ASC:   'name_asc',     // 이름 가나다순
  NAME_DESC:  'name_desc',    // 이름 가나다순 역순
}

/**
 * 사용자 배열을 정렬 기준에 따라 정렬
 * @param {Array} users - 사용자 배열
 * @param {string} sortBy - 정렬 기준
 * @returns {Array} 정렬된 사용자 배열 (원본 변경 없음)
 */
export function sortUsers(users, sortBy = SORT_OPTIONS.REGISTERED) {
  if (!users || users.length === 0) return []
  const arr = [...users]

  switch (sortBy) {
    case SORT_OPTIONS.NAME_ASC:
      return arr.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko'))
    case SORT_OPTIONS.NAME_DESC:
      return arr.sort((a, b) => (b.name || '').localeCompare(a.name || '', 'ko'))
    case SORT_OPTIONS.REGISTERED:
    default:
      return arr.sort((a, b) => {
        // sort_order 기준 → 같으면 created_at 기준
        const orderA = a.sort_order ?? 0
        const orderB = b.sort_order ?? 0
        if (orderA !== orderB) return orderA - orderB
        return new Date(a.created_at) - new Date(b.created_at)
      })
  }
}

/**
 * 이벤트 목록을 사용자 정렬 순서에 맞게 정렬
 * @param {Array} events - 이벤트 배열
 * @param {Array} sortedUsers - 이미 정렬된 사용자 배열
 * @returns {Array} 정렬된 이벤트 배열
 */
export function sortEventsByUserOrder(events, sortedUsers) {
  if (!events || !sortedUsers) return events || []
  const userOrder = {}
  sortedUsers.forEach((u, i) => { userOrder[u.id] = i })

  return [...events].sort((a, b) => {
    const orderA = userOrder[a.user_id] ?? 9999
    const orderB = userOrder[b.user_id] ?? 9999
    if (orderA !== orderB) return orderA - orderB
    return (a.start_time || '').localeCompare(b.start_time || '')
  })
}
