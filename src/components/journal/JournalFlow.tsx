'use client'

import { useState } from 'react'
import { addDays, format, parseISO, subDays } from 'date-fns'
import { ko } from 'date-fns/locale'
import { getJournal, saveJournal } from '@/app/actions/journal'
import type { JournalEntry } from '@/lib/db/schema'

const MAX_ENTRIES = 20
const EMPTY_ENTRY: JournalEntry = { startTime: '', endTime: '', memo: '' }

type Props = {
  today: string
  initialDate: string
  initialEntries: JournalEntry[]
}

export default function JournalFlow({ today, initialDate, initialEntries }: Props) {
  const [date, setDate] = useState(initialDate)
  const [entries, setEntries] = useState<JournalEntry[]>(
    initialEntries.length ? initialEntries : [{ ...EMPTY_ENTRY }],
  )
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const dateLabel = format(parseISO(date), 'M월 d일 (eee)', { locale: ko })
  const isToday = date === today

  async function loadDate(newDate: string) {
    setDate(newDate)
    setError(null)
    setSaved(false)
    setLoading(true)
    try {
      const fetched = await getJournal(newDate)
      setEntries(fetched.length ? fetched : [{ ...EMPTY_ENTRY }])
    } finally {
      setLoading(false)
    }
  }

  function updateEntry(index: number, field: keyof JournalEntry, value: string) {
    setEntries((prev) => prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)))
  }

  function addEntry() {
    if (entries.length >= MAX_ENTRIES) return
    setEntries((prev) => [...prev, { ...EMPTY_ENTRY }])
  }

  function removeEntry(index: number) {
    setEntries((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    setError(null)

    const filled = entries.filter((e) => e.startTime)
    for (const e of filled) {
      if (e.endTime && e.endTime < e.startTime) {
        setError('종료시간은 시작시간보다 빠를 수 없습니다')
        return
      }
    }

    setSaving(true)
    try {
      await saveJournal(date, filled)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장에 실패했습니다')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col bg-white px-5 pt-8 pb-10">
      <h1 className="text-xl font-bold text-gray-900">일지 기록</h1>

      {/* 날짜 이동 */}
      <div className="mt-5 flex items-center justify-between">
        <button
          onClick={() => loadDate(format(subDays(parseISO(date), 1), 'yyyy-MM-dd'))}
          className="p-2 text-gray-400 active:text-gray-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>

        <label className="relative flex items-center gap-1 text-base font-semibold text-gray-900">
          {dateLabel}
          {isToday && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">오늘</span>}
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => e.target.value && loadDate(e.target.value)}
            className="absolute inset-0 opacity-0"
          />
        </label>

        <button
          onClick={() => loadDate(format(addDays(parseISO(date), 1), 'yyyy-MM-dd'))}
          disabled={isToday}
          className="p-2 text-gray-400 active:text-gray-700 disabled:opacity-30"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      {/* 항목 리스트 */}
      <div className={`mt-6 space-y-3 ${loading ? 'opacity-40' : ''}`}>
        {entries.map((entry, index) => (
          <div key={index} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={entry.startTime}
                  onChange={(e) => updateEntry(index, 'startTime', e.target.value)}
                  className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 outline-none focus:border-blue-500"
                />
                <span className="text-gray-400">~</span>
                <input
                  type="time"
                  value={entry.endTime ?? ''}
                  onChange={(e) => updateEntry(index, 'endTime', e.target.value)}
                  className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 outline-none focus:border-blue-500"
                />
              </div>
              {entries.length > 1 && (
                <button onClick={() => removeEntry(index)} className="text-gray-300 active:text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
            <input
              type="text"
              placeholder="메모 (예: 출근 버스 탑승)"
              value={entry.memo ?? ''}
              onChange={(e) => updateEntry(index, 'memo', e.target.value)}
              className="mt-3 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500"
            />
          </div>
        ))}
      </div>

      <button
        onClick={addEntry}
        disabled={entries.length >= MAX_ENTRIES}
        className="mt-3 w-full rounded-xl border border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 active:bg-gray-50 transition disabled:opacity-40"
      >
        {entries.length >= MAX_ENTRIES ? '항목은 최대 20개까지 등록할 수 있어요' : '+ 항목 추가'}
      </button>

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving || loading}
        className="mt-auto pt-6 w-full rounded-xl bg-blue-500 py-4 text-base font-semibold text-white active:scale-95 transition disabled:opacity-50"
      >
        {saving ? '저장 중...' : saved ? '저장되었습니다' : '저장하기'}
      </button>
    </div>
  )
}
