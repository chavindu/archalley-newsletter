import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import { getSession, useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import {
  ArrowLeftIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { supabase, EmailList } from '@/lib/supabase'

export default function NewNewsletter() {
  const router = useRouter()
  const { data: session } = useSession()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [emailLists, setEmailLists] = useState<EmailList[]>([])
  const [selectedEmailLists, setSelectedEmailLists] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

  useEffect(() => {
    fetchEmailLists()
  }, [])

  const fetchEmailLists = async () => {
    try {
      const { data, error } = await supabase
        .from('email_lists')
        .select('*')
        .order('name')

      if (error) throw error
      setEmailLists(data || [])
    } catch (error) {
      console.error('Error fetching email lists:', error)
      showSnackbar('Error fetching email lists', 'error')
    }
  }

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleSave = async () => {
    if (!title.trim()) {
      showSnackbar('Please enter a newsletter title', 'error')
      return
    }

    if (!content.trim()) {
      showSnackbar('Please enter newsletter content', 'error')
      return
    }

    if (selectedEmailLists.length === 0) {
      showSnackbar('Please select at least one email list', 'error')
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('newsletters')
        .insert({
          title,
          content,
          selected_posts: [],
          email_list_ids: selectedEmailLists,
          status: 'draft',
          created_by: session?.user?.id,
        })
        .select()
        .single()

      if (error) throw error
      showSnackbar('Newsletter created successfully', 'success')
      router.push(`/newsletters/${data.id}`)
    } catch (error) {
      console.error('Error creating newsletter:', error)
      showSnackbar('Error creating newsletter', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailListChange = (emailListId: string) => {
    setSelectedEmailLists(prev => 
      prev.includes(emailListId) 
        ? prev.filter(id => id !== emailListId)
        : [...prev, emailListId]
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Create Newsletter
              </h1>
              <p className="text-gray-600">
                Create a new newsletter
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Newsletter Details
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="input-field"
                      placeholder="Enter newsletter title"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                      Content
                    </label>
                    <textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="input-field"
                      rows={10}
                      placeholder="Enter newsletter content (HTML supported)"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Email Lists
                </h3>
                
                <div className="space-y-3">
                  {emailLists.map((list) => (
                    <label key={list.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedEmailLists.includes(list.id)}
                        onChange={() => handleEmailListChange(list.id)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        {list.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="card p-6">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <DocumentTextIcon className="h-5 w-5 mr-2" />
                      Create Newsletter
                    </>
                  )}
                </button>
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