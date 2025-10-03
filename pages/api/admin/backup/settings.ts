import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { getSupabaseAdmin } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions)
    
    if (!session || session.user.role !== 'superadmin') {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const supabaseAdmin = getSupabaseAdmin()

    if (req.method === 'GET') {
      // Get current settings
      const { data: settings, error } = await supabaseAdmin
        .from('app_settings')
        .select('*')
        .single()

      if (error) {
        console.error('Error fetching settings:', error)
        return res.status(500).json({ message: 'Database error' })
      }

      // Check if OneDrive is connected
      const { data: oauthToken } = await supabaseAdmin
        .from('oauth_tokens')
        .select('expires_at')
        .eq('provider', 'microsoft')
        .eq('user_id', session.user.id)
        .single()

      const isConnected = oauthToken && new Date(oauthToken.expires_at) > new Date()

      res.status(200).json({
        ...settings,
        onedrive_connected: isConnected
      })

    } else if (req.method === 'PUT') {
      // Update settings
      const { onedrive_backup_path, backup_retention_days } = req.body

      // Validate input
      if (typeof onedrive_backup_path !== 'string' || onedrive_backup_path.trim() === '') {
        return res.status(400).json({ message: 'OneDrive backup path is required' })
      }

      if (typeof backup_retention_days !== 'number' || backup_retention_days < 1 || backup_retention_days > 365) {
        return res.status(400).json({ message: 'Retention days must be between 1 and 365' })
      }

      // First get the existing settings to get the ID
      const { data: existingSettings, error: fetchError } = await supabaseAdmin
        .from('app_settings')
        .select('id')
        .single()

      if (fetchError || !existingSettings) {
        return res.status(500).json({ message: 'Failed to fetch existing settings' })
      }

      const { data, error } = await supabaseAdmin
        .from('app_settings')
        .update({
          onedrive_backup_path: onedrive_backup_path.trim(),
          backup_retention_days,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSettings.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating settings:', error)
        return res.status(500).json({ message: 'Database error' })
      }

      res.status(200).json({
        message: 'Settings updated successfully',
        settings: data
      })

    } else {
      res.status(405).json({ message: 'Method not allowed' })
    }

  } catch (error) {
    console.error('Settings API error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
