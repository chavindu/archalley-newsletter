import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { syncWordPressEmails, EmailSyncResult } from '@/lib/wordpress-emails'
import { supabase } from '@/lib/supabase'
import { fetchWordPressPosts, convertWordPressPostsToEmailPosts, WordPressPost } from '@/lib/wordpress'
import { decodeHtmlEntities } from '@/lib/utils'
import { StoredWordPressPost, WordPressPostSyncResult } from '@/lib/wordpress-posts'
import { createBackup } from '@/lib/backup-exporter'
import { uploadToOneDrive, deleteOldBackups } from '@/lib/onedrive-upload'
import { getSupabaseAdmin } from '@/lib/supabase'

interface DailyTasksResult {
  success: boolean
  message: string
  posts: WordPressPostSyncResult
  emails: EmailSyncResult
  backup: {
    success: boolean
    message: string
    fileName?: string
    size?: number
    fileId?: string
    webUrl?: string
  }
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
    console.log('Starting daily tasks (WordPress sync + backup)...')

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

    // 3. Run Backup
    console.log('Starting backup...')
    let backupResult: DailyTasksResult['backup']
    let backupRunId: string | null = null

    try {
      const supabaseAdmin = getSupabaseAdmin()

      // Get backup settings
      const { data: settings, error: settingsError } = await supabaseAdmin
        .from('app_settings')
        .select('*')
        .single()

      if (settingsError || !settings) {
        backupResult = {
          success: false,
          message: 'Failed to fetch backup settings'
        }
      } else {
        // Get superadmin users for OneDrive tokens
        const { data: superadmins, error: userError } = await supabaseAdmin
          .from('users')
          .select('id, email, name')
          .eq('role', 'superadmin')

        if (userError || !superadmins || superadmins.length === 0) {
          backupResult = {
            success: false,
            message: 'No superadmin users found'
          }
        } else {
          // Find superadmin with OneDrive tokens, or use the first one
          let selectedSuperadmin = superadmins[0] // Default to first superadmin
          
          // Check if any superadmin has OAuth tokens
          const { data: oauthTokens } = await supabaseAdmin
            .from('oauth_tokens')
            .select('user_id')
            .eq('provider', 'microsoft')

          if (oauthTokens && oauthTokens.length > 0) {
            // Find superadmin that has OAuth tokens
            const superadminWithTokens = superadmins.find(sa => 
              oauthTokens.some(token => token.user_id === sa.id)
            )
            if (superadminWithTokens) {
              selectedSuperadmin = superadminWithTokens
            }
          }

          console.log(`Using superadmin for backup:`, selectedSuperadmin.email)

          // Create backup run record
          const { data: backupRun, error: runError } = await supabaseAdmin
            .from('backup_runs')
            .insert({
              status: 'running',
              started_at: new Date().toISOString(),
            })
            .select()
            .single()

          if (runError || !backupRun) {
            backupResult = {
              success: false,
              message: 'Failed to create backup run record'
            }
          } else {
            backupRunId = backupRun.id

            // Create backup with timeout
            const backupData = await Promise.race([
              createBackup(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Backup creation timeout after 5 minutes')), 5 * 60 * 1000)
              )
            ]) as any

            // Upload to OneDrive
            const uploadResult = await uploadToOneDrive(
              backupData.buffer,
              backupData.fileName,
              settings.onedrive_backup_path,
              selectedSuperadmin.id
            )

            if (!uploadResult.success) {
              // Update backup run with failure
              await supabaseAdmin
                .from('backup_runs')
                .update({
                  status: 'failed',
                  finished_at: new Date().toISOString(),
                  error: uploadResult.error,
                })
                .eq('id', backupRunId)

              backupResult = {
                success: false,
                message: `Backup upload failed: ${uploadResult.error}`
              }
            } else {
              // Update backup run with success
              await supabaseAdmin
                .from('backup_runs')
                .update({
                  status: 'success',
                  finished_at: new Date().toISOString(),
                  file_name: backupData.fileName,
                  file_size_bytes: backupData.size,
                })
                .eq('id', backupRunId)

              // Clean up old backups
              await deleteOldBackups(
                settings.onedrive_backup_path,
                settings.backup_retention_days,
                selectedSuperadmin.id
              )

              backupResult = {
                success: true,
                message: 'Backup completed successfully',
                fileName: backupData.fileName,
                size: backupData.size,
                fileId: uploadResult.fileId,
                webUrl: uploadResult.webUrl
              }
            }
          }
        }
      }

      console.log('Backup completed:', backupResult)
    } catch (error) {
      console.error('Backup failed:', error)
      
      // Update backup run with failure if we have an ID
      if (backupRunId) {
        try {
          const supabaseAdmin = getSupabaseAdmin()
          await supabaseAdmin
            .from('backup_runs')
            .update({
              status: 'failed',
              finished_at: new Date().toISOString(),
              error: error instanceof Error ? error.message : 'Unknown error',
            })
            .eq('id', backupRunId)
        } catch (updateError) {
          console.error('Failed to update backup run status:', updateError)
        }
      }

      backupResult = {
        success: false,
        message: `Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }

    const endTime = Date.now()
    const duration = endTime - startTime

    const combinedResult: DailyTasksResult = {
      success: postsResult.success && emailsResult.success && backupResult.success,
      message: `Daily tasks completed in ${duration}ms. Posts: ${postsResult.synced} new, ${postsResult.updated} updated. Emails: ${emailsResult.synced} new, ${emailsResult.updated} updated. Backup: ${backupResult.success ? 'success' : 'failed'}.`,
      posts: postsResult,
      emails: emailsResult,
      backup: backupResult,
      total_duration_ms: duration
    }

    console.log('Daily tasks completed:', combinedResult)
    
    if (combinedResult.success) {
      res.status(200).json(combinedResult)
    } else {
      res.status(500).json(combinedResult)
    }

  } catch (error) {
    console.error('Daily tasks failed:', error)
    const endTime = Date.now()
    const duration = endTime - startTime
    
    res.status(500).json({
      success: false,
      message: 'Daily tasks failed',
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
      backup: {
        success: false,
        message: 'Backup failed'
      },
      total_duration_ms: duration
    } as DailyTasksResult)
  }
}
