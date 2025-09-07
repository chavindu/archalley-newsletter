import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { supabase } from '@/lib/supabase'
import { fetchWordPressPosts, convertWordPressPostsToEmailPosts, WordPressPost } from '@/lib/wordpress'
import { authOptions } from '../auth/[...nextauth]'
import { StoredWordPressPost, WordPressPostSyncResult } from '@/lib/wordpress-posts'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  // For automated sync, allow without authentication
  // For manual sync, require authentication
  const isAutomatedSync = req.headers['x-automated-sync'] === 'true'
  
  if (!isAutomatedSync) {
    const session = await getServerSession(req, res, authOptions)
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
  }

  try {
    console.log('Starting WordPress posts sync...')
    
    // Fetch posts from WordPress API
    const wpResult = await fetchWordPressPosts(1, 50) // Fetch up to 50 latest posts
    
    if (wpResult.posts.length === 0) {
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

    // Process each WordPress post
    for (const wpPost of wpResult.posts) {
      try {
        // Extract categories and tags
        const categories = wpPost._embedded?.['wp:term']?.[0]?.filter((term: any) => term.taxonomy === 'category') || []
        const tags = wpPost._embedded?.['wp:term']?.[0]?.filter((term: any) => term.taxonomy === 'post_tag') || []
        
        // Get featured image
        const featuredImage = wpPost._embedded?.['wp:featuredmedia']?.[0]
        
        // Prepare post data
        const postData = {
          wp_post_id: wpPost.id,
          title: wpPost.title.rendered,
          excerpt: wpPost.excerpt.rendered || null,
          content: wpPost.content.rendered || null,
          link: wpPost.link,
          featured_image_url: featuredImage?.source_url || null,
          featured_image_alt: featuredImage?.alt_text || null,
          categories: categories.map(cat => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug
          })),
          tags: tags.map(tag => ({
            id: tag.id,
            name: tag.name,
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
          continue
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

    const result: WordPressPostSyncResult = {
      success: true,
      message: `Sync completed. Synced: ${synced}, Updated: ${updated}, Errors: ${errors}`,
      synced,
      updated,
      errors,
      total_fetched: wpResult.posts.length
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
