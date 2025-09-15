import { useState, useEffect, useMemo } from 'react'
import { GetServerSideProps } from 'next'
import { getSession, useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  NewspaperIcon,
  PlusIcon,
  XMarkIcon,
  ClockIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { supabase, EmailList } from '@/lib/supabase'
import { decodeHtmlEntities } from '@/lib/wordpress'
import { EmailPost } from '@/lib/email'

export default function NewNewsletter() {
  const router = useRouter()
  const { data: session } = useSession()
  const [title, setTitle] = useState('')
  const [emailLists, setEmailLists] = useState<EmailList[]>([])
  const [selectedEmailLists, setSelectedEmailLists] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  
  // WordPress posts state
  const [wpPosts, setWpPosts] = useState<EmailPost[]>([])
  const [selectedPosts, setSelectedPosts] = useState<EmailPost[]>([])
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [activeCategories, setActiveCategories] = useState<string[]>([])
  const [tempSelectedIds, setTempSelectedIds] = useState<Record<number, boolean>>({})
  
  // Send options
  const [sendOption, setSendOption] = useState<'now' | 'schedule'>('now')
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')

  useEffect(() => {
    const initializePage = async () => {
      await Promise.all([
        fetchEmailLists(),
        fetchWordPressPosts(),
        fetchWordPressCategories()
      ])
    }
    
    initializePage()
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

  const fetchWordPressPosts = async () => {
    setLoadingPosts(true)
    try {
      const response = await fetch('/api/wordpress/posts-stored?limit=20')
      if (!response.ok) throw new Error('Failed to fetch posts')
      
      const data = await response.json()
      // Convert stored posts to EmailPost format with word limit applied
      const emailPosts = data.posts.map((post: any) => {
        // Apply 20-word limit to excerpt
        const excerpt = post.excerpt || ''
        const words = excerpt.split(' ')
        const limitedExcerpt = words.length > 20 
          ? words.slice(0, 20).join(' ') + '...'
          : excerpt
        
        return {
          id: post.wp_post_id,
          title: decodeHtmlEntities(post.title),
          excerpt: decodeHtmlEntities(limitedExcerpt),
          link: post.link,
          featured_image: post.featured_image_url,
          categories: post.categories.map((cat: any) => decodeHtmlEntities(cat.name)),
          date: post.published_date
        }
      })
      
      setWpPosts(emailPosts)
    } catch (error) {
      console.error('Error fetching WordPress posts:', error)
      showSnackbar('Error fetching WordPress posts', 'error')
    } finally {
      setLoadingPosts(false)
    }
  }

  const fetchWordPressCategories = async () => {
    try {
      const response = await fetch('/api/wordpress/categories')
      if (!response.ok) throw new Error('Failed to fetch categories')
      const data = await response.json()
      const names: string[] = (data.categories || []).map((c: { name: string }) => c.name)
      setCategories(names.sort((a, b) => a.localeCompare(b)))
    } catch (error) {
      console.error('Error fetching WordPress categories:', error)
    }
  }

  const addPostToNewsletter = (post: EmailPost) => {
    if (!selectedPosts.find(p => p.id === post.id)) {
      setSelectedPosts([...selectedPosts, post])
    }
  }

  const removePostFromNewsletter = (postId: number) => {
    setSelectedPosts(selectedPosts.filter(p => p.id !== postId))
  }

  const toggleTempSelect = (postId: number) => {
    setTempSelectedIds(prev => ({ ...prev, [postId]: !prev[postId] }))
  }

  const clearTempSelection = () => setTempSelectedIds({})

  const selectAllVisible = (ids: number[]) => {
    const next: Record<number, boolean> = { ...tempSelectedIds }
    ids.forEach(id => { next[id] = true })
    setTempSelectedIds(next)
  }

  const addTempSelectedToNewsletter = () => {
    const ids = Object.keys(tempSelectedIds)
      .filter(id => tempSelectedIds[parseInt(id)])
      .map(id => parseInt(id))
    if (ids.length === 0) return
    const toAdd = wpPosts.filter(p => ids.includes(p.id)).filter(p => !selectedPosts.find(sp => sp.id === p.id))
    if (toAdd.length === 0) return
    setSelectedPosts([...selectedPosts, ...toAdd])
    clearTempSelection()
  }

  const isPostAlreadyAdded = (postId: number) => selectedPosts.find(p => p.id === postId) !== undefined

  const toggleCategory = (name: string) => {
    setActiveCategories(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name])
  }

  const clearCategories = () => setActiveCategories([])

  const filteredPosts = useMemo(() => {
    if (activeCategories.length === 0) return wpPosts
    const set = new Set(activeCategories)
    return wpPosts.filter(p => (p.categories || []).some(c => set.has(c)))
  }, [wpPosts, activeCategories])

  const generateNewsletterContent = () => {
    if (selectedPosts.length === 0) {
      showSnackbar('Please select at least one post', 'error')
      return
    }

    const postsHtml = selectedPosts.map(post => `
      <div class="post-item" style="margin-bottom: 20px; padding: 15px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h3 style="margin: 0 0 10px 0; font-size: 18px;">
          <a href="${post.link}" style="color: #333; text-decoration: none;">${post.title}</a>
        </h3>
        <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
          ${new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        <p style="margin: 0 0 10px 0; color: #555; line-height: 1.5;">
          ${post.excerpt}
        </p>
        <a href="${post.link}" style="color: #FFA500; text-decoration: none; font-weight: bold;">
          Read Full Article →
        </a>
      </div>
    `).join('')

    const newsletterContent = `
      <div class="newsletter-content">
        <h2 style="color: #333; margin-bottom: 20px;">Latest from Archalley</h2>
        ${postsHtml}
      </div>
    `

    return newsletterContent
  }

  const handleSave = async () => {
    if (!title.trim()) {
      showSnackbar('Please enter a newsletter title', 'error')
      return
    }

    if (selectedPosts.length === 0) {
      showSnackbar('Please select at least one WordPress post', 'error')
      return
    }

    if (selectedEmailLists.length === 0) {
      showSnackbar('Please select at least one email list', 'error')
      return
    }

    if (sendOption === 'schedule' && (!scheduleDate || !scheduleTime)) {
      showSnackbar('Please select a date and time for scheduling', 'error')
      return
    }

    setLoading(true)

    try {
      // Generate newsletter content from selected posts
      const content = generateNewsletterContent()
      
      // Create newsletter data
      const newsletterData = {
        content: content,
        posts: selectedPosts
      }

      // Determine scheduled time
      let scheduledAt = null
      if (sendOption === 'schedule') {
        const scheduleDateTime = new Date(`${scheduleDate}T${scheduleTime}`)
        scheduledAt = scheduleDateTime.toISOString()
      }

      console.log('Creating newsletter with data:', {
        title,
        content: newsletterData,
        selected_posts: selectedPosts.map(p => p.id),
        email_list_ids: selectedEmailLists,
        status: sendOption === 'now' ? 'draft' : 'scheduled',
        scheduled_at: scheduledAt,
        created_by: session?.user?.id,
      })

      const { data, error } = await supabase
        .from('newsletters')
        .insert({
          title,
          content: JSON.stringify(newsletterData),
          selected_posts: JSON.stringify(selectedPosts.map(p => p.id)),
          email_list_ids: selectedEmailLists,
          status: sendOption === 'now' ? 'draft' : 'scheduled',
          scheduled_at: scheduledAt,
          created_by: session?.user?.id,
        })
        .select()
        .single()

      if (error) {
        console.error('Database error creating newsletter:', error)
        throw error
      }

      if (sendOption === 'now') {
        // Send immediately
        const sendResponse = await fetch(`/api/newsletters/send/${data.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (sendResponse.ok) {
          const sendResult = await sendResponse.json()
          showSnackbar(`Newsletter sent successfully! Sent to ${sendResult.sent} subscribers.`, 'success')
        } else {
          showSnackbar('Newsletter created but failed to send. Please try sending manually.', 'error')
        }
      } else {
        showSnackbar('Newsletter scheduled successfully!', 'success')
      }

      router.push('/newsletters')
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
              {/* Newsletter Title */}
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Newsletter Title
                </h2>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-field"
                  placeholder="Enter newsletter title"
                />
              </div>

              {/* WordPress Posts Section */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Select WordPress Posts
                  </h2>
                  <button
                    onClick={fetchWordPressPosts}
                    disabled={loadingPosts}
                    className="btn-secondary flex items-center"
                  >
                    {loadingPosts ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                        Loading...
                      </>
                    ) : (
                      <>
                        <ArrowPathIcon className="h-5 w-5 mr-2" />
                        Refresh Posts
                      </>
                    )}
                  </button>
                </div>

                {/* Category Filters */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-700">Filter by Categories</h3>
                    {activeCategories.length > 0 && (
                      <button onClick={clearCategories} className="text-xs text-gray-600 hover:text-gray-800">Clear</button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={clearCategories}
                      className={`px-3 py-1 rounded-full text-xs border ${activeCategories.length === 0 ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                    >
                      All
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`px-3 py-1 rounded-full text-xs border ${activeCategories.includes(cat) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedPosts.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Selected Posts ({selectedPosts.length})
                    </h3>
                    <div className="space-y-3">
                      {selectedPosts.map((post) => (
                        <div key={post.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg border">
                          <div className="flex-1 flex items-start space-x-3">
                            {post.featured_image && (
                              <img
                                src={post.featured_image}
                                alt={post.title}
                                className="w-16 h-16 object-cover rounded flex-shrink-0"
                              />
                            )}
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900 mb-1">{decodeHtmlEntities(post.title)}</h4>
                              <p className="text-xs text-gray-500 mb-2">
                                {new Date(post.date).toLocaleDateString()}
                              </p>
                              {post.excerpt && (
                                <p className="text-xs text-gray-600 line-clamp-2">
                                  {decodeHtmlEntities(post.excerpt.replace(/<[^>]*>/g, ''))}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => removePostFromNewsletter(post.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Posts */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Available Posts ({filteredPosts.length})
                  </h3>

                  {/* Bulk actions */}
                  {filteredPosts.length > 0 && (
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs text-gray-600">
                        {Object.values(tempSelectedIds).filter(Boolean).length} selected
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => selectAllVisible(filteredPosts.map(p => p.id))}
                          className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                        >
                          Select All
                        </button>
                        <button
                          onClick={clearTempSelection}
                          className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                        >
                          Clear Selection
                        </button>
                        <button
                          onClick={addTempSelectedToNewsletter}
                          className="text-xs px-2 py-1 border rounded bg-gray-900 text-white"
                        >
                          Add Selected
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {loadingPosts ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                    </div>
                  ) : filteredPosts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <NewspaperIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No posts available</p>
                      <p className="text-sm">Try clearing filters or click "Refresh Posts"</p>
                    </div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto space-y-3">
                      {filteredPosts.map((post) => (
                        <div key={post.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-start space-x-3 flex-1">
                            <input
                              type="checkbox"
                              checked={!!tempSelectedIds[post.id]}
                              onChange={() => toggleTempSelect(post.id)}
                              className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded"
                            />
                            {post.featured_image ? (
                              <img
                                src={post.featured_image}
                                alt={post.title}
                                className="w-16 h-16 object-cover rounded flex-shrink-0"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center">
                                <NewspaperIcon className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900 mb-1">{decodeHtmlEntities(post.title)}</h4>
                              <p className="text-xs text-gray-500 mb-2">
                                {new Date(post.date).toLocaleDateString()}
                              </p>
                              {post.excerpt && (
                                <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                                  {decodeHtmlEntities(post.excerpt.replace(/<[^>]*>/g, ''))}
                                </p>
                              )}
                              {post.categories.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {post.categories.slice(0, 3).map((category, index) => (
                                    <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                      {decodeHtmlEntities(category)}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => isPostAlreadyAdded(post.id) ? removePostFromNewsletter(post.id) : addPostToNewsletter(post)}
                            disabled={false}
                            className="ml-3 btn-secondary text-xs disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                          >
                            {isPostAlreadyAdded(post.id) ? 'Remove' : 'Add'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Email Lists */}
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

              {/* Send Options */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Send Options
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="sendOption"
                        value="now"
                        checked={sendOption === 'now'}
                        onChange={(e) => setSendOption(e.target.value as 'now' | 'schedule')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <span className="ml-3 text-sm text-gray-700 flex items-center">
                        <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                        Send Now
                      </span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="sendOption"
                        value="schedule"
                        checked={sendOption === 'schedule'}
                        onChange={(e) => setSendOption(e.target.value as 'now' | 'schedule')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <span className="ml-3 text-sm text-gray-700 flex items-center">
                        <ClockIcon className="h-4 w-4 mr-2" />
                        Schedule for Later
                      </span>
                    </label>
                  </div>

                  {sendOption === 'schedule' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date
                        </label>
                        <input
                          type="date"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Time
                        </label>
                        <input
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          className="input-field"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="card p-6">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {sendOption === 'now' ? 'Sending...' : 'Scheduling...'}
                    </>
                  ) : (
                    <>
                      {sendOption === 'now' ? (
                        <>
                          <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                          Send Newsletter
                        </>
                      ) : (
                        <>
                          <ClockIcon className="h-5 w-5 mr-2" />
                          Schedule Newsletter
                        </>
                      )}
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