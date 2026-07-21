'use client'

import { useState } from 'react'
import { guestSignIn } from '@/app/actions/auth'

export default function GuestSignInForm({ error }: { error?: string }) {
  const [open, setOpen] = useState(Boolean(error))

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-center text-sm text-gray-400 underline-offset-2 hover:text-gray-600 hover:underline"
      >
        초대코드로 로그인
      </button>
    )
  }

  return (
    <form action={guestSignIn} className="space-y-2">
      <input
        type="password"
        name="code"
        placeholder="초대코드"
        autoFocus
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 shadow-sm outline-none focus:border-gray-400"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        type="submit"
        className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800 active:scale-95"
      >
        코드로 로그인
      </button>
    </form>
  )
}
