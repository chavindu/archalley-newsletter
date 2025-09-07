import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (error) {
      console.error('Database error:', error)
      return res.status(500).json({ 
        error: 'Database connection failed', 
        details: error.message,
        code: error.code 
      })
    }

    res.status(200).json({ 
      success: true, 
      message: 'Database connection successful',
      data: data 
    })
  } catch (error) {
    console.error('Connection test error:', error)
    res.status(500).json({ 
      error: 'Connection test failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
