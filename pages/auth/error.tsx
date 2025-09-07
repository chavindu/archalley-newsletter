import { useRouter } from 'next/router'
import Link from 'next/link'

export default function AuthError() {
  const router = useRouter()
  const { error } = router.query

  const getErrorMessage = (error: string | string[] | undefined) => {
    if (error === 'AccessDenied') {
      return 'Access denied. You are not authorized to access this application. Please contact the administrator.'
    }
    return 'An error occurred during authentication. Please try again.'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="card p-8 text-center">
          <h1 className="text-3xl font-bold text-primary-500 mb-6">
            Archalley Newsletter
          </h1>
          
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {getErrorMessage(error)}
                </p>
              </div>
            </div>
          </div>
          
          <Link href="/login">
            <button className="btn-primary">
              Try Again
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}