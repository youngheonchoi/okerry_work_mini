import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { WorkLog, DailyJournal } from '@/lib/db/schema'
import { getWageBreakdown } from '@/lib/wage'

type Props = {
  dateStr: string
  log: WorkLog | null
  journal: DailyJournal | null
  dailyWage: number
}

export default function DayDetail({ dateStr, log, journal, dailyWage }: Props) {
  const date = parseISO(dateStr)
  const dateLabel = format(date, 'M월 d일 (eee)', { locale: ko })

  const breakdown = log?.worked
    ? getWageBreakdown(dailyWage, true, log.isHoliday, Number(log.overtimeHrs))
    : null

  const hourlyRate = Math.round(dailyWage / 8)
  const overtimeMultiplier = log?.isHoliday ? 2.0 : 1.5

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">{dateLabel}</h1>

      {!log && (
        <p className="text-sm text-gray-400 text-center py-8">기록이 없는 날입니다</p>
      )}

      {log && !log.worked && (
        <p className="text-sm text-gray-400 text-center py-8">쉬는 날로 기록되었습니다</p>
      )}

      {log?.worked && breakdown && (
        <div className="mt-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">출근 여부</span>
            <span className="font-medium text-gray-900">출근</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">휴일 여부</span>
            <span className="font-medium text-gray-900">{log.isHoliday ? '휴일 출근' : '평일'}</span>
          </div>
          {Number(log.overtimeHrs) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">야근 시간</span>
              <span className="font-medium text-gray-900">{log.overtimeHrs}시간</span>
            </div>
          )}
          <div className="my-3 border-t border-gray-100" />
          <div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">기본 {log.isHoliday ? '휴일 수당' : '일당'}</span>
              <span className="font-medium text-gray-900">{breakdown.base.toLocaleString()}원</span>
            </div>
            {log.isHoliday && (
              <p className="mt-0.5 text-right text-xs text-gray-400">
                시급 {hourlyRate.toLocaleString()}원 × 1.5배 × 8시간
              </p>
            )}
          </div>
          {breakdown.overtime > 0 && (
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">야근 수당</span>
                <span className="font-medium text-orange-500">+{breakdown.overtime.toLocaleString()}원</span>
              </div>
              <p className="mt-0.5 text-right text-xs text-gray-400">
                시급 {hourlyRate.toLocaleString()}원 × {overtimeMultiplier}배 × {log.overtimeHrs}시간
              </p>
            </div>
          )}
          <div className="flex justify-between rounded-xl bg-blue-50 px-4 py-3">
            <span className="text-sm font-semibold text-blue-700">합계</span>
            <span className="text-base font-bold text-blue-700">{log.totalWage.toLocaleString()}원</span>
          </div>
        </div>
      )}

      {journal && journal.entries.length > 0 && (
        <div className="mt-5">
          <div className="mb-2 flex items-center gap-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">일지</p>
          </div>
          <div className="space-y-2 rounded-xl border border-gray-100 bg-gray-50 p-4">
            {journal.entries.map((entry, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <span className="shrink-0 font-medium text-gray-500">
                  {entry.startTime}{entry.endTime ? `–${entry.endTime}` : ''}
                </span>
                {entry.memo && <span className="text-gray-800">{entry.memo}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
