import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { fetchWordPressCategories } from '@/lib/wordpress'
import { authOptions } from '../auth/[...nextauth]'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  try {
    const categories = await fetchWordPressCategories()
    res.status(200).json({ categories })
  } catch (error) {
    console.error('Error fetching WordPress categories:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
