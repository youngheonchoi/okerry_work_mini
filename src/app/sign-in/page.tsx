import SignInButton from './SignInButton'
import GuestSignInForm from './GuestSignInForm'

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">okerry work mini</h1>
        </div>
        <SignInButton />
        <GuestSignInForm error={error === 'invalid_code' ? '초대코드가 올바르지 않아요' : undefined} />
      </div>
    </div>
  )
}
