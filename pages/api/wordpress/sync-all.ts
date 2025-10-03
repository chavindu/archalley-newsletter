import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { syncWordPressEmails, EmailSyncResult } from '@/lib/wordpress-emails'
import { supabase } from '@/lib/supabase'
import { fetchWordPressPosts, convertWordPressPostsToEmailPosts, WordPressPost } from '@/lib/wordpress'
import { decodeHtmlEntities } from '@/lib/utils'
import { StoredWordPressPost, WordPressPostSyncResult } from '@/lib/wordpress-posts'

interface CombinedSyncResult {
  success: boolean
  message: string
  posts: WordPressPostSyncResult
  emails: EmailSyncResult
  total_duration_ms: number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Accept both GET (for Vercel cron jobs) and POST (for manual calls)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const startTime = Date.now()

  // Check if this is a Vercel cron job invocation
  const authHeader = req.headers.authorization
  const cronSecret = process.env.CRON_SECRET
  
  // For Vercel cron jobs, verify the CRON_SECRET
  if (authHeader && cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
  } else {
    // For manual sync, require authentication
    const session = await getServerSession(req, res, authOptions)
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
  }

  try {
    console.log('Starting combined WordPress sync (posts + emails)...')

    // 1. Sync WordPress Posts
    console.log('Starting WordPress posts sync...')
    let postsResult: WordPressPostSyncResult

    try {
      // Fetch first page to determine total pages
      const firstPage = 1
      const perPage = 50
      const firstResult = await fetchWordPressPosts(firstPage, perPage)

      if (firstResult.posts.length === 0) {
        postsResult = {
          success: true,
          message: 'No new posts found',
          synced: 0,
          updated: 0,
          errors: 0,
          total_fetched: 0
        }
      } else {
        let synced = 0
        let updated = 0
        let errors = 0
        let totalFetched = 0

        // Helper to upsert a single post
        const upsertPost = async (wpPost: WordPressPost) => {
          try {
            // Extract categories and tags
            const categories = wpPost._embedded?.['wp:term']?.[0]?.filter((term: any) => term.taxonomy === 'category') || []
            const tags = wpPost._embedded?.['wp:term']?.[0]?.filter((term: any) => term.taxonomy === 'post_tag') || []
            
            // Get featured image
            const featuredImage = wpPost._embedded?.['wp:featuredmedia']?.[0]
            
            // Prepare post data
            const postData = {
              wp_post_id: wpPost.id,
              title: decodeHtmlEntities(wpPost.title.rendered),
              excerpt: wpPost.excerpt.rendered ? decodeHtmlEntities(wpPost.excerpt.rendered) : null,
              content: wpPost.content.rendered ? decodeHtmlEntities(wpPost.content.rendered) : null,
              link: wpPost.link,
              featured_image_url: featuredImage?.source_url || null,
              featured_image_alt: featuredImage?.alt_text || null,
              categories: categories.map(cat => ({
                id: cat.id,
                name: decodeHtmlEntities(cat.name),
                slug: cat.slug
              })),
              tags: tags.map(tag => ({
                id: tag.id,
                name: decodeHtmlEntities(tag.name),
                slug: tag.slug
              })),
              author_name: null, // WordPress API doesn't include author name in basic fetch
              published_date: wpPost.date,
              modified_date: wpPost.modified || null,
              status: 'active' as const,
              is_featured: false
            }

            // Check if post already exists
            const { data: existingPost, error: checkError } = await supabase
              .from('wordpress_posts')
              .select('id, wp_post_id, modified_date')
              .eq('wp_post_id', wpPost.id)
              .single()

            if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
              console.error('Error checking existing post:', checkError)
              errors++
              return
            }

            if (existingPost) {
              // Update existing post if modified date is newer
              const existingModified = existingPost.modified_date ? new Date(existingPost.modified_date) : new Date('1970-01-01')
              const newModified = postData.modified_date ? new Date(postData.modified_date) : new Date('1970-01-01')
              
              if (newModified > existingModified) {
                const { error: updateError } = await supabase
                  .from('wordpress_posts')
                  .update({
                    title: postData.title,
                    excerpt: postData.excerpt,
                    content: postData.content,
                    link: postData.link,
                    featured_image_url: postData.featured_image_url,
                    featured_image_alt: postData.featured_image_alt,
                    categories: postData.categories,
                    tags: postData.tags,
                    modified_date: postData.modified_date,
                    updated_at: new Date().toISOString()
                  })
                  .eq('wp_post_id', wpPost.id)

                if (updateError) {
                  console.error('Error updating post:', updateError)
                  errors++
                } else {
                  updated++
                }
              }
            } else {
              // Insert new post
              const { error: insertError } = await supabase
                .from('wordpress_posts')
                .insert(postData)

              if (insertError) {
                console.error('Error inserting post:', insertError)
                errors++
              } else {
                synced++
              }
            }
          } catch (error) {
            console.error('Error processing post:', error)
            errors++
          }
        }

        // Process first page
        totalFetched += firstResult.posts.length
        for (const wpPost of firstResult.posts) {
          await upsertPost(wpPost)
        }

        // Process remaining pages
        const totalPages = Math.max(1, firstResult.totalPages)
        for (let page = firstPage + 1; page <= totalPages; page++) {
          const pageResult = await fetchWordPressPosts(page, perPage)
          totalFetched += pageResult.posts.length
          for (const wpPost of pageResult.posts) {
            await upsertPost(wpPost)
          }
        }

        postsResult = {
          success: true,
          message: `Posts sync completed. Synced: ${synced}, Updated: ${updated}, Errors: ${errors}`,
          synced,
          updated,
          errors,
          total_fetched: totalFetched
        }
      }

      console.log('WordPress posts sync completed:', postsResult)
    } catch (error) {
      console.error('WordPress posts sync failed:', error)
      postsResult = {
        success: false,
        message: 'Posts sync failed',
        synced: 0,
        updated: 0,
        errors: 1,
        total_fetched: 0
      }
    }

    // 2. Sync WordPress Emails
    console.log('Starting WordPress emails sync...')
    let emailsResult: EmailSyncResult

    try {
      emailsResult = await syncWordPressEmails()
      console.log('WordPress emails sync completed:', emailsResult)
    } catch (error) {
      console.error('WordPress emails sync failed:', error)
      emailsResult = {
        success: false,
        message: 'Emails sync failed',
        synced: 0,
        updated: 0,
        errors: 1,
        total_fetched: 0
      }
    }

    const endTime = Date.now()
    const duration = endTime - startTime

    const combinedResult: CombinedSyncResult = {
      success: postsResult.success && emailsResult.success,
      message: `Combined sync completed in ${duration}ms. Posts: ${postsResult.synced} new, ${postsResult.updated} updated. Emails: ${emailsResult.synced} new, ${emailsResult.updated} updated.`,
      posts: postsResult,
      emails: emailsResult,
      total_duration_ms: duration
    }

    console.log('Combined WordPress sync completed:', combinedResult)
    
    if (combinedResult.success) {
      res.status(200).json(combinedResult)
    } else {
      res.status(500).json(combinedResult)
    }

  } catch (error) {
    console.error('Combined WordPress sync failed:', error)
    const endTime = Date.now()
    const duration = endTime - startTime
    
    res.status(500).json({
      success: false,
      message: 'Combined sync failed',
      posts: {
        success: false,
        message: 'Posts sync failed',
        synced: 0,
        updated: 0,
        errors: 1,
        total_fetched: 0
      },
      emails: {
        success: false,
        message: 'Emails sync failed',
        synced: 0,
        updated: 0,
        errors: 1,
        total_fetched: 0
      },
      total_duration_ms: duration
    } as CombinedSyncResult)
  }
}
