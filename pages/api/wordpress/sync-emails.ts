import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { syncWordPressEmails, EmailSyncResult } from '@/lib/wordpress-emails'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  // For automated sync, allow without authentication
  // For manual sync, require authentication
  const isAutomatedSync = req.headers['x-automated-sync'] === 'true'
  
  if (!isAutomatedSync) {
    const session = await getServerSession(req, res, authOptions)
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
  }

  try {
    console.log('Starting WordPress emails sync...')
    
    const result = await syncWordPressEmails()
    
    if (result.success) {
      res.status(200).json(result)
    } else {
      res.status(500).json(result)
    }

  } catch (error) {
    console.error('WordPress emails sync failed:', error)
    res.status(500).json({
      success: false,
      message: 'Sync failed',
      synced: 0,
      updated: 0,
      errors: 1,
      total_fetched: 0
    } as EmailSyncResult)
  }
}
