import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'
import { sendWelcomeEmail } from '@/lib/email'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token } = req.method === 'GET' ? req.query : req.body

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ message: 'Invalid resubscribe token' })
  }

  try {
    // Find subscriber by unsubscribe token
    const { data: subscriber, error: findError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('unsubscribe_token', token)
      .single()

    if (findError || !subscriber) {
      return res.status(404).json({ message: 'Invalid resubscribe link' })
    }

    if (subscriber.status === 'active') {
      return res.status(200).json({ 
        message: 'You are already subscribed to our newsletter!',
        status: 'already_subscribed'
      })
    }

    // Update subscriber status to active
    const { error: updateError } = await supabase
      .from('subscribers')
      .update({
        status: 'active',
        subscribed_at: new Date().toISOString(),
        unsubscribed_at: null,
      })
      .eq('unsubscribe_token', token)

    if (updateError) {
      throw updateError
    }

    // Send welcome email for resubscription
    try {
      await sendWelcomeEmail(subscriber.email)
    } catch (emailError) {
      console.error('Error sending welcome email for resubscription:', emailError)
      // Don't fail the resubscription if email fails
    }

    res.status(200).json({ 
      message: 'Successfully resubscribed to our newsletter! Welcome back!',
      status: 'resubscribed'
    })
  } catch (error) {
    console.error('Error resubscribing:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
