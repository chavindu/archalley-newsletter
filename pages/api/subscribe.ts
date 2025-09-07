import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'
import { sendWelcomeEmail } from '@/lib/email'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS for WordPress integration
  res.setHeader('Access-Control-Allow-Origin', 'https://archalley.com')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { email, emailListId } = req.body

  if (!email || !emailListId) {
    return res.status(400).json({ message: 'Email and email list ID are required' })
  }

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' })
  }

  try {
    // Check if email list exists
    const { data: emailList, error: listError } = await supabase
      .from('email_lists')
      .select('id')
      .eq('id', emailListId)
      .single()

    if (listError || !emailList) {
      return res.status(400).json({ message: 'Invalid email list' })
    }

    // Check if already subscribed
    const { data: existingSubscriber, error: checkError } = await supabase
      .from('subscribers')
      .select('id, status')
      .eq('email', email.toLowerCase().trim())
      .eq('email_list_id', emailListId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }

    if (existingSubscriber) {
      if (existingSubscriber.status === 'active') {
        return res.status(200).json({ 
          message: 'You are already subscribed to this newsletter',
          status: 'already_subscribed'
        })
      } else {
        // Reactivate subscription
        const { error: updateError } = await supabase
          .from('subscribers')
          .update({
            status: 'active',
            subscribed_at: new Date().toISOString(),
            unsubscribed_at: null,
          })
          .eq('id', existingSubscriber.id)

        if (updateError) throw updateError

        // Send welcome email for resubscription
        try {
          await sendWelcomeEmail(email.toLowerCase().trim())
        } catch (emailError) {
          console.error('Error sending welcome email for resubscription:', emailError)
          // Don't fail the subscription if email fails
        }

        return res.status(200).json({ 
          message: 'Successfully resubscribed to newsletter',
          status: 'resubscribed'
        })
      }
    }

    // Add new subscriber
    const { error: insertError } = await supabase
      .from('subscribers')
      .insert({
        email: email.toLowerCase().trim(),
        email_list_id: emailListId,
        status: 'active',
        unsubscribe_token: crypto.randomUUID(),
      })

    if (insertError) throw insertError

    // Send welcome email for new subscription
    try {
      await sendWelcomeEmail(email.toLowerCase().trim())
    } catch (emailError) {
      console.error('Error sending welcome email for new subscription:', emailError)
      // Don't fail the subscription if email fails
    }

    res.status(200).json({ 
      message: 'Successfully subscribed to newsletter',
      status: 'subscribed'
    })
  } catch (error) {
    console.error('Subscription error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
