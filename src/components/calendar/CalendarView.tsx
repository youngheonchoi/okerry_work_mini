'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isToday, parseISO, addMonths, subMonths,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import type { WageSettings, WorkLog } from '@/lib/db/schema'
import { getNextPayDate, getDaysUntilPay } from '@/lib/payPeriod'

type Props = {
  settings: WageSettings | null
  logs: WorkLog[]
  currentMonth: string
}

export default function CalendarView({ settings, logs, currentMonth }: Props) {
  const router = useRouter()
  const [month, setMonth] = useState(parseISO(currentMonth + '-01'))

  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) })
  const startPad = getDay(startOfMonth(month)) // 0=일
  const logMap = Object.fromEntries(logs.map((l) => [l.workDate, l]))

  const nextPayDate = settings
    ? getNextPayDate(settings.payType, parseISO(settings.nextPayDate))
    : null
  const daysUntil = nextPayDate ? getDaysUntilPay(nextPayDate) : null

  const periodTotal = logs
    .filter((l) => l.worked)
    .reduce((sum, l) => sum + l.totalWage, 0)

  function handleDayClick(dateStr: string) {
    router.push(`/calendar/${dateStr}`)
  }

  function getDayDotColor(isHoliday: boolean, hasOvertime: boolean) {
    if (isHoliday && hasOvertime) return 'bg-rose-500'
    if (isHoliday) return 'bg-amber-400'
    if (hasOvertime) return 'bg-violet-500'
    return 'bg-emerald-500'
  }

  return (
    <div className="flex flex-col bg-white">
      {/* 월 이동 헤더 */}
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <button onClick={() => setMonth(subMonths(month, 1))} className="p-2 text-gray-400 active:text-gray-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h2 className="text-base font-semibold text-gray-900">
          {format(month, 'yyyy년 M월')}
        </h2>
        <button onClick={() => setMonth(addMonths(month, 1))} className="p-2 text-gray-400 active:text-gray-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-b border-gray-100 pb-2">
        {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
          <p key={d} className={`text-center text-xs font-medium ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'}`}>{d}</p>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7">
        {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const log = logMap[dateStr]
          const isPayDay = nextPayDate && format(nextPayDate, 'yyyy-MM-dd') === dateStr
          const isCurrentDay = isToday(day)
          const dow = getDay(day)

          return (
            <button
              key={dateStr}
              onClick={() => handleDayClick(dateStr)}
              className="flex flex-col items-center py-2 gap-0.5 active:bg-gray-50 transition min-h-[64px]"
            >
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium
                ${isCurrentDay ? 'bg-blue-500 text-white' : dow === 0 ? 'text-red-500' : dow === 6 ? 'text-blue-500' : 'text-gray-800'}
              `}>
                {format(day, 'd')}
              </span>
              {isPayDay && <span className="text-xs">💰</span>}
              {log?.worked && (
                <span className="flex items-center gap-1">
                  <span className={`h-1.5 w-1.5 rounded-full ${getDayDotColor(log.isHoliday, Number(log.overtimeHrs) > 0)}`} />
                  <span className="text-[10px] font-semibold leading-tight text-gray-700">
                    {(log.totalWage / 10000).toFixed(1)}만
                  </span>
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 범례 */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-3 text-[11px] text-gray-500">
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />평일</span>
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-violet-500" />야근</span>
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" />주말·휴일</span>
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-rose-500" />주말·휴일 야근</span>
      </div>

      {/* 급여 요약 */}
      {settings && (
        <div className="mx-4 mt-4 rounded-2xl bg-gray-50 p-4 space-y-2">
          {nextPayDate && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">다음 급여일</span>
              <span className="text-sm font-semibold text-gray-900">
                {format(nextPayDate, 'M월 d일 (eee)', { locale: ko })}
                {daysUntil === 0 ? ' · 오늘' : daysUntil != null && ` · D-${daysUntil}`}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">이번 달 누적</span>
            <span className="text-sm font-bold text-blue-600">
              {periodTotal.toLocaleString()}원
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
