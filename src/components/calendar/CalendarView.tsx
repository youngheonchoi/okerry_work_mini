'use client'

import { useState } from 'react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isSameMonth, isToday, parseISO, startOfWeek, addMonths, subMonths,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import type { WageSettings, WorkLog } from '@/lib/db/schema'
import { getNextPayDate, getDaysUntilPay } from '@/lib/payPeriod'
import { getWageBreakdown } from '@/lib/wage'
import DayDetailSheet from './DayDetailSheet'

type Props = {
  settings: WageSettings | null
  logs: WorkLog[]
  currentMonth: string
}

export default function CalendarView({ settings, logs, currentMonth }: Props) {
  const [month, setMonth] = useState(parseISO(currentMonth + '-01'))
  const [selectedLog, setSelectedLog] = useState<WorkLog | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

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
    const log = logMap[dateStr]
    setSelectedDate(dateStr)
    setSelectedLog(log ?? null)
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
                <span className={`text-[10px] font-semibold leading-tight ${log.isHoliday ? 'text-orange-500' : 'text-blue-600'}`}>
                  {(log.totalWage / 10000).toFixed(1)}만
                  {Number(log.overtimeHrs) > 0 && <span className="text-yellow-500"> ★</span>}
                </span>
              )}
            </button>
          )
        })}
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

      {/* 날짜 상세 바텀시트 */}
      {selectedDate && (
        <DayDetailSheet
          dateStr={selectedDate}
          log={selectedLog}
          dailyWage={settings?.dailyWage ?? 0}
          onClose={() => { setSelectedDate(null); setSelectedLog(null) }}
        />
      )}
    </div>
  )
}
