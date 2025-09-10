import { useState } from 'react'
import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { EnvelopeIcon } from '@heroicons/react/24/outline'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function TestEmail() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testEmail = async () => {
    if (!email) {
      setResult({ success: false, error: 'Please enter an email address' })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/test-smtp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to: email }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ success: false, error: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute requireSuperAdmin>
      <Layout>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Test Email Sending
          </h1>
          <p className="text-gray-600 mb-8">
            Test the SMTP configuration and email sending functionality
          </p>

          <div className="card p-6 max-w-2xl">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Send Test Email
            </h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="Enter email address to test"
                />
              </div>
              
              <button
                onClick={testEmail}
                disabled={loading}
                className="btn-primary flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <EnvelopeIcon className="h-5 w-5 mr-2" />
                    Send Test Email
                  </>
                )}
              </button>
            </div>

            {result && (
              <div className="mt-6">
                {result.success ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800">
                          <strong>Success!</strong> Test email sent successfully.
                        </p>
                        {result.messageId && (
                          <p className="text-xs text-green-700 mt-1">
                            Message ID: {result.messageId}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-red-800">
                          <strong>Error:</strong> {result.error}
                        </p>
                        {result.details && (
                          <p className="text-xs text-red-700 mt-1">
                            Details: {JSON.stringify(result.details)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="card p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Troubleshooting Steps
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Check your <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">.env.local</code> file has correct SMTP credentials</li>
              <li>Verify the SMTP server settings are correct</li>
              <li>Test with a simple email address first</li>
              <li>Check the server console for detailed error messages</li>
              <li>Ensure your email provider allows SMTP connections</li>
            </ol>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context)

  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}