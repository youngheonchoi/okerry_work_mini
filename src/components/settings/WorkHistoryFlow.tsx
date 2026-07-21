'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { WorkLog } from '@/lib/db/schema'

type Props = {
  logs: WorkLog[]
  minDate: string | null
  maxDate: string | null
}

type Mode = 'text' | 'image'

const STATUS_COLOR = {
  rest: '#9ca3af',
  normal: '#10b981',
  overtime: '#8b5cf6',
  holiday: '#fbbf24',
  holidayOvertime: '#f43f5e',
} as const

function getStatusKey(log: WorkLog): keyof typeof STATUS_COLOR {
  if (!log.worked) return 'rest'
  const hasOvertime = Number(log.overtimeHrs) > 0
  if (log.isHoliday && hasOvertime) return 'holidayOvertime'
  if (log.isHoliday) return 'holiday'
  if (hasOvertime) return 'overtime'
  return 'normal'
}

function getStatusLabel(log: WorkLog): string {
  if (!log.worked) return '쉬는 날'
  const tags = [log.isHoliday ? '휴일' : null, Number(log.overtimeHrs) > 0 ? `야근 ${log.overtimeHrs}시간` : null].filter(Boolean)
  return tags.length ? `출근 · ${tags.join(', ')}` : '출근'
}

function buildReportText(logs: WorkLog[], startDate: string, endDate: string) {
  const lines: string[] = [`근무 내역 (${startDate} ~ ${endDate})`, '']
  let workedCount = 0
  let total = 0

  for (const log of logs) {
    const dateLabel = format(parseISO(log.workDate), 'M/d (eee)', { locale: ko })
    if (log.worked) {
      workedCount += 1
      total += log.totalWage
      lines.push(`${dateLabel}  ${getStatusLabel(log)}  ${log.totalWage.toLocaleString()}원`)
    } else {
      lines.push(`${dateLabel}  쉬는 날`)
    }
  }

  lines.push('', `총 근무일수: ${workedCount}일`, `총 합계: ${total.toLocaleString()}원`)
  return lines.join('\n')
}

export default function WorkHistoryFlow({ logs, minDate, maxDate }: Props) {
  const router = useRouter()
  const [startDate, setStartDate] = useState(minDate ?? '')
  const [endDate, setEndDate] = useState(maxDate ?? '')
  const [mode, setMode] = useState<Mode>('text')
  const [reportText, setReportText] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageBlob, setImageBlob] = useState<Blob | null>(null)
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const filteredLogs = useMemo(
    () => logs.filter((l) => l.workDate >= startDate && l.workDate <= endDate),
    [logs, startDate, endDate],
  )

  function resetOutputs() {
    setReportText(null)
    setImageUrl(null)
    setImageBlob(null)
  }

  function generateText() {
    resetOutputs()
    setReportText(buildReportText(filteredLogs, startDate, endDate))
  }

  function generateImage() {
    setGenerating(true)
    resetOutputs()

    const padding = 24
    const lineHeight = 28
    const width = 640
    const height = padding * 2 + 90 + filteredLogs.length * lineHeight + 70

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      setGenerating(false)
      return
    }

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    ctx.fillStyle = '#111827'
    ctx.font = 'bold 22px sans-serif'
    ctx.fillText('근무 내역', padding, padding + 24)

    ctx.fillStyle = '#6b7280'
    ctx.font = '14px sans-serif'
    ctx.fillText(`${startDate} ~ ${endDate}`, padding, padding + 48)

    ctx.strokeStyle = '#e5e7eb'
    ctx.beginPath()
    ctx.moveTo(padding, padding + 64)
    ctx.lineTo(width - padding, padding + 64)
    ctx.stroke()

    let y = padding + 64 + lineHeight
    let workedCount = 0
    let total = 0

    for (const log of filteredLogs) {
      const dateLabel = format(parseISO(log.workDate), 'M/d (eee)', { locale: ko })
      ctx.fillStyle = '#374151'
      ctx.font = '14px sans-serif'
      ctx.fillText(dateLabel, padding, y)

      ctx.fillStyle = STATUS_COLOR[getStatusKey(log)]
      ctx.fillText(getStatusLabel(log), padding + 90, y)

      if (log.worked) {
        workedCount += 1
        total += log.totalWage
        ctx.fillStyle = '#111827'
        ctx.font = 'bold 14px sans-serif'
        const wageText = `${log.totalWage.toLocaleString()}원`
        ctx.fillText(wageText, width - padding - ctx.measureText(wageText).width, y)
      }

      y += lineHeight
    }

    y += 10
    ctx.fillStyle = '#eff6ff'
    ctx.fillRect(padding, y, width - padding * 2, 48)
    ctx.fillStyle = '#2563eb'
    ctx.font = 'bold 14px sans-serif'
    ctx.fillText(`총 근무일수 ${workedCount}일`, padding + 16, y + 30)
    const totalText = `${total.toLocaleString()}원`
    ctx.fillText(totalText, width - padding - 16 - ctx.measureText(totalText).width, y + 30)

    canvas.toBlob((blob) => {
      setGenerating(false)
      if (!blob) return
      setImageBlob(blob)
      setImageUrl(URL.createObjectURL(blob))
    }, 'image/png')
  }

  function handleGenerate() {
    if (mode === 'text') generateText()
    else generateImage()
  }

  async function handleCopy() {
    if (!reportText) return
    await navigator.clipboard.writeText(reportText)
    setCopied(true)
    if (copyTimeout.current) clearTimeout(copyTimeout.current)
    copyTimeout.current = setTimeout(() => setCopied(false), 2000)
  }

  async function handleShareImage() {
    if (!imageBlob || !imageUrl) return
    const file = new File([imageBlob], `work-history-${startDate}_${endDate}.png`, { type: 'image/png' })

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: '근무 내역' })
      } catch {
        // 사용자가 공유를 취소한 경우
      }
      return
    }

    const a = document.createElement('a')
    a.href = imageUrl
    a.download = file.name
    a.click()
  }

  if (!minDate || !maxDate) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] flex-col bg-white px-5 pt-8">
        <BackButton onClick={() => router.push('/settings')} />
        <h1 className="mt-4 text-xl font-bold text-gray-900">근무 내역</h1>
        <p className="mt-10 text-center text-sm text-gray-400">아직 기록된 근무 내역이 없어요</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col bg-white px-5 pt-8 pb-10">
      <BackButton onClick={() => router.push('/settings')} />
      <h1 className="mt-4 text-xl font-bold text-gray-900">근무 내역</h1>
      <p className="mt-1 text-sm text-gray-500">기간을 선택해 근무 내역을 텍스트나 이미지로 받아보세요</p>

      {/* 기간 선택 */}
      <div className="mt-6 flex items-center gap-2">
        <input
          type="date"
          min={minDate}
          max={endDate || maxDate}
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:bg-white"
        />
        <span className="text-gray-400">~</span>
        <input
          type="date"
          min={startDate || minDate}
          max={maxDate}
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:bg-white"
        />
      </div>

      {/* 형식 선택 */}
      <div className="mt-4 flex gap-2 rounded-xl bg-gray-100 p-1">
        {(['text', 'image'] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); resetOutputs() }}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
              mode === m ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
            }`}
          >
            {m === 'text' ? '텍스트' : '이미지'}
          </button>
        ))}
      </div>

      <button
        onClick={handleGenerate}
        disabled={generating}
        className="mt-4 w-full rounded-xl bg-blue-500 py-3.5 text-sm font-semibold text-white active:scale-95 transition disabled:opacity-50"
      >
        {generating ? '생성 중...' : '근무 내역 만들기'}
      </button>

      {/* 텍스트 결과 */}
      {mode === 'text' && reportText && (
        <div className="mt-5">
          <pre className="whitespace-pre-wrap rounded-xl border border-gray-100 bg-gray-50 p-4 text-xs text-gray-700">
            {reportText}
          </pre>
          <button
            onClick={handleCopy}
            className="mt-3 w-full rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 active:bg-gray-50 transition"
          >
            {copied ? '복사되었습니다' : '복사하기'}
          </button>
        </div>
      )}

      {/* 이미지 결과 */}
      {mode === 'image' && imageUrl && (
        <div className="mt-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="근무 내역" className="w-full rounded-xl border border-gray-100" />
          <button
            onClick={handleShareImage}
            className="mt-3 w-full rounded-xl bg-blue-500 py-3 text-sm font-semibold text-white active:scale-95 transition"
          >
            공유하기
          </button>
        </div>
      )}
    </div>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1 text-sm text-gray-500">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
      설정
    </button>
  )
}
