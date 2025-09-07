import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { getEmailListStats } from '@/lib/wordpress-emails'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  try {
    const stats = await getEmailListStats()
    res.status(200).json(stats)
  } catch (error) {
    console.error('Error getting email list stats:', error)
    res.status(500).json({ message: 'Failed to get email list statistics' })
  }
}
