import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { getSupabaseAdmin } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || !['admin', 'superadmin'].includes(session.user.role)) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { id } = req.query
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid ID' })
  }

  const supabaseAdmin = getSupabaseAdmin()

  try {
    if (req.method === 'PUT') {
      const { company_name, target_url, alt_text, status, start_date, end_date, image_path, image_url_600 } = req.body

      const { data, error } = await supabaseAdmin
        .from('ad_banners')
        .update({ company_name, target_url, alt_text, status, start_date, end_date, image_path, image_url_600, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('deleted_at', null)
        .select()
        .single()

      if (error) return res.status(500).json({ message: 'Database error', error: error.message })
      if (!data) return res.status(404).json({ message: 'Not found' })
      return res.status(200).json({ item: data })
    }

    if (req.method === 'DELETE') {
      const { error } = await supabaseAdmin
        .from('ad_banners')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (error) return res.status(500).json({ message: 'Database error', error: error.message })
      return res.status(200).json({ message: 'Deleted' })
    }

    return res.status(405).json({ message: 'Method not allowed' })
  } catch (error) {
    console.error('Ad banner detail API error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}


