import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Service role client for server-side operations that bypass RLS
// Only create this client when the service key is available
export const getSupabaseAdmin = () => {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations')
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Database types
export interface EmailList {
  id: string
  name: string
  description?: string
  created_at: string
  created_by: string
}

export interface Subscriber {
  id: string
  email: string
  email_list_id: string
  status: 'active' | 'unsubscribed' | 'bounced'
  subscribed_at: string
  unsubscribed_at?: string
  unsubscribe_token: string
}

export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'superadmin'
  created_at: string
}

export interface Newsletter {
  id: string
  title: string
  content: string
  selected_posts: string[]
  email_list_ids: string[]
  status: 'draft' | 'scheduled' | 'sent'
  scheduled_at?: string
  sent_at?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface NewsletterAnalytics {
  id: string
  newsletter_id: string
  subscriber_email: string
  opened_at?: string
  clicked_at?: string
  unsubscribed_at?: string
}
