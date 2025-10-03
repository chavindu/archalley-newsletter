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

    // Check database status
    const status = {
      database_connected: false,
      app_settings_exists: false,
      superadmin_user_exists: false,
      oauth_tokens_exist: false,
      backup_runs_table_exists: false,
      details: {} as any
    }

    try {
      // Test database connection
      const { data: connectionTest, error: connectionError } = await supabaseAdmin
        .from('users')
        .select('count')
        .limit(1)

      if (!connectionError) {
        status.database_connected = true
      } else {
        status.details.connection_error = connectionError.message
      }

      // Check app_settings table
      const { data: settings, error: settingsError } = await supabaseAdmin
        .from('app_settings')
        .select('*')
        .single()

      if (!settingsError && settings) {
        status.app_settings_exists = true
        status.details.settings = settings
      } else {
        status.details.settings_error = settingsError?.message || 'No settings found'
      }

      // Check superadmin user
      const { data: superadmin, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, email, name, role')
        .eq('role', 'superadmin')

      if (!userError && superadmin && superadmin.length > 0) {
        status.superadmin_user_exists = true
        status.details.superadmin_users = superadmin
      } else {
        status.details.user_error = userError?.message || 'No superadmin users found'
      }

      // Check oauth_tokens table
      const { data: tokens, error: tokensError } = await supabaseAdmin
        .from('oauth_tokens')
        .select('provider, user_id, expires_at')
        .eq('provider', 'microsoft')

      if (!tokensError) {
        status.oauth_tokens_exist = true
        status.details.oauth_tokens = tokens || []
      } else {
        status.details.tokens_error = tokensError.message
      }

      // Check backup_runs table
      const { data: runs, error: runsError } = await supabaseAdmin
        .from('backup_runs')
        .select('count')
        .limit(1)

      if (!runsError) {
        status.backup_runs_table_exists = true
      } else {
        status.details.runs_error = runsError.message
      }

    } catch (error) {
      status.details.general_error = error instanceof Error ? error.message : 'Unknown error'
    }

    res.status(200).json(status)

  } catch (error) {
    console.error('Status check error:', error)
    res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
