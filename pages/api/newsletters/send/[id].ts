import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { supabase } from '@/lib/supabase'
import { sendNewsletterToList, EmailPost } from '@/lib/email'
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

    console.log(`Sending newsletter "${newsletter.title}" to ${subscribers.length} subscribers`)
    console.log('Subscribers:', subscribers.map(s => s.email))

    // Send newsletter
    const result = await sendNewsletterToList(
      newsletter.title,
      posts,
      subscribers,
      id as string
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
