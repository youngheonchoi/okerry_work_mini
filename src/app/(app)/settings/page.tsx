import Link from 'next/link'
import { getServerSession } from '@/lib/session'
import { signOut, deleteAccount } from '@/app/actions/auth'
import { DeleteAccountButton } from '@/components/settings/DeleteAccountButton'

export default async function SettingsPage() {
  const session = await getServerSession()

  return (
    <div className="flex flex-col bg-white min-h-[calc(100vh-5rem)]">
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-xl font-bold text-gray-900">설정</h1>
      </div>

      {/* 계정 */}
      <div className="px-5 mt-2">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">계정</p>
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
            <span className="text-sm text-gray-500">이메일</span>
            <span className="text-sm font-medium text-gray-700">{session?.user.email ?? ''}</span>
          </div>
          <form action={signOut}>
            <button type="submit" className="flex w-full items-center justify-between px-4 py-3.5 border-b border-gray-100 text-left active:bg-gray-100 transition">
              <span className="text-sm font-medium text-gray-800">로그아웃</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </form>
          <DeleteAccountButton action={deleteAccount} />
        </div>
      </div>

      {/* 서비스 */}
      <div className="px-5 mt-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">서비스</p>
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
          <Link href="/settings/work-history" className="flex w-full items-center justify-between px-4 py-3.5 border-b border-gray-100 text-left active:bg-gray-100 transition">
            <span className="text-sm font-medium text-gray-800">근무 내역</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </Link>
          <div className="flex w-full items-center justify-between px-4 py-3.5 text-left">
            <div>
              <p className="text-sm font-medium text-gray-800">홈 화면에 추가</p>
              <p className="text-xs text-gray-400 mt-0.5">Safari → 공유 → 홈 화면에 추가</p>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </div>
        </div>
      </div>

      <div className="mt-auto px-5 pb-6 text-center">
        <p className="text-xs text-gray-300">okerry work mini v1.0</p>
      </div>
    </div>
  )
}
