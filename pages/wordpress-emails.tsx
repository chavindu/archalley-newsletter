import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  EnvelopeIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useRouter } from 'next/router'

interface EmailStats {
  total_subscribers: number
  active_subscribers: number
  unsubscribed_subscribers: number
  bounced_subscribers: number
}

interface SyncResult {
  success: boolean
  message: string
  synced: number
  updated: number
  errors: number
  total_fetched: number
}

export default function WordPressEmails() {
  const router = useRouter()
  const [stats, setStats] = useState<EmailStats>({
    total_subscribers: 0,
    active_subscribers: 0,
    unsubscribed_subscribers: 0,
    bounced_subscribers: 0
  })
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/wordpress/email-stats')
      if (!response.ok) throw new Error('Failed to fetch stats')

      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
      showSnackbar('Error fetching email statistics', 'error')
    } finally {
      setLoading(false)
    }
  }

  const syncEmails = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/wordpress/sync-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) throw new Error('Sync failed')

      const result: SyncResult = await response.json()
      showSnackbar(result.message, result.success ? 'success' : 'error')
      fetchStats() // Refresh the stats
    } catch (error) {
      console.error('Error syncing emails:', error)
      showSnackbar('Error syncing emails', 'error')
    } finally {
      setSyncing(false)
    }
  }

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/newsletters')}
                className="mr-4 text-gray-500 hover:text-gray-700"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  WordPress Emails
                </h1>
                <p className="text-gray-600">
                  Manage email subscribers from archalley.com
                </p>
              </div>
            </div>
            
            <button
              onClick={syncEmails}
              disabled={syncing}
              className="btn-primary flex items-center"
            >
              {syncing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Syncing...
                </>
              ) : (
                <>
                  <ArrowPathIcon className="h-5 w-5 mr-2" />
                  Sync Emails
                </>
              )}
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <UserGroupIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Subscribers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : stats.total_subscribers}
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : stats.active_subscribers}
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Unsubscribed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : stats.unsubscribed_subscribers}
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Bounced</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : stats.bounced_subscribers}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Information Card */}
          <div className="card p-6">
            <div className="flex items-start">
              <div className="p-2 bg-blue-100 rounded-lg">
                <EnvelopeIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  WordPress Email Sync
                </h3>
                <div className="text-gray-600 space-y-2">
                  <p>
                    This system automatically fetches email addresses from the WordPress website 
                    archalley.com and syncs them to the email list with ID: <code className="bg-gray-100 px-2 py-1 rounded text-sm">b163441c-e44d-4461-b600-ebe79e39644f</code>
                  </p>
                  <p>
                    <strong>API Endpoint:</strong> https://archalley.com/wp-json/bitlab-custom-api/v1/user-emails
                  </p>
                  <p>
                    <strong>Sync Schedule:</strong> Every 24 hours at midnight UTC
                  </p>
                  <p>
                    <strong>Features:</strong>
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Fetches all email addresses from WordPress</li>
                    <li>Adds new subscribers to the email list</li>
                    <li>Reactivates previously unsubscribed users</li>
                    <li>Skips already active subscribers</li>
                    <li>Provides detailed sync statistics</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Manual Sync Instructions */}
          <div className="card p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Manual Sync Instructions
            </h3>
            <div className="text-gray-600 space-y-3">
              <p>
                <strong>Option 1 - Node.js Cron Job (Recommended):</strong>
              </p>
              <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm">
                <div>cd scripts</div>
                <div>npm run start-emails</div>
              </div>
              
              <p>
                <strong>Option 2 - Windows Task Scheduler:</strong>
              </p>
              <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm">
                <div>Create a task to run scripts/sync-wordpress-emails.bat daily</div>
              </div>
              
              <p>
                <strong>Option 3 - Linux Cron Job:</strong>
              </p>
              <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm">
                <div>0 0 * * * /path/to/scripts/sync-wordpress-emails.sh</div>
              </div>
            </div>
          </div>

          {/* Snackbar */}
          {snackbar.open && (
            <div className="fixed bottom-4 right-4 z-50">
              <div className={`p-4 rounded-md shadow-lg ${
                snackbar.severity === 'success' 
                  ? 'bg-green-50 border border-green-200 text-green-800' 
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{snackbar.message}</p>
                  </div>
                  <button
                    onClick={() => setSnackbar({ ...snackbar, open: false })}
                    className="ml-4 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
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
