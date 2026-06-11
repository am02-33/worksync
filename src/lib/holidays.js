/**
 * 한국 공휴일 데이터 (2020~2030)
 * 2026년 제헌절 포함 최신화
 */

// 고정 공휴일 (양력) — 제헌절은 2008년부터 공휴일 아니었으나 2024년 법 개정으로 2026년부터 재지정
const FIXED_HOLIDAYS = [
  { month: 1,  day: 1,  name: '신정' },
  { month: 3,  day: 1,  name: '삼일절' },
  { month: 5,  day: 5,  name: '어린이날' },
  { month: 6,  day: 6,  name: '현충일' },
  { month: 7,  day: 17, name: '제헌절', fromYear: 2026 }, // 2026년부터 재지정
  { month: 8,  day: 15, name: '광복절' },
  { month: 10, day: 3,  name: '개천절' },
  { month: 10, day: 9,  name: '한글날' },
  { month: 12, day: 25, name: '성탄절' },
]

// 연도별 음력 공휴일 + 대체공휴일
const LUNAR_HOLIDAYS = {
  2020: [
    { date: '2020-01-24', name: '설날 연휴' },
    { date: '2020-01-25', name: '설날' },
    { date: '2020-01-26', name: '설날 연휴' },
    { date: '2020-04-30', name: '부처님오신날' },
    { date: '2020-09-30', name: '추석 연휴' },
    { date: '2020-10-01', name: '추석' },
    { date: '2020-10-02', name: '추석 연휴' },
  ],
  2021: [
    { date: '2021-02-11', name: '설날 연휴' },
    { date: '2021-02-12', name: '설날' },
    { date: '2021-02-13', name: '설날 연휴' },
    { date: '2021-05-19', name: '부처님오신날' },
    { date: '2021-09-20', name: '추석 연휴' },
    { date: '2021-09-21', name: '추석' },
    { date: '2021-09-22', name: '추석 연휴' },
  ],
  2022: [
    { date: '2022-01-31', name: '설날 연휴' },
    { date: '2022-02-01', name: '설날' },
    { date: '2022-02-02', name: '설날 연휴' },
    { date: '2022-03-09', name: '대통령선거일' },
    { date: '2022-05-08', name: '부처님오신날' },
    { date: '2022-06-01', name: '지방선거일' },
    { date: '2022-09-09', name: '추석 연휴' },
    { date: '2022-09-10', name: '추석' },
    { date: '2022-09-11', name: '추석 연휴' },
    { date: '2022-09-12', name: '추석 대체공휴일' },
  ],
  2023: [
    { date: '2023-01-21', name: '설날 연휴' },
    { date: '2023-01-22', name: '설날' },
    { date: '2023-01-23', name: '설날 연휴' },
    { date: '2023-01-24', name: '설날 대체공휴일' },
    { date: '2023-05-27', name: '부처님오신날' },
    { date: '2023-05-29', name: '부처님오신날 대체공휴일' },
    { date: '2023-09-28', name: '추석 연휴' },
    { date: '2023-09-29', name: '추석' },
    { date: '2023-09-30', name: '추석 연휴' },
    { date: '2023-10-02', name: '임시공휴일' },
  ],
  2024: [
    { date: '2024-02-09', name: '설날 연휴' },
    { date: '2024-02-10', name: '설날' },
    { date: '2024-02-11', name: '설날 연휴' },
    { date: '2024-02-12', name: '설날 대체공휴일' },
    { date: '2024-04-10', name: '국회의원선거일' },
    { date: '2024-05-15', name: '부처님오신날' },
    { date: '2024-09-16', name: '추석 연휴' },
    { date: '2024-09-17', name: '추석' },
    { date: '2024-09-18', name: '추석 연휴' },
  ],
  2025: [
    { date: '2025-01-28', name: '설날 연휴' },
    { date: '2025-01-29', name: '설날' },
    { date: '2025-01-30', name: '설날 연휴' },
    { date: '2025-03-03', name: '삼일절 대체공휴일' },
    { date: '2025-05-05', name: '부처님오신날' },
    { date: '2025-05-06', name: '어린이날 대체공휴일' },
    { date: '2025-10-05', name: '추석 연휴' },
    { date: '2025-10-06', name: '추석' },
    { date: '2025-10-07', name: '추석 연휴' },
    { date: '2025-10-08', name: '추석 대체공휴일' },
  ],
  2026: [
    { date: '2026-02-16', name: '설날 연휴' },
    { date: '2026-02-17', name: '설날' },
    { date: '2026-02-18', name: '설날 연휴' },
    { date: '2026-03-02', name: '삼일절 대체공휴일' },
    { date: '2026-05-24', name: '부처님오신날' },
    { date: '2026-05-25', name: '부처님오신날 대체공휴일' },
    { date: '2026-08-17', name: '광복절 대체공휴일' },
    { date: '2026-09-24', name: '추석 연휴' },
    { date: '2026-09-25', name: '추석' },
    { date: '2026-09-26', name: '추석 연휴' },
    { date: '2026-10-05', name: '개천절 대체공휴일' },
  ],
  2027: [
    { date: '2027-02-06', name: '설날 연휴' },
    { date: '2027-02-07', name: '설날' },
    { date: '2027-02-08', name: '설날 연휴' },
    { date: '2027-05-13', name: '부처님오신날' },
    { date: '2027-09-14', name: '추석 연휴' },
    { date: '2027-09-15', name: '추석' },
    { date: '2027-09-16', name: '추석 연휴' },
  ],
  2028: [
    { date: '2028-01-26', name: '설날 연휴' },
    { date: '2028-01-27', name: '설날' },
    { date: '2028-01-28', name: '설날 연휴' },
    { date: '2028-05-02', name: '부처님오신날' },
    { date: '2028-10-02', name: '추석 연휴' },
    { date: '2028-10-03', name: '추석' },
    { date: '2028-10-04', name: '추석 연휴' },
  ],
  2029: [
    { date: '2029-02-12', name: '설날 연휴' },
    { date: '2029-02-13', name: '설날' },
    { date: '2029-02-14', name: '설날 연휴' },
    { date: '2029-05-20', name: '부처님오신날' },
    { date: '2029-09-22', name: '추석 연휴' },
    { date: '2029-09-23', name: '추석' },
    { date: '2029-09-24', name: '추석 연휴' },
  ],
  2030: [
    { date: '2030-02-02', name: '설날 연휴' },
    { date: '2030-02-03', name: '설날' },
    { date: '2030-02-04', name: '설날 연휴' },
    { date: '2030-05-09', name: '부처님오신날' },
    { date: '2030-09-12', name: '추석 연휴' },
    { date: '2030-09-13', name: '추석' },
    { date: '2030-09-14', name: '추석 연휴' },
  ],
}

/**
 * 특정 연도의 모든 한국 공휴일 반환
 * @param {number} year
 * @returns {Object} { 'YYYY-MM-DD': '공휴일명' }
 */
export function getKoreanHolidays(year) {
  const holidays = {}

  // 고정 공휴일
  FIXED_HOLIDAYS.forEach(({ month, day, name, fromYear }) => {
    if (fromYear && year < fromYear) return
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    holidays[dateStr] = name
  })

  // 음력 공휴일
  const lunarHolidays = LUNAR_HOLIDAYS[year] || []
  lunarHolidays.forEach(({ date, name }) => {
    holidays[date] = name
  })

  return holidays
}

/**
 * 날짜가 공휴일인지 확인
 * @param {string} dateStr 'YYYY-MM-DD'
 * @param {number} year
 * @param {Object} customHolidays - Supabase에서 가져온 커스텀 공휴일 { 'YYYY-MM-DD': '이름' }
 * @returns {string|null}
 */
export function getHolidayName(dateStr, year, customHolidays = {}) {
  // 커스텀 공휴일 우선
  if (customHolidays[dateStr]) return customHolidays[dateStr]
  const holidays = getKoreanHolidays(year)
  return holidays[dateStr] || null
}

/**
 * 연도의 모든 공휴일 데이터 배열로 반환 (Supabase 삽입용)
 */
export function getHolidaysForYear(year) {
  const holidays = getKoreanHolidays(year)
  return Object.entries(holidays).map(([date, name]) => ({
    date,
    name,
    type: 'national',
    is_custom: false,
  }))
}
