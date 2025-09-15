import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { supabase } from '@/lib/supabase'
import { sendNewsletterToList, EmailPost } from '@/lib/email'
import { supabase as supabaseClient } from '@/lib/supabase'
import { authOptions } from '../../auth/[...nextauth]'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  console.log('Session in API:', session)
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { id } = req.query

  try {
    // Get newsletter details
    const { data: newsletter, error: newsletterError } = await supabase
      .from('newsletters')
      .select('*')
      .eq('id', id)
      .single()

    if (newsletterError || !newsletter) {
      return res.status(404).json({ message: 'Newsletter not found' })
    }

    if (newsletter.status === 'sent') {
      console.log('Newsletter already sent, allowing resend...')
      // Allow resending - don't block it
    }

    // Get subscribers from selected email lists
    console.log('Email list IDs:', newsletter.email_list_ids)
    const { data: subscribers, error: subscribersError } = await supabase
      .from('subscribers')
      .select('email, unsubscribe_token')
      .in('email_list_id', newsletter.email_list_ids)
      .eq('status', 'active')

    console.log('Subscribers query result:', { subscribers, subscribersError })

    if (subscribersError) {
      console.error('Subscribers query error:', subscribersError)
      return res.status(500).json({ message: 'Database error fetching subscribers', error: subscribersError.message })
    }

    if (!subscribers || subscribers.length === 0) {
      console.log('No active subscribers found for email lists:', newsletter.email_list_ids)
      return res.status(400).json({ message: 'No active subscribers found' })
    }

    // Parse newsletter content
    const content = JSON.parse(newsletter.content)
    const posts: EmailPost[] = content.posts
    let banner = newsletter.ad_snapshot_image_url_600 && newsletter.ad_snapshot_target_url
      ? { imageUrl: newsletter.ad_snapshot_image_url_600, targetUrl: newsletter.ad_snapshot_target_url, altText: `${newsletter.title} Ad` }
      : null

    // If no snapshot, try to fetch live banner by ID and use its current values
    if (!banner && newsletter.ad_banner_id) {
      const { data: liveBanner } = await supabase
        .from('ad_banners')
        .select('image_url_600, target_url, alt_text, status, start_date, end_date, deleted_at')
        .eq('id', newsletter.ad_banner_id)
        .single()
      if (liveBanner) {
        const today = new Date().toISOString().slice(0,10)
        const startOk = !liveBanner.start_date || liveBanner.start_date.slice(0,10) <= today
        const endOk = !liveBanner.end_date || liveBanner.end_date.slice(0,10) >= today
        if (liveBanner.status && !liveBanner.deleted_at && startOk && endOk) {
          banner = { imageUrl: liveBanner.image_url_600, targetUrl: liveBanner.target_url, altText: liveBanner.alt_text }
        }
      }
    }

    console.log(`Sending newsletter "${newsletter.title}" to ${subscribers.length} subscribers`)
    console.log('Subscribers:', subscribers.map(s => s.email))

    // Send newsletter
    const result = await sendNewsletterToList(
      newsletter.title,
      posts,
      subscribers,
      id as string,
      banner || undefined
    )

    console.log('Send result:', result)

    // Only update status if emails were actually sent
    if (result.sent > 0) {
      // Update status to 'sent' and set sent_at timestamp
      await supabase
        .from('newsletters')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', id)

      // Log analytics for each sent email (this will add new entries for resend)
      const analyticsData = subscribers.map(subscriber => ({
        newsletter_id: id,
        subscriber_email: subscriber.email,
      }))

      await supabase
        .from('newsletter_analytics')
        .insert(analyticsData)
    }

    res.status(200).json({
      message: result.sent > 0 
        ? (newsletter.status === 'sent' ? 'Newsletter resent successfully' : 'Newsletter sent successfully')
        : 'No emails were sent',
      sent: result.sent,
      failed: result.failed,
      total: subscribers.length,
    })
  } catch (error) {
    console.error('Error sending newsletter:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
