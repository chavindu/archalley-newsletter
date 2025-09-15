import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { supabase } from '@/lib/supabase'
import { fetchWordPressPosts, convertWordPressPostsToEmailPosts, WordPressPost } from '@/lib/wordpress'
import { decodeHtmlEntities } from '@/lib/email'
import { authOptions } from '../auth/[...nextauth]'
import { StoredWordPressPost, WordPressPostSyncResult } from '@/lib/wordpress-posts'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Accept both GET (for Vercel cron jobs) and POST (for manual calls)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

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
    console.log('Starting WordPress posts sync...')

    // Fetch first page to determine total pages
    const firstPage = 1
    const perPage = 50
    const firstResult = await fetchWordPressPosts(firstPage, perPage)

    if (firstResult.posts.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No new posts found',
        synced: 0,
        updated: 0,
        errors: 0,
        total_fetched: 0
      } as WordPressPostSyncResult)
    }

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

    const result: WordPressPostSyncResult = {
      success: true,
      message: `Sync completed. Synced: ${synced}, Updated: ${updated}, Errors: ${errors}`,
      synced,
      updated,
      errors,
      total_fetched: totalFetched
    }

    console.log('WordPress posts sync completed:', result)
    res.status(200).json(result)

  } catch (error) {
    console.error('WordPress posts sync failed:', error)
    res.status(500).json({
      success: false,
      message: 'Sync failed',
      synced: 0,
      updated: 0,
      errors: 1,
      total_fetched: 0
    } as WordPressPostSyncResult)
  }
}
