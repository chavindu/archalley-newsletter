import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { getSupabaseAdmin, supabase } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || !['admin', 'superadmin'].includes(session.user.role)) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  try {
    if (req.method === 'GET') {
      const { q, active, limit = '20', offset = '0' } = req.query

      let query = supabase
        .from('ad_banners')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1)

      if (q && typeof q === 'string' && q.trim()) {
        query = query.ilike('company_name', `%${q.trim()}%`)
      }

      if (active === 'true') {
        // Active filter: status true AND within date range or dates null
        const today = new Date().toISOString().slice(0, 10)
        query = query
          .eq('status', true)
          .or(`start_date.is.null,start_date.lte.${today}`)
          .or(`end_date.is.null,end_date.gte.${today}`)
      }

      const { data, error, count } = await query

      if (error) return res.status(500).json({ message: 'Database error', error: error.message })
      return res.status(200).json({ items: data || [], count })
    }

    if (req.method === 'POST') {
      const { company_name, target_url, alt_text, status, start_date, end_date, image_path, image_url_600 } = req.body

      if (!company_name || !target_url || !alt_text || !image_path || !image_url_600) {
        return res.status(400).json({ message: 'Missing required fields' })
      }

      const supabaseAdmin = getSupabaseAdmin()
      const { data, error } = await supabaseAdmin
        .from('ad_banners')
        .insert({ 
          company_name, 
          target_url, 
          alt_text, 
          status: typeof status === 'boolean' ? status : true, 
          start_date: start_date || null, 
          end_date: end_date || null, 
          image_path, 
          image_url_600 
        })
        .select()
        .single()

      if (error) return res.status(500).json({ message: 'Database error', error: error.message })
      return res.status(201).json({ item: data })
    }

    return res.status(405).json({ message: 'Method not allowed' })
  } catch (error) {
    console.error('Ad banners API error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}


