import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { supabase } from '@/lib/supabase'
import { authOptions } from '../auth/[...nextauth]'
import { StoredWordPressPost } from '@/lib/wordpress-posts'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  try {
    const { 
      page = '1', 
      limit = '20', 
      status = 'active',
      featured = 'false',
      category = '',
      search = ''
    } = req.query

    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const offset = (pageNum - 1) * limitNum

    // Build query
    let query = supabase
      .from('wordpress_posts')
      .select('*', { count: 'exact' })
      .eq('status', status)
      .order('published_date', { ascending: false })

    // Add featured filter
    if (featured === 'true') {
      query = query.eq('is_featured', true)
    }

    // Add category filter
    if (category) {
      query = query.contains('categories', [{ slug: category }])
    }

    // Add search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`)
    }

    // Add pagination
    query = query.range(offset, offset + limitNum - 1)

    const { data: posts, error, count } = await query

    if (error) {
      console.error('Error fetching WordPress posts:', error)
      return res.status(500).json({ message: 'Database error' })
    }

    const totalPages = Math.ceil((count || 0) / limitNum)

    // Apply 20-word limit to excerpts for consistency
    const postsWithLimitedExcerpts = posts.map((post: any) => ({
      ...post,
      excerpt: post.excerpt ? (() => {
        const words = post.excerpt.split(' ')
        return words.length > 20 
          ? words.slice(0, 20).join(' ') + '...'
          : post.excerpt
      })() : null
    }))

    res.status(200).json({
      posts: postsWithLimitedExcerpts as StoredWordPressPost[],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    })

  } catch (error) {
    console.error('Error fetching WordPress posts:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
