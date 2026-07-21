import SignInButton from './SignInButton'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">okerry</h1>
          <p className="mt-2 text-sm text-gray-500">일용직 일당 기록 서비스</p>
        </div>
        <SignInButton />
      </div>
    </div>
  )
}
