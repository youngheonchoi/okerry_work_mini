'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveWorkLog } from '@/app/actions/wage'
import type { WorkLog } from '@/lib/db/schema'

type Props = {
  dateLabel: string
  existingLog: WorkLog | null
}

export default function TodayFlow({ dateLabel, existingLog }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<'home' | 1 | 2 | 3>('home')
  const [worked, setWorked] = useState(false)
  const [isHoliday, setIsHoliday] = useState(false)
  const [overtimeHrs, setOvertimeHrs] = useState(0)
  const [saving, setSaving] = useState(false)

  const isRecorded = !!existingLog

  async function submit(data: { worked: boolean; isHoliday: boolean; overtimeHrs: number }) {
    setSaving(true)
    try {
      await saveWorkLog(data)
      router.push('/calendar')
    } catch {
      setSaving(false)
    }
  }

  // 홈 화면
  if (step === 'home') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center gap-6">
        <div>
          <p className="text-sm text-gray-400">{dateLabel}</p>
          <h2 className="mt-2 text-xl font-bold text-gray-900">오늘 하루도 수고하셨어요</h2>
        </div>
        <div className={`rounded-xl px-4 py-2 text-sm font-medium ${isRecorded ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
          {isRecorded ? '오늘 기록 완료' : '아직 기록이 없어요'}
        </div>
        <button
          onClick={() => setStep(1)}
          className="w-full max-w-xs rounded-xl bg-blue-500 py-4 text-base font-semibold text-white active:scale-95 transition"
        >
          {isRecorded ? '다시 기록하기' : '오늘 기록하기'}
        </button>
      </div>
    )
  }

  const totalSteps = worked ? 3 : 1

  return (
    <div className="flex flex-1 flex-col px-6 pt-10">
      {/* 진행도 */}
      <div className="mb-8 flex items-center gap-3">
        {step !== 1 && (
          <button
            onClick={() => setStep(step === 3 ? 2 : step === 2 ? 1 : 'home')}
            className="text-gray-400"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <span className="text-sm font-medium text-gray-400">
          {step} / {totalSteps}
        </span>
      </div>

      {/* Step 1: 출근 여부 */}
      {step === 1 && (
        <div className="flex flex-1 flex-col">
          <h2 className="text-xl font-semibold text-gray-900">오늘 출근하셨나요?</h2>
          <div className="mt-8 space-y-3">
            <button
              onClick={() => { setWorked(true); setStep(2) }}
              className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 text-left font-semibold text-gray-800 active:bg-blue-50 transition"
            >
              예
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
            <button
              onClick={() => { setWorked(false); submit({ worked: false, isHoliday: false, overtimeHrs: 0 }) }}
              disabled={saving}
              className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 text-left font-semibold text-gray-800 active:bg-blue-50 transition disabled:opacity-50"
            >
              아니오 (쉬는 날)
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: 휴일 여부 */}
      {step === 2 && (
        <div className="flex flex-1 flex-col">
          <h2 className="text-xl font-semibold text-gray-900">오늘 휴일인가요?</h2>
          <p className="mt-1 text-sm text-gray-500">공휴일 또는 주말에 출근하셨나요?</p>
          <div className="mt-8 space-y-3">
            {(['예', '아니오'] as const).map((label) => (
              <button
                key={label}
                onClick={() => { setIsHoliday(label === '예'); setStep(3) }}
                className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 text-left font-semibold text-gray-800 active:bg-blue-50 transition"
              >
                {label}
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: 야근 */}
      {step === 3 && (
        <div className="flex flex-1 flex-col">
          <h2 className="text-xl font-semibold text-gray-900">야근하셨나요?</h2>
          <p className="mt-1 text-sm text-gray-500">야근 시간을 선택하거나 아니오를 눌러주세요</p>
          <div className="mt-10 flex flex-col items-center gap-6">
            <div className="flex items-center gap-8">
              <button
                onClick={() => setOvertimeHrs(Math.max(0, overtimeHrs - 0.5))}
                className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-gray-200 text-2xl text-gray-600 active:bg-gray-100 transition"
              >
                −
              </button>
              <span className="w-24 text-center text-3xl font-bold text-gray-900">
                {overtimeHrs}시간
              </span>
              <button
                onClick={() => setOvertimeHrs(overtimeHrs + 0.5)}
                className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-blue-500 text-2xl text-blue-500 active:bg-blue-50 transition"
              >
                +
              </button>
            </div>
          </div>
          <div className="mt-auto mb-8 space-y-3">
            {overtimeHrs > 0 && (
              <button
                onClick={() => submit({ worked, isHoliday, overtimeHrs })}
                disabled={saving}
                className="w-full rounded-xl bg-blue-500 py-4 text-base font-semibold text-white disabled:opacity-50 active:scale-95 transition"
              >
                {saving ? '저장 중...' : `${overtimeHrs}시간 야근 기록하기`}
              </button>
            )}
            <button
              onClick={() => submit({ worked, isHoliday, overtimeHrs: 0 })}
              disabled={saving}
              className="w-full rounded-xl border border-gray-200 py-4 text-base font-semibold text-gray-600 disabled:opacity-50 active:scale-95 transition"
            >
              아니오 (야근 없음)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
