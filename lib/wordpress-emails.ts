import { supabase } from './supabase'

export interface WordPressEmail {
  ID: number
  email: string
}

export interface EmailSyncResult {
  success: boolean
  message: string
  synced: number
  updated: number
  errors: number
  total_fetched: number
}

const WORDPRESS_EMAIL_API_URL = 'https://archalley.com/wp-json/bitlab-custom-api/v1/user-emails'
const WORDPRESS_EMAIL_SECRET = 'OpSAn1GqqhJJw5hpBM5NO1j5mJjlWykr'
const TARGET_EMAIL_LIST_ID = 'b163441c-e44d-4461-b600-ebe79e39644f'

/**
 * Fetch emails from WordPress custom API
 */
export async function fetchWordPressEmails(): Promise<WordPressEmail[]> {
  try {
    console.log('Fetching emails from WordPress API...')
    
    const response = await fetch(`${WORDPRESS_EMAIL_API_URL}?secret=${WORDPRESS_EMAIL_SECRET}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Archalley-Newsletter-System/1.0'
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const emails = await response.json()
    console.log(`Fetched ${emails.length} emails from WordPress API`)
    
    return emails
  } catch (error) {
    console.error('Error fetching WordPress emails:', error)
    throw error
  }
}

/**
 * Sync emails from WordPress to the target email list
 */
export async function syncWordPressEmails(): Promise<EmailSyncResult> {
  try {
    console.log('Starting WordPress emails sync...')
    
    // Fetch emails from WordPress API
    const wpEmails = await fetchWordPressEmails()
    
    if (wpEmails.length === 0) {
      return {
        success: true,
        message: 'No emails found from WordPress API',
        synced: 0,
        updated: 0,
        errors: 0,
        total_fetched: 0
      }
    }

    let synced = 0
    let updated = 0
    let errors = 0

    // Process each email
    for (const wpEmail of wpEmails) {
      try {
        // Check if subscriber already exists in the target email list
        const { data: existingSubscriber, error: checkError } = await supabase
          .from('subscribers')
          .select('id, status')
          .eq('email', wpEmail.email)
          .eq('email_list_id', TARGET_EMAIL_LIST_ID)
          .single()

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Error checking existing subscriber:', checkError)
          errors++
          continue
        }

        if (existingSubscriber) {
          // Update existing subscriber if they were unsubscribed
          if (existingSubscriber.status === 'unsubscribed') {
            const { error: updateError } = await supabase
              .from('subscribers')
              .update({
                status: 'active',
                subscribed_at: new Date().toISOString(),
                unsubscribed_at: null
              })
              .eq('id', existingSubscriber.id)

            if (updateError) {
              console.error('Error updating subscriber:', updateError)
              errors++
            } else {
              updated++
              console.log(`Reactivated subscriber: ${wpEmail.email}`)
            }
          }
          // If already active, skip
        } else {
          // Insert new subscriber
          const { error: insertError } = await supabase
            .from('subscribers')
            .insert({
              email: wpEmail.email,
              email_list_id: TARGET_EMAIL_LIST_ID,
              status: 'active',
              subscribed_at: new Date().toISOString(),
              unsubscribe_token: crypto.randomUUID()
            })

          if (insertError) {
            console.error('Error inserting subscriber:', insertError)
            errors++
          } else {
            synced++
            console.log(`Added new subscriber: ${wpEmail.email}`)
          }
        }
      } catch (error) {
        console.error('Error processing email:', wpEmail.email, error)
        errors++
      }
    }

    const result: EmailSyncResult = {
      success: true,
      message: `Email sync completed. Synced: ${synced}, Updated: ${updated}, Errors: ${errors}`,
      synced,
      updated,
      errors,
      total_fetched: wpEmails.length
    }

    console.log('WordPress emails sync completed:', result)
    return result

  } catch (error) {
    console.error('WordPress emails sync failed:', error)
    return {
      success: false,
      message: 'Sync failed',
      synced: 0,
      updated: 0,
      errors: 1,
      total_fetched: 0
    }
  }
}

/**
 * Get sync statistics for the target email list
 */
export async function getEmailListStats(): Promise<{
  total_subscribers: number
  active_subscribers: number
  unsubscribed_subscribers: number
  bounced_subscribers: number
}> {
  try {
    const { data, error } = await supabase
      .from('subscribers')
      .select('status')
      .eq('email_list_id', TARGET_EMAIL_LIST_ID)

    if (error) {
      throw error
    }

    const stats = {
      total_subscribers: data.length,
      active_subscribers: data.filter(s => s.status === 'active').length,
      unsubscribed_subscribers: data.filter(s => s.status === 'unsubscribed').length,
      bounced_subscribers: data.filter(s => s.status === 'bounced').length
    }

    return stats
  } catch (error) {
    console.error('Error getting email list stats:', error)
    return {
      total_subscribers: 0,
      active_subscribers: 0,
      unsubscribed_subscribers: 0,
      bounced_subscribers: 0
    }
  }
}
