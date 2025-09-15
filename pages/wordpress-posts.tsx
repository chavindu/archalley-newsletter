import { useState, useEffect, useRef } from 'react'
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
  const [loadingMore, setLoadingMore] = useState(false)
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

  // Live search
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search input
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(handle)
  }, [search])

  // Reset and fetch when search changes (handle current page === 1 case)
  useEffect(() => {
    setPosts([])
    if (pagination.page === 1) {
      fetchPosts(1)
    } else {
      setPagination(prev => ({ ...prev, page: 1 }))
    }
  }, [debouncedSearch])

  // Fetch when page changes
  useEffect(() => {
    fetchPosts(pagination.page)
  }, [pagination.page])

  const fetchPosts = async (pageToFetch: number) => {
    const isFirstPage = pageToFetch === 1
    if (isFirstPage) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }
    try {
      const params = new URLSearchParams({
        page: pageToFetch.toString(),
        limit: pagination.limit.toString(),
        status: 'active',
        ...(debouncedSearch && { search: debouncedSearch })
      })

      const response = await fetch(`/api/wordpress/posts-stored?${params}`)
      if (!response.ok) throw new Error('Failed to fetch posts')

      const data = await response.json()
      setPosts(prev => (isFirstPage ? data.posts : [...prev, ...data.posts]))
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching posts:', error)
      showSnackbar('Error fetching posts', 'error')
    } finally {
      if (isFirstPage) {
        setLoading(false)
      } else {
        setLoadingMore(false)
      }
    }
  }

  // Infinite scroll
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    if (!loadMoreRef.current) return

    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver((entries) => {
      const first = entries[0]
      if (first.isIntersecting && pagination.hasNext && !loadingMore && !loading) {
        setPagination(prev => ({ ...prev, page: prev.page + 1 }))
      }
    })

    observerRef.current.observe(loadMoreRef.current)

    return () => {
      if (observerRef.current) observerRef.current.disconnect()
    }
  }, [pagination.hasNext, loadingMore, loading])

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
      fetchPosts(1) // Refresh the list
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
  }

  const formatDate = (dateString: string) => {
    const d = dateString ? new Date(dateString) : null
    if (!d || isNaN(d.getTime())) return ''
    return d.toLocaleDateString('en-US', {
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

          {/* Live Search */}
          <div className="card p-6 mb-6">
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
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
            </form>
          </div>

          {/* Posts Grid */}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {posts.map((post) => (
                    <div key={post.id} className="border rounded-lg overflow-hidden hover:shadow-sm transition-shadow grid grid-rows-[auto_1fr_auto]">
                      {post.featured_image_url && (
                        <img
                          src={post.featured_image_url}
                          alt={post.featured_image_alt || post.title}
                          className="w-full h-40 object-cover"
                        />
                      )}
                      <div className="p-4 flex flex-col">
                        <div className="flex items-start mb-2">
                          <h3 className="text-base font-semibold text-gray-900 mr-2 line-clamp-2">
                            {decodeHtmlEntities(post.title)}
                          </h3>
                          {post.is_featured && (
                            <StarIcon className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                          )}
                        </div>
                        {post.excerpt && (
                          <p className="text-gray-600 mb-3 text-sm line-clamp-3">
                            {decodeHtmlEntities(post.excerpt.replace(/<[^>]*>/g, ''))}
                          </p>
                        )}
                        <div>
                          <div className="flex items-center justify-start text-xs text-gray-500 mb-3">
                            <div className="flex items-center">
                              <CalendarIcon className="h-4 w-4 mr-1" />
                              {formatDate(post.published_date)}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-700 mb-3">
                            {Array.isArray(post.categories) && post.categories.length > 0 ? (
                              post.categories.map(cat => (
                                <span key={cat.slug || cat.name} className="bg-gray-100 border border-gray-200 rounded-full px-2 py-0.5">
                                  {decodeHtmlEntities(cat.name)}
                                </span>
                              ))
                            ) : (
                              <span className="bg-gray-100 border border-gray-200 rounded-full px-2 py-0.5">Uncategorized</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="px-4 pb-[15px]">
                        <a
                          href={post.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary block w-full text-center text-sm"
                        >
                          <span className="inline-flex items-center justify-center">
                            <EyeIcon className="h-4 w-4 mr-1" />
                            View
                          </span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

                <div ref={loadMoreRef} className="h-8"></div>
                {loadingMore && (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
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
