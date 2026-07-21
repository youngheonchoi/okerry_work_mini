'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveWageSettings } from '@/app/actions/wage'
import { format, addDays } from 'date-fns'

type PayType = 'daily' | 'weekly' | 'monthly'

export default function OnboardingFlow() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [dailyWage, setDailyWage] = useState('')
  const [payType, setPayType] = useState<PayType | null>(null)
  const [nextPayDate, setNextPayDate] = useState('')
  const [loading, setLoading] = useState(false)

  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')

  async function handleSubmit() {
    if (!payType || !nextPayDate || !dailyWage) return
    setLoading(true)
    try {
      await saveWageSettings({
        dailyWage: Number(dailyWage.replace(/,/g, '')),
        payType,
        nextPayDate,
      })
      router.push('/today')
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col px-6 pt-14">
      {/* 헤더 */}
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-bold text-gray-900">okerry work mini</h1>
        <p className="mt-1 text-sm text-gray-500">기본 정보를 입력해 주세요</p>
      </div>

      {/* 진행 바 */}
      <div className="mb-10 flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors ${
              s <= step ? 'bg-blue-500' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Step 1: 일당 입력 */}
      {step === 1 && (
        <div className="flex flex-1 flex-col">
          <h2 className="text-xl font-semibold text-gray-900">기본 일당이 얼마인가요?</h2>
          <p className="mt-1 text-sm text-gray-500">하루 8시간 기준 금액을 입력해 주세요</p>
          <div className="mt-8 relative">
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={dailyWage}
              onChange={(e) => {
                const digitsOnly = e.target.value.replace(/[^0-9]/g, '')
                const formatted = digitsOnly ? Number(digitsOnly).toLocaleString() : ''
                if (formatted.length > 12) return
                setDailyWage(formatted)
              }}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-4 pl-4 pr-12 text-right text-2xl font-bold text-gray-900 outline-none focus:border-blue-500 focus:bg-white"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-gray-400">원</span>
          </div>
          <button
            onClick={() => setStep(2)}
            disabled={!dailyWage || Number(dailyWage.replace(/,/g, '')) <= 0}
            className="mt-auto mb-8 w-full rounded-xl bg-blue-500 py-4 text-base font-semibold text-white disabled:opacity-40 active:scale-95 transition"
          >
            다음
          </button>
        </div>
      )}

      {/* Step 2: 급여 유형 */}
      {step === 2 && (
        <div className="flex flex-1 flex-col">
          <button onClick={() => setStep(1)} className="mb-6 flex items-center gap-1 text-sm text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            이전
          </button>
          <h2 className="text-xl font-semibold text-gray-900">급여를 어떻게 받으시나요?</h2>
          <div className="mt-8 space-y-3">
            {([['daily', '일급', '일하는 날마다'], ['weekly', '주급', '매주 특정 요일'], ['monthly', '월급', '매월 특정 날짜']] as const).map(([type, label, desc]) => (
              <button
                key={type}
                onClick={() => setPayType(type)}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-4 transition ${
                  payType === type
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="text-left">
                  <p className={`font-semibold ${payType === type ? 'text-blue-600' : 'text-gray-800'}`}>{label}</p>
                  <p className="text-sm text-gray-500">{desc}</p>
                </div>
                {payType === type && (
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep(3)}
            disabled={!payType}
            className="mt-auto mb-8 w-full rounded-xl bg-blue-500 py-4 text-base font-semibold text-white disabled:opacity-40 active:scale-95 transition"
          >
            다음
          </button>
        </div>
      )}

      {/* Step 3: 다음 지급일 */}
      {step === 3 && (
        <div className="flex flex-1 flex-col">
          <button onClick={() => setStep(2)} className="mb-6 flex items-center gap-1 text-sm text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            이전
          </button>
          <h2 className="text-xl font-semibold text-gray-900">다음 급여일이 언제인가요?</h2>
          <p className="mt-1 text-sm text-gray-500">
            {payType === 'weekly' && '선택한 요일이 매주 급여일로 설정됩니다'}
            {payType === 'monthly' && '선택한 날짜가 매월 급여일로 설정됩니다'}
            {payType === 'daily' && '일하는 날 매일 급여가 정산됩니다'}
          </p>
          <div className="mt-8">
            <input
              type="date"
              min={tomorrow}
              value={nextPayDate}
              onChange={(e) => setNextPayDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-base text-gray-900 outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={!nextPayDate || loading}
            className="mt-auto mb-8 w-full rounded-xl bg-blue-500 py-4 text-base font-semibold text-white disabled:opacity-40 active:scale-95 transition"
          >
            {loading ? '저장 중...' : '시작하기'}
          </button>
        </div>
      )}
    </div>
  )
}
