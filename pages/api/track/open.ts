import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { newsletterId, email } = req.query

  if (!newsletterId || !email || typeof newsletterId !== 'string' || typeof email !== 'string') {
    return res.status(400).json({ message: 'Missing required parameters' })
  }

  try {
    // Update the analytics record to mark as opened
    const { error } = await supabase
      .from('newsletter_analytics')
      .update({ opened_at: new Date().toISOString() })
      .eq('newsletter_id', newsletterId)
      .eq('subscriber_email', email)
      .is('opened_at', null) // Only update if not already opened

    if (error) {
      console.error('Error updating open tracking:', error)
    }

    // Return a 1x1 transparent pixel
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    )

    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
    res.status(200).send(pixel)
  } catch (error) {
    console.error('Error in open tracking:', error)
    // Still return the pixel even if tracking fails
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    )
    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.status(200).send(pixel)
  }
}
