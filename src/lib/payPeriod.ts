import { addDays, addMonths, setDate, getDay, getDate, startOfDay, differenceInCalendarDays } from 'date-fns'

function adjustForWeekend(date: Date): Date {
  const day = getDay(date)
  if (day === 6) return addDays(date, 2) // 토 → 월
  if (day === 0) return addDays(date, 1) // 일 → 월
  return date
}

// 기준일로부터 다음 지급일 계산
export function getNextPayDate(payType: string, basePayDate: Date, from: Date = new Date()): Date {
  const today = startOfDay(from)

  if (payType === 'daily') return today

  if (payType === 'weekly') {
    const targetDow = getDay(basePayDate)
    const todayDow = getDay(today)
    let diff = targetDow - todayDow
    if (diff <= 0) diff += 7
    return adjustForWeekend(addDays(today, diff))
  }

  if (payType === 'monthly') {
    const targetDay = getDate(basePayDate)
    let candidate = setDate(today, targetDay)
    if (candidate <= today) candidate = addMonths(candidate, 1)
    return adjustForWeekend(candidate)
  }

  return today
}

// 현재 지급 주기 시작일
export function getPayPeriodStart(payType: string, basePayDate: Date, from: Date = new Date()): Date {
  const today = startOfDay(from)

  if (payType === 'daily') return today

  if (payType === 'weekly') {
    const targetDow = getDay(basePayDate)
    const todayDow = getDay(today)
    let diff = todayDow - targetDow
    if (diff < 0) diff += 7
    // 주기 경계는 지급일 다음날부터
    return addDays(today, -diff + (diff === 0 ? 0 : 0))
  }

  if (payType === 'monthly') {
    const targetDay = getDate(basePayDate)
    let start = setDate(today, targetDay)
    // 지급일 다음날이 주기 시작
    start = addDays(start, 1)
    if (start > today) start = addDays(addMonths(start, -1), 0)
    return start
  }

  return today
}

export function getDaysUntilPay(nextPayDate: Date, from: Date = new Date()): number {
  return differenceInCalendarDays(startOfDay(nextPayDate), startOfDay(from))
}
