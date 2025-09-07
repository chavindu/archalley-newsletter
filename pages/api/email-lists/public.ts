import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS for WordPress integration
  res.setHeader('Access-Control-Allow-Origin', 'https://archalley.com')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { data: emailLists, error } = await supabase
      .from('email_lists')
      .select('id, name, description')
      .order('name')

    if (error) throw error

    res.status(200).json({ emailLists: emailLists || [] })
  } catch (error) {
    console.error('Error fetching email lists:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
