import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { fetchWordPressPosts, convertWordPressPostsToEmailPosts } from '@/lib/wordpress'
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
    const { page = '1', per_page = '20' } = req.query
    
    const pageNum = parseInt(page as string)
    const perPageNum = parseInt(per_page as string)

    // Fetch WordPress posts
    const wpResult = await fetchWordPressPosts(pageNum, perPageNum)
    
    // Convert to EmailPost format
    const emailPosts = convertWordPressPostsToEmailPosts(wpResult.posts)

    res.status(200).json({
      posts: emailPosts,
      totalPages: wpResult.totalPages,
      total: wpResult.total,
      page: pageNum,
      perPage: perPageNum
    })
  } catch (error) {
    console.error('Error fetching WordPress posts:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
