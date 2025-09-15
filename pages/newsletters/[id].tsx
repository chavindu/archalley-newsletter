import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import { getSession, useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import {
  ArrowLeftIcon,
  PencilIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { supabase, EmailList, Newsletter } from '@/lib/supabase'

export default function EditNewsletter() {
  const router = useRouter()
  const { id } = router.query
  const { data: session } = useSession()
  const [newsletter, setNewsletter] = useState<Newsletter | null>(null)
  const [loading, setLoading] = useState(true)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

  useEffect(() => {
    if (id) {
      fetchNewsletter()
    }
  }, [id])

  const fetchNewsletter = async () => {
    try {
      const { data, error } = await supabase
        .from('newsletters')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setNewsletter(data)
    } catch (error) {
      console.error('Error fetching newsletter:', error)
      showSnackbar('Error fetching newsletter', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleSend = async () => {
    if (!confirm('Are you sure you want to send this newsletter? This will send it to all subscribers in the selected email lists.')) {
      return
    }

    try {
      const response = await fetch(`/api/newsletters/send/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()
      
      if (response.ok) {
        showSnackbar(result.message, 'success')
        fetchNewsletter()
      } else {
        showSnackbar(result.message || 'Error sending newsletter', 'error')
      }
    } catch (error) {
      console.error('Error sending newsletter:', error)
      showSnackbar('Error sending newsletter', 'error')
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex justify-center items-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  if (!newsletter) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="text-center py-8">
            <p className="text-gray-500">Newsletter not found</p>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div>
          <div className="flex items-center mb-8">
            <button
              onClick={() => router.push('/newsletters')}
              className="mr-4 text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                {newsletter.title}
              </h1>
              <p className="text-gray-600">
                Newsletter Details
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push(`/newsletters/${id}/edit`)}
                className="btn-secondary flex items-center"
              >
                <PencilIcon className="h-5 w-5 mr-2" />
                Edit
              </button>
              {newsletter.status === 'draft' && (
                <button
                  onClick={handleSend}
                  className="btn-primary flex items-center"
                >
                  <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                  Send Newsletter
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Newsletter Content
                </h2>
                {/* Render banner preview if present on record */}
                {(newsletter as any).ad_snapshot_image_url_600 && (newsletter as any).ad_snapshot_target_url && (
                  <div className="mb-4">
                    <a href={(newsletter as any).ad_snapshot_target_url} target="_blank" rel="noreferrer">
                      <img src={(newsletter as any).ad_snapshot_image_url_600} alt="Ad banner" className="w-full h-auto" />
                    </a>
                  </div>
                )}
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: newsletter.content }}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Newsletter Info
                </h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="text-sm text-gray-900">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        newsletter.status === 'draft' 
                          ? 'bg-gray-100 text-gray-800' 
                          : newsletter.status === 'sent'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {newsletter.status}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                    <dd className="text-sm text-gray-900">
                      {new Date(newsletter.created_at).toLocaleDateString()}
                    </dd>
                  </div>
                  {newsletter.sent_at && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Sent</dt>
                      <dd className="text-sm text-gray-900">
                        {new Date(newsletter.sent_at).toLocaleDateString()}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Selected Posts</dt>
                    <dd className="text-sm text-gray-900">
                      {newsletter.selected_posts?.length || 0}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email Lists</dt>
                    <dd className="text-sm text-gray-900">
                      {newsletter.email_list_ids?.length || 0}
                    </dd>
                  </div>
                </dl>
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