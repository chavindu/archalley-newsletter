export interface StoredWordPressPost {
  id: string
  wp_post_id: number
  title: string
  excerpt: string | null
  content: string | null
  link: string
  featured_image_url: string | null
  featured_image_alt: string | null
  categories: Array<{
    id: number
    name: string
    slug: string
  }>
  tags: Array<{
    id: number
    name: string
    slug: string
  }>
  author_name: string | null
  published_date: string
  modified_date: string | null
  status: 'active' | 'archived' | 'deleted'
  is_featured: boolean
  created_at: string
  updated_at: string
}

export interface WordPressPostSyncResult {
  success: boolean
  message: string
  synced: number
  updated: number
  errors: number
  total_fetched: number
}
