import { EmailPost } from './email'
import { stripHtmlTags, decodeHtmlEntities } from './utils'

export interface WordPressPost {
  id: number
  title: {
    rendered: string
  }
  excerpt: {
    rendered: string
  }
  content: {
    rendered: string
  }
  link: string
  date: string
  modified: string
  featured_media: number
  categories: number[]
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string
      alt_text: string
    }>
    'wp:term'?: Array<Array<{
      id: number
      name: string
      slug: string
      taxonomy: string
    }>>
  }
}

export interface WordPressCategory {
  id: number
  name: string
  slug: string
}

const WORDPRESS_API_URL = 'https://archalley.com/wp-json/wp/v2'

export async function fetchWordPressPosts(page: number = 1, perPage: number = 20): Promise<{
  posts: WordPressPost[]
  totalPages: number
  total: number
}> {
  try {
    const response = await fetch(
      `${WORDPRESS_API_URL}/posts?page=${page}&per_page=${perPage}&_embed=wp:featuredmedia,wp:term&orderby=date&order=desc`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const posts = await response.json()
    const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1')
    const total = parseInt(response.headers.get('X-WP-Total') || '0')

    return {
      posts,
      totalPages,
      total
    }
  } catch (error) {
    console.error('Error fetching WordPress posts:', error)
    return {
      posts: [],
      totalPages: 1,
      total: 0
    }
  }
}

export async function fetchWordPressCategories(): Promise<WordPressCategory[]> {
  try {
    const response = await fetch(`${WORDPRESS_API_URL}/categories?per_page=100`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const raw = await response.json()
    return (raw as WordPressCategory[]).map(cat => ({
      ...cat,
      name: decodeHtmlEntities(cat.name)
    }))
  } catch (error) {
    console.error('Error fetching WordPress categories:', error)
    return []
  }
}

export function getCategoryNames(post: WordPressPost): string[] {
  if (!post._embedded?.['wp:term']?.[0]) return []
  
  return post._embedded['wp:term'][0].map(term => term.name)
}

export function getFeaturedImage(post: WordPressPost): string | null {
  return post._embedded?.['wp:featuredmedia']?.[0]?.source_url || null
}


// Convert WordPressPost to EmailPost format
export function convertWordPressPostToEmailPost(wpPost: WordPressPost): EmailPost {
  const strippedExcerpt = stripHtmlTags(wpPost.excerpt.rendered)
  const words = strippedExcerpt.split(' ')
  const limitedExcerpt = words.length > 20 
    ? words.slice(0, 20).join(' ') + '...'
    : strippedExcerpt
  
  return {
    id: wpPost.id,
    title: stripHtmlTags(wpPost.title.rendered),
    excerpt: limitedExcerpt,
    link: wpPost.link,
    featured_image: getFeaturedImage(wpPost),
    categories: getCategoryNames(wpPost),
    date: wpPost.date
  }
}

// Convert array of WordPressPosts to EmailPosts
export function convertWordPressPostsToEmailPosts(wpPosts: WordPressPost[]): EmailPost[] {
  return wpPosts.map(convertWordPressPostToEmailPost)
}