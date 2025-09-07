import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { newsletterId, email, url } = req.query

  if (!newsletterId || !email || !url || 
      typeof newsletterId !== 'string' || 
      typeof email !== 'string' || 
      typeof url !== 'string') {
    return res.status(400).json({ message: 'Missing required parameters' })
  }

  try {
    // Decode the URL
    const decodedUrl = decodeURIComponent(url)

    // Update the analytics record to mark as clicked
    const { error } = await supabase
      .from('newsletter_analytics')
      .update({ clicked_at: new Date().toISOString() })
      .eq('newsletter_id', newsletterId)
      .eq('subscriber_email', email)

    if (error) {
      console.error('Error updating click tracking:', error)
    }

    // Redirect to the original URL
    res.redirect(302, decodedUrl)
  } catch (error) {
    console.error('Error in click tracking:', error)
    // Still redirect even if tracking fails
    try {
      const decodedUrl = decodeURIComponent(url as string)
      res.redirect(302, decodedUrl)
    } catch (decodeError) {
      res.status(400).json({ message: 'Invalid URL' })
    }
  }
}
