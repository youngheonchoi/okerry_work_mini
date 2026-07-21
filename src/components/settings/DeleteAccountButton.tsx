'use client'

import { useState, useTransition } from 'react'

export function DeleteAccountButton({ action }: { action: () => Promise<void> }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleConfirm = () => {
    startTransition(() => {
      action()
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center justify-between px-4 py-3.5 text-left active:bg-red-50 transition"
      >
        <span className="text-sm font-medium text-red-500">회원 탈퇴</span>
        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => !isPending && setIsOpen(false)} />

          <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
              <h3 className="text-base font-bold text-gray-900">정말 탈퇴하시겠습니까?</h3>
              <p className="mt-2 text-sm text-gray-500">모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.</p>

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                  className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 active:bg-gray-50 transition disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isPending}
                  className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-semibold text-white active:bg-red-600 transition disabled:opacity-50"
                >
                  {isPending ? '처리 중...' : '탈퇴하기'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
