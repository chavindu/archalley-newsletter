import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  StarIcon,
  CalendarIcon,
  TagIcon,
} from '@heroicons/react/24/outline'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { StoredWordPressPost } from '@/lib/wordpress-posts'
import { decodeHtmlEntities } from '@/lib/wordpress'
import { useRouter } from 'next/router'

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export default function WordPressPosts() {
  const router = useRouter()
  const [posts, setPosts] = useState<StoredWordPressPost[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })

  // Filters
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('active')
  const [featured, setFeatured] = useState('false')
  const [category, setCategory] = useState('')

  useEffect(() => {
    fetchPosts()
  }, [pagination.page, status, featured, category, search])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status,
        featured,
        ...(category && { category }),
        ...(search && { search })
      })

      const response = await fetch(`/api/wordpress/posts-stored?${params}`)
      if (!response.ok) throw new Error('Failed to fetch posts')

      const data = await response.json()
      setPosts(data.posts)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching posts:', error)
      showSnackbar('Error fetching posts', 'error')
    } finally {
      setLoading(false)
    }
  }

  const syncPosts = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/wordpress/sync-posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) throw new Error('Sync failed')

      const result = await response.json()
      showSnackbar(result.message, 'success')
      fetchPosts() // Refresh the list
    } catch (error) {
      console.error('Error syncing posts:', error)
      showSnackbar('Error syncing posts', 'error')
    } finally {
      setSyncing(false)
    }
  }

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const clearFilters = () => {
    setSearch('')
    setStatus('active')
    setFeatured('false')
    setCategory('')
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <ProtectedRoute requireSuperAdmin>
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
                  WordPress Posts
                </h1>
                <p className="text-gray-600">
                  Manage posts from archalley.com
                </p>
              </div>
            </div>
            
            <button
              onClick={syncPosts}
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
                  Sync Posts
                </>
              )}
            </button>
          </div>

          {/* Filters */}
          <div className="card p-6 mb-6">
            <div className="flex items-center mb-4">
              <FunnelIcon className="h-5 w-5 mr-2 text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            </div>
            
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input-field pl-10"
                    placeholder="Search posts..."
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="input-field"
                >
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                  <option value="deleted">Deleted</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Featured
                </label>
                <select
                  value={featured}
                  onChange={(e) => setFeatured(e.target.value)}
                  className="input-field"
                >
                  <option value="false">All Posts</option>
                  <option value="true">Featured Only</option>
                </select>
              </div>
              
              <div className="flex items-end space-x-2">
                <button
                  type="submit"
                  className="btn-secondary flex-1"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="btn-secondary"
                >
                  Clear
                </button>
              </div>
            </form>
          </div>

          {/* Posts List */}
          <div className="card p-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No posts found</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div key={post.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 mr-2">
                              {decodeHtmlEntities(post.title)}
                            </h3>
                            {post.is_featured && (
                              <StarIcon className="h-5 w-5 text-yellow-500" />
                            )}
                          </div>
                          
                          {post.excerpt && (
                            <p className="text-gray-600 mb-3 line-clamp-2">
                              {decodeHtmlEntities(post.excerpt.replace(/<[^>]*>/g, ''))}
                            </p>
                          )}
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <CalendarIcon className="h-4 w-4 mr-1" />
                              {formatDate(post.published_date)}
                            </div>
                            
                            {post.categories.length > 0 && (
                              <div className="flex items-center">
                                <TagIcon className="h-4 w-4 mr-1" />
                                {post.categories.map(cat => decodeHtmlEntities(cat.name)).join(', ')}
                              </div>
                            )}
                            
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              post.status === 'active' 
                                ? 'bg-green-100 text-green-800'
                                : post.status === 'archived'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {post.status}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <a
                            href={post.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary text-sm flex items-center"
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            View
                          </a>
                        </div>
                      </div>
                      
                      {post.featured_image_url && (
                        <div className="mt-3">
                          <img
                            src={post.featured_image_url}
                            alt={post.featured_image_alt || post.title}
                            className="w-full h-48 object-cover rounded"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-700">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                      {pagination.total} posts
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={!pagination.hasPrev}
                        className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      <span className="flex items-center px-3 py-2 text-sm text-gray-700">
                        Page {pagination.page} of {pagination.totalPages}
                      </span>
                      
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={!pagination.hasNext}
                        className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
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
