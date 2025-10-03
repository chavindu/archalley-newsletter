import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { getSupabaseAdmin } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions)
    
    if (!session || session.user.role !== 'superadmin') {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Get last 10 backup runs
    const { data: backupRuns, error } = await supabaseAdmin
      .from('backup_runs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching backup runs:', error)
      return res.status(500).json({ message: 'Database error' })
    }

    res.status(200).json(backupRuns || [])

  } catch (error) {
    console.error('Backup runs API error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
